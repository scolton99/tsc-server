const express = require('express');
const router = express.Router();
const airtable = require('airtable');
const fs = require('fs');
const request = require('request-promise-native');
const xml2js = require('xml2js');

// Setup connection to Airtable
const a_base = new airtable({ apiKey: process.env.AIRTABLE_API_KEY || "null" }).base('appydp8wFv8Yd5nVE');

const formatPhone = number => {
  let phon = ("" + number).replace(/[^\d]/g, "");
  return "(" + phon.substr(0,3) + ") " + phon.substr(3, 3) + "-" + phon.substr(6, 4);
}

const fp_request = fs.readFileSync(__dirname + '/../assets/fp_request.xml', { encoding: 'UTF-8' });

const get_user_tickets = async netid => {
  const fp_username = process.env.FP_USERNAME;
  const fp_password = process.env.FP_PASSWORD;

  const query = `SELECT COUNT(*) FROM (SELECT DISTINCT mrID FROM MASTER1_FIELDHISTORY WHERE mrUSERID = '${netid}')`;

  const tc_request_auth = fp_request.replace('{{FP_USERNAME}}', fp_username).replace('{{FP_PASSWORD}}', fp_password).replace("{{FP_QUERY}}", query);

  const response = await request({
    method: 'POST',
    uri: 'https://itsm-fp.northwestern.edu/MRcgi/MRWebServices.pl',
    body: tc_request_auth
  });

  let num_tickets = null;
  xml2js.parseString(response, (err, result) => {
    if (err) {
      return next(err);
    }

    // This is the worst thing ever written but you end up with the number of tickets currently in our queue!
    const {
      'SOAP-ENV:Envelope': {
        'SOAP-ENV:Body': [{
          'namesp1:MRWebServices__searchResponse': [{
            return: [{
              item: [{
                item: [{
                  value: [{
                    _: ticket_num_str
                  }]
                }]
              }]
            }]
          }]
        }]
      }
    } = result;

    num_tickets = parseInt(ticket_num_str);
  });

  return num_tickets;
}

router.get("/edit", async (req, res, next) => {
  const { netid } = req.session;

  a_base('Main').select({
    filterByFormula: `AND({NetID} = '${netid}', {Current})`
  }).firstPage((err, records) => {
    // If Airtable returns an error, log it and return 500
    if (err) {
      console.error(err);
      return next(err);
    }

    // If we can't find a record with that ID, return 404
    if (records.length === 0) {
      console.error("No record found with ID " + netid);
      return next();
    }
    
    const name = records[0].fields.Name;
    const record_id = records[0].id;

    a_base('Feedback').select({
      filterByFormula: `AND(NOT(FIND({Con}, '${name}') = 0), {Display})`,
      sort: [{field: "Time Submitted", direction: "desc"}],
      fields: ["Time Submitted", "Display Text"],
      maxRecords: 3
    }).firstPage((fb_err, kudos) => {
      // If Airtable returns an error, log it and return 500
      if (fb_err) {
        console.error(fb_err);
        return next(fb_err);
      }

      a_base('Performance Corrections').select({
        filterByFormula: `{Con} = '${name}'`,
        sort: [{field: "Timestamp", direction: "desc"}],
        fields: ["Timestamp", "Type", "Description"]
      }).firstPage((pc_err, pcs) => {
        // If Airtable returns an error, log it and return 500
        if (pc_err) {
          console.error(pc_err);
          return next(pc_err);
        }

        if (!records[0].fields.Photo) {
          records[0].fields.Photo = [
            {url: 'https://imgur.com/e5YUmjl.png'}
          ]
        }

        records[0].fields.Status = !records[0].fields.Status ? [] : records[0].fields.Status;
        records[0].fields.PillMap = {
          "Pinch-hitting": "blue",
          "Trainee": "seagreen",
          "On leave": "green"
        };

        if (records[0].fields["Grad Year"])
          records[0].fields.GradYearFixed = records[0].fields["Grad Year"].toString().substr(-2, 2);

        if (records[0].fields["Phone Number"]) {
          records[0].fields.PhoneFixed = formatPhone(records[0].fields["Phone Number"]);
        }

        if (records[0].fields["Exchange - Office365"])
          records[0].fields.ExchangeFixed = records[0].fields["Exchange - Office365"].toLowerCase();

        const ws = parseInt(records[0].fields.WS);
        if (isNaN(ws))
          records[0].fields.WSFixed = "-";
        else
          records[0].fields.WSFixed = `$${ws.toLocaleString()}`;

        const year = new Date().getFullYear();
        const years = [];
        
        for (let cy = year - 2; cy < year + 6; cy++)
          years.push(cy);

        res.render('edit-profile', { 
          user: records[0].fields, 
          formatPhone: formatPhone, 
          kudos: kudos.map(e => e.fields), 
          PCs: pcs.map(e => e.fields),
          record_id: record_id,
          years: years
        });
      });      
    });
  });
});

router.post("/:netid/edit", (req, res, next) => {
  let {
    record_id,
    bio,
    phone_number,
    wildcard_hid,
    other_pronouns,
    dietary_restrictions,
    t_shirt_size,
    first_name,
    pronouns,
    grad_month,
    grad_year
  } = req.body;

  if (typeof(pronouns) === "string") pronouns = [pronouns];
  if (typeof(pronouns) === "undefined") pronouns = [];
  if (typeof(wildcard_hid) === "string") wildcard_hid = parseInt(wildcard_hid);
  if (isNaN(wildcard_hid)) wildcard_hid = null;
  if (typeof(grad_year) === "string") grad_year = parseInt(grad_year);
  if (isNaN(grad_year)) grad_year = null;

  a_base('Main').update(record_id, {
    "First Name": first_name,
    "Pronouns": pronouns,
    "Wildcard HID": wildcard_hid,
    "Shirt Size": t_shirt_size,
    "Dietary Restrictions": dietary_restrictions,
    "Other Pronouns": other_pronouns,
    "Phone Number": phone_number,
    "Bio": bio,
    "Grad Month": grad_month,
    "Grad Year": grad_year
  }, (err, record) => {
      if (err) {
        console.error(err);
        return res.status(500).end();
      }

      res.json(record.fields);
  });
});

// NetID should be set here due to Security on this route in app.js
router.get('/', (req, res, _next) => {
  res.redirect(`/profile/${req.session.netid}`);
});

router.get("/:netid", (req, res, next) => {
  const { netid } = req.params;

  a_base('Main').select({
    filterByFormula: 'AND({NetID} = "' + netid + '", {Current})'
  }).firstPage((err, records) => {
    // If Airtable returns an error, log it and return 500
    if (err) {
      console.error(err);
      return next(err);
    }

    // If we can't find a record with that ID, return 404
    if (records.length === 0) {
      console.error("No record found with ID " + netid);
      return next();
    }

    res.render('profile', { user: records[0].fields, formatPhone: formatPhone });
  });
});

router.get("/tickets/:netid", async (req, res, _next) => {
  let num_tickets = await get_user_tickets(req.params.netid);
  res.json({ num_tickets: num_tickets });
});

module.exports = router;

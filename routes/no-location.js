const express = require('express');
const router = express.Router();

const fs = require('fs');
const bent = require('bent');
const xml2js = require('xml2js');
const airtable = require('airtable');

// Setup connection to Airtable
const a_base = new airtable({apiKey: process.env.AIRTABLE_API_KEY || "null"}).base('appydp8wFv8Yd5nVE');

const fp_request = fs.readFileSync(__dirname + '/../assets/fp_request.xml', { encoding: 'UTF-8' });
const fp_query = users => `SELECT MASTER1.mrID, MASTER1_FIELDHISTORY.mrUSERID FROM MASTER1 INNER JOIN MASTER1_FIELDHISTORY ON MASTER1_FIELDHISTORY.mrID=MASTER1.mrID WHERE MASTER1.walk__uin__blocation IS NULL AND MASTER1_FIELDHISTORY.mrUSERID IN (${users}) AND MASTER1_FIELDHISTORY.mrTIMESTAMP >= DATEADD('DAY', -14, GETDATE()) ORDER BY MASTER1.mrID DESC`;

const bent_string = bent('string', 'POST', 200, 301, 302);

router.get('/', async (_req, res, next) => {
  a_base('Main').select({
    fields: ['Name', 'NetID'],
    filterByFormula: '{Current}'
  }).firstPage(async (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).end();
      return;
    }

    const netid_map = {};
    result.forEach(record => (netid_map[record.get('NetID')] = record.get('Name')));

    const netids = `'${Object.keys(netid_map).join('\',\'')}'`;

    const { FP_USERNAME, FP_PASSWORD } = process.env;

    const fp_request_auth = fp_request.replace('{{FP_USERNAME}}', FP_USERNAME)
      .replace('{{FP_PASSWORD}}', FP_PASSWORD).replace('{{FP_QUERY}}', fp_query(netids));

    const response = await bent_string('https://itsm-fp.northwestern.edu/MRcgi/MRWebServices.pl', fp_request_auth);
    xml2js.parseString(response, (xmlerr, xmlres) => {
      const tickets = xmlres["SOAP-ENV:Envelope"]["SOAP-ENV:Body"][0]["namesp1:MRWebServices__searchResponse"][0]["return"][0]["item"];
      const list_clean = [];
  
      if (typeof(tickets) === "undefined")
        return res.json(list_clean);
      
      for (const ticket of tickets) {
        list_clean.push({
          ticket: parseInt(ticket.mrid[0]["_"]),
          netid: ticket.mruserid[0]["_"],
          name: netid_map[ticket.mruserid[0]["_"]]
        });
      }

      res.render('no-location', {tickets: list_clean});
    });
  });
});

module.exports = router;

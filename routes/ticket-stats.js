const express = require('express');
const router = express.Router();
const fs = require('fs');
const request = require('request-promise-native');
const xml2js = require('xml2js');
const FP = require('../util/FP');
const airtable = require('airtable');

const fp_request = fs.readFileSync(__dirname + '/../assets/fp_request.xml', { encoding: 'UTF-8' });
const { FP_USERNAME, FP_PASSWORD, AIRTABLE_API_KEY } = process.env;

const a_base = new airtable({apiKey: AIRTABLE_API_KEY || "null"}).base('appydp8wFv8Yd5nVE');

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

const month_str = month => MONTHS[month];

const is_leap_year = year => {
  return (year % 4 === 0 && !(year % 100 === 0)) || (year % 4 === 0 && year % 400 === 0 && year % 100 === 0);
};

const num_days = (month, year) => {
  switch (month) {
    case "January": 
    case "March": 
    case "May": 
    case "July": 
    case "August":
    case "October": 
    case "December": {
      return 31;
    }
    case "April":
    case "June": 
    case "September": 
    case "November": {
      return 30;
    }
    case "February": {
      return is_leap_year(year) ? 29 : 28;
    }
    default: {
      return -1;
    }
  }
};

router.get('/', (_req, res, _next) => {
  a_base('Main').select({
    filterByFormula: '{Current}',
    fields: ['First Name', 'Last Name', 'NetID', 'Position'],
    sort: [{field: 'Last Name', direction: 'asc'}]
  }).firstPage((err, netids) => {
    if (err) {
      console.error(err);
      return next(err);
    }

    const cur_date = new Date();
    const year = cur_date.getFullYear();
    const years = [year - 1, year, year + 1];
    
    res.render('ticket-stats', { 
      empls: netids, 
      years: years,
      cur_year: year,
      days: num_days(MONTHS[cur_date.getMonth()], cur_date.getFullYear()),
      cur_month: month_str(cur_date.getMonth()),
      cur_date: cur_date.getDate(),
      months: MONTHS
    });
  });
})

router.post('/', async (req, res, next) => {
  if (!Array.isArray(req.body.netids))
    req.body.netids = [req.body.netids];

  const netids = req.body.netids.map(x => `'${x}'`).join(',');

  const start = `${req.body['start-year']}-${req.body['start-month']}-${req.body['start-date']}`;
  const end = `${req.body['end-year']}-${req.body['end-month']}-${req.body['end-date']}`;

  const query = `SELECT COUNT(*), submission__btracking, mrUSERID FROM (SELECT DISTINCT MASTER1.mrID, MASTER1.submission__btracking, MASTER1_FIELDHISTORY.mrUSERID FROM MASTER1_FIELDHISTORY INNER JOIN MASTER1 on MASTER1.mrID = MASTER1_FIELDHISTORY.mrID WHERE MASTER1_FIELDHISTORY.mrUSERID IN (${netids}) AND TRUNC(MASTER1_FIELDHISTORY.mrTIMESTAMP, 'J') >= TO_DATE('${start}', 'YYYY-MM-DD') AND TRUNC(MASTER1.mrSUBMITDATE, 'J') &lt;= TO_DATE('${end}', 'YYYY-MM-DD') AND submission__btracking IS NOT NULL) GROUP BY mrUSERID, submission__btracking`;
  const query_auth = fp_request.replace("{{FP_USERNAME}}", FP_USERNAME).replace("{{FP_PASSWORD}}", FP_PASSWORD).replace("{{FP_QUERY}}", query);
  
  const fp_res = await request({
    uri: 'https://itsm-fp.northwestern.edu/MRcgi/MRWebServices.pl',
    method: 'POST',
    body: query_auth
  });

  const xml_obj = await xml2js.parseStringPromise(fp_res);

  const {
    "soap:Envelope": {
      "soap:Body": [{
        "namesp1:MRWebServices__searchResponse": [{
          return: container
        }]
      }]
    }
  } = xml_obj;

  const js_obj = {};

  if (container[0]["item"]) {
    for (const item of container[0]["item"]) {
      let netid, number, submission_tracking;
  
      for (const inner_item of item["item"]) {
        switch(inner_item.key[0]["_"]) {
          case "count(*)": {
            number = parseInt(inner_item.value[0]["_"]);
            break;
          }
          case "mruserid": {
            netid = inner_item.value[0]["_"];
            break;
          }
          case "submission__btracking": {
            submission_tracking = FP.unfix(inner_item.value[0]["_"]);
          }
        }
      }
  
      submission_tracking = fix_submission_tracking(submission_tracking);
      if (!submission_tracking) continue;
  
      if (!js_obj[netid])
        js_obj[netid] = {};
  
      if (js_obj[netid][submission_tracking])
        js_obj[netid][submission_tracking] += number;
      else
        js_obj[netid][submission_tracking] = number;
    }
  }

  for (const netid of req.body.netids) {
    if (!js_obj[netid])
      js_obj[netid] = {"Agent": 0, "Walk-In": 0, "Chat": 0, "Email": 0};
  }

  let info = {};
  a_base('Main').select({
    filterByFormula: '{Current}',
    fields: ["First Name", "Last Name", "NetID"]
  }).firstPage((err, a) => {
    if (err) {
      console.error(err);
      return next(err);
    }

    a.forEach(x => {
      info[x.get("NetID")] = [x.get("First Name"), x.get("Last Name")];
    });

    const lines = ['"First Name","Last Name",NetID,Phone,Chat,Walk-In,Email'];
    const netids_sorted = Object.keys(js_obj).sort((a, b) => {
      return info[a][1] < info[b][1] ? -1 : info[a][1] > info[b][1] ? 1 : 0;
    });
    for (const netid of netids_sorted) {
      const name = info[netid];

      const line = [
        `"${name[0]}"`,
        `"${name[1]}"`,
        netid,
        js_obj[netid]["Agent"] || "0",
        js_obj[netid]["Chat"] || "0",
        js_obj[netid]["Walk-In"] || "0",
        js_obj[netid]["Email"] || "0"
      ];

      lines.push(line.join(","));
    }

    const csv = lines.join("\n");

    res.set('Content-Disposition', "attachment; filename=report.csv");
    res.send(csv);
  });
});

const fix_submission_tracking = submission_tracking => {
  switch(submission_tracking) {
    case "Web": {
      return "Email";
    }
    case "Agent Email": {
      return "Agent";
    }
    case "Direct-Contact":
    case "Other": 
    case "Rounds":
    case "Walk Through": {
      return null;
    }
    default: {
      return submission_tracking;
    }
  }
}

module.exports = router;
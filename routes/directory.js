const express = require('express');
const router = express.Router();
const airtable = require('airtable');

// Setup connection to Airtable
const a_base = new airtable({apiKey: process.env.AIRTABLE_API_KEY || "null"}).base('appydp8wFv8Yd5nVE');

router.get('/', async (req, res, next) => {
  const records = [];

  a_base('Main').select({
    fields: [
      "Last, First",
      "Phone Number",
      "SpeedDial"
    ],
    filterByFormula: "{Current}",
    sort: [
      {field: 'Last Name', direction: 'asc'}
    ]
  }).eachPage((at_records, fetchNext) => {
    at_records.forEach(record => {
      records.push({name: record.get('Last, First'), number: record.get('Phone Number'), speeddial: record.get('SpeedDial')});
    });

    fetchNext();
  }, err => {
    if (err) {
      console.error(err)
      return next(err);
    }

    let records_format = records.map(x => ({...x, number: x.number.replace(/[^\d]/g, '')}))
    records_format = records_format.map(x => ({...x, number: '(' + x.number.substr(0, 3) + ') ' + x.number.substr(3, 3) + '-' + x.number.substr(6, 4)}));

    res.render('directory', {
      records: records_format,
      date: (new Date()).toLocaleDateString('en-US', {dateStyle: 'long'}),
      noprint: !!req.query.noprint
    });
  });
});

module.exports = router;

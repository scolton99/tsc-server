const express = require('express');
const router = express.Router();
const airtable = require('airtable');

const google_fields = [
  "Name",
  "Given Name",
  "Family Name",
  "Group Membership",
  "E-mail 1 - Value",
  "Phone 1 - Type",
  "Phone 1 - Value",
  "Organization 1 - Name",
  "Organization 1 - Title",
];

// Setup connection to Airtable
const a_base = new airtable({apiKey: process.env.AIRTABLE_API_KEY || "null"}).base('appydp8wFv8Yd5nVE');

router.get('/', (_req, res, next) => {
  let records = [];

  a_base('Main').select({
    fields: [
      "Name",
      "First Name",
      "Last Name",
      "Email",
      "Phone Number",
      "Position"
    ],
    filterByFormula: "{Current}"
  }).eachPage((at_records, fetchNext) => {
    at_records.forEach(record => {
      const name = record.get("Name");
      const first_name = record.get("First Name");
      const last_name = record.get("Last Name");
      const email = record.get("Email");
      const phone_number = "(" + record.get("Phone Number").replace("-", ") ");
      const position = record.get("Position");

      records.push([
        name,
        first_name,
        last_name,
        "Northwestern IT ::: * myContacts",
        email,
        "Mobile",
        phone_number,
        "Northwestern IT",
        position
      ]);
    });

    fetchNext();
  }, err => {
    if (err) {
      console.error(err)
      return next(err);
    }

    records = records.map(record => record.join());
    records = [google_fields.join()].concat(records);
    records = records.join("\n") + "\n";
  
    res.set("Content-Type", "text/csv");
    res.set("Content-Disposition", "attachment; filename=\"NorthwesternIT-Contacts.csv\"");
  
    res.send(records);
  });
});

module.exports = router;

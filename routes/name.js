const express = require('express');
const router = express.Router();
const airtable = require('airtable');

// Setup connection to Airtable
const a_base = new airtable({apiKey: process.env.AIRTABLE_API_KEY || "null"}).base('appydp8wFv8Yd5nVE');

router.post('/', (req, res, next) => {
  const { email } = req.body;
  const email_univ = email.toLowerCase();

  a_base('Main').select({
    filterByFormula: `LOWER({Full @u}) = "${email_univ}"`,
    fields: ["Name"]
  }).firstPage((err, records) => {
    // If Airtable returns an error, log it and return 500
    if (err) {
      console.error(err);
      return next(err);
    }

    // If we can't find a record with that ID, return 404
    if (records.length === 0) {
      console.error("No record found with email " + email);
      return next();
    }

    res.json({ email: email, name: records[0].get("Name") });
  });
});

module.exports = router;

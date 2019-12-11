const express = require('express');
const router = express.Router();
const airtable = require('airtable');

// Setup connection to Airtable
const a_base = new airtable({apiKey: process.env.AIRTABLE_API_KEY || "null"}).base('appydp8wFv8Yd5nVE');

router.post('/', (req, res, next) => {
  const { name } = req.body;
  const name_univ = name.toLowerCase();

  a_base('Main').select({
    filterByFormula: `OR(LOWER({Name}) = "${name_univ}", LOWER({HR First Name} & " " & {Last Name}) = "${name_univ}")`,
    fields: ["Full @u"]
  }).firstPage((err, records) => {
    // If Airtable returns an error, log it and return 500
    if (err) {
      console.error(err);
      return next(err);
    }

    // If we can't find a record with that ID, return 404
    if (records.length === 0) {
      console.error("No record found with name " + name);
      return next();
    }

    res.json({ name: name, email: records[0].get("Full @u").toLowerCase() });
  });
});

module.exports = router;

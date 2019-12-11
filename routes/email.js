const express = require('express');
const router = express.Router();
const airtable = require('airtable');

// Setup connection to Airtable
const a_base = new airtable({apiKey: process.env.AIRTABLE_API_KEY || "null"}).base('appydp8wFv8Yd5nVE');

router.post('/', (req, res, next) => {
  const { names: names_mixedcase } = req.body;
  const names = names_mixedcase.map(e => (e.toLowerCase()));

  a_base('Main').select({
    fields: ["Name", "Full @u", "HR First Name", "Last Name"]
  }).firstPage((err, records) => {
    // If Airtable returns an error, log it and return 500
    if (err) {
      console.error(err);
      return next(err);
    }

    const ret_obj = {};

    for (let i = 0; i < names.length; i++) {
      const record = records.filter(e => {
        const nickname = names[i] === e.get("Name").toLowerCase();
        const fullname = nickname || names[i] === (e.get("HR First Name") + " " + e.get("Last Name")).toLowerCase();

        return nickname || fullname;
      });

      if (record.length === 0)
        ret_obj[names_mixedcase[i]] = "";
      else
        ret_obj[names_mixedcase[i]] = record[0].get("Full @u");
    }

    res.json(ret_obj);
  });
});

module.exports = router;

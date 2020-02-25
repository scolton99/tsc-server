const express = require('express');
const router = express.Router();
const airtable = require('airtable');

// Setup connection to Airtable
const a_base = new airtable({ apiKey: process.env.AIRTABLE_API_KEY || "null" }).base('appydp8wFv8Yd5nVE');

router.get("/", async (_req, res, next) => {
  res.header("Access-Control-Allow-Origin", "https://kb.northwestern.edu");

  a_base('OOTO').select({}).firstPage((err, records) => {
    if (err) {
      console.error(err);
      return next(err);
    }

    const res_obj = {};
    for (const rec of records) {
      const status = rec.get("Status");

      if (!res_obj[status]) res_obj[status] = [];

      res_obj[status].push(rec.get("Name"));
    }

    res.json(res_obj);
  });
});

module.exports = router;

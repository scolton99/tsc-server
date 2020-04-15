const express = require('express');
const router = express.Router();
const fs = require('fs');
const bent = require('bent');
const xml2js = require('xml2js');
const FP = require('../util/FP');

const fp_request = fs.readFileSync(__dirname + '/../assets/assignment_group_request.xml', { encoding: 'UTF-8' });
const sep = " → ";

const bent_string = bent('string', 'POST', 200, 301, 302);

// Taken from https://stackoverflow.com/questions/7744912/making-a-javascript-string-sql-friendly
const escape_string = str => {
  return str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, char => {
    switch (char) {
      case "\0": {
        return "\\0";
      }
      case "\x08": {
        return "\\b";
      }
      case "\x09": {
        return "\\t";
      }
      case "\x1a": {
        return "\\z";
      }
      case "\n": {
        return "\\n";
      }
      case "\r": {
        return "\\r";
      }
      // prepends a backslash to backslash, percent, and double/single quotes
      case "\"":
      case "'":
      case "\\":
      case "%": {
        return "\\" + char; 
      }
    }
  });
};

router.get('/:group', async (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "https://kb.northwestern.edu");

  const { group } = req.params;
  const { FP_USERNAME: fp_username, FP_PASSWORD: fp_password } = process.env;

  const fp_request_auth = fp_request.replace("{{FP_USERNAME}}", fp_username)
    .replace("{{FP_PASSWORD}}", fp_password)
    .replace("{{GROUP_NAME}}", escape_string(group));

  try {
    const response = await bent_string('https://itsm-fp.northwestern.edu/MRcgi/MRWebServices.pl', fp_request_auth);

    xml2js.parseString(response, (err, result) => {
      if (err) {
        console.error(err);
        return next(err);
      }

      const items = result["SOAP-ENV:Envelope"]["SOAP-ENV:Body"][0]["namesp1:MRWebServices__searchResponse"][0]["return"][0]["item"];
      let formatted_items = [];
      const possible_categories = ["service__bfamily", "service", "category", "sub__ucategory"];

      for(const item of items) {
        const categories = [];

        for (let possible_category of possible_categories)
          if ("_" in item[possible_category][0])
            categories.push(FP.unfix(item[possible_category][0]["_"]))

        formatted_items.push({
          category: categories.join(sep),
          count: parseInt(item["count"][0]["_"])
        });
      }

      const response_json = {
        result: 'success',
        group_name: FP.unfix(group),
        stats: formatted_items
      }
      
      res.json(response_json);
    });
  } catch (e) {
    console.error(e.message);
    res.status(500).json({
      result: 'failure',
      message: e.message
    });
  }
});

module.exports = router;

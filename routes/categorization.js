const express = require('express');
const router = express.Router();
const fs = require('fs');
const request = require('request-promise-native');
const xml2js = require('xml2js');
const FP = require('../util/FP');

const fp_request = fs.readFileSync(__dirname + '/../assets/category_request.xml', { encoding: 'UTF-8' });

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

router.get('/:service_family/:service?/:category?/:sub_category?', async (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "https://kb.northwestern.edu");

  const { FP_USERNAME: fp_username, FP_PASSWORD: fp_password } = process.env;

  const field_names = ["service__bfamily", "service", "category", "sub__ucategory"];
  const fields = [req.params.service_family, req.params.service, req.params.category, req.params.sub_category];
  const sql = [];

  for (let i = 0; i < fields.length; i++) {
    if (!fields[i]) break;

    sql.push(field_names[i] + "='" + escape_string(fields[i]) + "'");
  }

  const query = sql.join(' AND ');

  const fp_request_auth = fp_request.replace("{{FP_USERNAME}}", fp_username)
    .replace("{{FP_PASSWORD}}", fp_password)
    .replace("{{FP_QUERY}}", query);

  try {
    const response = await request({
      method: 'POST',
      uri: 'https://itsm-fp.northwestern.edu/MRcgi/MRWebServices.pl',
      body: fp_request_auth,
      resolveWithFullResponse: true
    });

    if (response.statusCode >= 400) {
      res.status(500).json({
        result: 'failure',
        message: response.body
      });
    } else {
      xml2js.parseString(response.body, (err, result) => {
        if (err) {
          console.error(err);
          return next(err);
        }

        const items = result["SOAP-ENV:Envelope"]["SOAP-ENV:Body"][0]["namesp1:MRWebServices__searchResponse"][0]["return"][0]["item"];
        let formatted_items = [];

        for(const item of items) {
          formatted_items.push({
            group: FP.unfix(item["mrassignees"][0]["_"]),
            count: parseInt(item["count"][0]["_"])
          });
        }

        const response_json = {
          result: 'success',
          stats: formatted_items
        }
        
        res.json(response_json);
      });
    }
  } catch (e) {
    res.status(500).json({
      result: 'failure',
      message: e.message
    });
  }
});

module.exports = router;

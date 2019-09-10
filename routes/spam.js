const express = require('express');
const router = express.Router();
const fs = require('fs');
const request = require('request-promise-native');
const xml2js = require('xml2js');
const FP = require('../util/FP');

const fp_request = fs.readFileSync(__dirname + '/../assets/spam_request.xml', { encoding: 'UTF-8' });

router.get('/', (_req, res, _next) => {
  res.sendFile('spam.html', { root: global.root_dir + '/public' });
});

router.get('/status', async (req, res, next) => {
  const { FP_USERNAME, FP_PASSWORD } = process.env;

  const fp_request_auth = fp_request.replace('{{FP_USERNAME}}', FP_USERNAME)
    .replace('{{FP_PASSWORD}}', FP_PASSWORD);

  const response = await request({
    method: 'POST',
    uri: 'https://itsm-fp.northwestern.edu/MRcgi/MRWebServices.pl',
    body: fp_request_auth
  });

  xml2js.parseString(response, (err, result) => {
    if (err) {
      console.error(err);
      return next(err);
    }

    const tickets = result["SOAP-ENV:Envelope"]["SOAP-ENV:Body"][0]["namesp1:MRWebServices__searchResponse"][0]["return"][0]["item"];
    const list_clean = [];

    for (const ticket of tickets) {
      list_clean.push(parseInt(ticket.mrid[0]["_"]));
    }

    res.json(list_clean);
  });
});

module.exports = router;

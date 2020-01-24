const express = require('express');
const router = express.Router();
const fs = require('fs');
const request = require('request-promise-native');

const fp_request = fs.readFileSync(__dirname + '/../assets/edit_ticket_request.xml', { encoding: 'UTF-8' });

router.get("/", async (req, res, next) => {
  res.render('edit-ticket');
});

router.post("/", async (req, res, _next) => {
  const fp_username = process.env.FP_USERNAME;
  const fp_password = process.env.FP_PASSWORD;

  let { netid, submission_tracking, ticket_id } = req.body;

  switch (submission_tracking) {
    case "Email":
    case "Agent":
    case "Chat": {
      break;
    }
    case "Walk-In": {
      submission_tracking = "Walk__uIn";
      break;
    }
    default: {
      res.status(500).json({
        result: 'failure'
      });
      return;
    }
  }

  const tc_request_auth = fp_request.replace('{{FP_USERNAME}}', fp_username)
    .replace('{{FP_PASSWORD}}', fp_password)
    .replace('{{TICKET_ID}}', ticket_id)
    .replace('{{SUBMISSION_TRACKING}}', submission_tracking)
    .replace('{{SUBMITTER_NETID}}', netid);

  try {
    const response = await request({
      method: 'POST',
      uri: 'https://itsm-fp.northwestern.edu/MRcgi/MRWebServices.pl',
      body: tc_request_auth,
      resolveWithFullResponse: true
    });

    if (response.statusCode >= 400) {
      res.status(500).json({
        result: 'failure'
      });
    } else {
      res.json({
        result: 'success'
      });
    }
  } catch (e) {
    res.status(500).json({
      result: 'failure'
    });
  }
});

module.exports = router;
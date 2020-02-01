const express = require('express');
const router = express.Router();
const fs = require('fs');
const request = require('request-promise-native');

const fp_request = fs.readFileSync(__dirname + '/../assets/edit_ticket_request.xml', { encoding: 'UTF-8' });

router.get("/", async (_req, res, _next) => {
  res.render('edit-ticket');
});

router.post("/", async (req, res, _next) => {
  const fp_username = process.env.FP_USERNAME;
  const fp_password = process.env.FP_PASSWORD;

  let { submission_tracking, ticket_id } = req.body;

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
      console.error("Invalid submission tracking.")
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
    .replace('{{SUBMITTER_NETID}}', req.session.netid);

  try {
    const response = await request({
      method: 'POST',
      uri: 'https://itsm-fp.northwestern.edu/MRcgi/MRWebServices.pl',
      body: tc_request_auth,
      resolveWithFullResponse: true
    });

    if (response.statusCode >= 400) {
      console.error(response.body);
      res.status(500).json({
        result: 'failure'
      });
    } else {
      res.json({
        result: 'success'
      });
    }
  } catch (e) {
    const tst = /<faultstring>(.*?)\\n\\n/g.exec(e.message);
    if (tst)
      console.error(tst[1].replace(/\\n/g, "\n"));
    else
      console.error(e.message);
      
    res.status(500).json({
      result: 'failure'
    });
  }
});

module.exports = router;
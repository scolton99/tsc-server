var express = require('express');
var router = express.Router();
var request = require('request-promise');

router.post('/', async (req, res) => {
  const {channel: {id: channel}, message: {ts: message_ts}} = JSON.parse(req.body.payload);
  const api_token = process.env.SLACK_API_TOKEN;
  try {
    const fetch_response = await request(`https://slack.com/api/conversations.replies?token=${api_token}&channel=${channel}&ts=${message_ts}`);
    console.dir(fetch_response);
  } catch (e) {
    console.error(e);
  }
});

module.exports = router;

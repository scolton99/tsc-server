var express = require('express');
var router = express.Router();
var request = require('request-promise');
var airtable = require('airtable');
var a_base = new airtable({apiKey: process.env.AIRTABLE_API_KEY}).base('appydp8wFv8Yd5nVE');

router.post('/', async (req, res, next) => {
  const {
    channel: {
      id: channel
    },
    message: {
      ts: message_ts,
      blocks
    },
    actions: [
      {
        value: action_data
      }
    ],
    user: {
      username
    },
    response_url
  } = JSON.parse(req.body.payload);

  const api_token = process.env.SLACK_API_TOKEN;
  const [action_value, record_id] = action_data.split("_");

  let fetch_response = null;
  let display_text = null;
  try {
    fetch_response = await request(`https://slack.com/api/conversations.replies?token=${api_token}&channel=${channel}&ts=${message_ts}`);
    const s_res = JSON.parse(fetch_response);
    if ('error' in s_res && s_res.error !== "") {
      return next(new Error(s_res.error));
    }

    const messages = s_res.messages;
    if (messages.length >= 2) {
      display_text = messages[1].text;
    }
  } catch (e) {
    return next(e);
  }

  if (fetch_response == null) {
    return next(new Error("error"));
  }

  const verb = action_value === "approve" ? "approved" : "rejected";

  if (action_value === "approve") {
    a_base('Feedback').update(record_id, {
      "Approved Text": display_text,
      "Display": true
    }, (err) => {
      return next(err);
    });
  } else {
    a_base('Feedback').update(record_id, {
      "Display": false
    }, (err) => {
      return next(err);
    });
  }

  let extra = "";

  if (display_text !== null && action_value === "approve") {
    extra = " The text of the feedback was updated.";
  }

  res.end("Loading...");

  const end_response = {blocks: blocks, text: "None"};
  end_response.blocks[4] = {
    type: "section",
    text: {
      type: "mrkdwn",
      text: "_This compliment has been " + verb + " by " + username + "." + extra + "_"
    }
  };
  request({method: 'post', body: end_response, json: true, url: response_url}, err => {if (err) console.error(err)});
});

module.exports = router;

var express = require('express');
var router = express.Router();
var request = require('request-promise');
var airtable = require('airtable');
var a_base = new airtable({apiKey: process.env.AIRTABLE_API_KEY}).base('appydp8wFv8Yd5nVE');

router.post('/', async (req, res) => {
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
    }
  } = JSON.parse(req.body.payload);

  const api_token = process.env.SLACK_API_TOKEN;
  const [action_value, record_id] = action_data.split("_");

  let fetch_response = null;
  let display_text = null;
  try {
    fetch_response = await request(`https://slack.com/api/conversations.replies?token=${api_token}&channel=${channel}&ts=${message_ts}`);
    const { messages } = JSON.parse(fetch_response);

    if (messages.length >= 2) {
      display_text = messages[1].text;
    }
  } catch (e) {
    console.error(e);
  }

  if (fetch_response == null) {
    res.send("error");
    return;
  }

  const verb = action_value === "approve" ? "approved" : "rejected";

  if (action_value === "approve") {
    a_base('Feedback').update(record_id, {
      "Approved Text": display_text,
      "Display": true
    }, (err, rec) => {
      if (err) console.error(err);
    });
  } else {
    a_base('Feedback').update(record_id, {
      "Display": false
    });
  }

  let extra = "";

  if (display_text !== null && action_value === "approve") {
    extra = " The text of the feedback was updated.";
  }

  const end_response = {blocks: blocks, text: "None"};
  end_response.blocks[4] = {
    type: "section",
    text: {
      type: "mrkdwn",
      text: "_This compliment has been " + verb + " by " + username + "." + extra + "_"
    }
  };
  res.json(end_response);
});

module.exports = router;

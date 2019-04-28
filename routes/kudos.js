var express = require('express');
var router = express.Router();
var request = require('request-promise');
var airtable = require('airtable');

// Setup connection to Airtable
var a_base = new airtable({apiKey: process.env.AIRTABLE_API_KEY}).base('appydp8wFv8Yd5nVE');

// POST /kudos
router.post('/', async (req, res, next) => {
  // Fetch information from Slack's request
  // https://api.slack.com/actions#request_payload
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

  // Get API key from environment
  const api_token = process.env.SLACK_API_TOKEN;
  const [action_value, record_id] = action_data.split("_");

  // Initialize these for use later
  let fetch_response = null;
  let display_text = null;
  
  // Try to get replies to the message on which we clicked a button to enable us to 
  // get the new "Display Text" for this feedback 
  try {
    // Use conversations.replies API
    // https://api.slack.com/methods/conversations.replies
    fetch_response = await request(`https://slack.com/api/conversations.replies?token=${api_token}&channel=${channel}&ts=${message_ts}`);
    
    const s_res = JSON.parse(fetch_response);
    
    // If we have an error, send it to the 500 page
    // https://api.slack.com/web#responses
    if ('error' in s_res && s_res.error !== "") {
      return next(new Error(s_res.error));
    }

    // Otherwise, check the length of retrieved messages
    // Will be 1 if no replies (no change to feedback text), otherwise get new text
    const messages = s_res.messages;
    if (messages.length >= 2) {
      display_text = messages[1].text;
    }
  } catch (e) {
    // Catch errors with HTTP request
    return next(e);
  }

  // Convert the value of our button request to a participle
  const verb = action_value === "approve" ? "approved" : "rejected";

  // Make Airtable requests
  if (action_value === "approve") {
    // If we pushed approve, update the feedback appropriately
    a_base('Feedback').update(record_id, {
      "Approved Text": display_text,
      "Display": true
    }, (err) => {
      // If we run into an error, hand it to the 500 handler
      return next(err);
    });
  } else {
    // If we pushed reject, update the feedback appropriately (really, do nothing)
    a_base('Feedback').update(record_id, {
      "Display": false
    }, (err) => {
      // If we run into an error, hand it to the 500 handler
      return next(err);
    });
  }

  // Add extra feedback text if the text of the feedback was modified
  let extra = "";
  if (display_text !== null && action_value === "approve") {
    extra = " The text of the feedback was updated.";
  }

  // Send this while we make the airtable request. 
  res.end("Updating feedback...");

  // Replace the message with an identical-looking message, but with text where the actions were.
  const end_response = {blocks: blocks, text: "None"};
  end_response.blocks[4] = {
    type: "section",
    text: {
      type: "mrkdwn",
      text: "_This compliment has been " + verb + " by " + username + "." + extra + "_"
    }
  };
  
  // This line is run asynchronously without await, so we can't modify the response with it.
  // Errors that occur here can be found in Heroku logs.
  // This line sends the replacement message where Slack told us to through the end_response variable.
  request({method: 'post', body: end_response, json: true, url: response_url}, err => {if (err) console.error(err)});
});

module.exports = router;

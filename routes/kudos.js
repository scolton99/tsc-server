var express = require('express');
var router = express.Router();
var request = require('request-promise');
var airtable = require('airtable');

// Setup connection to Airtable
var a_base = new airtable({apiKey: process.env.AIRTABLE_API_KEY}).base('appydp8wFv8Yd5nVE');

// Convert a numerical month (1-indexed) and year to a human-readable string.
const toDateString = (month_num, year) => {
  let month = "";

  switch (month_num) {
    case 1: {
      month = "January";
      break;
    }
    case 2: {
      month = "February";
      break;
    }
    case 3: {
      month = "March";
      break;
    }
    case 4: {
      month = "April";
      break;
    }
    case 5: {
      month = "May";
      break;
    }
    case 6: {
      month = "June";
      break;
    }
    case 7: {
      month = "July";
      break;
    }
    case 8: {
      month = "August";
      break;
    }
    case 9: {
      month = "September";
      break;
    }
    case 10: {
      month = "October";
      break;
    }
    case 11: {
      month = "November";
      break;
    }
    case 12: {
      month = "December";
      break;
    }
  }

  return month + " " + year;
}

router.get('/', (_req, res, next) => {
  // Get from Feedback table
	a_base('Feedback').select({
    fields: ['Con Name', 'Display Text'],
    filterByFormula: 'AND({Display}, {Type} = "Compliment", DATETIME_DIFF(NOW(), {Time Submitted}, "days") <= 14)',    // Show compliments that have been approved and are less than two weeks old
    sort: [
      {
        field: 'Time Submitted',    // Make newest feedback show up first so that con order shuffles
        direction: 'desc'
      }
    ]
  }).firstPage((err, records) => {
    // Allow this to be loaded by the KB
    res.header("Access-Control-Allow-Origin", "https://kb.northwestern.edu");
    
    // Display errors if they occur 
    if (err) {
      console.error(err);
      return next(err);
    }
    
    // Get consultant names and remove duplicates (using Set)
    const names = new Set(records.map(record => record["fields"]["Con Name"]).reduce((prev, cur) => prev.concat(cur)));
    
    const feedback = {};
    names.forEach(name => {
      // Get the feedback applicable to this con as strings
      const con_feedback = records.filter(record => record["fields"]["Con Name"].includes(name)).map(record => record["fields"]["Display Text"]);
      
      // Store the feedback string in our feedback object
      feedback[name] = con_feedback;
    });
    
    res.json(feedback);
  });
});

// GET /kudos/:netid
router.get('/:netid', (req, res, next) => {
  const { netid } = req.params;
  let name = null;

  // Get the user's name for display given their NetID
  a_base('Main').select({
    filterByFormula: '{NetID} = "' + netid + '"',
    fields: ["Name"]
  }).firstPage((err, nameRecord) => {
    if (err || nameRecord.length === 0) {
      // If we can't find this user (they're not an employee), return 404
      console.error("Name not found for NetID " + netid);
      return next();
    }

    // Save name for later
    name = nameRecord[0].get('Name');

    let feedbacks = [];

    // Get feedback appropriate to this con that has been marked as "display"
    a_base('Feedback').select({
      filterByFormula: "AND({Con NetID} = '" + netid + "', {Type} = 'Compliment', {Display})",
      sort: [
        {
          field: "Time Submitted",
          direction: "desc"
        }
      ],
      fields: ['Con Name', 'Con NetID', 'Display Text', 'Time Submitted']
    }).eachPage((records, fetchNext) => {
      // Keep fetching until there's no feedback left; store each in the feedback variable
      feedbacks = feedbacks.concat(records);

      fetchNext();
    }, err => {
      // 500 error if Airtable returns an error
      if (err) {
        console.log(err);
        return next(err);
      }

      // If we didn't find any feedback for this person, return 404
      if (feedbacks.length == 0) return next();

      // Turn each feedback into an object into an array with this structure:
      // [year, month, hour, minute, text]
      feedbacks = feedbacks.map(feedback => {
        const date = new Date(feedback.get('Time Submitted'));

        return [date.getFullYear(), date.getMonth() + 1, date.getHours(), date.getMinutes(), feedback.get('Display Text')];
      });
      
      // Sort feedback in descending order
      feedbacks = feedbacks.sort((a, b) => {
        return a[0] - b[0] || a[1] - b[1] || a[2] - b[2] || a[3] - b[3];
      });

      // Make feedback into an object of this structure:
      /* { "April 2019": [
       *  "Feedback 1", "Feedback 2", ...
       * ], ... }
       */
      const kudos = {};
      for(let i = 0; i < feedbacks.length; i++) {
        const name = toDateString(feedbacks[i][1], feedbacks[i][0]);

        if (typeof(kudos[name]) === "undefined")
          kudos[name] = [];

        kudos[name].push(feedbacks[i][4]);
      }

      // Pass the restructured kudos to Pug for rendering
      res.render('kudos', { name: name, kudos: kudos });
    });
  });
});

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

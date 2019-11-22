const express = require('express');
const router = express.Router();
const fs = require('fs');
const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly', 'https://www.googleapis.com/auth/calendar.events.readonly'];
const TOKEN_PATH = 'token.json';

function authorize(credentials) {
  const {client_secret, client_id, redirect_uris} = credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  try {
    const token = fs.readFileSync(TOKEN_PATH);

    oAuth2Client.setCredentials(JSON.parse(token));
    return oAuth2Client;
  } catch (e) {
    const auth_url = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES
    });
  
    console.error("Need to reauthorize TSC server to access Google Calendar");
    console.error(`Use this link: ${auth_url}`);
    console.error("Reauthorize at /schedule/reauth");
  
    throw new Error("Unauthorized");
  }
}

router.get('/', (req, res) => {
  let secret;
  try {
    secret = fs.readFileSync('credentials.json');
  } catch (e) {
    throw new Error("Missing credentials.json");
  }

  const auth = authorize(JSON.parse(secret));

  const calendar = google.calendar({version: 'v3', auth});
  const d = (new Date()).toISOString();

  calendar.events.list({
    calendarId: process.env.CALENDAR_ID,
    timeMin: d,
    timeMax: d,
    singleEvents: true
  }, (err, res) => {
    if (err) {
      console.error("The API returned an error: ", err);
      throw err;
    }

    const events = res.data.items;
    const people = {"1800 Consultant": [], "1800 Supervisor": [], "Library Consultant": []};

    events.forEach(e => {
      if (e.summary.includes("1800 Consultant")) {
        people["1800 Consultant"].push(/^(.*)1800 Consultant/.exec(e.summary)[1].trim());
      } else if (e.summary.includes("1800 Supervisor")) {
        people["1800 Supervisor"].push(/^(.*)1800 Supervisor/.exec(e.summary)[1].trim());
      } else if (e.summary.includes("Library Consultant")) {
        people["Library Consultant"].push(/^(.*)Library Consultant/.exec(e.summary)[1].trim());
      }
    });

    res.render('schedule', {people: people});
  });
});

router.get('/reauth', (_req, res) => {
  res.render('token-reauth');
});

router.post('/reauth', (req, res) => {
  const code = req.body.code;

  const credentials = JSON.parse(fs.readFileSync('credentials.json'));
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  oAuth2Client.getToken(code, (err, token) => {
    if (err) return console.error('Error retrieving access token', err);
    oAuth2Client.setCredentials(token);

    // Store the token to disk for later program executions
    fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
      if (err) return console.error(err);
      console.log('Token stored to', TOKEN_PATH);
    });

    res.render('token-success');
  });
});

module.exports = router;

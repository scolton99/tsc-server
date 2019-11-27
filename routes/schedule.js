const express = require('express');
const router = express.Router();
const fs = require('fs');
const { google } = require('googleapis');
const { Storage } = require('@google-cloud/storage');
const IP = require('../util/IP');

const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly', 'https://www.googleapis.com/auth/calendar.events.readonly'];

const authorize = async credentials => {
  const {client_secret, client_id, redirect_uris} = credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  const storage = new Storage();
  const token = (await storage.bucket('tss-support-center.appspot.com').file('private/token').download())[0];

  if (token === null || token === "" || (typeof(token) === "object" && token.length === 0)) {
    const auth_url = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES
    });
  
    console.error("Need to reauthorize TSC server to access Google Calendar");
    console.error(`Use this link: ${auth_url}`);
  
    throw new Error("Unauthorized");
  }

  oAuth2Client.setCredentials(JSON.parse(token));

  return oAuth2Client;
}

router.get('/', async (req, res) => {
  if (!IP.isLocal(req.ip) && !IP.isNU(req.ip)) {
    console.log(`Refused schedule access to outside address ${req.ip}`);
    console.log(req.ips)
    return res.status(403).sendFile('forbidden.html', { root: global.root_dir + '/public' });
  }

  const { date: mrn } = req.query;

  const storage = new Storage();
  const bucket = storage.bucket('tss-support-center.appspot.com');

  const secret = await bucket.file('private/credentials.json').download();
  const auth = await authorize(JSON.parse(secret));

  const calendar = google.calendar({version: 'v3', auth});
  const ds = mrn ? new Date(mrn) : new Date();
  ds.setHours(0);
  ds.setMinutes(0);

  const de = mrn ? new Date(mrn) : new Date();
  de.setHours(23);
  de.setMinutes(59);

  calendar.events.list({
    calendarId: process.env.CALENDAR_ID,
    timeMin: ds.toISOString(),
    timeMax: de.toISOString(),
    singleEvents: true
  }, (err, results) => {
    if (err) {
      console.error("The API returned an error: ", err);
      throw err;
    }

    const events = results.data.items;
    const people = {"1800 Consultant": [], "1800 Supervisor": [], "Library Consultant": []};

    events.filter(e => {
      const rn = mrn ? new Date(mrn) : new Date();
      return (new Date(e.start.dateTime) <= rn) && (new Date(e.end.dateTime) > rn);
    }).forEach(e => {
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

router.get('/reauth', async (req, res) => {
  const code = req.query.code;

  const storage = new Storage();
  const bucket = storage.bucket('tss-support-center.appspot.com');
  const credentials_raw = await bucket.file('private/credentials.json').download();

  const credentials = JSON.parse(credentials_raw);
  const {client_secret, client_id, redirect_uris} = credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  const { tokens: token } = await oAuth2Client.getToken(code);
  
  const file = storage.bucket('tss-support-center.appspot.com').file('private/token');
  file.createWriteStream({ resumable: false }).end(JSON.stringify(token));

  res.redirect('/schedule');
});

module.exports = router;

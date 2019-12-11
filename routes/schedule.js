const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const { Storage } = require('@google-cloud/storage');
const IP = require('../util/IP');
const request = require('request-promise-native');

const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly', 'https://www.googleapis.com/auth/calendar.events.readonly'];
const SHIFT_TRADE_APP = process.env.SHIFT_TRADE_APP_URI;
const BUCKET_NAME = process.env.BUCKET_NAME;

const authorize = async credentials => {
    const { client_secret, client_id, redirect_uris } = credentials.web;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    const storage = new Storage();
    
    try {
        const token = (await storage.bucket(BUCKET_NAME).file('private/token').download())[0];

        if (token === null || token === "" || (typeof(token) === "object" && token.length === 0)) {
            throw new Error("Unauthorized");
        }

        oAuth2Client.setCredentials(JSON.parse(token));
    
        return oAuth2Client;
    } catch (e) {
        const auth_url = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES
        });

        console.error("Need to reauthorize TSC server to access Google Calendar");
        console.error(`Use this link: ${auth_url}`);

        throw new Error("Unauthorized");
    }
}

const next_shift = date => {
    if (date === null)
        date = new Date();

    const next = new Date(date.getTime());

    const hrs = date.getHours();
    const mins = date.getMinutes();

    switch (hrs) {
        case 7: {
            next.setHours(9);
            next.setMinutes(0);
            break;
        }
        case 8:
        case 9:
        case 10:
        case 11:
        case 12:
        case 13:
        case 14:
        case 15: {
            if (mins < 30) {
                next.setMinutes(30); 
            } else {
                next.setHours(hrs + 1);
                next.setMinutes(0);
            }

            break;
        }
        case 16: {
            if (mins < 30) {
                next.setMinutes(30);
            } else {
                next.setHours(7);
                next.setMinutes(45);
                next.setDate(next.getDate() + 1);
            }

            break;
        }
        default: {
            next.setHours(7);
            next.setMinutes(45);
            if (hrs >= 18)
                next.setDate(next.getDate() + 1);
        }
    }

    return next;
}

const gen_res_obj = (events, date) => {
    const people = {"1800 Consultant": [], "Consultant Supervisor": [], "Library Consultant": []};

    events.filter(e => {
        return (new Date(e.start.dateTime) <= date) && (new Date(e.end.dateTime) > date);
    }).forEach(e => {
        if (e.summary.includes("1800 Consultant")) {
            people["1800 Consultant"].push(/^(.*)1800 Consultant/.exec(e.summary)[1].trim());
        } else if (e.summary.includes("Consultant Supervisor")) {
            people["Consultant Supervisor"].push(/^(.*)Consultant Supervisor/.exec(e.summary)[1].trim());
        } else if (e.summary.includes("Library Consultant")) {
            people["Library Consultant"].push(/^(.*)Library Consultant/.exec(e.summary)[1].trim());
        }
    });

    return people;
};

router.get('/status', async(req, res) => {
    if (!IP.isLocal(req.ip) && !IP.isNU(req.ip)) {
        console.log(`Refused schedule access to outside address ${req.ip}`);
        console.log(req.ips)
        return res.status(403).sendFile('forbidden.html', { root: global.root_dir + '/public' });
    }

    let { date: mrn } = req.query;

    const storage = new Storage();
    const bucket = storage.bucket(BUCKET_NAME);

    const secret = await bucket.file('private/credentials.json').download();
    const auth = await authorize(JSON.parse(secret));

    const calendar = google.calendar({ version: 'v3', auth });
    const ds = mrn ? new Date(mrn) : new Date();
    ds.setHours(0);
    ds.setMinutes(0);

    const de = mrn ? new Date(mrn) : new Date();
    de.setDate(de.getDate() + 1);
    de.setHours(23);
    de.setMinutes(59);

    calendar.events.list({
        calendarId: process.env.CALENDAR_ID,
        timeMin: ds.toISOString(),
        timeMax: de.toISOString(),
        singleEvents: true
    }, async (err, results) => {
        if (err) {
            console.error("The API returned an error: ", err);
            throw err;
        }

        const events = results.data.items;

        const rn = mrn ? new Date(mrn) : new Date();
        const ltr_date = next_shift(rn);
    
        const now = gen_res_obj(events, rn);
        const ltr = gen_res_obj(events, ltr_date);

        const now_cons = [
            ...now["1800 Consultant"],
            ...now["Consultant Supervisor"],
            ...now["Library Consultant"]
        ];

        const ltr_cons = [
            ...ltr["1800 Consultant"],
            ...ltr["Consultant Supervisor"],
            ...ltr["Library Consultant"]
        ];

        const now_trades = await request({
            uri: SHIFT_TRADE_APP,
            headers: {
                'Content-Type': 'application/json'
            },
            method: 'POST',
            body: {date: rn.getTime(), cons: now_cons},
            json: true,
            simple: false,
            followAllRedirects: true
        });

        const ltr_trades = await request({
            uri: SHIFT_TRADE_APP,
            headers: {
                'Content-Type': 'application/json'
            },
            method: 'POST',
            body: {date: ltr_date.getTime(), cons: ltr_cons},
            json: true,
            simple: false,
            followAllRedirects: true
        });

        res.json({
            now: {
                sch: now, 
                trades: now_trades.cons
            },
            next: {
                date: ltr_date.getTime(),
                sch: ltr,
                trades: ltr_trades.cons
            }
        });
    });
});

router.get('/reauth', async(req, res) => {
    const code = req.query.code;

    const storage = new Storage();
    const bucket = storage.bucket(BUCKET_NAME);
    const credentials_raw = await bucket.file('private/credentials.json').download();

    const credentials = JSON.parse(credentials_raw);
    const { client_secret, client_id, redirect_uris } = credentials.web;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    const { tokens: token } = await oAuth2Client.getToken(code);

    const file = storage.bucket(BUCKET_NAME).file('private/token');
    file.createWriteStream({ resumable: false }).end(JSON.stringify(token));

    res.redirect('/schedule');
});

router.get('/', (req, res) => {
    if (!IP.isLocal(req.ip) && !IP.isNU(req.ip)) {
        console.log(`Refused schedule access to outside address ${req.ip}`);
        console.log(req.ips)
        return res.status(403).sendFile('forbidden.html', { root: global.root_dir + '/public' });
    }

    res.render('schedule');
});

module.exports = router;
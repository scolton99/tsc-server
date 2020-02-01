const express = require('express');
const files = require('express-fileupload');
const basicAuth = require('express-basic-auth')
const Security = require('./util/security');
const session = require('express-session');

const kudosRouter = require('./routes/kudos');
const photoRouter = require('./routes/photo');
const birthdayRouter = require('./routes/birthday');
const profileRouter = require('./routes/profile');
const queueRouter = require('./routes/queue');
const editTicketRouter = require('./routes/edit-ticket');
const contactsRouter = require('./routes/contacts');
const assignmentGroupRouter = require('./routes/assignment-group');
const categorizationRouter = require('./routes/categorization');
const spamRouter = require('./routes/spam');
const directoryRouter = require('./routes/directory');
const whenToWorkRouter = require('./routes/whentowork');
const scheduleRouter = require('./routes/schedule');
const getNameRouter = require('./routes/name');
const loginRouter = require('./routes/login');

const app = express();

const COOKIE_SECRET = process.env.COOKIE_SECRET;

app.set('view engine', 'pug');
app.set('views', './views');

app.set('trust proxy', process.env.GAE_VERSION === "production");

app.use(session({
  secret: COOKIE_SECRET,
  resave: true,
  saveUninitialized: false
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false, verify: (req, _res, buf, encoding) => {
  req.raw_body = buf.toString(encoding);
}}));
app.use(express.static('public'));
app.use(files());

if (process.env.GAE_VERSION !== "production") { 
  app.use(basicAuth({
    users: {
      'lc': process.env.DEV_BASIC_AUTH_PWD
    },
    challenge: true,
    realm: 'nuit'
  }));
}

const fix_ip = (req, _res, next) => {
  req.headers["x-forwarded-for"] = req.get('X-AppEngine-User-IP') + ', ' + req.get('X-Forwarded-For');
  next();
};

app.use(fix_ip);

const add_cors = (req, res, next) => {
  if (req.method !== "OPTIONS")
    return next();

  res.set('Access-Control-Allow-Origin', 'https://kb.northwestern.edu');
  res.set('Access-Control-Allow-Headers', 'X-Conweb-Token');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  return res.status(204).end();
}

app.use(add_cors);

const log_request = (req, _res, next) => {
  console.log(`New request from ${req.ip}`);
  console.log(`req.ip: ${req.ip}`);
  console.log(`req.ips: ${req.ips}`);
  console.log(`X-Forwarded-For: ${req.get('X-Forwarded-For')}`);
  next();
};

if (process.env.GAE_VERSION !== "production")
  app.use(log_request);

app.get("/", (_req, res) => {
  res.redirect("/queue");
});

// TSC Kudos handler
app.use('/kudos', kudosRouter);

// TSC Photo change handler
app.use('/photo', Security.require_nu_referrer, Security.require_conweb_token, photoRouter);

// TSC Today's Birthdays JSON
app.use('/birthdays', Security.require_nu_origin, Security.require_conweb_token, birthdayRouter);

// Login Handler
app.use('/profile/login', loginRouter);

// TSC Profile handler
app.use('/profile', Security.require_logged_in, Security.require_nu_referrer, profileRouter);

// FP Queue Handler
app.use('/queue', queueRouter);

// Ticket Editor Handler
app.use('/edit-ticket', Security.require_tss, editTicketRouter);

// Contact CSV Handler
app.use('/contacts', Security.require_northwestern, contactsRouter);

// Assignment Group Stats Handler
app.use('/assignment-group', Security.require_nu_origin, Security.require_conweb_token, assignmentGroupRouter);

// Category Stats Handler
app.use('/categorization', Security.require_nu_origin, Security.require_conweb_token, categorizationRouter);

// Spam Handler
app.use('/spam', spamRouter);

// Directory Handler
app.use('/directory', Security.require_northwestern, directoryRouter);

// WhenToWork Handler
app.use('/w2w', Security.require_nu_origin, Security.require_conweb_token, whenToWorkRouter);

app.use('/schedule', Security.require_tss, scheduleRouter);

app.use('/get-name', getNameRouter);

// Catch any errors
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).sendFile('/public/error.html', {root: __dirname});
});

// Otherwise, it's a 404
app.use((_req, res, _next) => {
  res.sendFile('public/not_found.html', {root: __dirname});
});

global.root_dir = __dirname;
global.cdn_endpoint = "//storage.googleapis.com/tss-support-center.appspot.com/"
global.cdn = x => `${global.cdn_endpoint}${x}`

global.POS_SUPERVISOR = "1800 Supervisor";
global.POS_CONSULTANT = "1800 Consultant";
global.POS_LIBRARY = "Library Consultant";

module.exports = app;

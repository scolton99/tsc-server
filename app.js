const express = require('express');
const files = require('express-fileupload');
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
const logoutRouter = require('./routes/logout');
const ticketStatsRouter = require('./routes/ticket-stats');

const app = express();

const { COOKIE_SECRET, GAE_VERSION } = process.env;

app.set('view engine', 'pug');
app.set('views', './views');

app.set('trust proxy', GAE_VERSION === "production");

app.use(session({
  secret: COOKIE_SECRET,
  resave: true,
  saveUninitialized: false,
  cookie: {
    secure: GAE_VERSION === "production"
  }
}));

app.use(express.json());

// For Slack signature verification
const inject_raw_body = (req, _res, buf, encoding) => {
  req.raw_body = buf.toString(encoding);
};

app.use(express.urlencoded({ 
  extended: false, 
  verify: inject_raw_body
}));

app.use(express.static('public'));
app.use(files());

if (GAE_VERSION !== "production")
  app.use(Security.dev_credentials);

if (GAE_VERSION === "production")
  app.use(Security.gae_fix_ip);

// CORS Preflight -- https://developer.mozilla.org/en-US/docs/Glossary/Preflight_request
const add_cors = (req, res, next) => {
  if (req.method !== "OPTIONS")
    return next();

  res.set('Access-Control-Allow-Origin', 'https://kb.northwestern.edu');
  res.set('Access-Control-Allow-Headers', 'X-Conweb-Token');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  return res.status(204).end();
}

app.use(add_cors);

// Homepage -> Queue
app.get("/", (_req, res) => {
  res.redirect("/queue");
});

// TSC Kudos handler
app.use('/kudos', kudosRouter);

// TSC Photo change handler
app.use('/photo', Security.require_logged_in, photoRouter);

// TSC Today's Birthdays JSON
app.use('/birthdays', Security.require_nu_origin, Security.require_conweb_token, birthdayRouter);

// Login Handler
app.use('/profile/login', loginRouter);

// Logout Handler
app.use('/profile/logout', logoutRouter);

// TSC Profile handler
app.use('/profile', Security.require_logged_in, profileRouter);

// FP Queue Handler
app.use('/queue', queueRouter);

// Ticket Editor Handler
app.use('/edit-ticket', Security.require_logged_in, editTicketRouter);

// Contact CSV Handler
app.use('/contacts', Security.require_logged_in, contactsRouter);

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

// Schedule Handler
app.use('/schedule', Security.require_tss, scheduleRouter);

// Name Information Handler
app.use('/get-name', getNameRouter);

// Ticket Statistics Router
app.use('/ticket-stats', Security.require_logged_in, ticketStatsRouter);

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

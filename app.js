const express = require('express');
const parser = require('body-parser');
const files = require('express-fileupload');

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
const getEmailRouter = require('./routes/email');

const app = express();

app.set('view engine', 'pug');
app.set('views', './views');

app.set('trust proxy', true);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));
app.use(parser.json());
app.use(files());

app.get("/", (_req, res) => {
  res.redirect("/queue");
});

// TSC Kudos handler
app.use('/kudos', kudosRouter);

// TSC Photo change handler
app.use('/photo', photoRouter);

// TSC Today's Birthdays JSON
app.use('/birthdays', birthdayRouter);

// TSC Profile handler
app.use('/profile', profileRouter);

// FP Queue Handler
app.use('/queue', queueRouter);

// Ticket Editor Handler
app.use('/edit-ticket', editTicketRouter);

// Contact CSV Handler
app.use('/contacts', contactsRouter);

// Assignment Group Stats Handler
app.use('/assignment-group', assignmentGroupRouter);

// Category Stats Handler
app.use('/categorization', categorizationRouter);

// Spam Handler
app.use('/spam', spamRouter);

// Directory Handler
app.use('/directory', directoryRouter);

// WhenToWork Handler
app.use('/w2w', whenToWorkRouter);

app.use('/schedule', scheduleRouter);

app.use('/get-name', getNameRouter);
app.use('/get-emails', getEmailRouter);

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
module.exports = app;

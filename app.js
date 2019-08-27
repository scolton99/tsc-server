var express = require('express');
var parser = require('body-parser');
var files = require('express-fileupload');

var kudosRouter = require('./routes/kudos');
var photoRouter = require('./routes/photo');
var birthdayRouter = require('./routes/birthday');
var profileRouter = require('./routes/profile');
var queueRouter = require('./routes/queue');
var editTicketRouter = require('./routes/edit-ticket');

var app = express();

app.set('view engine', 'pug');
app.set('views', './views');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));
app.use(parser.json());
app.use(files());

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
module.exports = app;

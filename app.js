var express = require('express');
var parser = require('body-parser');

var kudosRouter = require('./routes/kudos');

var app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));
app.use(parser.json());

app.use('/kudos', kudosRouter);

app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).sendFile('/public/error.html', {root: __dirname});
})

app.use((_req, res, _next) => {
  res.sendFile('public/not_found.html', {root: __dirname});
})

module.exports = app;

var express = require('express');
var parser = require('body-parser');

var kudosRouter = require('./routes/kudos');

var app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));
app.use(parser.json());

app.use('/kudos', kudosRouter);

module.exports = app;

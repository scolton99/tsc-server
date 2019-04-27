var express = require('express');

var kudosRouter = require('./routes/kudos');

var app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));

app.use('/kudos', kudosRouter);

module.exports = app;

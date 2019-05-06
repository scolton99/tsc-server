var express = require('express');
var router = express.Router();
var airtable = require('airtable');

// Setup connection to Airtable
var a_base = new airtable({apiKey: process.env.AIRTABLE_API_KEY}).base('appydp8wFv8Yd5nVE');

const formatPhone = number => {
    const all = number.split("-");

    return "(" + all[0] + ") " + all[1] + "-" + all[2];
}

router.get("/edit/:record_id", async (req, res, next) => {
    const { record_id } = req.params;

    a_base('Main').find("rec" + record_id, (err, record) => {
        // If Airtable returns an error, log it and return 500
        if (err) {
            console.error(err);
            return next(err);
        }

        // If we can't find a record with that ID, return 404
        if (record.length === 0) {
            console.error("No record found with ID " + record_id);
            return next();
        }

        console.log(record.fields);

        res.render('edit-profile', {user: record.fields});
    });
});

router.get("/:netid", (req, res, next) => {
    const { netid } = req.params;

    a_base('Main').select({
        filterByFormula: 'AND({NetID} = "' + netid + '", {Current})'
    }).firstPage((err, records) => {
        // If Airtable returns an error, log it and return 500
        if (err) {
            console.error(err);
            return next(err);
        }

        // If we can't find a record with that ID, return 404
        if (records.length === 0) {
            console.error("No record found with ID " + record_id);
            return next();
        }

        console.log(records[0].fields);

        res.render('profile', {user: records[0].fields, formatPhone: formatPhone});
    });
});

module.exports = router;
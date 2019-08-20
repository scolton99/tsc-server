var express = require('express');
var router = express.Router();
var airtable = require('airtable');
var fs = require('fs');
var request = require('request-promise-native');
var xml2js = require('xml2js');

// Setup connection to Airtable
var a_base = new airtable({apiKey: process.env.AIRTABLE_API_KEY || "null"}).base('appydp8wFv8Yd5nVE');

const formatPhone = number => {
    const all = number.split("-");

    return "(" + all[0] + ") " + all[1] + "-" + all[2];
}

const fp_request = fs.readFileSync(__dirname + '/../assets/fp_request.xml', {encoding: 'UTF-8'});

const get_user_tickets = async netid => {
    const fp_username = process.env.FP_USERNAME;
    const fp_password = process.env.FP_PASSWORD;

    const query = `SELECT COUNT(*) FROM (SELECT DISTINCT mrID FROM MASTER1_FIELDHISTORY WHERE mrUSERID = '${netid}')`;

    const tc_request_auth = fp_request.replace('{{FP_USERNAME}}', fp_username).replace('{{FP_PASSWORD}}', fp_password).replace("{{FP_QUERY}}", query);

    const response = await request({
        method: 'POST',
        uri: 'https://itsm-fp.northwestern.edu/MRcgi/MRWebServices.pl',
        body: tc_request_auth
    });

    let num_tickets = null;
    xml2js.parseString(response, (err, result) => {
        if (err) {
            return next(err);
        }

        // This is the worst thing ever written but you end up with the number of tickets currently in our queue!
        const {
            'SOAP-ENV:Envelope': {
                'SOAP-ENV:Body': [{
                    'namesp1:MRWebServices__searchResponse': [{
                        return: [{
                            item: [{
                                item: [{
                                    value: [{
                                        _: ticket_num_str
                                    }]
                                }]
                            }]
                        }]
                    }]
                }]
            }
        } = result;

        num_tickets = parseInt(ticket_num_str);
    });
    
    return num_tickets;
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

        res.render('profile', {user: records[0].fields, formatPhone: formatPhone});
    });
});

router.get("/tickets/:netid", async (req, res, _next) => {
    let num_tickets = await get_user_tickets(req.params.netid);
    res.json({num_tickets: num_tickets});
});

router.get("/:netid/edit", async (req, res, _next) => {
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

        res.render('edit-profile', {user: records[0].fields, formatPhone: formatPhone});
    });
});

module.exports = router;

var express = require('express');
var router = express.Router();
var fs = require('fs');
var request = require('request-promise-native');
var xml2js = require('xml2js');

const queue_request = fs.readFileSync(__dirname + '/../assets/queue_request.xml', {encoding: 'UTF-8'});

const get_background_color = num_tickets => {
    if (num_tickets === 0) {
        return "#401F68";
    } else if (num_tickets <= 5) {
        return "#087f23";
    } else if (num_tickets < 20) {
        return "#c6a700";
    } else if (num_tickets < 50) {
        return "#ba000d";
    } else {
        return "#000000";
    }
}

const get_num_tickets = async () => {
    const fp_username = process.env.FP_USERNAME;
    const fp_password = process.env.FP_PASSWORD;

    const queue_request_auth = queue_request.replace('{{FP_USERNAME}}', fp_username).replace('{{FP_PASSWORD}}', fp_password);
    
    const response = await request({
        method: 'POST',
        uri: 'https://itsm-fp.northwestern.edu/MRcgi/MRWebServices.pl',
        body: queue_request_auth
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
};

router.get('/', async (_req, res, _next) => {
    res.sendFile('queue.html', {root: global.root_dir + '/public'});
});

router.get('/status', async (_req, res, next) => {
    try {
        const num_tickets = await get_num_tickets();
        const verb = num_tickets === 1 ? "is" : "are";
        const noun = num_tickets === 1 ? "ticket" : "tickets";
        const background_color = get_background_color(num_tickets);

        res.json({
            num_tickets: num_tickets,
            verb: verb,
            noun: noun,
            background_color: background_color
        });
    } catch (e) {
	console.log(e.message);

        res.json({
            num_tickets: 'an unknown amount of',
            verb: 'is',
            noun: 'tickets',
            background_color: '#000'
        });
    }
})

module.exports = router;

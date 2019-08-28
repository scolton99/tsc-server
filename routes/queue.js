const express = require('express');
const router = express.Router();
const fs = require('fs');
const request = require('request-promise-native');
const xml2js = require('xml2js');

const fp_request = fs.readFileSync(__dirname + '/../assets/fp_request.xml', { encoding: 'UTF-8' });

global.stored_ticket_value = -1;

const get_background_color = num_tickets => {
  if (num_tickets === 0) {
    return "#401F68";
  } else if (num_tickets <= 10) {
    return "#087f23";
  } else if (num_tickets <= 25) {
    return "#c6a700";
  } else if (num_tickets <= 50) {
    return "#ba000d";
  } else {
    return "#000000";
  }
}

const get_num_tickets = async () => {
  const fp_username = process.env.FP_USERNAME;
  const fp_password = process.env.FP_PASSWORD;

  const query = "SELECT COUNT(*) from MASTER1 WHERE (mrSTATUS IN ('Customer__bResponded', 'In__bProgress', 'Open', 'Request') AND mrASSIGNEES LIKE '%AA_SUPPORT__bCENTER%')";

  const queue_request_auth = fp_request.replace('{{FP_USERNAME}}', fp_username).replace('{{FP_PASSWORD}}', fp_password).replace("{{FP_QUERY}}", query);

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
  res.sendFile('queue.html', { root: global.root_dir + '/public' });
});

router.get('/status', async (_req, res, _next) => {
  try {
    const num_tickets = await get_num_tickets();
    const verb = num_tickets === 1 ? "is" : "are";
    const noun = num_tickets === 1 ? "ticket" : "tickets";
    const background_color = get_background_color(num_tickets);

    global.stored_ticket_value = num_tickets;

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
});

router.get('/quick', async (_req, res, _next) => {
  res.json({
    num_tickets: global.stored_ticket_value,
    verb: global.stored_ticket_value === 1 ? 'is' : 'are',
    noun: global.stored_ticket_value === 1 ? 'ticket' : 'tickets',
    background_color: get_background_color(global.stored_ticket_value)
  });
});

module.exports = router;

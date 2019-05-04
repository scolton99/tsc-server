var express = require('express');
var router = express.Router();
var airtable = require('airtable');

// Setup connection to Airtable
var a_base = new airtable({apiKey: process.env.AIRTABLE_API_KEY}).base('appydp8wFv8Yd5nVE');

router.get('/', (req, res, next) => {
	const bday_date = (new Date()).toLocaleDateString("en-US", {month: 'short', day: 'numeric'});
	a_base('Main').select({
		fields: ['First Name', 'Birthday', 'Name'],
		filterByFormula: '{Birthday} = \'' + bday_date + '\''
	}).firstPage((err, records) => {
        // There should never be more than one page. Not going to have more than 100 birthdays.

		if (err) { 
            // If Airtable returns an error, log it and return 500
			console.error(err);
			return next(err);
		}
            
        const birthdays = records.map(record => record.get("First Name"));
        
        res.json(birthdays);
	});
});

module.exports = router;
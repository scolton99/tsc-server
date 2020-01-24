const express = require('express');
const router = express.Router();
const airtable = require('airtable');

// Setup connection to Airtable
const a_base = new airtable({apiKey: process.env.AIRTABLE_API_KEY || "null"}).base('appydp8wFv8Yd5nVE');

router.get('/', (_req, res, next) => {
	// Allow this to be loaded by the KB
	res.header("Access-Control-Allow-Origin", "https://kb.northwestern.edu");

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

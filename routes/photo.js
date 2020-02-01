const express = require('express');
const router = express.Router();
const airtable = require('airtable');
const {Storage} = require('@google-cloud/storage');

// Setup connection to Airtable
const a_base = new airtable({apiKey: process.env.AIRTABLE_API_KEY || "null"}).base('appydp8wFv8Yd5nVE');

const BUCKET_NAME = process.env.BUCKET_NAME;

// POST /photo
router.post('/', (req, res) => {
  // If no file was uploaded, return a request error
  if (Object.keys(req.files).length === 0) {
    return res.status(400).end();
  }

  const { netid } = req.session;
  const { name: filename, mimetype } = req.files.photo;
  
  // Get the file's extension
  const segments = filename.split('.');
  const ext = segments[segments.length - 1];

  // Get the record corresponding to the submitted NetID
  a_base('Main').select({
    filterByFormula: 'AND({NetID} = "' + netid + '", {Current})',
    fields: ['Name'],
  }).firstPage((err, records) => {
    // If there was an issue with the Airtable request, redirect to error page
    if (err) { 
      console.error(err);
      return res.status(500).end();
    }

    // If we couldn't find a user with that NetID, redirect to error page
    if (records.length === 0) {
      console.error("Couldn't find record with NetID " + netid);
      return res.status(500).end();
    }

    const storage = new Storage();
    const bucket = storage.bucket(BUCKET_NAME);
    const file = bucket.file(`photos/${netid}.${ext}`);
    
    let errored = false;

    const stream = file.createWriteStream({ resumable: false, contentType: mimetype });
    stream.on('error', err => {
      errored = true;
      console.error(err);
      return res.status(500).end();
    });
    
    stream.end(req.files.photo.data, null, err => {
      if (errored || err) return;

      file.makePublic().then(() => {
        // Get the record ID for this con in Airtable
        const rec_id = records[0].id;
        a_base('Main').update(rec_id, {
          "Photo": [
            {
              // Refer to this server; file only needs to be available for a few seconds according to http://bit.ly/2UI9yQE
              url: 'https://storage.googleapis.com/' + BUCKET_NAME + '/photos/' + netid + '.' + ext + '?' + Date.now(),
              // Add filename to fix previews
              filename: netid + '.' + mimeToExt(mimetype)
            }
          ]
        }, (err, record) => {
          // If there was an error updating the record, log it and redirect to error page
          if (err) {
            console.error(err);
            return res.status(500).end();
          }

          res.set('Content-Type', 'text/plain');
          res.send(record.fields.Photo[0].url);

          // Everything worked! Refer them back.
          // res.redirect(redirect + "#success");
        });
      });
    });
  });
});

// Convert a MIME type to an extension
const mimeToExt = mime => {
  switch (mime) {
    case "image/jpeg": {
      return "jpg";
    }
    case "image/png": {
      return ".png";
    }
    case "image/tiff": {
      return ".tiff";
    }
    case "image/gif": {
      return ".gif";
    }
    case "image/bmp": {
      return ".bmp"
    }
    default: {
      return null;
    }
  }
};

module.exports = router;

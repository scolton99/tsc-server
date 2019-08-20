const express = require('express');
const router = express.Router();
const airtable = require('airtable');
const fs = require('fs');

// Setup connection to Airtable
const a_base = new airtable({apiKey: process.env.AIRTABLE_API_KEY || "null"}).base('appydp8wFv8Yd5nVE');

// POST /photo
router.post('/', (req, res) => {
  // If no file was uploaded, return a request error
  if (Object.keys(req.files).length === 0) {
    return res.status(400).end();
  }

  const { redirect, netid } = req.body;
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
      return res.redirect(redirect + '#failure');
    }

    // If we couldn't find a user with that NetID, redirect to error page
    if (records.length === 0) {
      console.error("Couldn't find record with NetID " + netid);
      return res.redirect(redirect + '#failure');
    }

    // Get all OLD photos for this NetID and delete them
    const photos = fs.readdirSync(global.root_dir + '/public/photos');
    photos.forEach(photo => {
      if (!photo.startsWith(netid)) return;
      fs.unlinkSync(global.root_dir + '/public/photos/' + photo);
    });

    // Move the temporary file into our public photos directory so that Airtable can read it later
    req.files.photo.mv(global.root_dir + '/public/photos/' + netid + '.' + ext, err => {
      if (err) return res.redirect(redirect + "#failure");
    });

    // Get the record ID for this con in Airtable
    const rec_id = records[0].id;
    a_base('Main').update(rec_id, {
      "Photo": [
        {
          // Refer to this server; file only needs to be available for a few seconds according to http://bit.ly/2UI9yQE
          url: 'https://tsc-server.herokuapp.com/photo/' + netid + '?' + Date.now(),
          // Add filename to fix previews
          filename: netid + '.' + mimeToExt(mimetype)
        }
      ]
    }, err => {
      // If there was an error updating the record, log it and redirect to error page
      if (err) {
        console.error(err);
        return res.redirect(redirect + "#failure");
      }

      // Everything worked! Refer them back.
      res.redirect(redirect + "#success");
    });
  });
});

// Convert a MIME type to an extension
function mimeToExt(mime) {
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
}

// GET /photo/:netid
router.get('/:netid', (req, res, next) => {
  const photos = fs.readdirSync(global.root_dir + '/public/photos');
  let { netid } = req.params;
  netid = netid.toLowerCase();
  const con_photos = photos.filter(photo => photo.startsWith(netid.toLowerCase()));
  
  // If we can't find a photo for this con, return 404
  if (con_photos.length === 0) {
    return next();
  }

  const con_photo = con_photos[0];

  res.sendFile(con_photo, {root: global.root_dir + '/public/photos'});
});

module.exports = router;

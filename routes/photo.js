const express = require('express');
const router = express.Router();
const airtable = require('airtable');
const fs = require('fs');

// Setup connection to Airtable
const a_base = new airtable({apiKey: process.env.AIRTABLE_API_KEY}).base('appydp8wFv8Yd5nVE');

// GET /photo
router.get('/', (req, res, next) => {
  res.sendFile('/public/photo_form.html', {root: global.root_dir});
});

// POST /photo
router.post('/', (req, res, next) => {
  if (Object.keys(req.files).length === 0) {
    return res.status(400).end();
  }

  const { redirect, netid } = req.body;
  const { name: filename, mimetype } = req.files.photo;
  const segments = filename.split('.');
  const ext = segments[segments.length - 1];

  a_base('Main').select({
    filterByFormula: '{NetID} = "' + netid + '"',
    fields: ['Name']
  }).firstPage((err, records) => {
    if (err) {
      console.error(err);
      return res.redirect(redirect + '#failure');
    }

    if (records.length === 0) {
      console.error("Couldn't find record with NetID " + netid);
      return res.redirect(redirect + '#failure');
    }

    const photos = fs.readdirSync(global.root_dir + '/public/photos');
    photos.forEach(photo => {
      if (!photo.startsWith(netid)) return;
      fs.unlinkSync(global.root_dir + '/public/photos/' + photo);
    });

    req.files.photo.mv(global.root_dir + '/public/photos/' + netid + '.' + ext, err => {
      if (err) return res.redirect(redirect + "#failure");
    });

    const rec_id = records[0].id;
    a_base('Main').update(rec_id, {
      "Photo": [
        {
          url: 'https://tsc-server.herokuapp.com/photo/' + netid + '?' + Date.now(),
          type: mimetype
        }
      ]
    }, err => {
      if (err) {
        console.error(err);
        return res.redirect(redirect + "#failure");
      }

      res.redirect(redirect + "#success");
    });
  });
});

router.get('/:netid', (req, res, next) => {
  const photos = fs.readdirSync(global.root_dir + '/public/photos');
  let { netid } = req.params;
  netid = netid.toLowerCase();
  const con_photos = photos.filter(photo => photo.startsWith(netid.toLowerCase()));
  
  if (con_photos.length === 0) {
    return next();
  }

  const con_photo = con_photos[0];

  res.sendFile(con_photo, {root: global.root_dir + '/public/photos'});
});

module.exports = router;

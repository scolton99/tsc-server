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
router.post('/', async (req, res, next) => {
  if (Object.keys(req.files).length === 0) {
    return res.status(400).end();
  }

  const { redirect, netid } = req.body;
  const { name: filename } = req.files.photo;
  const segments = filename.split('.');
  const ext = segments[segments.length - 1];

  req.files.photo.mv(global.root_dir + '/public/photos/' + netid + '.' + ext, err => {
    if (err) return res.redirect(redirect + "#failure");

    a_base('Main').select({
      filterByFormula: '{NetID} = "' + netid + '"',
      fields: ['Name']
    }).firstPage((err, records) => {
      if (err) {
        console.error(err);
        return res.redirect(redirect + '#failure');
      }

      const rec_id = records[0].id;
      a_base('Main').update(rec_id, {
        "Photo": [
          {
            url: 'https://tsc-server.herokuapp.com/photo/' + netid + '.' + ext
          }
        ]
      }, (err, record) => {
        if (err) {
          console.error(err);
          return res.redirect(redirect + "#failure");
        }

        res.redirect(redirect + "#success");
      });
    });
  });
});

router.get('/:netid', (req, res, next) => {
   const photos = fs.readdirSync(global.root_dir + '/public/photos');
   const { netid } = req.params;

   console.log(photos);
   const con_photo = photos.filter(photo => photo.startsWith(netid.toLowerCase()))[0];

   console.log(con_photo);
   res.sendFile(con_photo, {root: global.root_dir + '/public/photos'});
});

module.exports = router;

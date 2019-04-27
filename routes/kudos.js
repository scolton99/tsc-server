var express = require('express');
var router = express.Router();

router.post('/', (req, res) => {
  console.dir(req.body);
});

module.exports = router;

const express = require('express');
const router = express.Router();
const request = require('request-promise-native');

router.get('/', (_req, res, _next) => {
	res.render('global-marketing');
});

router.post('/', async (req, res, _next) => {
  let { domain } = req.body;
  domain = domain.replace(/.*:\/\//, "").replace(/^(.*?)\/.*$/, "$1").toLowerCase();

  try {
    const dns_response = await request(`https://dns.google/resolve?name=${domain}&type=A`);

    const { Answer: answer } = JSON.parse(dns_response);

    for (const item of answer) {
      if (item.name === "common.wideip.northwestern.edu." || item.data === "common.wideip.northwestern.edu.") {
        return res.json({error: false, supported: true, domain: domain});
      }
    }
  
    return res.json({error: false, supported: false, domain: domain});
  } catch (e) {
    console.error(e);
    return res.json({error: true, domain: domain});
  }
});

module.exports = router;

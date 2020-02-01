const express = require('express');
const router = express.Router();
const Security = require('../util/security');

const { OIDC_LOGOUT_ENDPOINT, OIDC_LOGOUT_REDIRECT_URI, GAE_VERSION } = process.env;

router.get('/', (req, res, _next) => {
  req.session.destroy(err => {
    if (err) return next(err);

    if (GAE_VERSION === "production") {
      const next = encodeURIComponent(OIDC_LOGOUT_REDIRECT_URI);
      res.redirect(`${OIDC_LOGOUT_ENDPOINT}${next}`);
    } else {
      res.redirect("/");
    }
  });
});

module.exports = router;
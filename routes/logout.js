const express = require('express');
const router = express.Router();

const OIDC_LOGOUT_ENDPOINT = process.env.OIDC_LOGOUT_ENDPOINT;
const OIDC_LOGOUT_REDIRECT_URI = process.env.OIDC_LOGOUT_REDIRECT_URI;

router.get('/', (req, res, _next) => {
  req.session.destroy(err => {
    if (err) return next(err);

    const next = encodeURIComponent(OIDC_LOGOUT_REDIRECT_URI);
    res.redirect(`${OIDC_LOGOUT_ENDPOINT}${next}`);
  });
});

module.exports = router;
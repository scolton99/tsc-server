const express = require('express');
const router = express.Router();
const airtable = require('airtable');
const jwt = require('jsonwebtoken');
const request = require('request-promise-native');

const {
  OIDC_CLIENT_ID,
  OIDC_CLIENT_SECRET,
  OIDC_AUTH_ENDPOINT,
  OIDC_TOKEN_ENDPOINT,
  OIDC_REDIRECT_URI,
  GAE_VERSION,
  AIRTABLE_API_KEY
} = process.env;

const SCOPES = [
  "openid"
];

const a_base = new airtable({apiKey: AIRTABLE_API_KEY || "null"}).base('appydp8wFv8Yd5nVE');

const get_valid_netids = async () => {
  try {
    const recs = await a_base('Main').select({
      filterByFormula: '{Current}',
      fields: ['NetID']
    }).firstPage();

    const x = recs.map(r => r.get('NetID').toLowerCase());
    return x;
  } catch (e) {
    console.error(e);
    return null;
  }
};

router.get("/", (_req, res, _next) => {
  if (GAE_VERSION !== "production")
    return res.redirect("/profile");

  const scopes_str = encodeURIComponent(SCOPES.join(" "));
  const redirect_uri = encodeURIComponent(OIDC_REDIRECT_URI);

  return res.redirect(`${OIDC_AUTH_ENDPOINT}?client_id=${OIDC_CLIENT_ID}&scope=${scopes_str}&response_type=code&redirect_uri=${redirect_uri}`);
});

router.get("/oidc", async (req, res, next) => {
  if (req.query.error) {
    console.error(req.query.error + "\n"+ req.query.error_description);

    switch (req.query.error) {
      case "interaction_required":
      case "login_required":
      case "account_selection_reqired":
      case "consent_required":
      case "access_denied": {
        return res.status(403).sendFile('forbidden.html', { root: global.root_dir + '/public' });
      }
      
      case "invalid_request_object":
      case "request_not_supported":
      case "invalid_request_uri":
      case "request_uri_not_supported":
      case "registration_not_supported":
      case "invalid_request":
      case "unauthorized_client":
      case "invalid_scope":
      case "unsupported_response_type":
      case "server_error":
      case "temporarily_unavailable": {
        return next(req.query.error);
      }

      default: {
        return next(req.query.error);
      }
    }

  }

  const {code} = req.query;

  const token_res_raw = await request({
    method: 'POST',
    uri: OIDC_TOKEN_ENDPOINT,
    form: {
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: OIDC_REDIRECT_URI,
      client_id: OIDC_CLIENT_ID,
      client_secret: OIDC_CLIENT_SECRET
    }
  });

  const token_res = JSON.parse(token_res_raw);
  const tokens = jwt.decode(token_res.id_token);

  const valid = await get_valid_netids();

  if (valid === null)
    return next('Failed to load valid NetIDs');

  if (valid.includes(tokens.sub.toLowerCase())) {
    req.session.netid = tokens.sub;

    res.redirect(req.session.last || `/profile/${req.session.netid}`);
  } else {
    return res.status(403).sendFile('forbidden.html', { root: global.root_dir + '/public' });
  }
});

module.exports = router;
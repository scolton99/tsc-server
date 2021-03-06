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
  AIRTABLE_API_KEY,
  DEV_BASIC_AUTH_PWD
} = process.env;

const SCOPES = [
  "openid"
];

const a_base = new airtable({apiKey: AIRTABLE_API_KEY || "null"}).base('appydp8wFv8Yd5nVE');

const get_valid_netids = async () => {
  try {
    const recs = await a_base('Main').select({
      filterByFormula: '{Current}',
      fields: ['NetID', 'Position']
    }).firstPage();

    const x = {
      all: recs.map(r => r.get('NetID').toLowerCase()),
      lcs: recs.filter(r => r.get('Position') === "Lead Consultant").map(r => r.get('NetID').toLowerCase())
    };

    // Whoops, Lynne needs to be able to log in as well.
    x.lcs.push("lynne");
    x.all.push("lynne");

    return x;
  } catch (e) {
    console.error(e);
    return null;
  }
};

router.get("/", (req, res, _next) => {
  if (req.session.netid)
    return res.redirect("/profile");

  if (GAE_VERSION !== "production" && !GAE_VERSION.endsWith("-force-websso")) {
    const { flash } = req.session;
    req.session.flash = null;
    return res.render("login", { flash: flash });
  }

  const scopes_str = encodeURIComponent(SCOPES.join(" "));
  const redirect_uri = encodeURIComponent(OIDC_REDIRECT_URI);

  return res.redirect(`${OIDC_AUTH_ENDPOINT}?client_id=${OIDC_CLIENT_ID}&scope=${scopes_str}&response_type=code&redirect_uri=${redirect_uri}`);
});

router.post("/", (req, res, _next) => {
  const { username, password } = req.body;

  if (!username || !password) {
    req.session.flash = "Both username and password are required.";
    return res.redirect("/profile/login");
  }
  
  if (password !== DEV_BASIC_AUTH_PWD) {
    req.session.flash = "Incorrect password.";
    return res.redirect("/profile/login");
  }

  req.session.netid = username;
  req.session.lc = true;
  res.redirect(req.session.last || "/profile");
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
    },
    simple: false
  });

  const token_res = JSON.parse(token_res_raw);

  if (token_res.error) {
    console.error(token_res.error + "\n" + token_res.error_description);
    return next(token_res.error_description);
  }

  const tokens = jwt.decode(token_res.id_token);

  const valid = await get_valid_netids();

  if (valid === null)
    return next('Failed to load valid NetIDs');

  if (valid.all.includes(tokens.sub.toLowerCase())) {
    req.session.netid = tokens.sub;
    req.session.lc = valid.lcs.includes(tokens.sub.toLowerCase());

    res.redirect(req.session.last || `/profile/${req.session.netid}`);
  } else {
    return res.status(403).sendFile('forbidden.html', { root: global.root_dir + '/public' });
  }
});

module.exports = router;
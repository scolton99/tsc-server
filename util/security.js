const IP = require('./IP');
const crypto = require('crypto');

const { SLACK_SECRET, CONWEB_TOKEN, GAE_VERSION } = process.env;

const exp = {};

const forbidden = (req, res, reason) => {
    if (typeof(reason) !== 'undefined')
        console.warn(`Rejecting request from ${req.ip}: ${reason}`)

    return res.status(403).sendFile('forbidden.html', { root: global.root_dir + '/public' });
};

const get_origin_hostname = origin => {
    const res = /^.*?:\/\/([a-z0-9\-\.]*?)(?:\:[0-9]{1,5})?$/i.exec(origin);

    return res === null ? null : res[1];
};

const is_development = () => GAE_VERSION !== "production";

exp.require_conweb_token = (req, res, next) => {
    if (is_development())
        return next();

    let conweb_body_token;
    if (req.body)
        conweb_body_token = req.body.conweb_token;

    if (req.get('X-Conweb-Token') !== CONWEB_TOKEN && conweb_body_token !== CONWEB_TOKEN)
        forbidden(req, res, "Conweb token missing or wrong");
    else
        next();
};

exp.require_northwestern = (req, res, next) => {
    if (is_development())
        return next();

    if (!IP.isNU(req.ip))
        forbidden(req, res, "Source not a Northwestern IP address");
    else
        next();
};

exp.require_local = (req, res, next) => {
    if (is_development())
        return next();

    if (!IP.isLocal(req.ip))
        forbidden(req, res, "Source not a local address");
    else
        next();
};

exp.require_tss = (req, res, next) => {
    if (is_development())
        return next();

    if (!IP.isTSS(req.ip))
        forbidden(req, res, "Source not a TSS IP address");
    else
        next();
};

exp.require_nu_origin = (req, res, next) => {
    if (is_development())
        return next();

    if (typeof(req.get('Origin')) === 'undefined') return forbidden(req, res, "No origin header present");

    const origin_regex = /^(?:.+\.)?northwestern\.edu$/;
    
    if (!origin_regex.test(get_origin_hostname(req.get('Origin'))))
        forbidden(req, res, `Invalid origin header value (${req.get('Origin')})`);
    else
        next();
};

exp.require_nu_referrer = (req, res, next) => {
    if (is_development())
        return next();

    if (typeof(req.get('Referrer')) === 'undefined') return forbidden(req, res, "No referrer header present");

    const referrer_regex = /^https?:\/\/([a-z0-9\-\.]*?)(?:\/.*)?$/i;
    const match_res = referrer_regex.exec(req.get('Referrer'));
    
    if (match_res === null)
        return forbidden(req, res, `Invalid referrer header value (${req.get('Referrer')})`);

    const match = match_res[1].toLowerCase();

    if (match !== "kb.northwestern.edu" && match !== "tss-support-center.appspot.com")
        forbidden(req, res, `Invalid referrer header value (${req.get('Referrer')})`);
    else
        next();
}

exp.require_slack_verified = (req, res, next) => {
    if (is_development())
        return next();

    const slack_timestamp = req.get('X-Slack-Request-Timestamp');
    const { raw_body: body } = req;
    const slack_signature = req.get('X-Slack-Signature');

    const hmac = crypto.createHmac('sha256', SLACK_SECRET);
    const signature = 'v0=' + hmac.update(`v0:${slack_timestamp}:${body}`).digest('hex');

    if (signature !== slack_signature)
        forbidden(req, res, "Slack API signature nonexistent or did not match calculated signature");
    else
        next();
};

exp.require_logged_in = (req, res, next) => {
    if (!req.session.netid) {
        req.session.last = req.baseUrl;
        return res.redirect("/profile/login");
    }

    next();
};

exp.require_lc = (req, res, next) => {
    if (!req.session.netid) {
        req.session.last = req.baseUrl;
        return res.redirect("/profile/login");
    }

    if (!req.session.lc) 
        return res.redirect("/");

    next();
};

exp.gae_fix_ip = (req, _res, next) => {
    req.headers["x-forwarded-for"] = req.get('X-AppEngine-User-IP') + ', ' + req.get('X-Forwarded-For');
    next();
};

exp.dev_credentials = (req, res, next) => {
    if (IP.isLocal(req.ip))
        return next();

    if (!req.session.netid && req.path !== "/profile/login") {
        req.session.last = req.baseUrl;
        return res.redirect("/profile/login");
    }

    next();
};

module.exports = exp;

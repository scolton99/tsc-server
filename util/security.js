const IP = require('./IP');
const crypto = require('crypto');

const { SLACK_SECRET } = process.env;

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

exp.require_northwestern = (req, res, next) => {
    if (!IP.isNU(req.ip))
        forbidden(req, res, "Source not a Northwestern IP address");
    else
        next();
};

exp.require_local = (req, res, next) => {
    if (!IP.isLocal(req.ip))
        forbidden(req, res, "Source not a local address");
    else
        next();
};

exp.require_tss = (req, res, next) => {
    if (!IP.isTSS(req.ip))
        forbidden(req, res, "Source not a TSS IP address");
    else
        next();
};

exp.require_all_granted = (_req, _res, next) => {
    next();
};

exp.require_nu_origin = (req, res, next) => {
    if (typeof(req.get('Origin')) === 'undefined') return forbidden(req, res, "No origin header present");

    const origin_regex = /^(?:.+\.)?northwestern\.edu$/;
    
    if (!origin_regex.test(get_origin_hostname(req.get('Origin'))))
        forbidden(req, res, `Invalid origin header value (${req.get('Origin')})`);
    else
        next();
};

exp.require_nu_referrer = (req, res, next) => {
    if (typeof(req.get('Referrer')) === 'undefined') return forbidden(req, res, "No referrer header present");

    const referrer_regex = /^https?:\/\/([a-z0-9\-\.]*?)(?:\/.*)?$/i;
    const match_res = referrer_regex.exec(req.get('Referrer'));
    
    if (match_res === null)
        return forbidden(req, res, `Invalid referrer header value (${req.get('Referrer')})`);

    const match = match_res[1].toLowerCase();

    if (match !== "kb.northwestern.edu")
        forbidden(req, res, `Invalid referrer header value (${req.get('Referrer')})`);
    else
        next();
}

exp.require_slack_verified = (req, res, next) => {
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

module.exports = exp;

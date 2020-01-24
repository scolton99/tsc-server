const express = require('express');
const router = express.Router();
const request = require('request-promise-native');

const W2Wpwd = process.env.W2W_PWD;

router.get('/get-sid', async (_req, res, next) => {
    res.header("Access-Control-Allow-Origin", "https://kb.northwestern.edu");
    
    const req = await request.post(
        'https://www.whentowork.com/cgi-bin/w2w.dll/login',
        {
            form: {
                name: 'signin',
                Launch: null,
                LaunchParams: null,
                UserId1: 'tco393',
                Password1: W2Wpwd,
                captcha_required: false
            },
            simple: false,
            followRedirect: true,
            followAllRedirects: true,
            resolveWithFullResponse: true
        }
    );

    res.send(/SID=(.*)/.exec(req.request.uri.query)[1]);
});

module.exports = router;

var path = require('path'),
    fs = require('fs'),
    util = require('util'),

    Express = require('express'),

    dump = require('../../../lib/dump'),
    router = Express.Router();


router.get('/', function (req, res, next) {
    res.render('index', {
        user : (req.session && req.session.passport && req.session.passport.user) ? req.session.passport.user : false,
        title: 'Pet Data Entry'
    });
});

module.exports = router;

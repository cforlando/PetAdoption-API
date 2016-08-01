var path = require('path'),
    fs = require('fs'),
    util = require('util'),

    Express = require('express'),
    passport = require('passport'),

    dump = require('../../../lib/dump'),
    router = Express.Router();


//router.get('/', passport.authenticate('basic'), function (req, res, next) {
router.get('/', function (req, res, next) {
    res.render('index', { title: 'Pet Data Entry' });
});

module.exports = router;

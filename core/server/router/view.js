var path = require('path'),
    fs = require('fs'),
    util = require('util'),

    Express = require('express'),

    config = require('../../config');


/**
 *
 * @augments Express.Router
 * @class ViewRouter
 * @param {AppController} controller
 * @returns {ViewRouter}
 * @constructor
 */
function ViewRouter(controller) {
    var router = Express.Router();

    router.get('/',
        controller.session(),
        controller.passport.initialize(),
        controller.passport.session(),
        function (req, res) {
            res.render('index', {
                user: req.user,
                GOOGLE_MAPS_KEY: config.GOOGLE_MAPS_KEY,
                title: 'Pet Data Entry',
                env:  process.env
            });
        });

    router.get('/auth/google/',
        controller.session(),
        controller.passport.initialize(),
        controller.passport.authenticate('google', {
            scope: [
                'https://www.googleapis.com/auth/plus.login'
            ]
        }));

    router.get('/auth/google/callback/',
        controller.session(),
        controller.passport.initialize(),
        controller.passport.authenticate('google', {
            failureRedirect: '/'
        }),
        controller.onLoginSuccess());

    return router;
}

module.exports = ViewRouter;

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
        controller.userSession,
        controller.passport.initialize(),
        controller.passport.session(),
        function (req, res) {
            res.render('index', {
                user: req.user,
                title: 'Pet Data Entry'
            });
        });

    router.get('/auth/google/',
        controller.userSession,
        controller.passport.initialize(),
        controller.passport.authenticate('google', {
            scope: [
                'https://www.googleapis.com/auth/plus.login'
            ]
        }));

    router.get('/auth/google/callback/',
        controller.userSession,
        controller.passport.initialize(),
        controller.passport.authenticate('google', {
            failureRedirect: '/'
        }),
        controller.onLoginSuccess());

    return router;
}

module.exports = ViewRouter;

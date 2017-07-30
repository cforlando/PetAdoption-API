var path = require('path');
var fs = require('fs');
var util = require('util');

var Express = require('express');

var config = require('../../config');


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
        controller.auth.session(),
        controller.auth.passport.initialize(),
        controller.auth.passport.session(),
        function (req, res) {
            res.render('index', {
                user: req.user,
                title: 'Pet Data Entry',
                config:  config
            });
        });

    router.get('/auth/google',
        controller.auth.session(),
        controller.auth.passport.initialize(),
        controller.auth.passport.authenticate('google', {
            scope: [
                'https://www.googleapis.com/auth/plus.login'
            ]
        }));

    router.get('/auth/google/callback',
        controller.auth.session(),
        controller.auth.passport.initialize(),
        controller.auth.passport.authenticate('google', {
            failureRedirect: '/'
        }),
        controller.auth.onLoginSuccess());

    return router;
}

module.exports = ViewRouter;

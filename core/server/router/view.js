var path = require('path'),
    fs = require('fs'),
    util = require('util'),

    Express = require('express'),

    dump = require('../../../lib/dump');


/**
 *
 * @augments Express.Router
 * @class ViewRouter
 * @param {AppController} controller
 * @returns {ViewRouter}
 * @constructor
 */
function ViewRouter(controller){
    var router = Express.Router();

    router.use(controller.passport.initialize());

    router.get('/', controller.passport.session(), function (req, res) {
        res.render('index', {
            user : (req.session && req.session.passport && req.session.passport.user) ? req.session.passport.user : false,
            title: 'Pet Data Entry'
        });
    });

    router.get('/auth/google/',
        controller.passport.authenticate('google', {
            scope: [
                'https://www.googleapis.com/auth/plus.login'
            ]
        }));

    router.get('/auth/google/callback/',
        controller.passport.authenticate('google', {
            failureRedirect: '/'
        }),
        controller.onLoginSuccess());

    return router;
}

module.exports = ViewRouter;

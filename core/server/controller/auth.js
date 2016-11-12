var fs = require('fs'),
    path = require('path'),
    url = require('url'),

    _ = require('lodash'),
    passport = require('passport'),
    GoogleStrategy = require('passport-google-oauth').OAuth2Strategy,
    session = require('express-session'),

    Debuggable = require('../../lib/debuggable'),
    config = require('../../config');

/**
 * @extends Debuggable
 * @class AuthController
 * @param {MongoAPIDatabase} [database]
 * @param {Object} [options]
 * @param {DebugLevel} [options.debugLevel]
 * @constructor
 */
function AuthController(database, options) {
    this.setDebugTag('AuthController: ');
    var self = this;

    this.database = this.database || database;

    this._authOptions = _.defaults(options, {
        debugLevel: Debuggable.PROD
    });

    this.credentials = {
        web: {
            client_id: config.GOOGLE_CLIENT_ID,
            client_secret: config.GOOGLE_CLIENT_SECRET
        }
    };

    this.userSession = session({
        secret: config.SERVER_SESSION_SECRET,
        saveUninitialized: true,
        resave: true
    });

    /**
     * @type {Passport}
     */
    this.passport = passport;

    /**
     * Use the GoogleStrategy within Passport.
     * Strategies in passport require a `verify` function, which accept
     * credentials (in this case, a token, tokenSecret, and Google profile), and
     * invoke a callback with a user object.
     */
    this.passport.use(new GoogleStrategy({
        clientID: this.credentials.web.client_id,
        clientSecret: this.credentials.web.client_secret,
        callbackURL: url.resolve(config.DOMAIN, "/auth/google/callback")
    }, this.onLoginRequest()));

    this.passport.serializeUser(function (user, done) {
        done(null, user.id);
    });

    this.passport.deserializeUser(function (userId, done) {
        self.database.findUser({id: userId}, {
            complete: function (err, foundUser) {
                var deserializationError;
                if (err || !foundUser.id) {
                    deserializationError = err || new Error("Could not deserialize user");
                }
                done(deserializationError, foundUser);
            }
        })
    });
    this.log(Debuggable.MED, 'APIController() = %s', this.dump());
    return this;
}

AuthController.prototype = {

    onLoginRequest: function () {
        var self = this;

        return function (accessToken, refreshToken, profile, done) {
            self.database.findUser({id: profile.id}, {
                debug: self._authOptions.debugLevel,
                complete: function (err, user) {
                    if (err || !user.id) {
                        var userData = {
                            id: profile.id,
                            privilege: 0,
                            firstName: profile.name.givenName,
                            lastName: profile.name.familyName
                        };
                        if (profile.photos.length > 0) userData.photo = profile.photos[0].value;
                        self.database.saveUser(userData, {
                            debug: self._authOptions.debugLevel,
                            complete: function (err, user) {
                                done(err, user)
                            }
                        })
                    } else {
                        return done(err, user);
                    }
                }
            });
        }
    },


    onLoginSuccess: function () {
        return function (req, res, next) {
            res.redirect('/');
        }
    },

    verifyAuth: function () {
        return [
            this.userSession,
            this.passport.initialize(),
            this.passport.session(),
            function (req, res, next) {
                if (req.isAuthenticated()) {
                    next();
                } else {
                    var err = new Error("Not authenticated");
                    res.status(401);
                    res.render('error', {
                        message: err.message,
                        error: err,
                        DEVELOPMENT_ENV: config.DEVELOPMENT_ENV
                    });
                }
            }]
    }
};

_.extend(AuthController.prototype, Debuggable.prototype);

module.exports = AuthController;

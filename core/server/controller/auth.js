var fs = require('fs');

var _ = require('lodash');
var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var session = require('express-session');

var config = require('../../config');

/**
 * @class AuthController
 * @param {MongoAPIDatabase} database
 * @constructor
 */
function AuthController(database) {
    var self = this;

    this.database = this.database || database;

    this.credentials = {
        web: {
            client_id: config.GOOGLE_CLIENT_ID,
            client_secret: config.GOOGLE_CLIENT_SECRET
        }
    };

    this.sessionOptions = {
        secret: config.SERVER_SESSION_SECRET,
        saveUninitialized: true,
        resave: true
    };

    /**
     * @type {Passport}
     */
    this.passport = passport;

    this.userSession = session(this.sessionOptions);

    /**
     * Use the GoogleStrategy within Passport.
     * Strategies in passport require a `verify` function, which accept
     * credentials (in this case, a token, tokenSecret, and Google profile), and
     * invoke a callback with a user object.
     */
    this.passport.use(new GoogleStrategy({
        clientID: this.credentials.web.client_id,
        clientSecret: this.credentials.web.client_secret,
        callbackURL: config.GOOGLE_AUTH_CALLBACK
    }, this.onLoginRequest()));

    this.passport.serializeUser(function (user, done) {
        done(null, user.id);
    });

    this.passport.deserializeUser(function (userId, done) {
        self.database.findUser({id: userId})
            .then(function (foundUser) {
                if (!foundUser.id) {
                    return Promise.reject(new Error("Could not deserialize user"));
                }

                done(null, foundUser);
            })
            .catch(done)
    });
}

AuthController.prototype = {

    onLoginRequest: function () {
        var self = this;

        return function (accessToken, refreshToken, profile, done) {
            self.database.findUser({id: profile.id})
                .catch(function (err) {
                    console.error(err);
                    var userData = {
                        id: profile.id,
                        privilege: 0,
                        firstName: profile.name.givenName,
                        lastName: profile.name.familyName
                    };

                    if (profile.photos.length > 0) {
                        userData.photo = profile.photos[0].value;
                    }

                    return self.database.saveUser(userData)
                })
                .then(function (user) {
                    return done(null, user);
                })
        }
    },


    onLoginSuccess: function () {
        return function (req, res, next) {
            res.redirect('/');
        }
    },

    session: function(){
      return this.userSession;
    },

    verifyAuth: function () {
        return [
            this.session(),
            this.passport.initialize(),
            this.passport.session(),
            function (req, res, next) {
                if (!req.isAuthenticated()) {
                    var err = new Error("Not authenticated");
                    err.status = 401;
                    next(err);
                    return;
                }

                next();
            }]
    }
};

module.exports = AuthController;

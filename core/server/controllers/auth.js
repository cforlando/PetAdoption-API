function Authenticator() {

    var fs = require('fs'),
        path = require('path'),
        url = require('url'),

        passport = require('passport'),
        GoogleStrategy = require('passport-google-oauth').OAuth2Strategy,

        database = require('../../database'),
        config = require('../../config'),
        dump = require('../../../lib/dump');


    this.credentials = (function () {
        try {
            var credentialsStr = fs.readFileSync(path.resolve(__dirname, '../.google.credentials.json'));
            return JSON.parse(credentialsStr);
        } catch (err) {
            return {
                web: {
                    client_id: 'n/a',
                    client_secret: 'n/a',
                    err: true
                }
            }
        }
    })();

    this.passport = passport;

    this.onLoginRequest = function (accessToken, refreshToken, profile, done) {
        database.findUser({id: profile.id}, {
            debug: config.debugLevel,
            complete: function (err, user) {
                if (err || !user.id) {
                    var userData = {
                        id: profile.id,
                        privilege: 0,
                        firstName: profile.name.givenName,
                        lastName: profile.name.familyName
                    };
                    if (profile.photos.length > 0) userData.photo = profile.photos[0].value;
                    database.saveUser(userData, {
                        debug: config.debugLevel,
                        complete: function (err, user) {
                            done(err, user)
                        }
                    })
                } else {
                    return done(err, user);
                }
            }
        });
    };


    this.onLoginSuccess = function (req, res, next) {
        req.session.save(function (err) {
            if (err) {
                next(err);
            } else {
                res.redirect('/');
            }
        });

    };

    this.verifyAuth = function (req, res, next) {
        if (req.isAuthenticated()) {
            next();
        } else {
            var err = new Error("Not authenticated");
            err.code = 401;
            res.render('error', {
                message: err.message,
                error: config.isDevelopment ? err : {},
                isDevelopment: config.isDevelopment
            });
        }
    };
// Use the GoogleStrategy within Passport.
//   Strategies in passport require a `verify` function, which accept
//   credentials (in this case, a token, tokenSecret, and Google profile), and
//   invoke a callback with a user object.
    passport.use(new GoogleStrategy({
        clientID: this.credentials.web.client_id,
        clientSecret: this.credentials.web.client_secret,
        callbackURL: url.resolve('cfo.khalidhoffman.solutions', "/api/v1/auth/google/callback")
    }, this.onLoginRequest));

    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function (userId, done) {
        database.findUser({id: userId}, {
            debug: config.debugLevel,
            complete: function (err, foundUser) {
                var deserialiazationError;
                if (err || !foundUser.id) {
                    deserialiazationError = err || new Error("Could not deserialize user");
                }
                done(deserialiazationError, foundUser);
            }
        })
    });
}

module.exports = new Authenticator();

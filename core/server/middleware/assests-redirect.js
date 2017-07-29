var url = require('url');
var config = require('../../config');

module.exports = function () {
    return function (req, res) {
        res.redirect(303, url.resolve(config.ASSETS_DOMAIN, req.originalUrl));
    }
};
var url = require('url'),

    config = require('../../config');

module.exports = function(){
    return function(req, res){
        res.redirect(303, url.resolve(config.assetsDomain, url.parse(req.originalUrl).path));
    }
};
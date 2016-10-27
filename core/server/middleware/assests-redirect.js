var url = require('url'),

    config = require('../../config');

module.exports = function(){
    return function(req){
        req.redirect(303, url.resolve(config.assetsDomain, req.path));
    }
};
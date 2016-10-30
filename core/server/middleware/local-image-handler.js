var fs = require('fs'),
    path = require('path'),

    _ = require('lodash');

module.exports = function(options) {
    var _options = _.defaults(options, {
        placeholderDir: path.join(process.cwd(), 'public/images/placeholders/'),
        defaultPlaceholderPath: path.join(process.cwd(), 'public/images/placeholders/default.png')
    });

    return function (req, res, next) {
        if (/\.(jpg|png)$/i.test(req.path)) {
            fs.access(path.resolve(_options.publicDir, req.path), function (err) {
                if (err) {
                    // file not found
                    var placeholderImgPath = _options.defaultPlaceholderPath;
                    if(req.params.species){
                        placeholderImgPath = path.join(_options.placeholderDir, req.params.species + '.png');
                    } else if(req.path.match(/cat/)){
                        placeholderImgPath = path.join(_options.placeholderDir, 'cat.png');
                    } else if(req.path.match(/dog/)){
                        placeholderImgPath = path.join(_options.placeholderDir, 'dog.png');
                    }
                    fs.access(placeholderImgPath, function (err) {
                        if (err) {
                            // placeholder not found
                            next(err);
                        } else {
                            res.sendFile(placeholderImgPath);
                        }
                    })
                } else {
                    next();
                }
            });
        } else {
            next();
        }
    }
};

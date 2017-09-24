var fs = require('fs');
var path = require('path');

var _ = require('lodash');

module.exports = function (options) {
    var opts = _.defaults(options, {
        placeholderDir: path.join(process.cwd(), 'public/images/placeholders/'),
        defaultPlaceholderPath: path.join(process.cwd(), 'public/images/placeholders/default.png')
    });

    return function (req, res, next) {
        if (req.originalUrl.match(/\.(jpg|png)$/i) && req.method.match(/get/i)) {
            fs.access(path.resolve(opts.publicDir, req.path), function (err) {
                if (err) {
                    // file not found
                    var placeholderImgPath = opts.defaultPlaceholderPath;

                    if (req.path.match(/cat/i)) {
                        placeholderImgPath = path.join(opts.placeholderDir, 'cat.png');
                    } else if (req.path.match(/dog/i)) {
                        placeholderImgPath = path.join(opts.placeholderDir, 'dog.png');
                    }

                    fs.access(placeholderImgPath, function (err) {
                        if (err) {
                            // placeholder not found
                            next(err);
                            return;
                        }

                        res.sendFile(placeholderImgPath);
                    });
                    return;
                }

                next();
            });
            return;
        }

        next();
    }
};

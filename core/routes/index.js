var path = require('path'),
    fs = require('fs'),
    util = require('util'),

    express = require('express'),
    _ = require('lodash'),

    dump = require('../../lib/dump'),

    router = express.Router(),
    models = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'core/data/models.json'), {encoding: 'utf8'}));


router.get('/', function (req, res, next) {
    res.render('index', {
        title: 'CFO Pet Adoption Data Entry',
        inputs: _.sortBy(models)
    });
})
;


module.exports = router;

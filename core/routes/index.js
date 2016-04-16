var path = require('path'),
    fs = require('fs'),
    util = require('util'),

    express = require('express'),
    _ = require('lodash'),

    dump = require('../../lib/dump'),

    router = express.Router(),
    models = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'core/data/models.json'), {encoding: 'utf8'}));

var _reversedModels = {};
for(var modelTypeName in models){
    if(models.hasOwnProperty(modelTypeName)){
        _reversedModels[modelTypeName] = {};
        _.forEachRight(models[modelTypeName], function(modelPropData, modelPropName, collection){
            _reversedModels[modelTypeName][modelPropName] = modelPropData;
        });
    }
}
router.get('/', function (req, res, next) {
    res.render('index', {
        title: 'CFO Pet Adoption Data Entry',
        inputs: _reversedModels
    });
})
;


module.exports = router;

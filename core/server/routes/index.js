var path = require('path'),
    fs = require('fs'),
    util = require('util'),

    _ = require('lodash'),
    async = require('async'),
    Express = require('express'),

    dump = require('../../../lib/dump'),
    router = Express.Router(),

    database = require('../../database'),
    petTypes = database.config.petTypes,
    models = {};


router.get('/', function (req, res, next) {
    async.each(petTypes,
        function each(petType, done) {
            database.findModel({species: {defaultVal: petType}}, {
                complete: function (err, animalModel) {
                    models[petType] = formatRenderData(animalModel);
                    done(err)
                }
            })
        }, function complete() {
            // console.log('rendering %s', dump(models));
            res.render('index', {
                title: 'CFO Pet Adoption Data Entry',
                inputs: models
            });
        });
});

function formatRenderData(model){
    var formattedData = {},
        locationRegexResult;
    _.forEach(model, function(propData, propName){
        locationRegexResult = /(.*)(Lat|Lon)$/.exec(propName);
        if(/images/.test(propName)){
            formattedData[propName] = propData;
            formattedData[propName].valType = 'ignore';
        } else if(locationRegexResult && locationRegexResult[2]){
            formattedData[propName] = propData;
            formattedData[propName].valType = 'ignore';
            formattedData[locationRegexResult[1]] = formattedData[locationRegexResult[1]] || {valType: 'Location'};
            formattedData[locationRegexResult[1]][locationRegexResult[2]] = propData;
        } else {
            formattedData[propName] = propData;
        }
    });
    return formattedData;
}


module.exports = router;

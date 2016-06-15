var path = require('path'),
    fs = require('fs'),
    util = require('util'),

    express = require('express'),
    _ = require('lodash'),

    dump = require('../../lib/dump'),
    async = require('async'),

    router = express.Router(),
    mongodb = require('../mongodb'),
    petTypes = ['cat', 'dog'],
    models = {};


router.get('/', function (req, res, next) {
    async.each(petTypes,
        function each(petType, done) {
            mongodb.findModel({species: {defaultVal: petType}}, {
                complete: function (err, animalModel) {
                    models[petType] = animalModel;
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
})
;


module.exports = router;

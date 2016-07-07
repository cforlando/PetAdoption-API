var util = require('util'),

    async = require('async'),
    _ = require('lodash'),

    config = require('../config'),
    MongoDB = require('../mongodb');

function ModelFormatter(){
    var self = this;
    
    /**
     * 
     * @param options
     * @param options.complete
     */
    this.formatDB = function(options){
        var _options = _.extend({}, options),
            queryData = {species : 'dog'},
            updatedAnimal;

        MongoDB.findAnimals(queryData, {
            debug: config.debugLevel,
            complete: function (err, animals) {
                async.each(animals, function each (animal, done){
                    updatedAnimal = self.formatAnimal(animal);
                    self.saveAnimal(updatedAnimal, {
                        complete : function(){
                            done();
                        }
                    });
                }, function complete(){
                    if (_options.complete) _options.complete.apply(_options.context);
                });
            }
        });
    };
    
    this.formatAnimal = function(model){
        var self = this;
        _.forEach(model, function(propData, propName){
            switch(propName){
                case 'images':
                    propData.val = self.formatImagesArray(propData.val);
                default:
                    model[propName] = propData;
            }
        });
        return model;
    };

    this.formatImagesArray = function(imagesArr){

        function formatImgURL(imageURL){
            return (/^http:/.test(imageURL)) ? imageURL : util.format("%s%s", config.domain, imageURL);
        }
        return imagesArr.map(formatImgURL);
    };

    this.saveAnimal = function(model, options){
        var _options = _.extend({}, options),
            reducedModel = {};

        _.forEach(model, function(propData, propName){
            reducedModel[propName] = propData.val;
        });
        
        MongoDB.saveAnimal(reducedModel, {
            debug: config.debugLevel,
            complete: function (err, newAnimal) {
                if (_options.complete) _options.complete.apply(_options.context, [null, newAnimal])
            }
        });
    }
};




module.exports= new ModelFormatter();

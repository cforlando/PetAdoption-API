var util = require('util'),
    fs = require('fs'),
    path = require('path'),
    url = require('url'),

    async = require('async'),
    _ = require('lodash'),

    config = require('../../config'),
    database = require('../../database');

function ModelFormatter(){
    var self = this,
        cachedModels = (function(){
            try {
                return JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'core/data/models.json'), {encoding: 'utf8'}));
            } catch(err){
                console.log(err);
                return {};
            }
        })();
    
    /**
     * 
     * @param options
     * @param options.complete
     */
    this.formatDB = function(options){
        var _options = _.extend({}, options),
            queryData = {species : 'cat'},
            updatedAnimal;

        database.findAnimals(queryData, {
            debug: config.debugLevel,
            complete: function (err, animals) {
                async.each(animals, function each (animal, done){
                    updatedAnimal = self.formatAnimal(animal);
                    self._saveAnimal(updatedAnimal, {
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

    this._pickRandomOption = function(options){
        if (options && options.length > 0) {
            var randOptionIndex = Math.floor(Math.random() * options.length);
            return options[randOptionIndex]
        }
        return false;
    };

    this._saveAnimal = function(animalProps, options){
        var _options = _.extend({}, options),
            reducedModel = {};

        _.forEach(animalProps, function(propData, propName){
            reducedModel[propName] = propData.val;
        });

        database.saveAnimal(reducedModel, {
            debug: config.debugLevel,
            complete: function (err, newAnimal) {
                if (_options.complete) _options.complete.apply(_options.context, [null, newAnimal])
            }
        });
    };

    this.formatAnimal = function(animalProps){
        var self = this,
            species = animalProps.species.val || self._pickRandomOption(['dog', 'cat']);
        console.log('formatting a %s', species);
        _.forEach(cachedModels[species], function(propData, propName){
            switch(propName){
                case 'images':
                    var images = (animalProps[propName] && _.isArray(animalProps[propName].val)) ? animalProps[propName].val : (propData.defaultVal || propData.example);
                    propData.val = self.formatImagesArray(images);
                    animalProps[propName] = propData;
                    break;
                case 'species':
                    animalProps[propName] = _.extend({}, animalProps[propName] || propData, {val: species});
                    break;
                default:
                    animalProps[propName] = _.extend({}, propData, animalProps[propName]);
                    animalProps[propName].val = self._pickRandomOption(propData.options) || animalProps[propName].val || propData.example || propData.defaultVal;
            }
        });
        return animalProps;
    };

    this.formatImagesArray = function(imagesArr){
        console.log("formatting %s images", imagesArr.length);
        function formatImgURL(imageURL){
            return (/^http:/.test(imageURL)) ? imageURL : url.resolve(config.domain, imageURL);
        }
        return imagesArr.map(formatImgURL);
    };
};




module.exports= new ModelFormatter();

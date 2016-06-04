var util = require('util'),
    path = require('path'),
    fs = require('fs'),

    mongoose = require('mongoose'),
    _ = require('lodash'),
    async = require('async'),

    config = require('../config'),
    dump = require('../../lib/dump'),
    dbUtils = require('./utils'),

    animalSchemas = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'core/data/schema.json'), {encoding: 'utf8'})),
    animalModels = {},
    petTypes = ['cat', 'dog'],
    AnimalDocs = {},
    AnimalModelDocs = {},
    defaultSpecies = 'dog',
    localConfig = (function () {
        var config = {
            username: 'username',
            password: 'password',
            domain: 'example.com',
            port: 'port',
            database: 'no_database_provided'
        };
        try {
            //override template config with local json file data
            config = JSON.parse(fs.readFileSync(path.resolve('./', 'core/mongodb/mongodb.config')));
        } catch (e) {
            console.error(e);
        }
        return config;
    })(),
    mongodb = {
        adapter: mongoose,
        identity: {
            username: process.env.username || localConfig.username,
            password: process.env.password || localConfig.password,
            domain: process.env.domain || localConfig.domain,
            port: process.env.port || localConfig.port,
            database: process.env.database || localConfig.database
        },
        state: {
            isConnecting: false,
            isConnected: false
        },
        config: {
            retryTimeout: 2000,
            isDevelopment: config.isDevelopment
        },
        queue: []
    };

mongodb.connect = function (callback, options) {
    mongodb.state.isConnecting = true;
    var mongodbURL = util.format("mongodb://%s:%s@%s:%s/%s", mongodb.identity.username, mongodb.identity.password, mongodb.identity.domain, mongodb.identity.port, mongodb.identity.database);
    console.log('mongodb is connecting to %s', mongodbURL);
    mongodb.adapter.connect(mongodbURL);
    var db = mongodb.adapter.connection,
        _options = _.extend({
            context: null
        }, options);

    db.on('error', console.error.bind(console, 'connection error:'));

    db.once('open', function () {

        var dbCollectionNames = {
            model: (function () {
                var _collections = {};
                _.forEach(petTypes, function (petType, index) {
                    _collections[petType] = util.format('pets_model_%s_%s', petType, (mongodb.config.isDevelopment) ? 'test' : 'production')
                });
                return _collections;
            })(),
            pet: (mongodb.config.isDevelopment) ? 'pets_test' : 'pets_production'
        };

        console.log('Running in %s mode.', (mongodb.config.isDevelopment) ? 'dev' : 'production');

        async.eachSeries(petTypes,
            function each(petType, done) {
                // init pet documents
                AnimalDocs[petType] = mongoose.model(petType, new mongoose.Schema(animalSchemas[petType]), dbCollectionNames.pet);

                // init pet model documents
                var _animalModelSchema = dbUtils.buildModelSchema(animalSchemas[petType]);
                AnimalModelDocs[petType] = mongoose.model(util.format('%s-model', petType), new mongoose.Schema(_animalModelSchema), dbCollectionNames.model[petType]);
                AnimalModelDocs[petType].find({})
                    .sort({timestamp: -1})
                    .limit(1)
                    .exec(function (err, _animalModel) {
                        if (err || _animalModel.length === 0) {
                            console.error(err || new Error('No models found'));
                            console.warn('creating new model');
                            // use hardcoded version on failure to load from db
                            var hardcodedAnimalModel = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'core/data/models.json'), {encoding: 'utf8'}));
                            animalModels[petType] = hardcodedAnimalModel[petType];
                            animalModels[petType]['timestamp'] = Date.now();
                            AnimalModelDocs[petType].create(_animalModel[petType], function (err, _savedAnimalModel) {
                                animalModels[petType] = mongodb._sanitizeModelOutput(_savedAnimalModel);
                                if (err) throw err;
                                done();
                            });
                        } else {
                            animalModels[petType] = mongodb._sanitizeModelOutput(_animalModel[0]);
                            done();
                        }
                    });

            }, function complete(err) {
                if (err) throw err;
                mongodb.state.isConnected = true;
                mongodb.state.isConnecting = false;
                fs.writeFile(path.resolve(process.cwd(), 'core/data/models.json'), JSON.stringify(animalModels), function () {
                    if (err) console.error(err);
                    console.log('saved initial model');
                    if (_.isFunction(callback)) callback.apply(_options.context, [mongodb, _options]);
                });
            });
    });
};

/**
 *
 * @param func
 * @param [options]
 * @param options.context
 * @private
 */
mongodb._exec = function (func, options) {
    var _options = _.extend({}, options);
    if (!_.isFunction(func)) {
        console.warn('mongodb._exec() - no function passed');
        return;
    }
    mongodb.queue.push({
        callback: func,
        options: _options
    });

    function onConnected() {
        var callback,
            callbackOptions;
        while (mongodb.queue.length > 0) {
            callback = mongodb.queue[0].callback;
            callbackOptions = mongodb.queue[0].options;
            callback.apply(callbackOptions.context, [mongodb, callbackOptions]);
            mongodb.queue.shift();
        }
    }

    if (mongodb.state.isConnected) {
        onConnected();
    } else if (mongodb.state.isConnecting) {
        if (_options.debug) console.log('MongoDB is connecting...');
    } else {
        if (_options.debug) console.log('MongoDB is starting up...');
        mongodb.connect(onConnected);
    }
};

/**
 * Builds search object from provided animalProps object. animalProps is an object of fields corresponding to one of the animal schemas
 * @param {Object} animalProps
 * @returns {Object}
 * @private
 */
mongodb._buildQuery = function (animalProps) {
    var searchParams = {
            species: mongodb._getSpeciesFromProps(animalProps)
        },
        propValue;

    if (searchParams['species'])
        _.forEach(animalProps, function (propData, propName, collection) {
            propValue = propData.val || propData; // check if data has been sent as a model structure
            switch (propName) {
                case 'petId':
                case 'hashId':
                case '_id':
                    // only use given id and quit early
                    searchParams = {'_id': propValue};
                    console.log('searching by id: %s', propValue);
                    return false;
                case 'species':
                    // ignore because species was already set
                    break;
                default:
                    var prefix = '',
                        suffix = '',
                        regexArgs = '';
                    if (animalProps['matchStartFor'] && _.indexOf(animalProps['matchStartFor'], propName) >= 0) {
                        prefix = '^';
                    }
                    if (animalProps['matchEndFor'] && _.indexOf(animalProps['matchEndFor'], propName) >= 0) {
                        suffix = '$';
                    }
                    if (animalProps['ignoreCaseFor'] && _.indexOf(animalProps['ignoreCaseFor'], propName) >= 0) {
                        regexArgs = 'i';
                    }
                    if (_.has(animalSchemas[searchParams['species']], propName)) {
                        searchParams[propName] = new RegExp(util.format('%s%s%s', prefix, propValue, suffix), regexArgs);
                    }
                    break;
            }
        });
    return searchParams;
};

mongodb._getSpeciesFromProps = function (animalProps) {

    var _species = defaultSpecies;
    if (_.isString(animalProps['species'])) {
        // check v2 format
        _species = animalProps['species'].toLowerCase()
    } else if (animalProps['species'] && animalProps['species'].val) {
        // check v1 format
        _species = animalProps['species'].val.toLowerCase()
    }
    return (animalSchemas[_species]) ? _species : defaultSpecies;
};

mongodb._getSpeciesFromModel = function (animalModelProps) {

    var _species = defaultSpecies;
    if (_.isString(animalModelProps['species'].val)) {
        _species = animalModelProps['species'].val.toLowerCase()
    } else if (_.isString(animalModelProps['species'].defaultVal)) {
        _species = animalModelProps['species'].defaultVal.toLowerCase()
    }
    return (animalModels[_species]) ? _species : defaultSpecies;
};

mongodb._sanitizeSearchParams = function (searchQueryProps) {
    var filteredAnimalQueryProps = {};

    if (searchQueryProps['petName'] || searchQueryProps['petId']) {
        if (searchQueryProps['petId'] && /^\w+$/.test(searchQueryProps['petId'])) {
            // petId provided
            filteredAnimalQueryProps['_id'] = searchQueryProps['petId'];
        } else {
            filteredAnimalQueryProps['petName'] = searchQueryProps['petName'];
        }
    } else {
        filteredAnimalQueryProps = searchQueryProps;
    }
    return filteredAnimalQueryProps;
};

mongodb._sanitizeInput = function (searchQueryProps) {
    var sanitizedProps = {},
        animalSpecies = mongodb._getSpeciesFromProps(searchQueryProps),
        schema = animalSchemas[animalSpecies];

    if (config.isDevelopment) console.log('using schema for %s', animalSpecies);

    _.forEach(searchQueryProps, function (propValue, propName) {
        if (schema[propName]) {
            switch (schema[propName].valType) {
                case 'Float':
                case 'Location':
                case 'Number':
                    sanitizedProps[propName] = parseFloat(propValue) || -1;
                    break;
                case 'Date':
                    sanitizedProps[propName] = new Date(propValue);
                    break;
                default:
                    sanitizedProps[propName] = propValue;
            }
        }
    });
    sanitizedProps['species'] = animalSpecies;

    return sanitizedProps;
};

mongodb._sanitizePetOutput = function (animalProps) {
    var _sanitizedAnimalProps = {},
        species = mongodb._getSpeciesFromProps(animalProps),
        model = animalModels[species];

    // format to model structure
    _.forEach(model, function (propData, propName) {
        if (!animalProps[propName]) return;
        _sanitizedAnimalProps[propName] = _.extend({}, model[propName], {
            val: animalProps[propName]
        });
    });
    _sanitizedAnimalProps['petId'] = {
        val: animalProps['_id']
    };

    return _sanitizedAnimalProps;
};

mongodb._sanitizeModelOutput = function (modelDoc) {
    var _model = (_.isFunction(modelDoc.toObject)) ? modelDoc.toObject() : modelDoc;
    return _.omit(_model, ['__v', '_id', 'timestamp'])
};

/**
 *
 * @param animalProps
 * @param {Object} options
 * @param {Boolean} [options.debug] Whether to log debug info
 * @param {Function} options.complete callback on operation completion
 * @param {Object} [options.context] context for complete function callback
 */
mongodb.removeAnimal = function (animalProps, options) {
    var _options = _.extend({}, options);

    mongodb._exec(function () {
        if (_options.debug) console.log("mongodb.removeAnimal() - received query for: ", animalProps);

        var searchableProps = mongodb._sanitizeSearchParams(animalProps),
            animalSpecies = mongodb._getSpeciesFromProps(animalProps);

        if (_options.debug) console.log('mongodb.removeAnimal() - searching for: ', searchableProps);
        AnimalDocs[animalSpecies].remove(searchableProps, function (err) {
            if (_options.debug) console.log('mongodb.removeAnimal() - args: %j', arguments);
            if (_options.complete) _options.complete.apply(null, [{result: err || 'success'}]);
        })
    }, options);
};

/**
 * @callback AnimalQueryCallback
 * @param err
 * @param animalProps
 */

/**
 *
 * @param animalProps
 * @param {Object} options
 * @param {Boolean} [options.debug] Whether to log debug info
 * @param {AnimalQueryCallback} options.complete callback on operation completion
 * @param {Object} [options.context] context for complete function callback
 */
mongodb.findAnimal = function (animalProps, options) {
    var _options = _.extend({}, options);

    mongodb._exec(function () {
        if (_options.debug) console.log("mongodb.findAnimal() - received query for: ", animalProps);
        var searchParams = mongodb._buildQuery(animalProps),
            species = mongodb._getSpeciesFromProps(animalProps);

        if (_options.debug) console.log('mongodb.findAnimal() - searching for: ', searchParams);
        AnimalDocs[species].findOne(
            searchParams,
            function (err, _animal) {
                var animal = {};
                if (err) {
                    console.error(err);
                } else {
                    animal = mongodb._sanitizePetOutput(_animal._doc);
                }
                if (_options.debug) console.log('mongodb.findAnimal() - found animal: ', animal);
                if (_options.complete) _options.complete.apply(null, [err, animal]);
            })
    }, options);
};


/**
 *
 * @param animalProps
 * @param {Object} options
 * @param {Boolean} [options.debug] Whether to log debug info
 * @param {AnimalQueryCallback} options.complete callback on operation completion
 * @param {Object} [options.context] context for complete function callback
 */
mongodb.findAnimals = function (animalProps, options) {
    var _options = _.extend({}, options);
    if (_options.debug) console.log("mongodb.findAnimals(%j)", arguments);

    var query = function () {
        if (_options.debug) console.log("mongodb.findAnimals() - received query for: ", animalProps);

        var searchParams = mongodb._buildQuery(animalProps),
            species = mongodb._getSpeciesFromProps(animalProps);

        if (_options.debug) console.log('mongodb.findAnimals() - searching for: ', searchParams);

        AnimalDocs[species].find(
            searchParams,
            function (err, _animals) {
                var animals = [];
                if (err) {
                    console.error(err);
                } else {
                    _.forEach(_animals, function (animal, index) {
                        animals.push(mongodb._sanitizePetOutput(animal));
                    })
                }
                if (_options.debug) console.log('mongodb.findAnimals() - found animals: ', animals);
                if (_options.complete) _options.complete.apply(_options.context, [err, animals]);
            })
    };
    mongodb._exec(query, options);
};

/**
 *
 * @param animalProps
 * @param {Object} options
 * @param {Boolean} [options.debug] Whether to log debug info
 * @param {AnimalQueryCallback} options.complete callback on operation completion
 * @param {Object} [options.context] context for complete function callback
 */
mongodb.saveAnimal = function (animalProps, options) {
    var _options = _.extend({}, options);

    mongodb._exec(function () {
        if (_options.debug) console.log("mongodb.saveAnimal() - received post for: ", animalProps);

        var animalSpecies = mongodb._getSpeciesFromProps(animalProps),
            searchableAnimalProps = mongodb._sanitizeSearchParams(animalProps),
            savableAnimalProps = mongodb._sanitizeInput(animalProps),
            queryParams = mongodb._buildQuery(searchableAnimalProps);

        if (_options.debug) console.log('mongodb.saveAnimal() - searching for: ', queryParams);

        AnimalDocs[animalSpecies].findOneAndUpdate(
            queryParams,
            savableAnimalProps, {
                new: true,
                upsert: true
            }, function (err, _animal) {
                var animal = {};
                if (err) {
                    console.error(err);
                } else {
                    animal = mongodb._sanitizePetOutput(_animal._doc);
                }
                if (_options.debug) console.log('saved and sending animal: ', animal);
                if (_options.complete) _options.complete.apply(_options.context, [err, animal])
            })
    }, options);
};

/**
 * @callback AnimalModelQueryCallback
 * @param err
 * @param animalModel
 */

/**
 *
 * @param animalModelProps
 * @param {Object} options
 * @param {Boolean} [options.debug] Whether to log debug info
 * @param {AnimalModelQueryCallback} options.complete callback on operation completion
 * @param {Object} [options.context] context for complete function callback
 */
mongodb.findModel = function (animalModelProps, options) {
    var _options = _.extend({}, options);

    mongodb._exec(function () {
        if (_options.debug) console.log("mongodb.findModel() - received request for: ", animalModelProps);

        var animalSpecies = mongodb._getSpeciesFromModel(animalModelProps);

        console.log('searching for %s model', animalSpecies);

        AnimalModelDocs[animalSpecies].find({})
            .sort({timestamp: -1})
            .limit(1)
            .exec(function (err, animalModels) {
                if (err) {
                    console.error(err);
                }
                var _model = (animalModels[0]) ? mongodb._sanitizeModelOutput(animalModels[0]) : {};

                // update active model instance
                animalModels[animalSpecies] = animalModels[0];

                if (_options.debug) console.log('found and sending animal model: ', _model);
                if (_options.complete) _options.complete.apply(_options.context, [null, err || _model]);
            });

    }, options);
};

/**
 *
 * @param animalModelProps
 * @param {Object} options
 * @param {Boolean} [options.debug] Whether to log debug info
 * @param {AnimalModelQueryCallback} options.complete callback on operation completion
 * @param {Object} [options.context] context for complete function callback
 */
mongodb.saveModel = function (animalModelProps, options) {
    var _options = _.extend({}, options);

    mongodb._exec(function () {
        // if (_options.debug) console.log("mongodb.saveAnimalModel() - received model update for w/ %s", dump(animalModelProps));
        if (_options.debug) console.log("mongodb.saveAnimalModel() - received model update ");

        var animalSpecies = mongodb._getSpeciesFromModel(animalModelProps),
            newModel = {};

        if (_options.debug) console.log('mongodb.saveAnimalModel() - searching for %s model', animalSpecies);

        // merge newly received model with current model
        _.forEach(animalModels[animalSpecies], function (currentPropData, propName) {
            if (animalModelProps[propName] && animalModelProps[propName].val) {
                delete animalModelProps[propName].val;
            }
            newModel[propName] = _.extend({}, currentPropData, animalModelProps[propName]);
        });
        newModel.timestamp = Date.now();

        AnimalModelDocs[animalSpecies].create(newModel, function (err, _animalModel) {
            if (err) {
                console.error(err);
            }

            // update active model instance
            animalModels[animalSpecies] = mongodb._sanitizeModelOutput(_animalModel);
            if (_options.debug) console.log('saved and sending animal model: %j', animalModels[animalSpecies]);


            fs.writeFile(path.resolve(process.cwd(), 'core/data/models.json'), JSON.stringify(animalModels), function () {
                if (_options.debug) console.log('updated cached animal model');
                if (_options.complete) _options.complete.apply(_options.context, [err, animalModels[animalSpecies]]);
            });
        });
    }, options);
};

module.exports = mongodb;

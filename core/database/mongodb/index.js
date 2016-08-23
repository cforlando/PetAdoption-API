function MongoDB(instanceOptions) {
    var util = require('util'),
        path = require('path'),
        fs = require('fs'),

        mongoose = require('mongoose'),
        _ = require('lodash'),
        async = require('async'),

        config = require('../../config'),
        dump = require('../../../lib/dump'),
        dbUtils = require('./utils'),

        self = this,
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
                config = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'mongodb.config')));
            } catch (e) {
                console.error(e);
            }
            return config;
        })();


    this.adapter = mongoose;

    this.identity = {
        username: process.env.username || localConfig.username,
        password: process.env.password || localConfig.password,
        domain: process.env.domain || localConfig.domain,
        port: process.env.port || localConfig.port,
        database: process.env.database || localConfig.database
    };

    this.state = {
        isConnecting: false,
        isConnected: false
    };
    this.config = _.extend({
        retryTimeout: 2000,
        isDevelopment: config.isDevelopment,
        petTypes: (function () {
            try {
                var schemasCacheStr = fs.readFileSync(path.resolve(process.cwd(), 'data/schema.json'), {encoding: 'utf8'}),
                    schemasCache = JSON.parse(schemasCacheStr);
                return Object.keys(schemasCache);
            } catch (err) {
                console.error('server init error: %s', err);
                return ['cat', 'dog']
            }
        })(),
        defaultSpecies: 'dog',
        queryOptions: {
            complete: function (err) {
                if (config.debugLevel > config.DEBUG_LEVEL_LOW) console.warn(err);
                return err;
            }
        }
    }, instanceOptions);

    this.errors = {
        species: (function () {
            var err = new Error("Must use valid species");
            err.status = 404;
            return err;
        })()
    };

    this.queue = [];


    this.localData = {
        models: (function () {
            try {
                return JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'data/models.json'), {encoding: 'utf8'}))
            } catch (e) {
                console.error(e);
                return {};
            }
        })(),
        schemas: (function () {
            try {
                return JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'data/schema.json'), {encoding: 'utf8'}))
            } catch (e) {
                console.error(e);
                return {};
            }
        })()
    };

    this.schemasCollection = this.localData.schemas;
    this.schemasCollection.user = require('./schemas/user');

    this.modelsCollection = {
        // init without any species models
    };

    this.AnimalDoc = {
        // init without any databases to search from
    };
    this.ModelDoc = {
        // init without any databases to search from
    };

    this.UserDoc = {};

    this._connect = function (callback, options) {
        this.state.isConnecting = true;
        var mongodbURL = util.format("mongodb://%s:%s@%s:%s/%s", this.identity.username, this.identity.password, this.identity.domain, this.identity.port, this.identity.database);
        if (config.debugLevel > config.DEBUG_LEVEL_LOW) console.log('mongodb is connecting to %s', mongodbURL);
        this.adapter.connect(mongodbURL);
        var db = this.adapter.connection,
            _options = _.defaults(options, {
                context: null,
                loadFromLocalFile: false
            });

        db.on('error', console.error.bind(console, 'connection error:'));

        db.once('open', function () {

            if (config.debugLevel > config.DEBUG_LEVEL_LOW) console.log('Running in %s mode.', (self.config.isDevelopment) ? 'dev' : 'production');

            self._initUserDoc();

            async.each(self.config.petTypes,
                function each(petType, done) {
                    self._initSpeciesDocs(petType, {
                        onInitializationComplete: done
                    });
                }, function complete(err) {
                    if (err) throw err;
                    self.state.isConnected = true;
                    self.state.isConnecting = false;
                    fs.writeFile(path.resolve(process.cwd(), 'data/models.json'), JSON.stringify(self.modelsCollection), function (localWriteErr) {
                        if (localWriteErr) console.error(localWriteErr);
                        if (config.debugLevel > config.DEBUG_LEVEL_LOW) console.log('models initialization complete');
                        if (_.isFunction(callback)) callback.apply(_options.context, [self, _options]);
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
    this._exec = function (func, options) {
        var _options = _.defaults(options, {
            context: self
        });
        if (!_.isFunction(func)) {
            console.warn('mongodb._exec() - no function passed');
            return;
        }
        this.queue.push({
            callback: func,
            options: _options
        });

        function onConnected() {
            while (self.queue.length > 0) {
                self.queue[0].callback.apply(self.queue[0].options.context, [self, self.queue[0].options]);
                self.queue.shift();
            }
        }

        if (this.state.isConnected) {
            onConnected();
        } else if (this.state.isConnecting) {
            if (_options.debug >= config.DEBUG_LEVEL_LOW) console.log('MongoDB is connecting...');
        } else {
            if (_options.debug >= config.DEBUG_LEVEL_LOW) console.log('MongoDB is starting up...');
            this._connect(onConnected);
        }
    };

    /*
     *
     * @param {String} species
     * @param {Object} [options]
     * @param {Function} [options.onInitializationComplete]
     * @param {String} [options.docNamePrefix]
     */
    this._initSpeciesDocs = function (species, options) {
        var _options = _.defaults(options, {
            docNamePrefix :  (self.config.isDevelopment) ? 'dev' : 'prod'
        });

        // init animals db document for given species
        var Animal = require('./models/animal'),
            animalDocName = util.format('%s_%s', _options.docNamePrefix, species);

        this.AnimalDoc[species] = new Animal(animalDocName, this.schemasCollection[species]);

        // init given species's model db document
        var Species = require('./models/species'),
            speciesDocName = util.format('%s_%s_species', _options.docNamePrefix, species);

        this.ModelDoc[species] = new Species(speciesDocName, this.schemasCollection[species]);

        // find last saved model
        this.ModelDoc[species].find({})
            .sort({timestamp: -1})
            .limit(1)
            .exec(function (err, foundAnimalModels) {
                if (err || foundAnimalModels.length == 0 || _options.loadFromLocalFile) {
                    // use local hardcoded version
                    console.warn('creating new %s model', species);

                    var hardcodedAnimalModel = self.localData.models;
                    self.modelsCollection[species] = hardcodedAnimalModel[species];
                    self.modelsCollection[species]['timestamp'] = new Date();

                    self.ModelDoc[species].create(self.modelsCollection[species], 
                        function (createError, newlySavedAnimalModel) {
                            if (createError) {
                                console.log('%s', util.inspect(createError, {depth: null}));
                                _options.onInitializationComplete(createError);
                            } else {
                                self.modelsCollection[species] = self._formatModelOutput(newlySavedAnimalModel);
                                _options.onInitializationComplete();
                            }
                        });
                } else {
                    self.modelsCollection[species] = self._formatModelOutput(foundAnimalModels[0]); // foundAnimalModels is an array of 1 model due to the limit set in the query
                    if (config.debugLevel >= config.DEBUG_LEVEL_MED) console.log('%s model initialization complete', species);
                    _options.onInitializationComplete();
                }
            });
    };
    /*
     * @param {Object} [options]
     * @param {String} [options.docNamePrefix]
     */
    this._initUserDoc = function (options) {
        var _options = _.defaults(options, {
            docNamePrefix :  (self.config.isDevelopment) ? 'dev' : 'prod'
        });

        var User = require('./models/user'),
            userDocName = util.format("%s_users", _options.docNamePrefix);
        this.UserDoc = new User(userDocName, this.schemasCollection.user);
    };

    /**
     * Builds search object from provided animalProps object. animalProps is an object of fields corresponding to one of the animal schemas
     * @param {Object} searchProps
     * @returns {Object}
     * @private
     */
    this._buildQuery = function (searchProps) {
        var query = {},
            sanitizedSearchProps = this._sanitizeSearchProps(searchProps),
            propValue;

        _.forEach(sanitizedSearchProps, function (propData, propName, collection) {
            propValue = propData.val || propData; // check if data has been sent as a v1 or v2 structure
            switch (propName) {
                case 'petId':
                case 'hashId':
                case '_id':
                    // only use given id and quit early
                    query = {
                        '_id': propValue,
                        'species': query['species']
                    };
                    if (config.debugLevel >= config.DEBUG_LEVEL_LOW) console.log('searching by id: %s', propValue);
                    return false;
                case 'species':
                    query[propName] = propValue;
                    break;
                default:
                    if (self.modelsCollection[sanitizedSearchProps.species][propName]) {
                        if (self.modelsCollection[sanitizedSearchProps.species][propName].valType == 'String') {
                            var prefix = '',
                                suffix = '',
                                regexArgs = '';
                            if (sanitizedSearchProps['matchStartFor'] && _.indexOf(sanitizedSearchProps['matchStartFor'], propName) >= 0) {
                                prefix = '^';
                            }
                            if (sanitizedSearchProps['matchEndFor'] && _.indexOf(sanitizedSearchProps['matchEndFor'], propName) >= 0) {
                                suffix = '$';
                            }
                            if (sanitizedSearchProps['ignoreCaseFor'] && _.indexOf(sanitizedSearchProps['ignoreCaseFor'], propName) >= 0) {
                                regexArgs = 'i';
                            }
                            if (self.schemasCollection[sanitizedSearchProps.species][propName]) {
                                query[propName] = new RegExp(util.format('%s%s%s', prefix, dbUtils.escapeRegExp(propValue), suffix), regexArgs);
                            }
                        } else {
                            query[propName] = propValue;
                        }
                    }
                    break;
            }
        });
        return query;
    };

    this._sanitizeSearchProps = function (queryProps) {
        var sanitizedQueryProps = {
                species: (function (props) {
                    var species;
                    if (_.isString(props['species'])) {
                        // check v2 format
                        species = props['species'].toLowerCase()
                    } else {
                        return false;
                    }
                    return (self.schemasCollection[species]) ? species : false;
                })(queryProps)
            },
            schema = self.schemasCollection[sanitizedQueryProps.species];
        if (!schema) return {};
        if (queryProps['petId']) {
            sanitizedQueryProps['_id'] = "000000000000000000000000";
            if (dbUtils.isValidID(queryProps['petId'])) {
                // petId provided
                sanitizedQueryProps['_id'] = queryProps['petId'];
            }
        }
        if (config.debugLevel >= config.DEBUG_LEVEL_LOW) console.log('sanitizing input with schema for %s', sanitizedQueryProps.species);
        _.forEach(queryProps, function (propValue, propName) {
            if (schema[propName] && propName != 'species') {
                switch (schema[propName].valType) {
                    case 'Location':
                    case 'Float':
                    case 'Number':
                        sanitizedQueryProps[propName] = parseFloat(propValue) || -1;
                        break;
                    case 'Date':
                        sanitizedQueryProps[propName] = new Date(propValue);
                        break;
                    default:
                        sanitizedQueryProps[propName] = propValue;
                }
            }
        });
        return _.defaults(sanitizedQueryProps, queryProps);
    };


    this._formatOutput = function (animalProps, options) {
        var _options = _.defaults(options, {
                isV1Format: true
            }),
            sanitizedAnimalProps = {},
            model = self.modelsCollection[animalProps.species];

        if (config.debugLevel > config.DEBUG_LEVEL_WAY_TMI) console.log("mongodb._sanitizePetOutput() - formatting %s with: ", animalProps.species, self.modelsCollection[animalProps.species]);
        // format to model structure
        _.forEach(model, function (propData, propName) {
            if (_.isUndefined(animalProps[propName])) return;
            sanitizedAnimalProps[propName] = (_options.isV1Format) ? _.defaults({
                val: animalProps[propName]
            }, model[propName]) : animalProps[propName];
        });

        sanitizedAnimalProps['petId'] = (_options.isV1Format) ? _.defaults({val: animalProps['_id']}, model['petId']) : animalProps['_id'];

        return sanitizedAnimalProps;
    };

    this._formatModelOutput = function (modelDoc) {
        var _model = (_.isFunction(modelDoc.toObject)) ? modelDoc.toObject() : modelDoc;
        return _.omit(_model, ['__v', '_id', 'timestamp'])
    };

    this.findUser = function (props, options) {
        var _options = _.defaults(options, self.config.queryOptions);

        this._exec(function () {
            self.UserDoc.findOne({id: props.id || -1}, function (err, user) {

                if (err) err.status = 404;
                if (_options.debug >= config.DEBUG_LEVEL_MED) console.log('mongodb.findUser() - args: %s', util.inspect(arguments));
                if (_options.complete) _options.complete.apply(_options.context, [err, user.toObject()]);
            });

        }, options)
    };

    this.saveUser = function (props, options) {
        var _options = _.defaults(options, self.config.queryOptions);

        this._exec(function () {
            if (_options.debug >= config.DEBUG_LEVEL_HIGH) console.log("mongodb.saveUser() - received post for: ", props);

            var user = new self.UserDoc(props),
                userData = user.toObject();

            delete userData._id;

            self.AnimalDoc[species].findOneAndUpdate(
                {id: user.id},
                userData, {
                    new: true,
                    upsert: true
                }, function (err, _user) {
                    var user = {};
                    if (err) {
                        err.status = 404;
                        console.error(err);
                    }
                    if (_options.debug >= config.DEBUG_LEVEL_HIGH) console.log('saved and sending user: ', animal);
                    if (_options.complete) _options.complete.apply(_options.context, [err, user.toObject()])
                })
        }, options);
    };

    /**
     *
     * @param {String} species
     * @param {Object} props
     * @param {Object} options
     * @param {Boolean} [options.debug] Whether to log debug info
     * @param {Function} options.complete callback on operation completion
     * @param {Object} [options.context] context for complete function callback
     */
    this.removeAnimal = function (species, props, options) {
        var _options = _.defaults(options, self.config.queryOptions);

        this._exec(function () {

            if (_options.debug >= config.DEBUG_LEVEL_MED) console.log('mongodb.removeAnimal() - searching for: ', props.petId || props._id);
            self.AnimalDoc[species].remove({
                _id: props.petId || props._id
            }, function (err, result) {
                if (err || (result && result.n == 0)) {
                    err = err || new Error("Could not delete pet");
                    err.status = 404;
                }
                if (_options.debug >= config.DEBUG_LEVEL_MED) console.log('mongodb.removeAnimal() - args: %s', util.inspect(arguments));
                if (_options.complete) _options.complete.apply(null, [err, {result: (err) ? 'failure' : 'success'}]);
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
     * @param props
     * @param {Object} options
     * @param [{Boolean}] [options.debug] Whether to log debug info
     * @param {AnimalQueryCallback} options.complete callback on operation completion
     * @param [{Object}] [options.context] context for complete function callback
     */
    this.findAnimals = function (props, options) {
        var _options = _.defaults(options, self.config.queryOptions);
        if (_options.debug >= config.DEBUG_LEVEL_HIGH) console.log("mongodb.findAnimals(%j)", arguments);

        var query = function () {
            if (_options.debug >= config.DEBUG_LEVEL_HIGH) console.log("mongodb.findAnimals() - received query for: ", props);

            var query = self._buildQuery(props);

            if (!query.species) return _options.complete.call(null, self.errors.species);

            if (_options.debug >= config.DEBUG_LEVEL_MED) console.log("mongodb.AnimalDatabases['%s'].findAnimals(%j)", query.species, query);
            self.AnimalDoc[query.species].find(
                query,
                function (err, _animals) {
                    var animals = [];
                    if (err) {
                        err.status = 404;
                        console.error(err);
                    } else {
                        if (_options.debug >= config.DEBUG_LEVEL_WAY_TMI) console.log('mongodb.findAnimals() - found animals (preformatted): ', _animals);
                        _.forEach(_animals, function (animal, index) {
                            animals.push(self._formatOutput(animal));
                        })
                    }
                    if (_options.debug >= config.DEBUG_LEVEL_TMI) console.log('mongodb.findAnimals() - found animals: ', animals);
                    if (_options.complete) _options.complete.apply(_options.context, [err, animals]);
                })
        };
        this._exec(query, options);
    };

    /**
     *
     * @param {String} species
     * @param {Object} props
     * @param {Object} options
     * @param {Number} [options.debug] Debug output level
     * @param {AnimalQueryCallback} options.complete callback on operation completion
     * @param {Object} [options.context] context for complete function callback
     */
    this.saveAnimal = function (species, props, options) {
        var _options = _.defaults(options, self.config.queryOptions);

        this._exec(function () {
            if (_options.debug >= config.DEBUG_LEVEL_HIGH) console.log("mongodb[%s].saveAnimal() - received post for: ", species, props);

            var animal = new self.AnimalDoc[species](props),
                animalData = animal.toObject();

            delete animalData._id;
            animalData.species = species;
            if (_options.debug >= config.DEBUG_LEVEL_HIGH) console.log("mongodb[%s].saveAnimal() - searching for ID: ", species, animal.petId);

            if (!animalData.petId) {

                self.AnimalDoc[species].create(animalData, function (err, animalDoc) {
                    var formattedAnimalDoc = {};
                    if (err) {
                        err.status = 404;
                        console.error(err);
                    } else {
                        formattedAnimalDoc = self._formatOutput(animalDoc.toObject());
                    }
                    if (_options.debug >= config.DEBUG_LEVEL_HIGH) console.log('saved and sending animal: ', formattedAnimalDoc);
                    if (_options.complete) _options.complete.apply(_options.context, [err, formattedAnimalDoc])
                })
            } else {
                self.AnimalDoc[species].findOneAndUpdate(
                    {'_id': animalData.petId},
                    animalData, {
                        new: true,
                        upsert: true
                    }, function (err, animalDoc) {
                        var formattedAnimalDoc = {};
                        if (err) {
                            err.status = 404;
                            console.error(err);
                        } else {
                            formattedAnimalDoc = self._formatOutput(animalDoc.toObject());
                        }
                        if (_options.debug >= config.DEBUG_LEVEL_HIGH) console.log('saved and sending animal: ', formattedAnimalDoc);
                        if (_options.complete) _options.complete.apply(_options.context, [err, formattedAnimalDoc])
                    })
            }
        }, options);
    };

    /**
     * @callback AnimalModelQueryCallback
     * @param err
     * @param animalModel
     */

    /**
     *
     * @param species
     * @param {Object} options
     * @param {Number} [options.debug] Debug output level
     * @param {AnimalModelQueryCallback} options.complete callback on operation completion
     * @param {Object} [options.context] context for complete function callback
     */
    this.findModel = function (species, options) {
        var _options = _.defaults(options, self.config.queryOptions);

        this._exec(function () {
            self.ModelDoc[species].find({})
                .sort({timestamp: -1})
                .limit(1)
                .exec(function (err, foundAnimalModels) {
                    if (err && foundAnimalModels.length > 0) {
                        err.status = 404;
                        console.error(err || new Error("No models found"));
                    } else {
                        // update active model instance
                        self.modelsCollection[species] = self._formatModelOutput(foundAnimalModels[0]);
                    }
                    if (_options.debug >= config.DEBUG_LEVEL_HIGH) console.log('mongoDb.findModel() - sending animal model: ', self.modelsCollection[species]);
                    if (_options.complete) _options.complete.apply(_options.context, [null, err || self.modelsCollection[species]]);
                });

        }, options);
    };

    /**
     *
     * @param species
     * @param props
     * @param {Object} options
     * @param {Number} [options.debug] Debug output level
     * @param {AnimalModelQueryCallback} options.complete callback on operation completion
     * @param {Object} [options.context] context for complete function callback
     */
    this.saveModel = function (species, props, options) {
        var _options = _.defaults(options, self.config.queryOptions);

        this._exec(function () {
            if (_options.debug == config.DEBUG_LEVEL_MED) console.log("mongodb.saveAnimalModel() - received model update ");
            if (_options.debug >= config.DEBUG_LEVEL_HIGH) console.log("mongodb.saveAnimalModel() - received model update for w/ %s", dump(props));


            if (_options.debug >= config.DEBUG_LEVEL_HIGH) console.log('mongodb.saveAnimalModel() - searching for %s model', species);

            var newModel = new self.ModelDoc[species](props);
            newModel.save(function (err, _animalModel) {
                if (err) {
                    err.status = 404;
                    console.error(err);
                }

                // update active model instance
                self.modelsCollection[species] = self._formatModelOutput(_animalModel);
                if (_options.debug >= config.DEBUG_LEVEL_HIGH) console.log('saved and sending animal model: %j', self.modelsCollection[species]);


                fs.writeFile(path.resolve(process.cwd(), 'data/models.json'), JSON.stringify(self.modelsCollection), function () {
                    if (_options.debug >= config.DEBUG_LEVEL_LOW) console.log('updated cached animal model');
                    if (_options.complete) _options.complete.apply(_options.context, [err, self.modelsCollection[species]]);
                });
            })

        }, options);

        return this;
    };
}


module.exports = MongoDB;

var util = require('util'),
    path = require('path'),
    fs = require('fs'),

    mongoose = require('mongoose'),
    schemaGenerator = require('mongoose-gen'),
    _ = require('lodash'),

    animalSchemasJSON = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'core/data/schema.json'), 'utf8')),
    AnimalDocuments = {},
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
            isDevelopment: require('os').hostname().toLowerCase().indexOf('kah') > -1 // TODO use proper dev flag condition
        },
        queue: []
    };

mongodb.connect = function (callback, options) {
    mongodb.state.isConnecting = true;
    mongodb.adapter.connect(
        'mongodb://'
        + mongodb.identity.username + ':'
        + mongodb.identity.password
        + '@' + mongodb.identity.domain + ':' + mongodb.identity.port + '/'
        + mongodb.identity.database
    );
    var db = mongodb.adapter.connection,
        _options = _.extend({
            context: null
        }, options);

    db.on('error', console.error.bind(console, 'connection error:'));

    db.once('open', function () {
        mongodb.state.isConnected = true;
        mongodb.state.isConnecting = false;

        var AnimalSchemas = {};
        _.forEach(animalSchemasJSON, function (animalSchema, animalSchemaName, collection) {
            AnimalSchemas[animalSchemaName] = new mongoose.Schema(schemaGenerator.convert(animalSchema));
            AnimalDocuments[animalSchemaName] = mongoose.model(animalSchemaName, AnimalSchemas[animalSchemaName], (mongodb.config.isDevelopment) ? 'pets_test' : 'pets_production');
        });
        console.log('Running in %s mode.', (mongodb.config.isDevelopment) ? 'dev' : 'production');

        if (_.isFunction(callback)) callback.apply(_options.context, [mongodb, _options]);
    });
};

/**
 * Builds search object from provided animalProps object. animalProps is an object of fields corresponding to one of the animal schemas
 * @param animalQueryProps
 * @returns {Object}
 * @private
 */
mongodb._buildQuery = function (animalQueryProps) {
    var searchParams = {
        species: (AnimalDocuments[animalQueryProps['species']]) ? animalQueryProps['species'] : 'dog'  // defaults to dog species
    };

    if (searchParams['species'])
        _.forEach(animalQueryProps, function (propVal, propName, collection) {
            switch (propName) {
                case 'petId':
                case 'hashId':
                case '_id':
                    // only use given id and quit early
                    searchParams = {'_id': propVal};
                    return false;
                case 'species':
                    // ignore because species was already set
                    break;
                default:
                    var prefix = '',
                        suffix = '',
                        regexArgs = '';
                    console.log('matchStartFor: %s = %s', typeof animalQueryProps['matchStartFor'], animalQueryProps['matchStartFor']);
                    if (animalQueryProps['matchStartFor'] && _.indexOf(animalQueryProps['matchStartFor'], propName) >= 0) {
                        prefix = '^';
                    }
                    if (animalQueryProps['matchEndFor'] && _.indexOf(animalQueryProps['matchEndFor'], propName) >= 0) {
                        suffix = '$';
                    }
                    if (animalQueryProps['ignoreCaseFor'] && _.indexOf(animalQueryProps['ignoreCaseFor'], propName) >= 0) {
                        regexArgs = 'i';
                    }
                    if (_.has(animalSchemasJSON[searchParams['species']], propName)) {
                        searchParams[propName] = new RegExp(util.format('%s%s%s', prefix, propVal, suffix), regexArgs);
                    }
                    break;
            }
        });
    return searchParams;
};

/**
 *
 * @param func
 * @param options
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
 *
 * @param animalQueryProps
 * @param {Object} options
 * @param {Boolean} options.debug Whether to log debug info
 * @param {Function} options.complete callback on operation completion
 * @param {Object} options.context context for complete function callback
 */
mongodb.findAnimal = function (animalQueryProps, options) {
    var _options = _.extend({}, options);

    mongodb._exec(function () {
        if (_options.debug) console.log("mongodb.findAnimal() - received query for: ", animalQueryProps);
        var searchParams = mongodb._buildQuery(animalQueryProps);

        if (_options.debug) console.log('mongodb.findAnimal() - searching for: ', searchParams);
        AnimalDocuments[searchParams.species].findOne(
            searchParams,
            function (err, animal) {
                if (err) {
                    console.error(err);
                }
                if (_options.debug) console.log('mongodb.findAnimal() - found animal: ', animal);
                if (typeof _options.complete == 'function') {
                    _options.complete.apply(null, [err, animal])
                } else {
                    throw new Error('mongodb.findAnimal() - No options.complete callback specified');
                }
            })
    }, options);
};


/**
 *
 * @param animalQueryProps
 * @param {Object} options
 * @param {Boolean} options.debug Whether to log debug info
 * @param {Function} options.complete callback on operation completion
 * @param {Object} options.context context for complete function callback
 */
mongodb.findAnimals = function (animalQueryProps, options) {
    var _options = _.extend({}, options);
    if (_options.debug) console.log("mongodb.findAnimals(%j)", arguments);

    var query = function () {
        if (_options.debug) console.log("mongodb.findAnimals() - received query for: ", animalQueryProps);
        var searchParams = mongodb._buildQuery(animalQueryProps);
        if (_options.debug) console.log('mongodb.findAnimals() - searching for: ', searchParams);
        AnimalDocuments[searchParams.species].find(
            searchParams,
            function (err, animals) {
                if (err) {
                    console.error(err);
                }
                // if (_options.debug) console.log('mongodb.findAnimals() - found animals: ', animals);
                if (_.isFunction(_options.complete)) {
                    _options.complete.apply(null, [err, animals])
                } else {
                    throw new Error('mongodb.findAnimals() - No options.complete callback specified');
                }
            })
    };
    mongodb._exec(query, options);
};

/**
 *
 * @param animalQueryProps
 * @param {Object} options
 * @param {Boolean} options.debug Whether to log debug info
 * @param {Function} options.complete callback on operation completion
 * @param {Object} options.context context for complete function callback
 */
mongodb.saveAnimal = function (animalQueryProps, options) {
    var _options = _.extend({}, options);

    mongodb._exec(function () {
        if (_options.debug) console.log("mongodb.saveAnimal() - received query for: ", animalQueryProps);
        var searchParams = mongodb._buildQuery(animalQueryProps);
        if (_options.debug) console.log('mongodb.saveAnimal() - searching for: ', searchParams);
        AnimalDocuments[searchParams.species].findOneAndUpdate(
            searchParams,
            animalQueryProps, {
                new: true,
                upsert: true
            }, function (err, animal) {
                if (err) {
                    console.error(err);
                }
                if (_options.debug) console.log('saved and sending animal: ', animal);
                if (_options.complete) {
                    _options.complete.apply(_options.context, [err, animal])
                } else {
                    throw new Error('mongodb.saveAnimal() - No options.complete callback specified');
                }
            })
    }, options);
};

module.exports = mongodb;
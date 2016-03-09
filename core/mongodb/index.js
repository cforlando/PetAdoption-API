var mongoose = require('mongoose'),
    schemaGenerator = require('mongoose-gen'),
    path = require('path'),
    fs = require('fs'),
    _ = require('lodash'),
    animalSchemaJSON = JSON.parse(fs.readFileSync(path.resolve('./', 'core/mongodb/schemas/animal.json'), 'utf8')),
    Animal = null,
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
        queue : []
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
            context : null
        }, options);

    db.on('error', console.error.bind(console, 'connection error:'));

    db.once('open', function () {
        mongodb.state.isConnected = true;
        mongodb.state.isConnecting = false;

        var AnimalSchema = new mongoose.Schema(schemaGenerator.convert(animalSchemaJSON));

        Animal = mongoose.model('Animal', AnimalSchema, (mongodb.config.isDevelopment) ? 'pets_test' : 'pets_production');
        console.log('Running in %s mode.', (mongodb.config.isDevelopment) ? 'dev' : 'production');

        if(_.isFunction(callback)) callback.apply(_options.context, [mongodb, _options]);
    });
};

/**
 * Builds search object from provided animalProps object. animalProps is an object of fields corresponding to one of the animal schemas
 * @param animalProps
 * @returns {Object}
 * @private
 */
mongodb._buildQuery = function (animalProps) {
    var searchParams = {};
    if (animalProps['petName']) searchParams['petName'] = animalProps['petName'];
    if (animalProps['species']) searchParams['species'] = animalProps['species'];
    if (animalProps['petId'] && !(animalProps['petId'] == '0' || animalProps['petId'] == 'undefined')) {
        searchParams = {
            '_id': animalProps['petId']
        }
    }
    return searchParams;
};

/**
 *
 * @param func
 * @param options
 * @param options.context
 * @private
 */
mongodb._exec = function(func, options){
    var _options = _.extend({}, options);
    if(!_.isFunction(func)) {
        console.warn('mongodb._exec() - no function passed');
        return;
    }
    mongodb.queue.push({
        callback : func,
        options : _options
    });

    function onConnected(){
        var callback,
            callbackOptions;
        while(mongodb.queue.length > 0){
            callback = mongodb.queue[0].callback;
            callbackOptions = mongodb.queue[0].options;
            callback.apply(callbackOptions.context, [mongodb, callbackOptions]);
            mongodb.queue.shift();
        }
    }

    if (mongodb.state.isConnected) {
        onConnected();
    } else if(mongodb.state.isConnecting) {
        if (_options.debug) console.log('MongoDB is connecting...');
    } else {
        if (_options.debug) console.log('MongoDB is starting up...');
        mongodb.connect(onConnected);
    }
};

/**
 *
 * @param animalProps
 * @param {Object} options
 * @param {Boolean} options.debug Whether to log debug info
 * @param {Function} options.complete callback on operation completion
 * @param {Object} options.context context for complete function callback
 */
mongodb.findAnimal = function (animalProps, options) {
    var _options = _.extend({}, options);

    mongodb._exec(function() {
        if (_options.debug) console.log("mongodb.findAnimal() - received query for: ", animalProps);
        var searchParams = mongodb._buildQuery(animalProps);

        if (_options.debug) console.log('mongodb.findAnimal() - searching for: ', searchParams);
        Animal.findOne(
            searchParams,
            function (err, animal) {
                if (err) {
                    console.error(err);
                }
                if (_options.debug) console.log('mongodb.findAnimal() - found animal: ', animal);
                if (typeof _options.complete == 'function') {
                    _options.complete.apply(null, [err, animal || animalProps])
                } else {
                    throw new Error('mongodb.findAnimal() - No options.complete callback specified');
                }
            })
    }, options);
};


/**
 *
 * @param animalProps
 * @param {Object} options
 * @param {Boolean} options.debug Whether to log debug info
 * @param {Function} options.complete callback on operation completion
 * @param {Object} options.context context for complete function callback
 */
mongodb.findAnimals = function (animalProps, options) {
    var _options = _.extend({}, options);

    mongodb._exec(function() {
        if (_options.debug) console.log("mongodb.findAnimals() - received query for: ", animalProps);
        var searchParams = mongodb._buildQuery(animalProps);
        if (_options.debug) console.log('mongodb.findAnimals() - searching for: ', searchParams);
        Animal.find(
            searchParams,
            function (err, animals) {
                if (err) {
                    console.error(err);
                }
                if (_options.debug) console.log('mongodb.findAnimals() - found animals: ', animals);
                if (_.isFunction(_options.complete)) {
                    _options.complete.apply(null, [err, animals || animalProps])
                } else {
                    throw new Error('mongodb.findAnimals() - No options.complete callback specified');
                }
            })
    }, options);
};

/**
 *
 * @param animalProps
 * @param {Object} options
 * @param {Boolean} options.debug Whether to log debug info
 * @param {Function} options.complete callback on operation completion
 * @param {Object} options.context context for complete function callback
 */
mongodb.saveAnimal = function (animalProps, options) {
    var _options = _.extend({}, options);

    mongodb._exec(function () {
        if (_options.debug) console.log("mongodb.saveAnimal() - received query for: ", animalProps);
        var searchParams = mongodb._buildQuery(animalProps);
        if (_options.debug) console.log('mongodb.saveAnimal() - searching for: ', searchParams);
        Animal.findOneAndUpdate(
            searchParams,
            animalProps, {
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
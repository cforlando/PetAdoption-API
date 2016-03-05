var mongoose = require('mongoose'),
    schemaGenerator = require('mongoose-gen'),
    path = require('path'),
    fs = require('fs'),
    _ = require('lodash'),
    animalSchemaJSON = JSON.parse(fs.readFileSync(path.resolve('./', 'core/mongodb/schemas/animal.json'), 'utf8')),
    Animal = null,
    localConfig = (function(){
        var config = {
            username : 'username',
            password : 'password',
            domain : 'example.com',
            port :  'port',
            database : 'no_database_provided'
        };
        try {
            //override template config with local json file data
            config = JSON.parse(fs.readFileSync(path.resolve('./', 'core/mongodb/mongodb.config')));
        } catch(e){
            console.error(e);
        }
        return config;
    })(),
    mongodb = {
        adapter: mongoose,
        identity: {
            username: process.env.username || localConfig.username,
            password : process.env.password || localConfig.password,
            domain : process.env.domain || localConfig.domain,
            port : process.env.port || localConfig.port,
            database : process.env.database || localConfig.database
        },
        state: {
            isConnecting: false,
            isConnected: false
        },
        options: {
            retryTimeout: 2000,
            isDevelopment: require('os').hostname().toLowerCase().indexOf('kah') > -1 // TODO use proper dev flag condition
        }
    };

mongodb.connect = function () {
    mongodb.state.isConnecting = true;
    mongodb.adapter.connect(
        'mongodb://'
        + mongodb.identity.username + ':'
        + mongodb.identity.password
        + '@' + mongodb.identity.domain + ':' + mongodb.identity.port + '/'
        + mongodb.identity.database
    );
    var db = mongodb.adapter.connection;

    db.on('error', console.error.bind(console, 'connection error:'));

    db.once('open', function (callback) {
        mongodb.state.isConnected = true;

        var AnimalSchema = new mongoose.Schema(schemaGenerator.convert(animalSchemaJSON));

        Animal = mongoose.model('Animal', AnimalSchema, (mongodb.options.isDevelopment) ? 'pets_test' : 'pets_production');
        console.log('Running in %s mode.', (mongodb.options.isDevelopment) ? 'dev' : 'production');
    });
};
/**
 *
 * @param animalProps
 * @param options
 */
mongodb.findAnimal = function (animalProps, options) {
    if (!mongodb.state.isConnected) {

        if (!mongodb.state.isConnecting) {
            if (options && options.debug) console.log('MongoDB is starting up...');
            mongodb.connect();
        } else {
            if (options && options.debug) console.log('MongoDB is connecting...');
        }
        setTimeout(function () {
            mongodb.findAnimal(animalProps, options);
        }, mongodb.options.retryTimeout)
    } else {
        if (options && options.debug) console.log("mongodb.findAnimal() - received query for: ", animalProps);
        var searchParams = {};
        if (animalProps['petName']) searchParams['petName'] = animalProps['petName'];
        if (animalProps['species']) searchParams['species'] = animalProps['species'];
        if (animalProps['petId'] && !(animalProps['petId'] == '0' || animalProps['petId'] == 'undefined')) {
            searchParams = {
                '_id': animalProps['petId']
            }
        }
        if (options && options.debug) console.log('mongodb.findAnimal() - searching for: ', searchParams);
        Animal.findOne(
            searchParams,
            function (err, animal) {
                if (err) {
                    console.error(err);
                }
                if (options && options.debug) console.log('mongodb.findAnimal() - found animals: ', animal);
                if (options && typeof options.complete == 'function') {
                    options.complete.apply(null, [err, animal || animalProps])
                } else {
                    throw new Error('mongodb.findAnimal() - No options.complete callback specified');
                }
            })
    }

};
mongodb.findAnimals = function (animalProps, options) {
    if (!mongodb.state.isConnected) {

        if (!mongodb.state.isConnecting) {
            if (options && options.debug) console.log('MongoDB is starting up...');
            mongodb.connect();
        } else {
            if (options && options.debug) console.log('MongoDB is connecting...');
        }
        setTimeout(function () {
            mongodb.findAnimal(animalProps, options);
        }, mongodb.options.retryTimeout)
    } else {
        if (options && options.debug) console.log("mongodb.findAnimal() - received query for: ", animalProps);
        var searchParams = {};
        if (animalProps['petName']) searchParams['petName'] = animalProps['petName'];
        if (animalProps['species']) searchParams['species'] = animalProps['species'];
        if (animalProps['petId'] && !(animalProps['petId'] == '0' || animalProps['petId'] == 'undefined')) {
            searchParams = {
                '_id': animalProps['petId']
            }
        }
        if (options && options.debug) console.log('mongodb.findAnimal() - searching for: ', searchParams);
        Animal.find(
            searchParams,
            function (err, animals) {
                if (err) {
                    console.error(err);
                }
                if (options && options.debug) console.log('mongodb.findAnimal() - found animals: ', animals);
                if (options && _.isFunction(options.complete)) {
                    options.complete.apply(null, [err, animals || animalProps])
                } else {
                    throw new Error('mongodb.findAnimal() - No options.complete callback specified');
                }
            })
    }
};
mongodb.saveAnimal = function (animalProps, options) {
    if (!mongodb.state.isConnected) {
        if (options && options.debug) console.log('MongoDB is not connected...');
        if (!mongodb.state.isConnecting) {
            if (options && options.debug) console.log('MongoDB is starting up...');
            mongodb.connect();
        } else {
            if (options && options.debug) console.log('MongoDB is connecting...');
        }
        setTimeout(function () {
            mongodb.saveAnimal(animalProps, options);
        }, mongodb.options.retryTimeout)
    } else {
        if (options && options.debug) console.log("mongodb.saveAnimal() - received query for: ", animalProps);
        var searchParams = {};
        if (animalProps['petName']) searchParams['petName'] = animalProps['petName'];
        if (animalProps['species']) searchParams['species'] = animalProps['species'];
        if (animalProps['petId'] && !(animalProps['petId'] == '0' || animalProps['petId'] == 'undefined')) {
            searchParams = {
                '_id': animalProps['petId']
            }
        }
        if (options && options.debug) console.log('mongodb.saveAnimal() - searching for: ', searchParams);
        Animal.findOneAndUpdate(
            searchParams,
            animalProps, {
                new: true,
                upsert: true
            }, function (err, animal) {
                if (err) {
                    console.error(err);
                }
                if (options && options.debug) console.log('saved and sending animal: ', animal);
                if (options && options.complete) {
                    options.complete.apply(null, [err, animal])
                } else {
                    throw new Error('mongodb.saveAnimal() - No options.complete callback specified');
                }
            })
    }

};

module.exports = mongodb;
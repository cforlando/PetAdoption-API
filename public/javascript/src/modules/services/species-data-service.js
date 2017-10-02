var _ = require('lodash');
var ngApp = require('ngApp');

var Species = require('core/lib/species');

module.exports = ngApp.service('speciesDataService', function (request, speciesFactory) {
    var self = this;
    this.animalSpecies = {};


    /**
     *
     * @param {Object} [options]
     * @param {Boolean} [options.useCache=false]
     * @returns {Promise.<String[]>}
     */
    this.getSpeciesList = function (options) {
        var _options = _.defaults(options, {
            useCache: false
        });

        if (_options.useCache && this.speciesList) {
            return Promise.resolve(this.speciesList);
        }

        return request.get('/api/v1/species/all/list')
            .then(function success(response) {
                self.speciesList = response.data;
                return Promise.resolve(self.speciesList);
            })
    };

    /**
     *
     * @param {String} speciesName
     * @param {Object} [options]
     * @param {Boolean} [options.useCache=false]
     * @returns {Promise.<Species>}
     */
    this.getSpecies = function (speciesName, options) {
        var _options = _.defaults(options, {
            useCache: false
        });
        var cachedSpecies;

        if (!speciesName) {
            return Promise.reject(new Error('invalid species specified'));
        }

        if (_options.useCache && this.animalSpecies[speciesName]) {
            cachedSpecies = this.animalSpecies[speciesName];
            return Promise.resolve(new Species(cachedSpecies.getSpeciesName(), cachedSpecies.getSpeciesProps()));
        }

        return request.get('/api/v1/species/' + speciesName + '/model')
            .then(function success(response) {

                self.animalSpecies[speciesName] = new Species(speciesName, response.data);

                return Promise.resolve(self.animalSpecies[speciesName]);
            })
    };

    /**
     *
     * @param {Species} species
     * @param {Object} [options]
     * @returns {Promise.<Species>}
     */
    this.saveSpecies = function (species, options) {
        var _options = _.defaults(options, {});
        var speciesName = species.getSpeciesName();

        return request.post('/api/v1/species/' + speciesName + '/model/update', species.toMongooseDoc({removeValues: true}))
            .then(function (response) {
                var speciesData = response.data;

                self.animalSpecies[speciesName] = new Species(speciesName, speciesData);

                return Promise.resolve(self.animalSpecies[speciesName]);
            })
    };

    /**
     *
     * @param {String} speciesName
     * @param {Object} [options]
     * @param {Object[]} [options.speciesProps=[]]
     * @returns {Promise.<Species>}
     */
    this.createSpecies = function (speciesName, options) {
        var sanitizedSpeciesName = _.kebabCase(speciesName);
        var opts = _.defaults(options, {
            speciesProps: []
        });
        var newSpecies;

        if (this.animalSpecies[sanitizedSpeciesName]) {
            return Promise.resolve(this.animalSpecies[sanitizedSpeciesName]);
        }

        newSpecies = speciesFactory.createTemplate(sanitizedSpeciesName, opts.speciesProps);


        return request.post('/api/v1/species/' + newSpecies.getSpeciesName() + '/model/create', newSpecies.getSpeciesProps())
            .then(function success(response) {
                var speciesProps = response.data;

                self.animalSpecies[sanitizedSpeciesName] = new Species(sanitizedSpeciesName, speciesProps);
                self.getSpeciesList()
                    .catch(function (err) {
                        console.error(err);
                    });

                return Promise.resolve(self.animalSpecies[sanitizedSpeciesName]);
            })
    };

    /**
     *
     * @param {String} speciesName
     * @param {Object} [options]
     * @param {Boolean} [options.updateSpeciesList=true]
     * @returns {Promise}
     */
    this.deleteSpecies = function (speciesName, options) {
        var opts = _.defaults(options, {
            updateSpeciesList: true
        });

        return request.post('/api/v1/species/' + speciesName + '/model/remove')
            .then(function success(response) {

                if (opts.updateSpeciesList) {
                    self.getSpeciesList({useCache: false})
                }

                return Promise.resolve(response);
            })
    };

    /**
     *
     * @param {String} speciesName
     * @param {String} propName
     * @param {Object} [options]
     * @returns {Promise}
     */
    this.deleteSpeciesProp = function (speciesName, propName, options) {
        this.animalSpecies[speciesName].removeProp(propName);
        return this.saveSpecies(this.animalSpecies[speciesName], options);
    };

    /**
     *
     * @param {String|Object} speciesName
     * @param {String} propName
     * @returns {Object} - the prop as defined by the species
     */
    this.getSpeciesProp = function (speciesName, propName) {
        return this.animalSpecies[speciesName].getProp(propName);
    };

    /**
     *
     * @param {String} speciesName
     * @param {Object} propData
     */
    this.setSpeciesProp = function (speciesName, propData) {
        this.animalSpecies[speciesName].setProps([propData])
    };

    /**
     *
     * @param {String} speciesName
     * @param {Object} propData
     * @returns {Promise.<Species>}
     */
    this.saveSpeciesProp = function (speciesName, propData) {
        this.setSpeciesProp(speciesName, propData);
        return this.saveSpecies(this.animalSpecies[speciesName]);
    };

    /**
     *
     * @param {String} speciesName
     * @param {String} propName
     * @param {Object} options
     * @returns {Promise}
     */
    this.createSpeciesProp = function (speciesName, propName, options) {
        var species = this.animalSpecies[speciesName];
        var propData = _.defaults(options, {
            key: propName,
            valType: 'string',
            defaultVal: '',
            fieldLabel: '',
            note: '',
            description: '',
            example: '',
            options: []
        });

        if (species.getProp(speciesName, propName)) {
            return Promise.reject(new Error('property exists'));
        }

        species.setProps([propData]);

        return self.saveSpecies(species);
    };

    /**
     *
     * @param {String} speciesName
     * @param {HTMLElement} fileInput
     * @param {Object} [options]
     * @param {Object} [options.headers]
     * @return {Promise}
     */
    this.saveSpeciesPlaceholder = function (speciesName, fileInput, options) {
        var opts = _.defaults(options, {
            headers: {
                "Content-Type": undefined
            }
        });
        var formData = new FormData();
        var requestParams = {headers: opts.headers};

        _.forEach(fileInput.files, function (file) {
            formData.append("placeholder", file);
        });

        return request.post('/api/v1/species/' + speciesName + '/placeholder', formData, requestParams)
            .catch(function failure(err) {
                var errMessage = "Could not save placeholder";

                return Promise.reject(new Error(errMessage));
            })
    };

    return this;
});


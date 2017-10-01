var ngApp = require('ngApp');
var _ = require('lodash');
var Animal = require('core/lib/animal');

module.exports = ngApp.service('animalDataService', function (request) {
    var self = this;

    this.animals = {};

    /**
     *
     * @param speciesName
     * @param {Object} [options]
     * @param {Boolean} [options.useCache=false]
     * @return {Promise.<Animal[]>}
     */
    this.getAnimalsBySpecies = function (speciesName, options) {
        var opts = _.defaults(options, {
            useCache: false
        });

        if (opts.useCache && self.animals[speciesName]) {
            return Promise.resolve(self.animals[speciesName])
        }

        return request.get("/api/v1/species/" + speciesName + "/animals/list?properties=['petId','petName','species','images']")
            .then(function success(response) {

                self.animals[speciesName] = response.data.map(function (animalData) {
                    return new Animal(animalData);
                });

                return Promise.resolve(self.animals[speciesName]);
            })
    };


    /**
     *
     * @param {Animal} animal
     * @returns {Promise}
     */
    this.deleteAnimal = function (animal) {
        return request.post('/api/v1/species/' + animal.getSpeciesName() + '/animals/remove', animal.toMongooseDoc())
    };

    /**
     *
     * @param {Animal} animal
     * @param {Object} [options]
     * @returns {Promise.<Animal>}
     */
    this.fetchAnimal = function (animal, options) {
        return request.post('/api/v1/species/all/query', animal.toQuery())
            .then(function success(response) {
                var fetchedAnimalData = response.data[0];
                var fetchedAnimal;

                if (!fetchedAnimalData) {
                    return Promise.reject(new Error('failed to fetch pet'))
                }

                fetchedAnimal = new Animal(fetchedAnimalData);

                return Promise.resolve(fetchedAnimal);
            })
    };

    this.fetchAnimalById = function (petId) {
        var animalProps = [
            {
                key: 'petId',
                val: petId
            }
        ];
        var queriedAnimal = new Animal(animalProps);

        return this.fetchAnimal(queriedAnimal);
    };

    /**
     *
     * @param {Animal} animal
     * @param {Object} [options]
     * @param {Function} [options.isMediaSaved]
     * @returns {Promise.<Animal>}
     */
    this.saveAnimal = function (animal, options) {
        var formData = new FormData();

        if (animal.$media) {
            // append uploaded files
            _.forEach(animal.$media, function ($inputs, key) {
                // iterate through each member in $media object
                $inputs.each(function () {
                    var fileInputEl = this;

                    _.forEach(fileInputEl.files, function (file) {
                        formData.append(key, file);
                        // TODO only append if filename is saved in props
                    });
                })
            });
            // we won't be needing the $media anymore - no sense in trying to format it
            delete animal.$media;
        }

        // assign animal values to form data
        _.forEach(animal.getProps(), function (propData) {
            if (propData.val !== undefined && propData.val !== null) {

                if (!propData.key || propData.key === 'undefined'){
                    console.error('invalid property saved in animal: %o', animal);
                    throw new Error('attempted to save invalid property');
                }

                if (propData.valType === '[image]') {
                    // remove temporary images that will be added on upload
                    propData.val = _.reject(propData.val, function (imageUrl) {
                        return /^data:/.test(imageUrl);
                    })
                }

                formData.append(propData.key, propData.val);
            }
        });

        return request.post('/api/v1/species/' + animal.getSpeciesName() + '/animals/save', formData, {
                headers: {
                    // hackish fix for $http to send data with correct format
                    "Content-Type": undefined
                }
            })
            .then(function success(response) {
                return Promise.resolve(new Animal(response.data));
            })
    };

    this.getPropType = function (propData) {
        if (!propData) {
            return 'invalid';
        }

        switch (propData.key) {
            case 'petId':
                return 'hidden';
            case 'species':
                return 'select';
            case 'description':
                return 'textarea';
            default:
                break;
        }

        switch (propData.valType && propData.valType.toLowerCase()) {
            case 'location':
                return 'location';
            case '[image]':
                return 'gallery';
            case 'date':
                return 'date';
            case 'number':
                return 'number';
            case 'boolean':
                return 'boolean';
            default:
                return 'string';
        }
    };

    return this;
});

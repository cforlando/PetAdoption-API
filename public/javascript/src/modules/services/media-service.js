var async = require('async');
var _ = require('lodash');
var angular = require('angular');

var ngApp = require('ngApp');

module.exports = ngApp.service('media', function () {

    /**
     *
     * @param {HTMLInputElement} inputEl
     * @returns {Promise<String[]>}
     */
    this.getInputURLs = function (inputEl) {
        var numOfFiles = inputEl.files.length;
        var urls = [];
        var reader;
        var fileIndex;

        if (numOfFiles > 0) {
            reader = new FileReader();
            fileIndex = 0;

            return new Promise(function (resolve) {
                reader.onload = function (e) {
                    urls.push(e.target.result);

                    if (fileIndex === numOfFiles) {
                        resolve(urls);
                    } else {
                        reader.readAsDataURL(inputEl.files[fileIndex++]);
                    }
                };

                reader.readAsDataURL(inputEl.files[fileIndex]);
            });
        }

        return Promise.resolve([]);
    };

    /**
     *
     * @param {String|jQuery} fileInputSelector
     * @returns {Promise.<String[]>}
     */
    this.getFileInputValues = function (fileInputSelector) {
        var self = this;
        var $fileInputs = fileInputSelector.jquery ? fileInputSelector : $(fileInputSelector);

        return Promise.all($fileInputs.map(self.getInputURLs))
            .then(function (results) {
                return Promise.resolve(_.flatten(results));
            });
    };


    /**
     *
     * @param {Animal} animal
     * @param {String|jQuery} fileInputSelector
     * @returns {FormData}
     */
    this.generateAnimalPostFormData = function (animal, fileInputSelector) {
        var animalFormData = new FormData();
        var $inputs = fileInputSelector.jquery ? fileInputSelector : angular.element(fileInputSelector || "input[type='file']");

        if ($inputs.length) {
            // append uploaded files
            $inputs.each(function ($el) {
                var fileInputEl = $el[0];
                _.forEach(fileInputEl.files, function (file) {
                    // TODO only append if filename is saved in props
                    animalFormData.append(file.name, file);
                });
            });
        }

        return _.reduce(animal.toJSON(), function (formData, animalPropertyValue, animalPropertyName) {
            if (animalPropertyValue != undefined && animalPropertyValue != null) {
                formData.append(animalPropertyName, animalPropertyValue);
            }
            return formData;
        }, animalFormData);

    };
});

module.exports = ngApp;
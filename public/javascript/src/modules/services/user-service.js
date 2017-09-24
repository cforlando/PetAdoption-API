var angular = require('angular');
var ngApp = require('ngApp');
var _ = require('lodash');

module.exports = ngApp.service('userService', function (request) {
    var self = this;

    this.user = {
        // Get user ID
    };

    /**
     *
     * @param propName
     */
    this.getUserDefault = function (propName) {
        return _.find(this.user.defaults, {key: propName});
    };

    this.getUserDefaults = function () {
        return this.user.defaults;
    };

    /**
     *
     * @param propData
     */
    this.addUserDefault = function (propData) {
        this.user.defaults.push(_.pick(propData, ['key', 'val']));
    };

    /**
     *
     * @param propData
     */
    this.updateUserDefault = function (propData) {
        var propDefault = _.find(this.user.defaults, function (propDefaultData) {
            return propDefaultData.key == propData.key;
        });
        propDefault = _.pick(propData, ['key', 'val']);
    };

    /**
     *
     * @param propData
     */
    this.setUserDefault = function (propData) {
        var currentDefault = this.getUserDefault(propData.key);
        if (!currentDefault) {
            this.addUserDefault(propData);
        } else {
            this.updateUserDefault(propData);
        }
    };

    /**
     *
     * @param {String} propName
     * @param {Number} priorityVal
     */
    this.setUserAnimalPropertyOrder = function (propName, priorityVal) {
        var propOrderData = _.find(this.user.meta, function (metaProp) {
            return metaProp.name == 'propOrder';
        });
        // define if not set
        if (!propOrderData) {
            propOrderData = {name: 'propOrder', value: '{}'};
            this.user.meta.push(propOrderData);
        }
        var propOrderValue = JSON.parse(propOrderData.value);
        propOrderValue[propName] = priorityVal;
        propOrderData.value = JSON.stringify(propOrderValue);
    };

    /**
     *
     * @param {String} propName
     * @param {Number} priorityVal
     * @returns {Promise}
     */
    this.saveUserAnimalPropertyOrder = function(propName, priorityVal){
        this.setUserAnimalPropertyOrder(propName, priorityVal);
        return this.saveCurrentUser();
    };

    this.setUserAnimalPropertiesOrder = function (propPriorities) {
        _.forEach(propPriorities, function (propOrderVal, propName) {
            self.setUserAnimalPropertyOrder(propName, propOrderVal);
        });
    };

    this.getUserAnimalPropertiesOrder = function () {
        var propPriorities = _.find(this.user.meta, function (metaProp) {
            return metaProp.name == 'propOrder';
        });
        // define if not set
        if (!propPriorities) {
            propPriorities = {name: 'propOrder', value: '{}'};
            this.user.meta.push(propPriorities);
        }
        return JSON.parse(propPriorities.value);
    };

    this.getPropPriority = function (propName) {
        var propPriorities = this.getUserAnimalPropertiesOrder();
        return propPriorities[propName];
    };

    this.sortSpeciesProps = function (props) {
        var propPriorities = _.defaults(this.getUserAnimalPropertiesOrder(), {
            petId: 0,
            images: 1,
            petName: 2,
            species: 3
        });
        return _.sortBy(props, function (propData) {
            // default to prop order in not specified
            return propPriorities[propData.key] ? propPriorities[propData.key] : props.length - 1;
        })
    };

    /**
     * @returns {Promise}
     **/
    this.saveCurrentUser = function () {
        return request.post('/api/v1/user/save', this.user)
            .catch(function failure(err) {
                console.error(err || new Error('Could not save user'));
                return Promise.reject(err);
            });
    };


    /**
     * @param {Object} options
     * @returns {Promise}
     **/
    this.getCurrentUser = function (options) {
        var _options = _.defaults(options, {});

        return request.get('/api/v1/user')
            .then(function success(response) {
                self.user = response.data;
                return Promise.resolve(self.user);
            })
            .catch(function failure(err) {
                console.error(err);
                return Promise.reject(err);
            });
    };
});

var angular = require('angular');
var ngApp = require('ngApp');
var _ = require('lodash');

module.exports = ngApp.service('userService', function (request) {
    var self = this;

    this.user = {
        // Get user ID
    };

    this.setUserMeta = function (key, val) {
        var metaProp = _.find(this.user.meta, {key: key});

        if (!metaProp) {
            this.user.meta.push({
                key: key,
                val: val
            });
        } else {
            metaProp.val = val;
        }
    };

    /**
     *
     * @param {String} key
     * @return {{key: String, val: *}}
     */
    this.getUserMeta = function (key) {
        return _.find(this.user.meta, {key: key});
    };

    /**
     *
     * @param {String} key
     * @return {*}
     */
    this.getUserMetaValue = function (key) {
        var metaProp = _.find(this.user.meta, {key: key});
        return metaProp && metaProp.val;
    };

    /**
     *
     * @param propName
     */
    this.getUserDefault = function (propName) {
        return _.find(this.user.defaults, {key: propName});
    };

    /**
     * @returns {Object[]}
     */
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
        var propDefault = this.getUserDefault(propData.key);
        propDefault.key = propData.key;
        propDefault.val = propData.val;
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
        var propOrderData = _.find(this.user.meta, {key: 'propOrder'});
        // define if not set
        if (!propOrderData) {
            propOrderData = {key: 'propOrder', val: '{}'};
            this.user.meta.push(propOrderData);
        }
        var propOrderValue = JSON.parse(propOrderData.val);
        propOrderValue[propName] = priorityVal;
        propOrderData.val = JSON.stringify(propOrderValue);
    };

    /**
     *
     * @param {String} propName
     * @param {Number} priorityVal
     * @returns {Promise}
     */
    this.saveUserAnimalPropertyOrder = function (propName, priorityVal) {
        this.setUserAnimalPropertyOrder(propName, priorityVal);
        return this.saveCurrentUser();
    };

    this.setUserAnimalPropertiesOrder = function (propPriorities) {
        _.forEach(propPriorities, function (propOrderVal, propName) {
            self.setUserAnimalPropertyOrder(propName, propOrderVal);
        });
    };

    this.getUserAnimalPropertiesOrder = function () {
        var propPriorities = _.find(this.user.meta, {key: 'propOrder'});
        // define if not set
        if (!propPriorities) {
            propPriorities = {key: 'propOrder', val: '{}'};
            this.user.meta.push(propPriorities);
        }
        return JSON.parse(propPriorities.val);
    };

    this.getPropPriority = function (propName) {
        var propPriorities = this.getUserAnimalPropertiesOrder();
        return propPriorities[propName];
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

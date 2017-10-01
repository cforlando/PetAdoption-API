var app = require('ngApp');

module.exports = app.service('uiService', function ($mdToast, $rootScope) {
    $rootScope.loadingQueue = {
        length: 0
    };
    /**
     *
     * @param {String} errorMessage
     */
    this.showError = function (errorMessage) {
        return $mdToast.show($mdToast.simple().textContent(errorMessage || 'Sorry. Try Again :-('));
    };

    /**
     *
     * @param {String} message
     */
    this.showMessage = function (message) {
        return $mdToast.show($mdToast.simple().textContent(message || 'Success'))
            .catch(function (err) {
                if (err) {
                    console.error('$mdToast err: %o', err);
                } else {
                    // promise was safely rejected
                }
                return Promise.resolve();
            });
    };

    this.showLoading = function () {
        $rootScope.loadingQueue.length++;
        return Promise.resolve();
    };

    this.hideLoading = function () {
        if ($rootScope.loadingQueue.length > 0) {
            $rootScope.loadingQueue.length--;
        }
        return Promise.resolve();
    };

    return this;
})

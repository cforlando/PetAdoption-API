var _ = require('lodash'),
    ngApp = require('ngApp');

module.exports = ngApp.directive('textareaInput', function () {
    return {
        restrict: 'C',
        template: require('raw!./templates/textarea-input.html')
    };
});

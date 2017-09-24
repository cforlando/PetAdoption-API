var _ = require('lodash'),
    ngApp = require('ngApp');

module.exports = ngApp.directive('textareaInput', function () {
    return {
        restrict: 'C',
        template: require('raw-loader!./templates/textarea-input.html')
    };
});

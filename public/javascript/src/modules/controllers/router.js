define(
    [
        'require',
        'namespace',
        'utils',
        'wordpress',
        'backbone'
    ],
    function(require) {
        var Backbone = require('backbone'),
            utils = require('utils'),
            NS = require('namespace'),
            WordPress = require('wordpress'),
            Router = Backbone.Router.extend({
                initialize: function() {
                    var self = this;
                    // var self = this,
                    //     routerOptions = {
                    //     pushState: true,
                    //     hashChange: false
                    // };
                    // if ('/' != utils.getRootPath()) routerOptions['root'] = utils.getRootPath();
                    // Backbone.history.start(routerOptions);
                    // (function(history) {
                    //     var pushState = history.pushState;
                    //     history.pushState = function(state) {
                    //         if (typeof history.onpushstate == "function") {
                    //             history.onpushstate.apply(null, arguments);
                    //         }
                    //         // whatever else you want to do
                    //         // maybe call onhashchange e.handler
                    //         return pushState.apply(history, arguments);
                    //     };
                    // })(window.history);
                    // window.onpopstate = history.onpushstate = function(data, str, url) {
                    //     console.log('router.initialize() - History changed (%s -> %s)[%O]', location.href, url, arguments);
                    //     self.trigger('view:change', {event: data, to: url, from: location.href});
                    // };

                    console.log('Router.initialze()');
                    if(window['SPA']){
                        window['SPA'].on('wp-spa:view:update', function(evt){
                            console.log("Router.initialize().$(window).on(wp-spa:view:update) - History changed: [%O]",arguments);
                            self.trigger('wp-spa:view:update', evt);
                        });
                    }
                },
                routes: {
                    '*path': 'onRouteChange'
                },
                /**
                 *
                 * @param {string} url - A full url to navigate to
                 * @param {object} [options]
                 * @param {object} [options.trigger = true] - Whether to trigger a 'route' event or just navigate;
                 * @param {object} [options.event] - An event object. Useful for when a link has been clicked
                 * @param {object} [options.bypassUrlValidation = false] Whether to validate path with WordPress
                 */
                navigateTo: function(url, options) {
                    //console.log('Router.navigateTo() called w/', arguments);
                    var defaults = {
                            trigger: true
                        },
                        _options = Backbone.$.extend(defaults, options);
                    if (_options.bypassUrlValidation || (WordPress.hasPage(url) || WordPress.hasPost(url))) {
                        //console.log("Router.navigateTo() - navigating to page:", url);
                        this.trigger('view:request', {
                            from: location.hostname + location.pathname,
                            to: url,
                            event: _options.event
                        });
                        this.navigate(utils.getPathFromUrl(url), {
                            trigger: _options.trigger
                        });
                        /*
                         // alternate to navigate function call
                         history.pushState({}, (options && options.title)?options.title:'', url );
                         this.trigger('route', 'navigateTo', [utils.getPathFromUrl(url), from], options);
                         */
                    }
                },
                onRouteChange: function(path, arg2) {
                    console.log('Router.onRouteChange() called w/ ', arguments);
                    var url = (path) ? utils.getRootUrl(true) + path : utils.getRootUrl(false);
                    if (url == location.href) return;
                    this.navigateTo(url);
                },
                onViewReinitialized: function() {

                }
            });

        NS.Router = new Router();
        return NS.Router;
    }
);

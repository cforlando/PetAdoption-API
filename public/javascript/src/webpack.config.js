var path = require('path'),
    url = require('url'),
    fs = require('fs'),

    webpack = require('webpack'),
    ModuleReplace = webpack.NormalModuleReplacementPlugin;

module.exports = {
    entry: "app.js",
    context: __dirname,
    output: {
        path: path.join(process.cwd(), './public/javascript/'),
        filename: "app.js"
    },
    module: {
        loaders: [{
            test: /\.md$/,
            loader: 'raw!'
        }]
    },
    resolve: {
        root: path.join(__dirname, 'public/javascript/'),
        modulesDirectories: ['./', path.join(process.cwd(), 'node_modules/'), path.join(process.cwd(), 'core/lib/')],
        extensions: ['', '.js', '.jsx'],
        alias: {
            'ngApp': 'modules/ngApp',
            'species': 'species',

            'ng-controllers': 'modules/controllers',
            'ng-directives': 'modules/directives',
            'ng-services': 'modules/services',
            'ng-router': 'modules/router',

            'jquery-ui': 'modules/vendors/jquery-ui',
            'touch-punch': 'modules/vendors/jquery.ui.touch-punch',
            'ng-animate': 'angular-animate',
            'ng-aria': 'angular-aria',
            'ng-material': 'angular-material',
            'ng-messages': 'angular-messages',
            'ng-route': 'angular-route',
            'ng-sanitize': 'angular-sanitize',
            'jquery-slick': 'slick-carousel',
            'underscore': 'lodash'
        }
    },
    plugins: [
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                drop_console: true,
                drop_debugger: true
            },
            mangle: false
        }),

        new webpack.ProvidePlugin({
            $: "jquery",
            jQuery: "jquery",
            "window.jQuery": "jquery"
        }),

        // Hack for requirejs's text plugin
        new ModuleReplace(/^text!.+$/, function (ctx) {
            ctx.request = ctx.request.replace(/text!/, 'raw!');
        })
    ],
    node: {
        'path': true,
        'url': true
    }
};

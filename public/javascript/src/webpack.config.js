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
    shim: {
        "live": [],
        "jquery-slick": ["jquery"]
    },
    plugins: [
        // new webpack.optimize.UglifyJsPlugin({
        //     compress : {
        //         drop_console : true,
        //         drop_debugger : true
        //     }
        // }),

        new webpack.ProvidePlugin({
              "window.jQuery": "jquery"
        }),
        // Hack for requirejs's domReady plugin
        new ModuleReplace(/^(domReady\!)$/, 'modules/null-module'),

        // Hack for requirejs's text plugin
        new ModuleReplace(/^text!.+$/, function (ctx) {
            ctx.request = ctx.request.replace(/text!/, 'raw!');
        }),

        // Hack for requirejs's css plugin
        new ModuleReplace(/^css!.+$/, function (ctx) {
            ctx.request = 'style!' + ctx.request;
        })
    ],
    node: {
        'path': true,
        'url': true
    }
};

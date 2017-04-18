var path = require('path');
var url = require('url');
var fs = require('fs');

var webpack = require('webpack');

module.exports = {
	entry: {
		app: 'app.js',
		vendor: [
			'url',
			'path',
			'jquery',
			'lodash',
			'jquery-ui',
			'touch-punch',
			'angular',
			'ng-animate',
			'ng-aria',
			'ng-material',
			'ng-messages',
			'ng-route',
			'ng-sanitize',
			'jquery-slick',
			'angular-slick-carousel',
			'angular-dragdrop',
			'underscore',
			'moment',
			'async'
		]
	},
	context: __dirname,
	output: {
		path: path.join(process.cwd(), './public/javascript/'),
		filename: "app.js"
	},
	resolve: {
		root: path.join(__dirname, 'public/javascript/'),
		modulesDirectories: [
			'./',
			path.join(process.cwd(), 'node_modules/'),
			path.join(process.cwd(), 'core/lib/')
		],
		alias: {
			'ngApp': 'modules/ngApp',
			'species': 'species',

			'ng-controllers': 'modules/controllers',
			'ng-directives': 'modules/directives',
			'ng-services': 'modules/services',
			'ng-filters': 'modules/filters',
			'ng-router': 'modules/router',

			'jquery-ui': 'vendors/jquery-ui',
			'touch-punch': 'vendors/jquery.ui.touch-punch',
			'jquery-file-input-urls': 'vendors/jquery.file-input-urls',
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
		// new webpack.optimize.UglifyJsPlugin({
		//     compress: {
		//         drop_console: true,
		//         drop_debugger: true
		//     },
		//     mangle: false
		// }),

		new webpack.ProvidePlugin({
			'$': 'jquery',
			'jQuery': 'jquery',
			'window.jQuery': 'jquery',
			'Promise': 'es6-promise' // Thanks Aaron (https://gist.github.com/Couto/b29676dd1ab8714a818f#gistcomment-1584602)
		}),

		new webpack.optimize.CommonsChunkPlugin("vendor", "vendor.app.js")
	],
	node: {
		'path': true,
		'url': true
	}
};

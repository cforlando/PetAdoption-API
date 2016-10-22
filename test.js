var Jasmine = require('jasmine');
var SpecReporter = require('jasmine-spec-reporter');

var jrunner = new Jasmine();
jrunner.addReporter(new SpecReporter());       // add jasmine-spec-reporter
jrunner.DEFAULT_TIMEOUT_INTERVAL = 10 * 1000;
jrunner.loadConfigFile("spec/support/jasmine.json");    // load jasmine.json configuration
jrunner.execute();

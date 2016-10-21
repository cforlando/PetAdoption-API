var Jasmine = require('jasmine');
var SpecReporter = require('jasmine-spec-reporter');

var jrunner = new Jasmine();
jrunner.jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;
jrunner.addReporter(new SpecReporter());       // add jasmine-spec-reporter
jrunner.loadConfigFile("spec/support/jasmine.json");    // load jasmine.json configuration
jrunner.execute();

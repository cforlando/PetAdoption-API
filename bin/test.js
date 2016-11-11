var path = require('path'),
    
    Jasmine = require('jasmine'),
    SpecReporter = require('jasmine-spec-reporter');

var jrunner = new Jasmine();
jrunner.addReporter(new SpecReporter({
    displayStacktrace: 'all',
    displaySpecDuration: true
}));
jrunner.jasmine.DEFAULT_TIMEOUT_INTERVAL = 10 * 1000;
jrunner.loadConfigFile(path.join(process.cwd(), "spec/support/jasmine.json"));
jrunner.execute();

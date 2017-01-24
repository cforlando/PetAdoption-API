var Mocha = require('mocha'),
    fs = require('fs'),
    path = require('path'),

    // Instantiate a Mocha instance.
    mocha = new Mocha({
        ui: 'bdd',
        timeout: 10000
    }),

    testDir = path.join(process.cwd(), 'test/'),
    testDirFiles = fs.readdirSync(testDir).filter(function (file) {

        // Only run test files
        return file.match(/-spec.js/);
    });


// Add each .js file to the mocha instance
testDirFiles.forEach(function (file) {
    mocha.addFile(path.join(testDir, file));
});

// Run the tests.
mocha.run(function (failures) {
    process.on('exit', function () {
        process.exit(failures);  // exit with non-zero status if there were failures
    });
});
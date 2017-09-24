var CSVImporter = require('../core/csv-importer');

var parser = new CSVImporter();

parser.run()
    .then(function(){
        console.log('csv parsed');
    })
    .catch(console.error.bind(console));

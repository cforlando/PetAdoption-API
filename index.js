var fs = require('fs'),
    path = require('path'),
    csvReader = require('./core/csv-parser');


csvReader.parseSchema({
    readPath : path.resolve('./', 'tmp/CfO_Animal_Adoption_DB_Model - Dogs.csv'),
    cache : true,
    done : function(formattedSchema, options){

        console.log('parsed schema');
        require('./core/server');
    }
});

var fs = require('fs'),
    path = require('path'),
    csvReader = require('./core/csv-parser');

csvReader.parseSchema({
    readPath: path.resolve('./', 'tmp/CfO_Animal_Adoption_DB_Model - Dogs.csv'),
    cache: true,
    done: onSchemaParsed
});

function onSchemaParsed(formattedSchema, options) {

    console.log('parsed schema');
    csvReader.parseOptions({
        cache: true,
        readPath: path.resolve('./', 'tmp/CfO_Animal_Adoption_DB_Options - Dogs.csv'),
        done: onOptionsParsed
    })
}

function onOptionsParsed() {
    console.log('parsed schema');
    csvReader.parseDataset({
        cache: true,
        done: onDatasetParsed
    });
}

function onDatasetParsed() {
    console.log('parsed schema');
    fs.readFile(path.resolve('./', 'core/mongodb/cache/dataset.dog.json'), 'utf8', function(err, datasetStr){
        if(err){
            console.error(err);
        } else {
            var mongodb = require('./core/mongodb'),
                petIndex = 0,
                petCollection = JSON.parse(datasetStr),
                numOfPets = petCollection.length;

            function savePets(){
                mongodb.saveAnimal(petCollection[petIndex], {
                    debug: true,
                    complete: function(){
                        petIndex++;
                        if(err){
                            console.error(err);
                            require('./core/server');
                        } else if(petIndex < numOfPets){
                            console.log('Saved pet %d/%d', petIndex, numOfPets);
                            savePets()
                        } else {
                            require('./core/server');
                        }
                    }
                })
            }

            savePets();


        }
    });
}


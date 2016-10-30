var fs = require('fs'),
    path = require('path'),

    SpeciesDBImage = require('../core/mongodb/lib/species-db-image');

var catProps = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/props.cat.json')), 'utf8'),
    dogProps = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/props.dog.json')), 'utf8'),
    
    // TODO Need better test data
    data = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/dataset.dog.json')), 'utf8'),
    cats = data.splice(0, 5).map(function(animalData){
        animalData.species = 'cat';
        return animalData;
    }),
    dogs = data.splice(0, 5);

module.exports = [
    new SpeciesDBImage('cat', cats, catProps),
    new SpeciesDBImage('dog', dogs, dogProps)
];

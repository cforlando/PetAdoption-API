var fs = require('fs'),
    path = require('path'),

    _ = require('lodash'),

    SpeciesDBImage = require('../core/mongodb/lib/species-db-image');

var catProps = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/props.cat.json')), 'utf8'),
    dogProps = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/props.dog.json')), 'utf8'),

    // TODO Need better test data
    data = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/dataset.json')), 'utf8'),
    cats = _.chain(data)
        .filter({species: 'cat'})
        .take(5)
        .value(),
    dogs = _.chain(data)
        .filter({species: 'dog'})
        .take(5)
        .value();

module.exports = [
    new SpeciesDBImage('cat', cats, catProps),
    new SpeciesDBImage('dog', dogs, dogProps)
];

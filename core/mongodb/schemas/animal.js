var mongoose = require('mongoose'),
    AnimalProp = new mongoose.Schema(require('./animal-prop'));

module.exports = {
    petId: String,
    props: [AnimalProp]
};
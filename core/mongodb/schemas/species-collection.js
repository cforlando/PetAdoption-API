var mongoose = require("mongoose"),
    SpeciesSchema = new mongoose.Schema(require('./species'));

module.exports = {
    speciesList: [SpeciesSchema],
    timestamp: Date
};

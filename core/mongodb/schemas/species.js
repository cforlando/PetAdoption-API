var mongoose = require("mongoose"),
    SpeciesProp = new mongoose.Schema(require('./species-prop'));

module.exports = {
    speciesName: String,
    timestamp: Date,
    props: [SpeciesProp]
};

var mongoose = require("mongoose"),
    SpeciesProp = new mongoose.Schema(require('./species-prop'));

module.exports = {
    name: String,
    timestamp : Date,
    props: [SpeciesProp]
};

var _ = require('lodash'),
    mongoose = require('mongoose');

module.exports = _.defaults({val: mongoose.Schema.Types.Mixed}, require('./species-prop'));

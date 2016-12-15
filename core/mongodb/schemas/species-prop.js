var mongoose = require('mongoose');

module.exports = {
    description: String,
    defaultVal: mongoose.Schema.Types.Mixed,
    example: String,
    fieldLabel: String,
    key: String,
    options: [mongoose.Schema.Types.Mixed],
    note: String,
    valType: String,
    value: mongoose.Schema.Types.Mixed
};

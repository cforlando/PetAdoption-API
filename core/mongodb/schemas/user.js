var Schema = require('mongoose').Schema;

module.exports = {
    id : String,
    privilege: Number,
    firstName : String,
    lastName : String,
    photo : String,
    defaults : [{
            key : String,
            val: Schema.Types.Mixed
    }]
};

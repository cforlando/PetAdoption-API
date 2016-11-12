var _ = require('lodash');

module.exports = {
    normalizePort : function(val) {
        var port = parseInt(val, 10);

        if (isNaN(port)) {
            // named pipe
            return val;
        }

        if (port >= 0) {
            // port number
            return port;
        }

        return false;
    },
    parseArrayStr : function(str){
        try {
            var _result = str
                .substr(1, (str.length - 2))
                .replace(/[\'\"]/g, '')
                .split(',');
            return (_.isArray(_result)) ? _result : false;
        } catch (err){

        }
        return false;
    }
};

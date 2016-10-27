module.exports = function(options){
    return function(req, res, next){
        //     res.header("Cache-Control", util.format("max-age=%s", (60 * 60))); // 60 seconds * 60 minutes

        //CORS access
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        res.header("Access-Control-Allow-Origin", "*");
        next();
    }
};

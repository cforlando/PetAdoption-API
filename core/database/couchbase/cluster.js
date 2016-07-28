var fs = require('fs'),
    path = require('path'),
    
    couchbase = require('couchbase'),
    
    // cluster definition can also be defined in a json file with at the key/namespace 'url'
    cluster = (function(){
        var configStr,
            clusterURL = 'couchbase://cfo-pet-adoption.eastus.cloudapp.azure.com';
        try{
            configStr = fs.readFileSync(path.resolve(__dirname, 'couchbase.config'));
            clusterURL = JSON.parse(configStr)['url'];
        } catch (err){
            console.error(err);
        }
        return new couchbase.Cluster(clusterURL);
    })();


module.exports = cluster;
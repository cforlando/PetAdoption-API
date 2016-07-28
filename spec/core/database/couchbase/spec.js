describe("couchbase-api", function() {
    var cluster;

    beforeAll(function() {
        cluster = require('../../../../core/database/couchbase/cluster');
    });

    it("can upsert a doc to default couchbase db", function(done) {
        var bucket = cluster.openBucket('default');
        bucket.upsert('testdoc', {
            name: 'Frank'
        }, function(err, result) {
            if (err) throw err;
            bucket.get('testdoc', function(err, result) {
                if (err) throw err;
                // console.log(result.value);
                expect(result.value.name).toEqual('Frank');
                done();
            });
        });
    });

    it("can successfully execute sample code", function(done) {
        var bucket = cluster.openBucket('beer-sample', function(err) {
            if (err) {
                // Failed to make a connection to the Couchbase cluster.
                throw err;
            }
            // Retrieve a document
            bucket.get('aass_brewery-juleol', function(err, result) {
                if (err) {
                    // Failed to retrieve key
                    throw err;
                }
                var doc = result.value;
                // console.log(doc.name + ', ABV: ' + doc.abv);
                // Store a document
                doc.comment = "Random beer from Norway";
                bucket.replace('aass_brewery-juleol', doc, function(err, result) {
                    if (err) {
                        // Failed to replace key
                        throw err;
                    }
                    // console.log(result);
                    // Success!
                    // process.exit(0);
                    expect(result.cas).toBeTruthy();
                    done();
                });
            });
        });
    });

    it("can generate unique hashes", function() {
        var Couchbase = require('../../../core/couchbase');
        var hash1 = Couchbase._buildHash({
                test: 1
            }),
            hash2 = Couchbase._buildHash({
                test: 3
            });
        expect(hash1).not.toEqual(hash2)
    })

});
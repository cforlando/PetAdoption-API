var url = require('url'),
    fs = require('fs'),
    path = require('path'),
    util = require('util'),

    _ = require('lodash'),
    request = require('request');

describe('Pet Adoption API', function () {
    var domain = 'http://cfo-pet-adoption-server.eastus.cloudapp.azure.com',
        apiEndpoint = url.resolve(domain, 'api/v1/');

    describe("'options' endpoint", function () {
        var optionsData = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'core/data/options.json'), {encoding: 'utf8'})),
            optionsEndpoint = url.resolve(apiEndpoint, 'options/');

        describe('provided with species', function () {

            it('should list all options', function (done) {
                var species = 'dog';
                request({
                    method: 'GET',
                    json: true,
                    url: url.resolve(optionsEndpoint, util.format('%s/', species))
                }, function (err, response, body) {
                    expect(body).toEqual(optionsData[species]);
                    done();
                });
            });

        });

    })
});
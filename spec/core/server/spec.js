var url = require('url'),
    util = require('util'),
    path = require('path'),
    fs = require('fs'),

    request = require('supertest'),
    _ = require('lodash'),
    
    server = require('../../../core/server'),
    serverUtils = require('../../../core/server/utils');


var domain = require('../../../core/config').domain,
    apiEndpoint = url.resolve(domain, 'api/v1/'),
    optionsEndpoint = url.resolve(apiEndpoint, 'options/'),
    modelsData = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'core/data/models.json'), {encoding: 'utf8'})),
    optionsData = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'core/data/options.json'), {encoding: 'utf8'}));


   describe("GET options/:species/", function(){
        var species = 'dog';

        it("returns a JSON of all options", function(done){
                        
            request(server.app)
             .get(util.format('options/%s', species))
             .set('Accept', 'application/json')
             .expect('Content-Type', /json/)
             .expect(optionsData[species])
             .expect(200, done)
        })
        
        describe(":optionName/", function(){
            var optionsName = 'primaryBreed';

            it("returns a JSON of all options of a given :optionName", function(done){
               
                request(server.app)
                 .get(util.format('options/%s/%s', species, optionsName))
                 .set('Accept', 'application/json')
                 .expect('Content-Type', /json/)
                 .expect(optionsData[species][optionsName])
                 .expect(200, done)
            });
        })
   })

   describe("GET list/:species/", function(){
       var species = 'dog';
       it("returns JSON of all pets of a given :species", function(done){
            request(server.app)
             .get(util.format('options/%s', species))
             .set('Accept', 'application/json')
             .expect('Content-Type', /json/)
             .expect(200, done)
       })
   });
   
    describe("POST query/", function(){
        var species = 'dog',
            emptyProps = {},
            dogProps = {species: 'dog'},
            maiseProps = {petName : 'Maise'},
            maiseWrongCapProps = {petName: 'MAise'},
            maiseWrongCapWithIgnoreProps = {petName: 'Maise', ignoreCaseFor: ['petName']};
   
       function pickRandomOption(propData){
            var options = propData.options,
                result = false;
            if (options && options.length > 0) {
                var randOptionIndex = Math.floor(Math.random() * options.length);
                result = options[randOptionIndex]
            }
            result = propData.example || propData.defaultVal;
            if (result === null || result === undefined) throw new Error(util.format("Cannot generate test option for '%s'", propData.key));
            return result;
        }
       
       function alterCase(str){
            var randIndex = Math.floor(Math.random() * str.length);
            return str.substr(0,randIndex).toUpperCase() + str.substr(randIndex).toLowerCase();  
       };

       _.forEach(modelsData[species], function(propData, propName){
            var queryProps = {};
            queryProps[propName] = pickRandomOption(propData);

            it(util.format("returns JSON of all pets with provided %s prop", propName), function(done){
                request(server.app)
                 .post('query/')
                 .send(queryProps)
                 .set('Accept', 'application/json')
                 .expect(function(res){
                    if(err) throw err;
                    _.forEach(queryProps, function(propValue, propName){
                        if(res.body[propName].val != queryProps[propName]) throw new Error('Received incorrect pet when species provided');
                    });
                 })
                 .expect(200, done)
           })

       })
       
       describe("when multiple params are provided", function(){
             var queryProps = {};

            _.forEach(modelsData[species], function(propData, propName){

               queryProps[propName] = pickRandomOption(propData);

                it(util.format("returns JSON of all pets with provided '%s' props", Object.keys(queryProps).join(", ")), function(done){
                    request(server.app)
                     .post('query/')
                     .send(queryProps)
                     .set('Accept', 'application/json')
                     .expect(function(res){
                        if(err) throw err;
                        _.forEach(queryProps, function(propValue, propName){
                            if(res.body[propName].val != queryProps[propName]) throw new Error('Received incorrect pet when species provided');
                        });
                     })
                     .expect(200, done)
               })

           })
       });
              
        describe("when ignoreCase flag is set", function(){ 
           _.forEach(modelsData[species], function(propData, propName){
                var queryProps = {ignoreCase: [propName]},
                    randOption = pickRandomOption(propData);
                
                //skip non-string values
                if(!_.isString(randOption)) return;

                queryProps[propName] = alterCase(randOption);
                it(util.format("returns JSON of all pets with provided '%s' prop regardless of Case", propName), function(done){
                    request(server.app)
                     .post('query/')
                     .send(queryProps)
                     .set('Accept', 'application/json')
                     .expect(function(res){
                        if(err) throw err;
                        _.forEach(queryProps, function(propValue, propName){
                            if(res.body[propName].val != queryProps[propName]) throw new Error('Received incorrect pet when species provided');
                        });
                     })
                     .expect(200, done)
               })

           })
       }); 
    });

var _ = require('lodash'),

    Debuggable = require('../../../../../core/lib/debuggable'),
    Query = require('../../../../../core/mongodb/lib/animal-query-factory');

describe("AnimalQueryFactory", function () {
    var speciesProps = [
            {
                valType: 'String',
                key: 'queryTest'
            },
            {
                valType: 'Boolean',
                key: 'boolQueryTest'
            },
            {
                valType: 'Boolean',
                key: 'boolQueryTestV2'
            },
            {
                valType: 'Float',
                key: 'floatQueryTest'
            },
            {
                valType: 'Number',
                key: 'intQueryTest'
            },
            {
                valType: 'Date',
                key: 'dateQueryTest'
            }
        ],
        queryProps = {
            queryTest: 'success',
            boolQueryTest: true,
            boolQueryTestV2: 'yes',
            floatQueryTest: 81.239023,
            intQueryTest: 4,
            dateQueryTest: new Date()
        },
        tQuery,
        tGeneratedQueryProps;

    beforeAll(function () {
        tQuery = new Query(speciesProps, queryProps, {
            debugLevel: Debuggable.PROD
        });
        tGeneratedQueryProps = tQuery.build();
    });

    it("Returns an object", function () {
        expect(tGeneratedQueryProps).not.toBeUndefined();
        var tEmptyGeneratedQuery = new Query(speciesProps, {}, {
            debugLevel: tQuery.getDebugLevel()
        });
        expect(tEmptyGeneratedQuery.build()).not.toBeUndefined('A prop-less query should return an empty object');
    });

    it("properly formats a date property to ISO", function () {
        expect(tGeneratedQueryProps.dateQueryTest).toEqual(queryProps.dateQueryTest.toISOString());
    });

    it("properly formats an integer property", function () {
        expect(tGeneratedQueryProps.intQueryTest).toEqual(queryProps.intQueryTest);
    });

    it("properly formats a location property", function () {
        expect(tGeneratedQueryProps.floatQueryTest).toEqual(queryProps.floatQueryTest);
    });

    it("properly formats a boolean", function () {
        expect(tGeneratedQueryProps.boolQueryTest).toEqual(true);
        expect(tGeneratedQueryProps.boolQueryTestV2).toEqual(true);
    });

    it("properly formats a string", function () {
        expect(tGeneratedQueryProps.queryTest).toEqual(/success/);
    });

    it("Accepts meta property: ignoreCaseFor:", function () {

        var tQueryProps = _.defaults({
                ignoreCaseFor: ['queryTest']
            }, queryProps),
            tQuery = new Query(speciesProps, tQueryProps, {
                debugTag: 'tQuery: '
            });
        expect(tQuery.build().queryTest).toEqual(/success/i)
    });

    it("Accepts meta property: matchStartFor:", function () {

        var tQueryProps = _.defaults({
                matchStartFor: ['queryTest']
            }, queryProps),
            tQuery = new Query(speciesProps, tQueryProps, {
                debugTag: 'tQuery: '
            });

        expect(tQuery.build().queryTest).toEqual(/^success/)
    });

    it("Accepts meta property: matchEndFor:", function () {

        var tQueryProps = _.defaults({
                matchEndFor: ['queryTest']
            }, queryProps),
            tQuery = new Query(speciesProps, tQueryProps, {
                debugLevel: Debuggable.PROD,
                debugTag: 'tQuery: '
            });

        expect(tQuery.build().queryTest).toEqual(/success$/)
    });
});

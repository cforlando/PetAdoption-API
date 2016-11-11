console.log('loading services');
module.exports = [
    require('modules/services/address-finder'),
    require('modules/services/species-factory'),
    require('modules/services/data-parser'),
    require('modules/services/request'),
    require('modules/services/google')
];

console.log('loading services');
module.exports = [
    require('modules/services/animal-data-service'),
    require('modules/services/species-data-service'),
    require('modules/services/user-service'),
    require('modules/services/media-service'),
    require('modules/services/address-finder'),
    require('modules/services/species-factory'),
    require('modules/services/request'),
    require('modules/services/google')
];

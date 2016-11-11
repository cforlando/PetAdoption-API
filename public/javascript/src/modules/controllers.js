console.log('loading controllers');
module.exports = [
    require('modules/controllers/app-controller'),
    require('modules/controllers/user-controller'),
    require('modules/controllers/data-controller'),
    require('modules/controllers/pet-list-controller'),
    require('modules/controllers/pet-form-controller'),
    require('modules/controllers/species-list-controller'),
    require('modules/controllers/species-form-controller'),
    require('modules/controllers/species-prop-form-controller')
];

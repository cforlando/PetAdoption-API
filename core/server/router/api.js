var Express = require('express');

/**
 *
 * @augments Express.Router
 * @class APIRouter
 * @param {AppController} controller
 * @returns {APIRouter}
 * @constructor
 */
function APIRouter(controller) {
    var router = Express.Router();

    router.post([
        '/species/:speciesName/query',
        '/query'
    ], controller.api.onQueryRequest());

    router.post([
        '/species/:speciesName/query/:pageNumber',
        '/query/:pageNumber'
    ], controller.api.onQueryRequest());

    router.get([
        '/species/all/animals/list',
        '/list'
    ], controller.api.onListAllRequest());

    router.get([
        '/species/:speciesName/animals/list',
        '/list/:speciesName'
    ], controller.api.onListSpeciesRequest());

    router.get([
        '/species/:speciesName/animals/list/:pageNumber',
        '/list/:speciesName/:pageNumber'
    ], controller.api.onListSpeciesRequest());

    // save an animal
    router.post([
        '/species/:speciesName/animals/save',
        '/save/:speciesName'
    ], controller.auth.verifyAuth(), controller.api.uploader.array('images'), controller.api.onSaveAnimalForm());

    // save a json of an animal
    router.post([
        '/species/:speciesName/animals/save/json',
        '/save/:speciesName/json'
    ], controller.auth.verifyAuth(), controller.api.onSaveAnimalJSON());

    // delete an animal
    router.post([
        '/species/:speciesName/animals/remove',
        '/remove/:speciesName'
    ], controller.auth.verifyAuth(), controller.api.onDeleteAnimal());

    router.get([
        '/species/all/list',
        '/species'
    ], controller.api.onSpeciesListRequest());

    router.get([
        '/species/:speciesName/options',
        '/options/:speciesName'
    ], controller.api.onOptionsRequest());

    router.get([
        '/species/:speciesName/options/:option',
        '/options/:speciesName/:option'
    ], controller.api.onSingleOptionRequest());

    router.get([
        '/species/:speciesName/options/:option/:pageNumber',
        '/options/:speciesName/:option/:pageNumber'
    ], controller.api.onSingleOptionRequest());

    // create a species
    router.post([
        '/species/:speciesName/model/create',
        '/create/:speciesName/model'
    ], controller.auth.verifyAuth(), controller.api.onCreateSpecies());

    // fetch the species
    router.get([
        '/species/:speciesName/model',
        '/model/:speciesName'
    ], controller.api.onRetrieveSpecies());

    // update a species
    router.post([
        '/species/:speciesName/model/update',
        '/save/:speciesName/model'
    ], controller.auth.verifyAuth(), controller.api.onSaveSpecies());

    // delete a species
    router.post([
        '/species/:speciesName/model/remove',
        '/remove/:speciesName/model'
    ], controller.auth.verifyAuth(), controller.api.onDeleteSpecies());

    // save a species placeholder image
    router.post([
        '/species/:speciesName/placeholder',
        '/save/:speciesName/placeholder'
    ], controller.auth.verifyAuth(), controller.api.uploader.single('placeholder'), controller.api.onSaveSpeciesPlaceholder());

    router.get('/user', controller.auth.verifyAuth(), controller.api.onUserRetrieve());

    router.post('/user/save', controller.auth.verifyAuth(), controller.api.onUserUpdate());

    router.get('/formatdb/', controller.api.onFormatDb());

    router.get('/reset', controller.api.onReset());

    return router;
}


module.exports = APIRouter;

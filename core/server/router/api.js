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

    router.get('/options/:species', controller.api.onOptionsRequest());
    router.get('/options/:species/:option', controller.api.onSingleOptionRequest());
    router.get('/options/:species/:option/:pageNumber', controller.api.onSingleOptionRequest());
    router.get('/model/:species', controller.api.onRetrieveSpecies());
    router.get('/list', controller.api.onListAllRequest());
    router.get('/list/:species', controller.api.onListSpeciesRequest());
    router.get('/list/:species/:pageNumber', controller.api.onListSpeciesRequest());
    router.get('/species', controller.api.onSpeciesListRequest());

    router.post('/query/:pageNumber', controller.api.onQueryRequest());
    router.post('/query', controller.api.onQueryRequest());

    // save a json of an animal
    router.post('/save/:species/json',
        controller.auth.verifyAuth(),
        controller.api.onSaveAnimalJSON());

    // save an animal
    router.post('/save/:species',
        controller.auth.verifyAuth(),
        controller.api.uploader.array('images'),
        controller.api.onSaveAnimalForm());

    // delete an animal
    router.post('/remove/:species',
        controller.auth.verifyAuth(),
        controller.api.onDeleteAnimal());

    // save a species
    router.post('/save/:species/model',
        controller.auth.verifyAuth(),
        controller.api.onSaveSpecies());

    // save a species placeholder image
    router.post('/save/:species/placeholder',
        controller.auth.verifyAuth(),
        controller.api.uploader.single('placeholder'),
        controller.api.onSaveSpeciesPlaceholder());

    // create a species
    router.post('/create/:species/model',
        controller.auth.verifyAuth(),
        controller.api.onCreateSpecies());

    // create a species
    router.post('/remove/:species/model',
        controller.auth.verifyAuth(),
        controller.api.onDeleteSpecies());

    router.post('/user/save',
        controller.auth.verifyAuth(),
        controller.api.onUserUpdate());

    router.get('/user',
        controller.auth.verifyAuth(),
        controller.api.onUserRetrieve());

    router.get('/formatdb/', controller.api.onFormatDb());
    router.get('/reset', controller.api.onReset());

    return router;
}


module.exports = APIRouter;

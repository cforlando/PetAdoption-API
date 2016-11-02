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

    router.get('/options/:species', controller.onOptionsRequest());
    router.get('/options/:species/:option', controller.onSingleOptionRequest());
    router.get('/options/:species/:option/:pageNumber', controller.onSingleOptionRequest());
    router.get('/model/:species', controller.onRetrieveSpecies());
    router.get('/list', controller.onListAllRequest());
    router.get('/list/:species', controller.onListSpeciesRequest());
    router.get('/list/:species/:pageNumber', controller.onListSpeciesRequest());
    router.get('/species', controller.onSpeciesListRequest());

    router.post('/query/:pageNumber', controller.onQueryRequest());
    router.post('/query', controller.onQueryRequest());

    // save a json of an animal
    router.post('/save/:species/json',
        controller.verifyAuth(),
        controller.onSaveAnimalJSON());

    // save an animal
    router.post('/save/:species',
        controller.verifyAuth(),
        controller.uploader.array('uploads'),
        controller.onSaveAnimalForm());

    // delete an animal
    router.post('/remove/:species',
        controller.verifyAuth(),
        controller.onDeleteAnimal());

    // save a species
    router.post('/save/:species/model',
        controller.verifyAuth(),
        controller.onSaveSpecies());

    // save a species placeholder image
    router.post('/save/:species/placeholder',
        controller.verifyAuth(),
        controller.uploader.single('uploads'),
        controller.onSaveSpeciesPlaceholder());

    // create a species
    router.post('/create/:species/model',
        controller.verifyAuth(),
        controller.onCreateSpecies());

    // create a species
    router.post('/remove/:species/model',
        controller.verifyAuth(),
        controller.onDeleteSpecies());

    router.post('/user/save',
        controller.verifyAuth(),
        controller.onUserUpdate());

    router.get('/user',
        controller.verifyAuth(),
        controller.onUserRetrieve());

    router.get('/cleandb/', controller.onFormatAllDB());
    router.get('/cleandb/:species/', controller.onFormatSpeciesDB());
    router.get('/reset', controller.onReset());
    return router;
}


module.exports = APIRouter;

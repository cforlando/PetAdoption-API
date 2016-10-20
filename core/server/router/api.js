var Express = require('express');


/**
 *
 * @augments Express.Router
 * @class APIRouter
 * @param {AppController} controller
 * @returns {APIRouter}
 * @constructor
 */
function APIRouter(controller){
    var router = Express.Router();

    router.get('/options/:species', controller.onOptionsRequest.bind(controller));
    router.get('/options/:species/:option', controller.onSingleOptionRequest.bind(controller));
    router.get('/options/:species/:option/:pageNumber', controller.onSingleOptionRequest.bind(controller));
    router.get('/model/:species', controller.onRetrieveSpecies.bind(controller));
    router.get('/schema/:species', controller.onSchemaRequest.bind(controller));
    router.get('/list', controller.onListAllRequest.bind(controller));
    router.get('/list/:species', controller.onListSpeciesRequest.bind(controller));
    router.get('/list/:species/:pageNumber', controller.onListSpeciesRequest.bind(controller));
    router.get('/species', controller.onSpeciesListRequest.bind(controller));

    router.post('/query/:pageNumber', controller.onQueryRequest.bind(controller));
    router.post('/query', controller.onQueryRequest.bind(controller));

    // save a json of an animal
    router.post('/save/:species/json',
            controller.passport.session(),
            controller.verifyAuth.bind(controller),
            controller.onSaveAnimalJSON.bind(controller));

    // save an animal
    router.post('/save/:species',
            controller.passport.session(),
            controller.verifyAuth.bind(controller),
            controller.upload.array('uploads'),
            controller.onMediaSave.bind(controller));

    // delete an animal
    router.post('/remove/:species',
        controller.passport.session(),
        controller.verifyAuth.bind(controller),
        controller.onDeleteSpecies.bind(controller));

    // save a species
    router.post('/save/:species/model',
            controller.passport.session(),
            controller.verifyAuth.bind(controller),
            controller.onSaveSpecies.bind(controller));

    // create a species
    router.post('/create/:species/model',
        controller.passport.session(),
        controller.verifyAuth.bind(controller),
        controller.onCreateSpecies.bind(controller));

    router.post('/user/save',
            controller.passport.session(),
            controller.verifyAuth.bind(controller),
            controller.onUserUpdate.bind(controller));

    router.get('/user', 
            controller.passport.session(),
            controller.verifyAuth.bind(controller),
            controller.onUserRetrieve.bind(controller));

    router.get('/cleandb/', controller.onFormatAllDB.bind(controller));
    router.get('/cleandb/:species/', controller.onFormatSpeciesDB.bind(controller));
    router.get('/reset', controller.onReset.bind(controller));
    return router;
}


module.exports = APIRouter;

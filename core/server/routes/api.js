var Express = require('express'),

    handler = require('../controllers'),
    router = Express.Router();



router.use(handler.authenticator.passport.initialize());
router.use(handler.authenticator.passport.session());

router.get('/auth/google/',
    handler.authenticator.passport.authenticate('google', {
        scope: [
            'https://www.googleapis.com/auth/plus.login'
        ]
    }));

router.get('/auth/google/callback/',
    handler.authenticator.passport.authenticate('google', {
        failureRedirect: '/'
    }),
    handler.authenticator.onLoginSuccess);

router.get('/options/:species', handler.onOptionsRequest);
router.get('/options/:species/:option', handler.onSingleOptionRequest);
router.get('/options/:species/:option/:pageNumber', handler.onSingleOptionRequest);
router.get('/model/:species', handler.onModelRequest);
router.get('/schema/:species', handler.onSchemaRequest);
router.get('/list', handler.onListAllRequest);
router.get('/list/:species', handler.onListRequest);
router.get('/list/:species/:pageNumber', handler.onListRequest);
router.get('/species/', handler.onSpeciesListRequest);
router.post('/save/:species/json', handler.authenticator.verifyAuth, handler.onJSONSave);
router.post('/save/:species', handler.authenticator.verifyAuth, handler.upload.array('uploads'), handler.onMediaSave);
router.post('/save/:species/model', handler.authenticator.verifyAuth, handler.onModelSave);
router.post('/remove/:species', handler.authenticator.verifyAuth, handler.onDeleteRequest);
router.post('/query/:pageNumber', handler.onQueryRequest);
router.post('/query', handler.onQueryRequest);


router.get('/cleandb/', handler.onFormatDBRequestAll);
router.get('/cleandb/:species/', handler.onFormatDBRequestSpecies);
router.get('/reset', handler.onResetRequest);


module.exports = router;

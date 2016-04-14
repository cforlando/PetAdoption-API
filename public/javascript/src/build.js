({
    name: 'build-production',
    baseUrl: "./",
    optimize: 'uglify2',
    context : null, // fix for r.js
    uglify2 : {
        compress : {
            drop_console : true,
            drop_debugger : true
        }
    },
    include : ['require-lib'],
    mainConfigFile: 'rjs-config.js',
    out: "../app.js"
});
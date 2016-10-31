// template gulpfile
// working gulpfile should be in root of project and named 'gulpfile.js'

var path = require('path'),

    gulp = require('gulp'),

    lib = function(moduleName){ return require('gulp-utils/lib/'+path.normalize(moduleName)); },

    project = lib('project'),
    utils = lib('utils');

// dev task that watches and executes appropriate tasks as necessary
gulp.task('auto', function(){
    gulp.watch(utils.buildGlobSelector(project.tasks['pug-php'], '/**/*.pug'), ['pug-php']);
    // gulp.watch(utils.buildGlobSelector(project.tasks['stylus'], '/**/*.styl'), ['stylus']);
    gulp.watch(utils.buildGlobSelector(project.tasks['stylus-bem'], '/**/*.styl'), ['stylus-bem']);
    // gulp.watch(utils.buildGlobSelector(project.tasks['pug-html'], '/**/*.pug'), ['pug-html']);
    // gulp.watch(utils.buildGlobSelector(project.tasks['jsx'], '{**,!node_modules,!vendors}/**/*.jsx'), ['babel']);
    // gulp.watch(utils.buildGlobSelector(project.tasks['sass'], '/**/*.scss'), ['sass']);
    
    // autoformat pug files on save
    //gulp.watch(utils.buildGlobSelector(project.tasks['pug'], '/**/*.pug'), function(event){
    //    lib('pug').beautify({
    //        tasks : [
    //            {
    //                input : path.dirname(event.path),
    //                suffix : path.basename(event.path)
    //            }
    //        ]
    //    });
    //});

    // autoformat javascript files on save
    // gulp.watch(utils.buildGlobSelector(project.tasks['js'],'/{**,!node_modules,!vendors}/**/*.js'), function(event){
    //     lib('javascript').beautify({
    //         tasks : [
    //             {
    //                 input : path.dirname(event.path),
    //                 suffix : path.basename(event.path)
    //             }
    //         ]
    //     });
    // });

    // render jsx files on save
    // gulp.watch(utils.buildGlobSelector(project.tasks['jsx'],'/{**, !node_modules,!vendors}/**/*.jsx'), function(event){
    //     lib('babel').compile({
    //         tasks : [
    //             {
    //                 input : path.dirname(event.path),
    //                 output : path.basename(event.path)
    //             }
    //         ]
    //     });
    // });

    lib('project/chrome-sync').start(function(){
        console.log('chrome-sync active...');
    });
});
// CSS tasks

gulp.task('stylus', lib('stylus').compile);

gulp.task('stylus-bem', lib('stylus').compileBEM);

gulp.task('stylus-auto', function(){
    gulp.watch(utils.buildGlobSelector(project.tasks['stylus'], '**/*.styl'), ['stylus']);
});

gulp.task('stylus-bem-auto', function(){
    gulp.watch(utils.buildGlobSelector(project.tasks['stylus-bem'], '**/*.styl'), ['stylus-bem']);
});

gulp.task('less', lib('less').compile);

gulp.task('sass', lib('sass').compile);

gulp.task('sass-debug', lib('sass').debug);

gulp.task('sass-auto', function(){
    gulp.watch(utils.buildGlobSelector(project.tasks['sass'], '**/*.{scss,sass}'), ['sass']);
});

gulp.task('compass', lib('sass').compass);


// Pug/Jade tasks
gulp.task('pug-2-stylus', lib('pug').pug2Stylus);

gulp.task('pug-php', lib('pug').php);

gulp.task('pug-php-auto', function(){
    gulp.watch(utils.buildGlobSelector(project.tasks['pug-php'], '/**/*.pug'), ['pug-php']);
});

gulp.task('pug-html', lib('pug').html);

gulp.task('pug-html-auto', function(){
    gulp.watch(utils.buildGlobSelector(project.tasks['pug-html'], '/**/*.pug'), ['pug-html']);
});

gulp.task('pug-php-debug', lib('pug').phpDebug);

gulp.task('pug-ejs', lib('pug').ejs);

gulp.task('pug-ejs-auto', function(){
    gulp.watch(utils.buildGlobSelector(project.tasks['pug-ejs'], '/**/*.pug'), ['pug-ejs']);
});

gulp.task('html-2-pug', lib('pug').html2Pug);

gulp.task('php-2-pug', lib('pug').php2Pug);

gulp.task('jade-php', lib('jade').php);

gulp.task('jade-ejs', lib('jade').ejs);

gulp.task('jade-html', lib('jade').html);

gulp.task('pug-beautify', lib('pug').beautify);


// Javascript tasks
gulp.task('build-js-config', lib('javascript').config);

gulp.task('beautify-js', lib('javascript').beautify);

gulp.task('beautify-js-auto', function(){
    gulp.watch(utils.buildGlobSelector(project.tasks['js'], '{**,!node_modules,!vendors)/*.js'), ['beautify-js']);
});

gulp.task('test-js', lib('javascript').test);

gulp.task('build-js', lib('javascript').build);

gulp.task('build-webpack', lib('javascript').buildWebpack);

gulp.task('build-rjs', lib('javascript').buildRequireJS);

gulp.task('jsx', lib('babel').compile);

//WordPress tasks
gulp.task('init-wp-config', lib('wordpress').init);

gulp.task('init-project',  lib('project').init);

gulp.task('init-avocode', lib('avocode').init);


// Babel tasks
gulp.task('babel', lib('babel').compile);

gulp.task('babel-auto', function(){
    gulp.watch(utils.buildGlobSelector(project.tasks['jsx'], '{**,!node_modules,!vendors)/**/*.jsx'), ['babel']);
});


// Project tasks
gulp.task('ftp', lib('ftp').sync);

gulp.task('ftp-auto', function(){
    gulp.watch(utils.buildGlobSelector(project.tasks['ftp'], ''), ['ftp']);
});

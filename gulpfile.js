// template gulpfile
// working gulpfile should be in root of project and named 'gulpfile.js'

var path = require('path'),

    gulp = require('gulp'),

    utils = function(moduleName){ return require('gulp-utils/lib/'+path.normalize(moduleName)); },

    project = utils('project'),
    projectUtils = utils('utils');

// dev task that watches and executes appropriate tasks as necessary
gulp.task('auto', function(){
    // gulp.watch(projectUtils.buildGlobArray(project.tasks['pug-php'], '/**/*.pug'), ['pug-php']);
    gulp.watch(projectUtils.buildGlobArray(project.tasks['stylus'], '/**/*.styl'), ['stylus']);
    // gulp.watch(projectUtils.buildGlobArray(project.tasks['stylus-bem'], '/**/*.styl'), ['stylus-bem']);
    gulp.watch(projectUtils.buildGlobArray(project.tasks['pug-html'], '/**/*.pug'), ['pug-html']);
    // gulp.watch(projectUtils.buildGlobArray(project.tasks['jsx'], '{**,!node_modules,!vendors}/**/*.jsx'), ['babel']);
    // gulp.watch(projectUtils.buildGlobArray(project.tasks['sass'], '/**/*.scss'), ['sass']);
    
    // autoformat pug files on save
    //gulp.watch(projectUtils.buildGlobArray(project.tasks['pug'], '/**/*.pug'), function(event){
    //    utils('pug').beautify({
    //        tasks : [
    //            {
    //                input : path.dirname(event.path),
    //                suffix : path.basename(event.path)
    //            }
    //        ]
    //    });
    //});

    // autoformat javascript files on save
    // gulp.watch(projectUtils.buildGlobArray(project.tasks['js'],'/{**,!node_modules,!vendors}/**/*.js'), function(event){
    //     utils('javascript').beautify({
    //         tasks : [
    //             {
    //                 input : path.dirname(event.path),
    //                 suffix : path.basename(event.path)
    //             }
    //         ]
    //     });
    // });

    utils('project/chrome-sync').start(function(){
        console.log('chrome-sync active...');
    });
});
// CSS tasks

gulp.task('stylus', utils('stylus').compile);

gulp.task('stylus-bem', utils('stylus').compileBEM);

gulp.task('stylus-auto', function(){
    gulp.watch(projectUtils.buildGlobArray(project.tasks['stylus'], '**/*.styl'), ['stylus']);
});

gulp.task('stylus-bem-auto', function(){
    gulp.watch(projectUtils.buildGlobArray(project.tasks['stylus-bem'], '**/*.styl'), ['stylus-bem']);
});

gulp.task('less', utils('less').compile);

gulp.task('sass', utils('sass').compile);

gulp.task('sass-debug', utils('sass').debug);

gulp.task('sass-auto', function(){
    gulp.watch(projectUtils.buildGlobArray(project.tasks['stylus'], '**/*.(scss|sass)'), ['sass']);
});

gulp.task('compass', utils('sass').compass);


// Pug/Jade tasks
gulp.task('pug-2-stylus', utils('pug').pug2Stylus);

gulp.task('pug-php', utils('pug').php);

gulp.task('pug-php-auto', function(){
    gulp.watch(projectUtils.buildGlobArray(project.tasks['pug-php'], '/**/*.pug'), ['pug-php']);
});

gulp.task('pug-html', utils('pug').html);

gulp.task('pug-html-auto', function(){
    gulp.watch(projectUtils.buildGlobArray(project.tasks['pug-html'], '/**/*.pug'), ['pug-html']);
});

gulp.task('pug-php-debug', utils('pug').phpDebug);

gulp.task('pug-ejs', utils('pug').ejs);

gulp.task('pug-ejs-auto', function(){
    gulp.watch(projectUtils.buildGlobArray(project.tasks['pug-ejs'], '/**/*.pug'), ['pug-ejs']);
});

gulp.task('html-2-pug', utils('pug').html2Pug);

gulp.task('php-2-pug', utils('pug').php2Pug);

gulp.task('jade-php', utils('jade').php);

gulp.task('jade-ejs', utils('jade').ejs);

gulp.task('jade-html', utils('jade').html);

gulp.task('pug-beautify', utils('pug').beautify);


// Javascript tasks
gulp.task('build-js-config', utils('javascript').config);

gulp.task('beautify-js', utils('javascript').beautify);

gulp.task('beautify-js-auto', function(){
    gulp.watch(projectUtils.buildGlobArray(project.tasks['js'], '{**,!node_modules,!vendors)/*.js'), ['beautify-js']);
});

gulp.task('test-js', utils('javascript').test);

gulp.task('build-js', utils('javascript').build);

gulp.task('jsx', utils('babel').compile);

//WordPress tasks
gulp.task('init-wp-config', utils('wordpress').init);

gulp.task('init-project',  utils('project').init);

gulp.task('init-avocode', utils('avocode').init);


// Babel tasks
gulp.task('babel', utils('babel').compile);

gulp.task('babel-auto', function(){
    gulp.watch(projectUtils.buildGlobArray(project.tasks['jsx'], '{**,!node_modules,!vendors)/**/*.jsx'), ['babel']);
});


// Project tasks
gulp.task('ftp', utils('ftp').sync);

gulp.task('ftp-auto', function(){
    gulp.watch(projectUtils.buildGlobArray(project.tasks['ftp'], ''), ['ftp']);
});

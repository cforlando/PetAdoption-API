// template gulpfile
// working gulpfile should be in root of project

var path = require('path'),

    gulp = require('gulp'),

    gulpLib = function(moduleName){ return require('gulp-utils/lib/'+path.normalize(moduleName)); },

    project = gulpLib('project'),
    projectUtils = gulpLib('utils');

// dev task that watches and executes appropriate tasks as necessary
gulp.task('auto', function(){
    gulp.watch(projectUtils.buildGlobArray(project.tasks['pug'], '/**/*.pug'), ['pug-php']);
    gulp.watch(projectUtils.buildGlobArray(project.tasks['stylus'], '/**/*.styl'), ['stylus']);
    // gulp.watch(projectUtils.buildGlobArray(project.tasks['pugjs'], '/**/*.pug'), ['pug-js']);
    // gulp.watch(projectUtils.buildGlobArray(project.tasks['jsx'], '!(node_modules|vendors)/**/*.jsx'), ['babel']);
    // gulp.watch(projectUtils.buildGlobArray(project.tasks['sass'], '/**/*.scss'), ['sass']);
    //gulp.watch(projectUtils.buildGlobArray(project.tasks['pug'], '/**/*.pug'), function(event){
    //    gulpLib('pug').beautify({
    //        tasks : [
    //            {
    //                input : path.dirname(event.path),
    //                suffix : path.basename(event.path)
    //            }
    //        ]
    //    });
    //});
    gulp.watch(projectUtils.buildGlobArray(project.tasks['js'],'!(node_modules|vendors)/**/*.js'), function(event){
        gulpLib('javascript').beautify({
            tasks : [
                {
                    input : path.dirname(event.path),
                    suffix : path.basename(event.path)
                }
            ]
        });
    });
    gulpLib('project/chrome-sync').start();
});
// CSS tasks

gulp.task('stylus', gulpLib('stylus').compile);

gulp.task('stylus-auto', function(){
    gulp.watch(projectUtils.buildGlobArray(project.tasks['stylus'], '**/!(_)*.styl'), ['stylus']);
});

gulp.task('less', gulpLib('less').compile);

gulp.task('sass', gulpLib('sass').compile);

gulp.task('sass-debug', gulpLib('sass').debug);

gulp.task('compass', gulpLib('sass').compass);


// Pug/Jade tasks
gulp.task('pug-2-stylus', gulpLib('pug').pug2Stylus);

gulp.task('pug-php', gulpLib('pug').php);

gulp.task('pug-php-auto', function(){
    gulp.watch(projectUtils.buildGlobArray(project.tasks['pug'], '/**/*.pug'), ['pug-php']);
});

gulp.task('pug-html', gulpLib('pug').html);

gulp.task('pug-html-auto', function(){
    gulp.watch(projectUtils.buildGlobArray(project.tasks['pug-html'], '/**/*.pug'), ['pug-html']);
});

gulp.task('pug-php-debug', gulpLib('pug').phpDebug);

gulp.task('pug-ejs', gulpLib('pug').ejs);

gulp.task('pug-ejs-auto', function(){
    gulp.watch(projectUtils.buildGlobArray(project.tasks['pug-ejs'], '/**/*.pug'), ['pug-ejs']);
});

gulp.task('html-2-pug', gulpLib('pug').html2Pug);

gulp.task('php-2-pug', gulpLib('pug').php2Pug);

gulp.task('jade-php', gulpLib('jade').php);

gulp.task('jade-ejs', gulpLib('jade').ejs);

gulp.task('jade-html', gulpLib('jade').html);

gulp.task('pug-beautify', gulpLib('pug').beautify);


// Javascript tasks
gulp.task('build-js-config', gulpLib('javascript').config);

gulp.task('beautify-js', gulpLib('javascript').beautify);

gulp.task('beautify-js-auto', function(){
    gulp.watch(projectUtils.buildGlobArray(project.tasks['js'], '!(node_modules|vendors)/**/*.js'), ['beautify-js']);
});

gulp.task('test-js', gulpLib('javascript').test);

gulp.task('build-js', gulpLib('javascript').build);


//WordPress tasks
gulp.task('init-wp-config', gulpLib('wordpress').init);

gulp.task('init-project',  gulpLib('project').init);

gulp.task('init-avocode', gulpLib('avocode').init);


// Babel tasks
gulp.task('babel', gulpLib('babel').compile);

gulp.task('babel-auto', function(){
    gulp.watch(projectUtils.buildGlobArray(project.tasks['jsx'], '!(node_modules|vendors)/**/*.jsx'), ['babel']);
});


// Project tasks
gulp.task('ftp', gulpLib('ftp').sync);

gulp.task('ftp-auto', function(){
    gulp.watch(projectUtils.buildGlobArray(project.tasks['ftp'], ''), ['ftp']);
});

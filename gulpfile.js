// template gulpfile
// working gulpfile should be in root of project

var path = require('path'),

    gulp = require('gulp'),

    gulpModule = function(moduleName){ return require('gulp-utils/commands/'+path.normalize(moduleName)); },

    project = gulpModule('project'),
    projectUtils = gulpModule('utils');

// dev task that watches and executes appropriate tasks as necessary
gulp.task('auto', function(){
    gulp.watch(projectUtils.buildGlobArray(project.tasks['pug'], '/**/*.pug'), ['pug-php']);
    gulp.watch(projectUtils.buildGlobArray(project.tasks['stylus'], '/**/*.styl'), ['stylus']);
    // gulp.watch(projectUtils.buildGlobArray(project.tasks['pugjs'], '/**/*.pug'), ['pug-js']);
    // gulp.watch(projectUtils.buildGlobArray(project.tasks['jsx'], '!(node_modules|vendors)/**/*.jsx'), ['babel']);
    // gulp.watch(projectUtils.buildGlobArray(project.tasks['sass'], '/**/*.scss'), ['sass']);
    // gulp.watch(projectUtils.buildGlobArray(project.tasks['js'],'!(node_modules|vendors)/**/*.js'), ['beautify-js']);
    gulpModule('project/chrome-sync').start();
});

gulp.task('stylus', gulpModule('stylus').compile);

gulp.task('stylus-auto', function(){
    gulp.watch(projectUtils.buildGlobArray(project.tasks['stylus'], '**/!(_)*.styl'), ['stylus']);
});

// CSS tasks
gulp.task('less', gulpModule('less').compile);

gulp.task('sass', gulpModule('sass').compile);

gulp.task('sass-debug', gulpModule('sass').debug);

gulp.task('compass', gulpModule('sass').compass);

// Jade tasks

gulp.task('pug-2-stylus', gulpModule('stylus').pug2Stylus);

gulp.task('pug-php', gulpModule('pug').php);

gulp.task('pug-php-auto', function(){
    gulp.watch(projectUtils.buildGlobArray(project.tasks['pug'], '/**/*.pug'), ['pug-php']);
});

gulp.task('pug-php-debug', gulpModule('pug').phpDebug);

gulp.task('pug-js', gulpModule('pug').js);

gulp.task('pug-js-auto', function(){
    gulp.watch(projectUtils.buildGlobArray(project.tasks['pugjs'], '/**/*.pug'), ['pug-js']);
});


// Javascript tasks
gulp.task('build-js-config', gulpModule('javascript').config);

gulp.task('beautify-js', gulpModule('javascript').beautify);

gulp.task('beautify-js-auto', function(){
    gulp.watch(projectUtils.buildGlobArray(project.tasks['js'], '!(node_modules|vendors)/**/*.js'), ['beautify-js']);
});

gulp.task('test-js', gulpModule('javascript').test);

gulp.task('build-js', gulpModule('javascript').build);


//WordPress tasks
gulp.task('init-wp-config', gulpModule('wordpress').init);

gulp.task('init-project',  gulpModule('project').init);

gulp.task('init-avocode', gulpModule('avocode').init);


// Babel tasks
gulp.task('babel', gulpModule('babel').compile);


gulp.task('babel-auto', function(){
    gulp.watch(projectUtils.buildGlobArray(project.tasks['jsx'], '!(node_modules|vendors)/**/*.jsx'), ['babel']);
});

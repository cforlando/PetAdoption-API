var fs = require('fs'),
    path = require('path'),
    gulp = require('gulp'),
    _ = require('lodash'),
    argv = require('yargs').argv,
    customJade = require('jade'),
    jade = require('gulp-jade'),
    projectDirectory = __dirname;

customJade.filters.ejs = function (text) {
    return '<% ' + text + ' %>';
};

gulp.task('jade', function () {
    var jadeDirectory = path.resolve(projectDirectory, 'jade/'),
        jadeFilesPattern = path.join(jadeDirectory, '/**/[^_]*.jade');
    gulp.src(jadeFilesPattern)
        .pipe(jade({
            pretty: (argv['pretty']) ? true : false,
            jade: customJade
        }))
        .on('error', onError)
        .pipe(gulp.dest(function(file){
            var basename = path.parse(file.path).base;
            return ((basename == 'index.html')? './' : './views/');
        }));
});

gulp.task('jade-auto', function () {
    var jadeDirectory = path.resolve(projectDirectory, 'jade/');
    gulp.watch(path.join(jadeDirectory, '/**/*.jade'), ['jade']);
});

function onError(err) {
    console.log(err);
    this.emit('end');
}

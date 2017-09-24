const gulp = require('gulp');

const Project = require('kdev-utils/lib/project');
const Utils = require('kdev-utils/lib/utils');

const project = new Project();

const exec = function (taskName) {
    return function () {
        return project.exec(taskName);
    }
};

const task = function(taskName){
    const Task = project.getModule(taskName);
    return new Task();
};

gulp.task('auto', ['pug', 'stylus', 'chrome-sync']);

gulp.task('chrome-sync', task('extra/chrome-sync').run);

// CSS tasks
gulp.task('css', exec('css'));

gulp.task('stylus', exec('stylus'));

gulp.task('stylus-auto', function () {
    gulp.watch(Utils.buildGlobSelector(project.tasks['stylus'], '**/*.styl'), ['stylus']);
});

gulp.task('less', exec('less'));

gulp.task('sass', exec('sass'));

gulp.task('sass-auto', function () {
    gulp.watch(Utils.buildGlobSelector(project.tasks['sass'], '**/*.{scss,sass}'), ['sass']);
});

gulp.task('compass', exec('compass'));

// Pug/Jade tasks
gulp.task('pug-html', exec('pug-html'));

gulp.task('pug-ejs', exec('pug-ejs'));

gulp.task('pug-php', exec('pug-php'));

gulp.task('pug-auto', function () {
    gulp.watch(Utils.buildGlobSelector(project.tasks['pug'], '/**/*.pug'), ['pug']);
});

gulp.task('pug-beautify', exec('pug-beautify'));

gulp.task('pug2stylus', exec('pug2stylus'));

gulp.task('php2pug', exec('php2pug'));

// Javascript tasks
gulp.task('js-beautify', exec('js'));

gulp.task('js-beautify-auto', function () {
    const globSelector = Utils.buildGlobSelector(project.tasks['js'], '/{**,!node_modules,!vendors}/**/*.js');
    gulp.watch(globSelector, function (event) {
        return task('js/beautify').beautifyFile(event.path)
    });
});

gulp.task('build-webpack', exec('webpack'));

gulp.task('build-rjs', exec('rjs'));

gulp.task('jsx', exec('jsx'));

//WordPress tasks
gulp.task('init-wp', exec('wordpress'));

gulp.task('init-avocode', exec('avocode'));

// Babel tasks
gulp.task('babel', exec('babel'));

gulp.task('babel-auto', function () {
    gulp.watch(Utils.buildGlobSelector(project.getTasks('jsx'), '{**,!node_modules,!vendors)/**/*.jsx'), ['babel']);
});

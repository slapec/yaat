var gulp = require('gulp');

var meta = require('./package.json');

var addStream = require('add-stream');
var concat = require('gulp-concat');
var expect = require('gulp-expect-file');
var htmlMinifier = require('gulp-html-minifier');
var inject = require('gulp-inject-string');
var rename = require('gulp-rename');
var templateCache = require('gulp-angular-templatecache');
var uglify = require('gulp-uglify');
var minifyCss = require('gulp-minify-css');

// Paths ----------------------------------------------------------------------
var BASE = 'dev/yatable';
var DIST = '.';

var templateFiles = [
    BASE + '/static/table.html',
    BASE + '/static/controls.html',
    BASE + '/static/dropdown.html',
    BASE + '/static/row.html',
    BASE + '/static/paging.html'
];

var mainFile = BASE + '/static/js/yaat.js';

// Options --------------------------------------------------------------------
var outFilename = 'yaat.full.js';
var minifiedOutFilename = 'yaat.min.js';

var cacheOptions = {
    module: 'yaat',
    root: 'yatable'
};

var prependString = '/*\n';
prependString += '    ' + meta.name + ' v' + meta.version + ' - https://github.com/slapec/yaat\n';
prependString += '    build date: ' + new Date().toISOString() + '\n';
prependString += '*/\n';

// Tasks ----------------------------------------------------------------------

gulp.task('minifyCss', function(){
    var path = BASE + '/static/css/yaat.css';
    return gulp.src(path)
        .pipe(expect(path))
        .pipe(minifyCss())
        .pipe(inject.prepend(prependString))
        .pipe(gulp.dest(DIST))
});

gulp.task('default', ['minifyCss'], function(){
    var templates = gulp.src(templateFiles)
        .pipe(expect(templateFiles))
        .pipe(htmlMinifier({collapseWhitespace: true}))
        .pipe(templateCache(cacheOptions));

    gulp.src(mainFile)
        .pipe(expect(mainFile))
        .pipe(addStream.obj(templates))
        .pipe(concat(outFilename))
        .pipe(inject.prepend(prependString))
        .pipe(gulp.dest(BASE + '/static/js/'))
        .pipe(gulp.dest(DIST))
        .pipe(uglify())
        .pipe(inject.prepend(prependString))
        .pipe(rename(minifiedOutFilename))
        .pipe(gulp.dest(BASE + '/static/js'))
        .pipe(gulp.dest(DIST))
});
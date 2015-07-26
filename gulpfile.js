var gulp = require('gulp');
var gutil = require('gulp-util');
var uglify = require('gulp-uglify');
var uglifycss = require('gulp-uglifycss');
var watch = require('gulp-watch');

gulp.task('minify', function() {
	return gulp
			.src('src/assets/js/**/*.js')
			.pipe(uglify())
			.pipe(gulp.dest('build/assets/js'));
});

gulp.task('minifycss', function() {
	return gulp
			.src('src/assets/css/**/*.css')
			.pipe(uglifycss())
			.pipe(gulp.dest('build/assets/css'));
});

gulp.task('watch', function() {
	gulp.watch('src/assets/js/**/*.js', function(event) {
		gutil.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
		gulp.run('minify');
	})
});

var files = [
	'src/assets/libs/jquery/dist/jquery.min.js', 
	'src/assets/libs/backbone/backbone-min.js',
	'src/assets/libs/mustache/mustache.min.js',
	'src/assets/libs/underscore/underscore-min.js'
];
gulp.task('copy-files', function() {
	gulp.src(files)
	.pipe(gulp.dest('build/assets/libs/'));

	gulp.src('src/index.html')
	.pipe(gulp.dest('build/'));

	gulp.src('src/assets/images/*')
	.pipe(gulp.dest('build/assets/images'));
});
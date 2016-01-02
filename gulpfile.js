var gulp = require('gulp'),
	gulpif = require('gulp-if'),
	uglify = require('gulp-uglify'),
	minifyCss = require('gulp-minify-css'),
	bundle = require('gulp-useref'),
	watch = require('gulp-watch'),
	server = require('gulp-server-livereload');

gulp.task('bundle', function() {
	var assets = bundle.assets();
	return gulp.src('src/*.html')
			.pipe(assets)
			.pipe(gulpif('*.js', uglify()))
			.pipe(gulpif('*.css', minifyCss({
				aggressiveMerging: false
			})))
			.pipe(assets.restore())
			.pipe(bundle())
			.pipe(gulp.dest('build'));
});

gulp.task('watch', function() {
	gulp.watch(['src/**/*.js', 'src/**/*.css', 'src/**/*.html'], function() {
		gulp.start('bundle');
	});
});

gulp.task('server', function() {
	gulp.src('build')
			.pipe(server({
				livereload: true,
				open: true,
				defaultFile: 'index.html'
			}));
});

gulp.task('build', ['watch', 'server']);

gulp.task('default', ['build']);
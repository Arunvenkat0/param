var gulp = require('gulp'),
	gutil = require('gulp-util'),
	sass = require('gulp-sass'),
	prefix = require('gulp-autoprefixer'),
	browserify = require('browserify'),
	watchify = require('watchify'),
	source = require('vinyl-source-stream');

var paths = {
	scss: {
		src: './app_storefront_core/cartridge/scss/*.scss',
		dest: './app_storefront_core/cartridge/static/default/css'
	},
	js : {
		src: './app_storefront_richUI/cartridge/javascripts/app.js',
		dest: './app_storefront_richUI/cartridge/static/default/js'
	}
}

var watching = false;
gulp.task('enable-watch-mode', function() { watching = true })

gulp.task('sass', function () {
	gulp.src(paths.scss.src)
		.pipe(sass())
		.pipe(prefix({cascade: true}))
		.pipe(gulp.dest(paths.scss.dest));
});

gulp.task('browserify', function () {
	var bundleMethod = watching ? watchify : browserify;
	var bundler = bundleMethod({
		entries: paths.js.src,
		debug: development
	});
	var development = gutil.env.type === 'development';
	// optionally transform
	// bundler.transform('transformer');

	bundler.on('update', bundle);

	function bundle () {
		return bundler
			.bundle()
			.on('error', function (e) {
				gutil.log('Browserify Error', e);
			})
			.pipe(source('app.js'))
			.pipe(gulp.dest(paths.js.dest));
	}
	return bundle();
});

gulp.task('watch', ['enable-watch-mode', 'browserify'], function () {
	gulp.watch(paths.scss.src, ['sass']);
});
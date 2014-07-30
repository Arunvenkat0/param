var gulp = require('gulp'),
	gutil = require('gulp-util'),
	sass = require('gulp-sass'),
	prefix = require('gulp-autoprefixer'),
	browserify = require('browserify'),
	watchify = require('watchify'),
	source = require('vinyl-source-stream'),
	xtend = require('xtend');

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
	var opts = {
		entries: paths.js.src,
		debug: (gutil.env.type === 'development')
	}
	if (watching) {
		opts = xtend(opts, watchify.args);
	}
	var bundler = browserify(opts);
	if (watching) {
		bundler = watchify(bundler);
	}
	// optionally transform
	// bundler.transform('transformer');

	bundler.on('update', function (ids) {
		gutil.log('File(s) changed: ' + gutil.colors.cyan(ids));
		gutil.log('Rebunlding...');
	});

	function rebundle () {
		return bundler
			.bundle()
			.on('error', function (e) {
				gutil.log('Browserify Error', gutil.colors.red(e));
			})
			.pipe(source('app.js'))
			.pipe(gulp.dest(paths.js.dest));
	}
	return rebundle();
});

gulp.task('watch', ['enable-watch-mode', 'browserify'], function () {
	gulp.watch(paths.scss.src, ['sass']);
});
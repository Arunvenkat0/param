'use strict';

var browserify = require('browserify'),
	connect = require('gulp-connect'),
	deploy = require('gulp-gh-pages'),
	gulp = require('gulp'),
	gutil = require('gulp-util'),
	jscs = require('gulp-jscs'),
	jshint = require('gulp-jshint'),
	minimist = require('minimist'),
	mocha = require('gulp-mocha'),
	sass = require('gulp-sass'),
	source = require('vinyl-source-stream'),
	stylish = require('jshint-stylish'),
	prefix = require('gulp-autoprefixer'),
	watchify = require('watchify'),
	xtend = require('xtend');

var paths = {
	scss: {
		src: './app_storefront_core/cartridge/scss/*.scss',
		dest: './app_storefront_core/cartridge/static/default/css'
	},
	js: {
		src: './app_storefront_richUI/cartridge/js/app.js',
		dest: './app_storefront_richUI/cartridge/static/default/js'
	}
}

var watching = false;
gulp.task('enable-watch-mode', function () { watching = true })

gulp.task('scss', function () {
	gulp.src(paths.scss.src)
		.pipe(sass())
		.pipe(prefix({cascade: true}))
		.pipe(gulp.dest(paths.scss.dest));
});

gulp.task('js', function () {
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
		rebundle();
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

gulp.task('jscs', function () {
	return gulp.src('**/*.js')
		.pipe(jscs());
});

gulp.task('jshint', function () {
	return gulp.src('./app_storefront_richUI/cartridge/js/**/*.js')
		.pipe(jshint())
		.pipe(jshint.reporter(stylish));
});

gulp.task('ui-test', function () {
	var opts = minimist(process.argv.slice(2));
	// default option to all
	var suite = opts.suite || '*';
	if (suite === 'all') {
		suite = '*';
	}
	// default reporter to spec
	var reporter = opts.reporter || 'spec';
	// default timeout to 10s
	var timeout = opts.timeout || 10000;
	return gulp.src(['test/ui/' + suite + '/**/*.js', '!test/ui/webdriver/*'], {read: false})
		.pipe(mocha({
			reporter: reporter,
			timeout: timeout
		}));
});

var transform = require('vinyl-transform');
var rename = require('gulp-rename');
var filter = require('gulp-filter');
gulp.task('test-browserify', function () {
	var browserified = transform(function (filename) {
		var b = browserify(filename);
		return b.bundle();
	});

	return gulp.src(['test/unit/browser/*.js', '!test/unit/browser/*.out.js'])
		.pipe(browserified)
		.pipe(rename(function (path) {
			path.dirname += '/dist';
		}))
		.pipe(gulp.dest('test/unit/browser'));
});

gulp.task('test-connect', function () {
	var opts = minimist(process.argv.slice(2));
	var port = opts.port || 7000;
	return connect.server({
		root: 'test/unit/browser',
		port: port
	});
});
gulp.task('unit-test', ['test-browserify', 'test-connect'], function () {
	var opts = minimist(process.argv.slice(2));
	var reporter = opts.reporter || 'spec';
	var timeout = opts.timeout || 10000;
	var suite = opts.suite || '*';
	gulp.src(['test/unit/' + suite + '/**/*.js', '!test/unit/browser/**/*', '!test/unit/webdriver/*'], {read: false})
		.pipe(mocha({
			reporter: reporter,
			timeout: timeout
		}))
		.on('end', function () {
			connect.serverClose();
		})
});

gulp.task('watch', ['enable-watch-mode', 'js'], function () {
	gulp.watch(paths.scss.src, ['scss']);
});

var hbsfy = require('hbsfy');
var styleguideWatching = false;
gulp.task('styleguide-watching', function () {styleguideWatching = true});
gulp.task('styleguide-browserify', function () {
	var opts = {
		entries: ['./styleguide/js/main.js'],
		debug: (gutil.env.type === 'development')
	}
	if (styleguideWatching) {
		opts = xtend(opts, watchify.args);
	}
	var bundler = browserify(opts);
	if (styleguideWatching) {
		bundler = watchify(bundler);
	}

	// transforms
	bundler.transform(hbsfy);

	bundler.on('update', function (ids) {
		gutil.log('File(s) changed: ' + gutil.colors.cyan(ids));
		gutil.log('Rebunlding...');
		bundle();
	});

	var bundle = function() {
		return bundler
			.bundle()
			.on('error', function (e) {
				gutil.log('Browserify Error', gutil.colors.red(e));
			})
			.pipe(source('main.js'))
			.pipe(gulp.dest('./styleguide/dist'));
	};
	return bundle();
});

gulp.task('styleguide-connect', function () {
	var opts = minimist(process.argv.slice(2));
	var port = opts.port || 8000;
	return connect.server({
		root: 'styleguide',
		port: port
	});
});

gulp.task('styleguide-scss', function () {
	gulp.src('styleguide/scss/*.scss')
		.pipe(sass())
		.pipe(prefix({cascade: true}))
		.pipe(gulp.dest('styleguide/dist'));
});

gulp.task('styleguide', ['styleguide-watching', 'styleguide-browserify', 'styleguide-scss', 'styleguide-connect'], function () {
	gulp.watch('styleguide/scss/*.scss', ['styleguide-scss']);
});

// deploy to github pages
gulp.task('styleguide-deploy', function () {
	var options = xtend({cacheDir: 'styleguide/.tmp'}, require('./styleguide/deploy.json').options);
	return gulp.src(['styleguide/index.html', 'styleguide/dist/**/*', 'styleguide/lib/**/*'])
		.pipe(deploy(options));
});

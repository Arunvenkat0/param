var gulp = require('gulp'),
	sass = require('gulp-sass'),
	prefix = require('gulp-autoprefixer');

var paths = {
	scss: {
		src: 'app_storefront_core/cartridge/scss/*.scss',
		dest: 'app_storefront_core/cartridge/static/default/css'
	}
}
gulp.task('scss', function () {
	gulp.src(paths.scss.src)
		.pipe(sass())
		.pipe(prefix({cascade: true}))
		.pipe(gulp.dest(paths.scss.dest));
});

gulp.task('watch', function () {
	gulp.watch(paths.scss.src, ['sass']);
});
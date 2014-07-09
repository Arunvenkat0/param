var gulp = require('gulp'),
	sass = require('gulp-sass');

gulp.task('sass', function () {
	gulp.src('app_storefront_core/cartridge/scss/*.scss')
		.pipe(sass())
		.pipe(gulp.dest('app_storefront_core/cartridge/static/default/css'));
});
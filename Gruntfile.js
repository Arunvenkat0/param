'use strict';

module.exports = function (grunt) {
	require('load-grunt-tasks')(grunt);
	grunt.initConfig({
		watch: {
			sass: {
				files: ['app_storefront_core/cartridge/scss/*.scss'],
				tasks: ['sass', 'autoprefixer']
			}
		},
		sass: {
			dev: {
				options: {
					style: 'expanded',
					sourcemap: true
				},
				files: {
					'app_storefront_core/cartridge/static/default/css/style.css': 'app_storefront_core/cartridge/scss/style.scss'
				}
			}
		},
		autoprefixer: {
			dev: {
				src: 'app_storefront_core/cartridge/static/default/css/style.css',
				dest: 'app_storefront_core/cartridge/static/default/css/style.css'
			}
		},
	});

	grunt.registerTask('default', [
		'sass',
		'autoprefixer',
		'watch'
	]);
}
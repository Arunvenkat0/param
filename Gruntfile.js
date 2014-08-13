'use strict';

module.exports = function (grunt) {
	require('load-grunt-tasks')(grunt);
	grunt.initConfig({
		watch: {
			sass: {
				files: ['app_storefront_core/cartridge/scss/*.scss'],
				tasks: ['scss']
			},
			js: {
				files: ['app_storefront_richUI/cartridge/js/**/*.js'],
				tasks: ['browserify:watch']
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
		browserify: {
			dist: {
				files: {
					'app_storefront_richUI/cartridge/static/default/js/app.js': 'app_storefront_richUI/cartridge/js/app.js'
				},
			},
			watch: {
				files: {
					'app_storefront_richUI/cartridge/static/default/js/app.js': 'app_storefront_richUI/cartridge/js/app.js'
				},
				options: {
					watch: true
				}
			}
		},
		jscs: {
			src: '**/*.js',
			options: {
				config: './.jscsrc'
			}
		}
	});

	grunt.registerTask('scss', ['sass', 'autoprefixer']);
	grunt.registerTask('default', ['scss', 'browserify:dist', 'watch']);
	grunt.registerTask('js', ['browserify:dist']);
}
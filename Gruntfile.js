'use strict';

module.exports = function (grunt) {
	require('load-grunt-tasks')(grunt);

	// command line arguments
	var config = {};
	// mocha ui tests
	config.suite = grunt.option('suite') || '*';
	if (config.suite === 'all') { config.suite === '*'; }
	config.reporter = grunt.option('reporter') || 'spec';
	config.timeout = grunt.option('timeout') || 10000;
	config.port = grunt.option('port') || 7000;

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
				}
			},
			watch: {
				files: {
					'app_storefront_richUI/cartridge/static/default/js/app.js': 'app_storefront_richUI/cartridge/js/app.js'
				},
				options: {
					watch: true
				}
			},
			test: {
				files: [{
					expand: true,
					cwd: 'test/unit/browser/',
					src: ['*.js', '!*.out.js'],
					dest: 'test/unit/browser/dist'
				}]
			}
		},
		connect: {
			test: {
				options: {
					port: config.port,
					base: 'test/unit/browser'
				}
			}
		},
		jscs: {
			src: '**/*.js',
			options: {
				config: './.jscsrc'
			}
		},
		jshint: {
			options: {
				reporter: require('jshint-stylish'),
				jshintrc: true
			},
			target: ['app_storefront_richUI/cartridge/js/**/*.js']
		},
		mochaTest: {
			ui: {
				options: {
					reporter: config.reporter,
					timeout: config.timeout
				},
				src: ['test/ui/' + config.suite + '/**/*.js', '!test/ui/webdriver/*']
			},
			unit: {
				options: {
					reporter: config.reporter,
					timeout: config.timeout
				},
				src: ['test/unit/' + config.suite + '/**/*.js', '!test/unit/browser/**/*', '!test/unit/webdriver/*']
			}
		}
	});

	grunt.registerTask('css', ['sass', 'autoprefixer']);
	grunt.registerTask('default', ['css', 'browserify:dist', 'watch']);
	grunt.registerTask('js', ['browserify:dist']);
	grunt.registerTask('test:ui', ['mochaTest:ui']);
	grunt.registerTask('test:unit', ['browserify:test', 'connect:test', 'mochaTest:unit'])
}

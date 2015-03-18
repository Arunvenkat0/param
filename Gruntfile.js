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

	var paths = require('./package.json').paths;

	grunt.initConfig({
		watch: {
			dev: {
				files: paths.css.map(function (path) {
					return path.src + '*.scss';
				}),
				tasks: ['css:dev']
			},
			styleguide: {
				files: paths.css.map(function (path) {
					return path.src + '*.scss';
				}).push('styleguide/scss/*.scss'),
				tasks: ['css:styleguide']
			}
		},
		sass: {
			dev: {
				options: {
					style: 'expanded',
					sourcemap: true
				},
				files: paths.css.map(function (path) {
					return {src: path.src + 'style.scss', dest: path.dest + 'style.css'}
				})
			},
			styleguide: {
				files: [{
					'styleguide/dist/main.css': 'styleguide/scss/main.scss'
				}]
			}
		},
		autoprefixer: {
			dev: {
				files: paths.css.map(function (path) {
					return {src: path.dest + 'style.css', dest: path.dest + 'style.css'}
				})
			},
			styleguide: {
				files: [{
					'styleguide/dist/main.css': 'styleguide/dist/main.css'
				}]
			}
		},
		browserify: {
			dev: {
				files: [{
					src: paths.js.src + 'app.js',
					dest: paths.js.dest + 'app.js'
				}]
			},
			watch_dev: {
				files: [{
					src: paths.js.src + 'app.js',
					dest: paths.js.dest + 'app.js'
				}],
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
			},
			styleguide: {
				files: [{
					src: 'styleguide/js/main.js',
					dest: 'styleguide/dist/main.js'
				}],
				options: {
					transform: ['hbsfy']
				}
			},
			watch_styleguide: {
				files: [{
					src: 'styleguide/js/main.js',
					dest: 'styleguide/dist/main.js'
				}],
				options: {
					transform: ['hbsfy'],
					watch: true
				}
			}
		},
		connect: {
			test: {
				options: {
					port: config.port,
					base: 'test/unit/browser'
				}
			},
			styleguide: {
				options: {
					port: grunt.option('port') || 8000,
					base: 'styleguide'
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
			application: {
				options: {
					reporter: config.reporter,
					timeout: config.timeout
				},
				src: ['test/application/' + config.suite + '/**/*.js', '!test/application/webdriver/*']
			},
			unit: {
				options: {
					reporter: config.reporter,
					timeout: config.timeout
				},
				src: ['test/unit/' + config.suite + '/**/*.js', '!test/unit/browser/**/*', '!test/unit/webdriver/*']
			}
		},
		'gh-pages': {
			styleguide: {
				src: ['dist/**', 'index.html', 'lib/**/*'],
				options: {
					base: 'styleguide',
					clone: 'styleguide/.tmp',
					message: 'Update ' + new Date().toISOString(),
					repo: require('./styleguide/deploy.json').options.remoteUrl
				}
			}
		}
	});

	grunt.registerTask('css:dev', ['sass:dev', 'autoprefixer:dev']);
	grunt.registerTask('css:styleguide', ['sass:styleguide', 'autoprefixer:styleguide']);
	grunt.registerTask('default', ['css:dev', 'browserify:watch_dev', 'watch:dev']);
	grunt.registerTask('js', ['browserify:dev']);
	grunt.registerTask('test:application', ['mochaTest:application']);
	grunt.registerTask('test:unit', ['browserify:test', 'connect:test', 'mochaTest:unit']);
	grunt.registerTask('styleguide', ['css:styleguide', 'browserify:watch_styleguide', 'connect:styleguide', 'watch:styleguide']);
	grunt.registerTask('deploy:styleguide', ['css:styleguide', 'browserify:styleguide', 'gh-pages:styleguide']);
}

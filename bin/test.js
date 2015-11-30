#!/usr/bin/env node

'use strict';

/* jshint mocha:false */

var spawn = require('child_process').spawn;
var minimist = require('minimist');
var argv = minimist(process.argv.slice(2));
var folder = '*';

if (argv.suite) {
	folder = argv.suite;
	if (folder === 'all') {
		folder = '*';
	}
}

if (!argv.type) {
	console.error('Please specify a test type (either \'unit\' or \'application\')');
	process.exit(1);
}

switch (argv.type) {
	case 'application':
		if (!argv.timeout) {
			argv.timeout = 60000;
		}
		break;
}

var args = [
	'test/' + argv.type + '/' + folder + '/**/*.js',
	'--compilers',
	'js:babel-core/register',
	'--reporter',
	'spec'
];

var opts = ['timeout', 'client', 'url', 'host', 'port'];

opts.forEach(function (opt) {
	if (argv[opt]) {
		args.push('--' + opt);
		args.push(argv[opt]);
	}
});

var mocha = spawn('mocha', args, {stdio: 'inherit'});

mocha.on('close', function (code) {
	process.exit(code);
});


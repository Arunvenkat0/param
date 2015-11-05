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

var type = argv.type;
var timeout = argv.timeout;

switch (type) {
	case 'application':
		if (!timeout) {
			timeout = 60000;
		}
		break;
}

var args = [
	'test/' + type + '/' + folder + '/**/*.js',
	'--compilers',
	'js:babel-core/register',
	'--reporter',
	'spec'
];

if (timeout) {
	args.push('--timeout');
	args.push(timeout);
}

spawn('mocha', args, {stdio: 'inherit'});


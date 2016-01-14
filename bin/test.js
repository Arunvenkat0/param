#!/usr/bin/env node

'use strict';

var fs = require('fs');
var spawn = require('child_process').spawn;
var minimist = require('minimist');
var argv = minimist(process.argv.slice(2));
var reporter = argv.reporter || 'spec';
var args = [
	'test/unit/**/*.js',
	'--compilers',
	'js:babel-core/register',
	'--reporter',
	reporter
];

if (argv.timeout) {
	args.push('--timeout');
	args.push(argv.timeout);
}

var stdio = reporter === 'xunit' ? [process.stdin, 'pipe', process.stderr] : 'inherit';

var mochaProcess = spawn('mocha', args, {stdio: stdio});

mochaProcess.on('close', function (code) {
	process.exit(code);
});

// write to reports
if (reporter === 'xunit') {
	mochaProcess.stdout.pipe(fs.createWriteStream('test/reports/UNIT.xunit.' + new Date().getTime() + '.xml'));
}

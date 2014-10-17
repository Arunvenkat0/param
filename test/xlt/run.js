#!/usr/bin/env node

'use strict';

var browserify = require('browserify');
var remapify = require('remapify');
var fs = require('fs');
var path = require('path');
var argv = require('minimist')(process.argv.slice(2));
var b, suite;

var aliasify = require('aliasify').configure({
	aliases: {
		'webdriver': './webdriver.js',
		'globalData': './data.json'
	},
	configDir: __dirname
});

if (argv.suite) {
	suite = argv.suite;
}

var testDir = __dirname + '/TESTS/SiteGenesis/PUBLIC/smoketest/' + suite;

b = browserify(testDir, {
	debug: true
});
b.plugin(remapify, [
	{
		src: '**/*.js',
		expose: 'A_common',
		cwd: __dirname + '/A_common'
	}, {
		src: '**/*.js',
		expose: 'app',
		cwd: __dirname + '/app'
	}
]);

b.external('webdriverio');

b.transform(aliasify);
b.bundle().pipe(fs.createWriteStream(__dirname + '/out.js'));

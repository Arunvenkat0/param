#!/usr/bin/env node

'use strict';

var browserify = require('browserify');
var remapify = require('remapify');
var fs = require('fs');
var b = browserify(__dirname + '/TESTS/SiteGenesis/PUBLIC/smoketest/cart');

var aliasify = require('aliasify').configure({
	aliases: {
		'webdriver': './webdriver.js',
		'globalData': './data.json'
	},
	configDir: __dirname
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

b.transform(aliasify);
b.bundle();

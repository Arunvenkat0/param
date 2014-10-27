var assert = require('chai').assert;
var client = require('./browser/client');
var config = require('./browser/config');
var Promise = require('promise');

var waitForExist = Promise.denodeify(client.waitForExist.bind(client));
var click = Promise.denodeify(client.click.bind(client));

describe('click tests', function () {
	before(function (done) {
		client.init().url(config.url, done);
	});
	it('wait for login', function () {
		return waitForExist('.user-login').then(function (res) {
			assert.ok(true);
		});

	});
	it('click login', function () {
		return click('.user-login').then(function (res) {
			assert.ok(true);
		});
	});
	after(function (done) {
		client.end();
		done();
	});
});

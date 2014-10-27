var assert = require('chai').assert;
var client = require('./webdriver/client');
var config = require('./webdriver/config');

describe('click tests', function () {
	before(function (done) {
		client.init().url(config.url, done);
	});
	it('wait for login', function () {
		return client.waitForExist('.user-login').then(function (res) {
			assert.ok(true);
		});

	});
	it('click login', function () {
		return client.click('.user-login').then(function (res) {
			assert.ok(true);
		});
	});
	after(function (done) {
		client.end();
		done();
	});
});

var assert = require('chai').assert;
var client = require('./browser/client');
var config = require('./browser/config');

describe('click tests', function () {
	before(function (done) {
		client.init().url(config.url, done);
	});
	it('wait for login', function (done) {
		client.waitForExist('.user-login', function (err, res) {
			assert.ok(true);
			done();
		});

	});
	it('click login', function (done) {
		client.click('.user-login', function (err, res) {
			assert.ok(true);
			done();
		});
	});
	after(function (done) {
		client.end();
		done();
	});
});

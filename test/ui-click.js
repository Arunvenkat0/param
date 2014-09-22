var assert = require('assert');
var client = require('./browser/client');

describe('click tests', function () {
	before(function (done) {
		client.init().url('http://dev10-sitegenesis-dw.demandware.net/on/demandware.store/Sites-SiteGenesis-Site', done);
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

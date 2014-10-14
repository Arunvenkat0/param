var assert = require('chai').assert;
var Promise = require('promise');
var client = require('./browser/client');
var waitForExist = Promise.denodeify(client.waitForExist.bind(client));

module.exports = function () {
	describe('subtest', function () {
		it('wait for login', function () {
			return waitForExist('.user-login').then(function (res) {
				assert.ok(true);
			});
		});
	});
};

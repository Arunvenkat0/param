var assert = require('chai').assert;
var client = require('./browser/client');
var config = require('./browser/config');

describe('navigation menu', function () {
	before(function (done) {
		client.init().url(config.url, done);
	});
	it('check navigation menu', function (done) {
		client.getAttribute('#navigation .menu-category .level-1', 'innerHTML', function (err, res) {
			assert.deepEqual(res, [
				'New Arrivals',
				'Womens',
				'Mens',
				'Electronics',
				'Gift Certificates',
				'Top Seller'
			]);
			done();
		});
	});
	after(function (done) {
		client.end();
		done();
	});
});

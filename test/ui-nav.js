var assert = require('chai').assert;
var client = require('./browser/client');
var config = require('./browser/config');
var Promise = require('promise');

var getAttribute = Promise.denodeify(client.getAttribute.bind(client));

describe('navigation menu', function () {
	before(function (done) {
		client.init().url(config.url, done);
	});
	it('check navigation menu', function () {
		return getAttribute('#navigation .menu-category .level-1', 'innerHTML').then(function (array) {
			assert.deepEqual(array, [
				'New Arrivals',
				'Womens',
				'Mens',
				'Electronics',
				'Gift Certificates',
				'Top Seller'
			]);
		});
	});
	after(function (done) {
		client.end();
		done();
	});
});

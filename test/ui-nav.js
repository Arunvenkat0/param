var assert = require('chai').assert;
var client = require('./browser/client');
var config = require('./browser/config');
var Promise = require('promise');

var getAttribute = Promise.denodeify(client.getAttribute.bind(client));
var elements = Promise.denodeify(client.elements.bind(client));

describe('navigation menu', function () {
	before(function (done) {
		client.init().url(config.url, done);
	});
	it('menu items length', function () {
		return elements('#navigation .menu-category > li').then(function (res) {
			assert.ok(res.value.length, 6);
		});
	});

	it('check menu items', function () {
		return getAttribute('#navigation .menu-category > li > a', 'innerHTML').then(function (array) {
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

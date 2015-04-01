var assert = require('chai').assert;
var client = require('../webdriver/client');
var config = require('../webdriver/config');

describe('Product Details Page - single item', function () {
	before(function (done) {
		client.init().url(config.url + '/home', done);
	});
	it('- Product Details for Modern Blazer', function (done) {
		client
			.waitForExist('form[role="search"]')
			.setValue('#q', 'modern')
			.submitForm('form[role="search"]')
			.waitForExist('#search-result-items', function (err) {
				assert.equal(err, undefined);
			})
			.click('[title$="Modern Blazer"]')

			.getText('h1.product-name', function (err, title) {
				assert.equal(err, undefined);
				assert.equal(title, 'Modern Blazer', 'The Product Name should equal Modern Blazer');
			})
			.isExisting('.primary-image', function (err, exists) {
				assert.equal(err, undefined);
				assert.equal(exists, true, 'The Primary img element should exist');
			})
			.isExisting('span.price-sales', function (err, exists) {
				assert.equal(err, undefined);
				assert.equal(exists, true, 'The Item Price element should exist');
			})
			.getText('#product-content > .product-price .price-sales', function (err, price) {
				assert.equal(err, undefined);
				assert.equal(price, '$495.00', 'The price is right');
			})
			.isExisting('#Quantity', function (err, exists) {
					assert.equal(err, undefined);
					assert.equal(exists, true, 'The Quantity input should exist');
			})
			.getAttribute('#Quantity', 'size', function (err, exists) {
				assert.equal(err, undefined);
				assert.equal(exists, '2', 'The attribute size is 2');
			})
			.isEnabled('#add-to-cart', function (err, enabled) {
				assert.equal(err, undefined);
				assert.notOk(enabled, 'Add to Cart button is disabled');
			})

			.call(done);
	});
	after(function (done) {
		client.end(done);
	});
});

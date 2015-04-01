var assert = require('chai').assert;
var client = require('../webdriver/client');
var config = require('../webdriver/config');

describe('Product Details Page - Set', function () {
	before(function (done) {
		client.init().url(config.url + '/home', done);
	});
	it('- Product Details for Set', function (done) {
		client
			.waitForExist('form[role="search"]')
			.setValue('#q', 'look')
			.submitForm('form[role="search"]')
			.waitForExist('#search-result-items', function (err) {
				assert.equal(err, undefined);
			})
			.click('[title$="Fall Look"]')

			.getText('#pdpMain > h1.product-name', function (err, title) {
				assert.equal(err, undefined);
				assert.equal(title, 'Fall Look', 'The Product Name should equal Fall Look');
			})
			.isExisting('.primary-image', function (err, exists) {
				assert.equal(err, undefined);
				assert.equal(exists, true, 'The Primary img element should exist');
			})
			.getText('#item-013742003314 .item-name', function (err, title) {
				assert.equal(err, undefined);
				assert.equal(title, 'Pink and Gold Necklace', 'The Product Name should equal Pink and Gold Necklace');
			})
			.getText('#item-701644033668 .item-name', function (err, title) {
				assert.equal(err, undefined);
				assert.equal(title, 'Floral Tunic', 'The Product Name should equal Floral Tunic');
			})
			.getText('#item-701644607197 .item-name', function (err, title) {
				assert.equal(err, undefined);
				assert.equal(title, 'Straight Leg Pant.', 'The Product Name should equal Straight Leg Pant');
			})
			.getText('.product-col-2.product-set > .product-price .salesprice', function (err, price) {
				assert.equal(err, undefined);
				assert.equal(price, '$204.00', 'The price is right');
			})
			.isEnabled('.add-all-to-cart', function (err, enabled) {
				assert.equal(err, undefined);
				assert.ok(enabled, 'Add All to Cart button is enabled');
			})

			.call(done);
	});
	after(function (done) {
		client.end(done);
	});
});

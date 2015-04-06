var assert = require('chai').assert;
var client = require('../webdriver/client');
var config = require('../webdriver/config');

describe('Product Details Page - Bundle', function () {
	before(function (done) {
		client.init().url(config.url + '/home', done);
	});
	it('- Product Details for Bundle', function (done) {
		client
			.waitForExist('form[role="search"]')
			.setValue('#q', 'bundle')
			.submitForm('form[role="search"]')
			.waitForExist('#search-result-items', function (err) {
				assert.equal(err, undefined);
			})
			.click('[title$="Playstation 3 Bundle"]')

			.getText('#pdpMain > h1.product-name', function (err, title) {
				assert.equal(err, undefined);
				assert.equal(title, 'Playstation 3 Bundle', 'The Product Name should equal Playstation 3 Bundle');
			})
			.isExisting('.primary-image', function (err, exists) {
				assert.equal(err, undefined);
				assert.equal(exists, true, 'The Primary img element should exist');
			})
			.isExisting('#item-sony-ps3-console', function (err, exists) {
				assert.equal(err, undefined);
				assert.equal(exists, true, 'The bundle item PS3-console element should exist');
			})
			.isExisting('#item-easports-nascar-09-ps3', function (err, exists) {
				assert.equal(err, undefined);
				assert.equal(exists, true, 'The bundle item Nascar element should exist');
			})
			.isExisting('#item-easports-monopoly-ps3', function (err, exists) {
				assert.equal(err, undefined);
				assert.equal(exists, true, 'The bundle item Monopoly element should exist');
			})
			.isExisting('#item-namco-eternal-sonata-ps3', function (err, exists) {
				assert.equal(err, undefined);
				assert.equal(exists, true, 'The bundle item Eternal Sonata element should exist');
			})
			.isExisting('#item-sony-warhawk-ps3', function (err, exists) {
				assert.equal(err, undefined);
				assert.equal(exists, true, 'The bundle item Warhawk element should exist');
			})
			.isExisting('span.price-sales', function (err, exists) {
				assert.equal(err, undefined);
				assert.equal(exists, true, 'The Item Price element should exist');
			})
			.getText('.product-col-2.product-set > .product-price .price-sales', function (err, price) {
				assert.equal(err, undefined);
				assert.equal(price, '$449.00', 'The price is right');
			})
			.isExisting('#dwopt_sony-ps3-bundle_consoleWarranty', function (err, exists) {
				assert.equal(err, undefined);
				assert.equal(exists, true, 'The Extended Warranty element should exist');
			})
			.isEnabled('#add-to-cart', function (err, enabled) {
				assert.equal(err, undefined);
				assert.ok(enabled, 'Add to Cart button is enabled');
			})

			.call(done);
	});
	after(function (done) {
		client.end(done);
	});
});

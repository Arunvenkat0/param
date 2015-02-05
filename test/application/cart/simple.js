var assert = require('chai').assert;
var client = require('../webdriver/client');
var config = require('../webdriver/config');

describe('Cart - Simple', function () {
	before(function (done) {
		client.init(done);
	});
	it('should show product in cart', function (done) {
		client
			// go directly to product page for Straight Leg Trousers
			.url(config.url + '/mens/clothing/pants/82916781.html?dwvar_82916781_color=BDA')
			.waitForExist('.product-variations')
			.click('.swatches.size li:nth-child(2) a')
			.pause(500)
			.isEnabled('#add-to-cart', function (err, enabled) {
				assert.equal(err, undefined);
				assert.ok(enabled, 'Add to Cart button is not enabled');
			})
			.click('#add-to-cart', function (err) {
				assert.equal(err, undefined);
			})
			.url(config.url + '/cart')
			.elements('.item-list .cart-row', function (err, results) {
				assert.equal(err, undefined);
				assert(results.value.length === 1, 'cart contains 1 product')
			})
			.getText('.cart-row:nth-child(1) .name', function (err, title) {
				assert.equal(err, undefined);
				assert.equal(title, 'Straight Leg Trousers');
			})
			.getText('.cart-row:nth-child(1) .attribute[data-attribute="color"] .value', function (err, color) {
				assert.equal(err, undefined);
				assert.equal(color, 'Black');
			})
			.getText('.cart-row:nth-child(1) .attribute[data-attribute="size"] .value', function (err, size) {
				assert.equal(err, undefined);
				assert.equal(size, '29');
			})
			.call(done);
	});
	after(function (done) {
		client.end(done);
	});
});

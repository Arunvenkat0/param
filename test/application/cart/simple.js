var assert = require('chai').assert;
var client = require('../webdriver/client');
var config = require('../webdriver/config');

describe('Cart - Simple', function () {
	beforeEach(function (done) {
		client.init()
			// go directly to product page for Straight Leg Trousers
			.url(config.url + '/mens/clothing/pants/82916781.html?dwvar_82916781_color=BDA')
			.waitForExist('.product-variations')
			.click('.swatches.size li:nth-child(2) a')
			.pause(500)
			.isEnabled('#add-to-cart', function (err, enabled) {
				assert.equal(err, undefined);
				assert.ok(enabled, 'Add to Cart button is not enabled');
			})
			.click('#add-to-cart')
			.url(config.url + '/cart')
			.call(done);
	});
	it('should show product in cart', function (done) {
		client
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

	it('should remove product from cart', function (done) {
		client
			.click('.cart-row:nth-child(1) .item-user-actions button[value="Remove"]', function (err) {
				assert.equal(err, undefined);
			})
			.isExisting('.cart-empty', function (err, exists) {
				assert.equal(err, undefined);
				assert.ok(exists, 'item is removed from cart');
			})
			.call(done);
	});

	it('should update quantity in cart', function (done) {
		client
			.setValue('.cart-row:nth-child(1) .item-quantity input', 3)
			.click('.cart-footer button[name$="_updateCart"]')
			.getValue('.cart-row:nth-child(1) .item-quantity input', function (err, qty) {
				assert.equal(err, undefined);
				assert.equal(qty, 3, 'quantity updated')
			})
			.getText('.cart-row:nth-child(1) .item-total .price-total', function (err, price) {
				assert.equal(err, undefined);
				assert.equal(price, '$675.00', 'price updated')
			})
			.call(done);
	});

	it('should change size', function (done) {
		client
			.click('.cart-row:nth-child(1) .item-details .item-edit-details a')
			.waitForExist('.ui-dialog')
			.click('.ui-dialog .product-variations .swatches.size li:nth-child(5) a')
			.pause(500)
			.click('.ui-dialog #add-to-cart')
			// wait for the page to refresh, which happens after a 500 timeout by default
			.pause(1500)
			.getText('.cart-row:nth-child(1) .attribute[data-attribute="size"] .value', function (err, size) {
				assert.equal(err, undefined);
				assert.equal(size, '32');
			})
			.call(done);
	})

	afterEach(function (done) {
		client.end(done);
	});
});

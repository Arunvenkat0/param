'use strict';

var BaseClass = require('./Base');
var assert = require('chai').assert;

const CSS_ADD_TO_CART = '#add-to-cart';


class ProductDetailPage extends BaseClass {
	constructor (client) {
		super(client);
	}

	addToCart (pdpUrl) {
		return this
			.navigateTo(pdpUrl)
			.waitForExist('.product-variations')
			.click('.swatches.size li:nth-child(2) a')
			.pause(500)
			.isEnabled(CSS_ADD_TO_CART, function (err, enabled) {
				assert.equal(err, undefined);
				assert.ok(enabled, 'Add to Cart button is not enabled');
			})
			.click(CSS_ADD_TO_CART);
	}
}


module.exports = ProductDetailPage;

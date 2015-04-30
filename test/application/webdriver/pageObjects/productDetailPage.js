'use strict';

var BaseClass = require('./BaseClass');
var assert = require('chai').assert;


class ProductDetailPage extends BaseClass {
	constructor (client) {
		super(client);
	}

	navigateTo (urlPath) {
		return this.client.url(urlPath);
	}

	addToCart (pdpUrl) {
		return this
			.navigateTo(pdpUrl)
			.waitForExist('.product-variations')
			.click('.swatches.size li:nth-child(2) a')
			.pause(500)
			.isEnabled('#add-to-cart', function (err, enabled) {
				assert.equal(err, undefined);
				assert.ok(enabled, 'Add to Cart button is not enabled');
			})
			.click('#add-to-cart');
	}
}


module.exports = ProductDetailPage;

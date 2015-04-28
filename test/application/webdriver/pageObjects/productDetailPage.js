'use strict';

var assert = require('chai').assert;


function ProductDetailPage (client) {
	this.client = client;
}

ProductDetailPage.prototype.navigateTo = function (urlPath) {
	return this.client.url(urlPath);
};

ProductDetailPage.prototype.addToCart = function (pdpUrl) {
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
};


module.exports = ProductDetailPage;

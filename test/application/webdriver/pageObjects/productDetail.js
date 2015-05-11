'use strict';

var BaseClass = require('./Base');
var assert = require('chai').assert;



class ProductDetailPage extends BaseClass {
	constructor (client, loggingLevel) {
		super(client, loggingLevel);

		this.btnAddToCart = '#add-to-cart';
		this.inputQuantity = '#Quantity';
	}

	isAddToCartEnabled () {
		return this.client.isEnabled(this.btnAddToCart)
			.then(function (enabled) {
				assert.ok(enabled);
			});
	}

	selectColorByIndex (idx) {
		this.client.click('.swatches.color li:nth-child(' + idx + ') a');
	}

	selectSizeByIndex (idx) {
		this.client.click('.swatches.size li:nth-child(' + idx + ') a');
		return this.client.pause(500);
	}

	setQuantity (value) {
		return this.client.setValue(this.inputQuantity, value);
	}

	pressBtnAddToCart () {
		return this.client.click(this.btnAddToCart);
	}

	/**
	 * Adds a Product Variation to the Cart
	 *
	 * @param {Map} product Product Map comprised of the following:
	 * @param {String} product.resourcePath - Product Detail Page URL resource path
	 * @param {Number} [product.colorIndex] - If product variations with Color,
	 *     this represents the index value for the color options
	 * @param {number} [product.sizeIndex]  - If product variations with Size,
	 *     this represents the index value for the size options
	 */
	addProductVariationToCart (product) {
		this.navigateTo(product.get('resourcePath'));

		// The order of these two conditionals is important, as the selection
		// of the Color value drives the available Size options (if available).
		if (product.has('colorIndex')) {
			this.selectColorByIndex(product.get('colorIndex'));
		}
		if (product.has('sizeIndex')) {
			this.selectSizeByIndex(product.get('sizeIndex'));
		}

		this.isAddToCartEnabled();
		this.pressBtnAddToCart();

		return this.client;
	}
}


module.exports = ProductDetailPage;

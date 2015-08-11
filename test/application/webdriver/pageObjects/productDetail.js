'use strict';

import client from '../client';

export const PDP_MAIN = '.pdp-main';
const BTN_ADD_TO_CART = '#add-to-cart';
const MINI_CART = '.mini-cart-content';


function selectAttributeByIndex (attributeName, index) {
	let selector = '.swatches.' + attributeName + ' li:nth-child(' + index + ') a';
	return client.waitForVisible(selector)
		.click(selector)
		.waitForText('.swatches.' + attributeName + ' .selected-value');
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
export function addProductVariationToCart (product) {
	return client.url(product.get('resourcePath'))
		// The order of setting the attributes is important, as the selection
		// of the Color value enables Size options if available.
		.then(() => {
			if (product.has('colorIndex')) {
				return selectAttributeByIndex('color', product.get('colorIndex'));
			} else {
				return Promise.resolve();
			}
		})
		.then(() => {
			if (product.has('sizeIndex')) {
				return selectAttributeByIndex('size', product.get('sizeIndex'));
			} else {
				return Promise.resolve();
			}
		})
		.then(() => {
			if (product.has('widthIndex')) {
				return selectAttributeByIndex('width', product.get('widthIndex'));
			} else {
				return Promise.resolve();
			}
		})
		.then(() => client.waitForVisible(BTN_ADD_TO_CART)
			.waitForEnabled(BTN_ADD_TO_CART)
			.click(BTN_ADD_TO_CART)
			.waitForVisible(MINI_CART));
}

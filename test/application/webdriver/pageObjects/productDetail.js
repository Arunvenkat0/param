'use strict';

import client from '../client';
import config from '../config';

export const BTN_ADD_TO_CART = '#add-to-cart';
export const INPUT_QUANTITY = '#Quantity';

export function navigateTo (path) {
	return client.url(config.url + path);
}

export function selectColorByIndex (idx) {
	return client.click('.swatches.color li:nth-child(' + idx + ') a')
		.pause(500);
}

export function selectSizeByIndex (idx) {
	return client.click('.swatches.size li:nth-child(' + idx + ') a')
		.pause(500);
}

export function selectWidthByIndex (idx) {
	return client.click('.swatches.width li:nth-child(' + idx + ') a')
		.pause(500);
}

export function setQuantity (value) {
	return client.setValue(INPUT_QUANTITY, value);
}

export function pressBtnAddToCart () {
	return client.click(BTN_ADD_TO_CART);
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
	navigateTo(product.get('resourcePath'));

	// The order of these two conditionals is important, as the selection
	// of the Color value drives the available Size options (if available).
	if (product.has('colorIndex')) {
		selectColorByIndex(product.get('colorIndex'));
	}
	if (product.has('sizeIndex')) {
		selectSizeByIndex(product.get('sizeIndex'));
	}
	if (product.has('widthIndex')) {
		selectWidthByIndex(product.get('widthIndex'));
	}

	pressBtnAddToCart();

	return client;
}

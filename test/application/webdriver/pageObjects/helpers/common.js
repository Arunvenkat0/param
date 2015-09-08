'use strict';

import client from '../../client';
// using Q to be compliant with webdriver.
// should switch to native Promise if it is used in webdriver v3
// https://github.com/webdriverio/webdriverio/issues/498
import Q from 'q';

// commonly used selectors
export const PRIMARY_H1 = '#primary h1';
export const BREADCRUMB_A = '.breadcrumb a';
export const LAST_BREADCRUMB = '.breadcrumb-element:last-of-type';


export function getPageTitle() {
	return Q.Promise(resolve => {
		client.getTitle()
			.then(title => resolve(title.split('|')[0].trim()));
	});
}

export function checkElementEquals (selector, value) {
	return client.getText(selector)
		.then(text => text === value);
}

export function removeItems (removeLink) {
	let promises = [];

	return client.elements(removeLink)
		.then(removeLinks => {
			// Because each Remove link results in a page reload,
			// it is necessary to wait for one remove operation
			// to complete before clicking on the next Remove
			// link
			if (!removeLinks.value.length) {
				return Promise.resolve();
			}
			removeLinks.value.forEach(() => promises.push(_clickFirstRemoveLink(removeLink)));
		})
		.then(() => Promise.all(promises));
}

export function clickCheckbox(selector) {
	return client.click(selector)
		.isSelected(selector)
		.then(selected => {
			if (!selected) {
				return client.click(selector);
			}
			return Promise.resolve();
		});
}

export function selectAttributeByIndex (attributeName, index) {
	let selector = '.swatches.' + attributeName + ' li:nth-child(' + index + ') a';
	return client.waitForVisible(selector)
		.click(selector)
		.waitForText('.swatches.' + attributeName + ' .selected-value');
}
/**
 * Adds a Product Variation to a Basket
 *
 * @param {Map} product Product Map comprised of the following:
 * @param {String} product.resourcePath - Product Detail Page URL resource path
 * @param {Number} [product.colorIndex] - If product variations with Color,
 *     this represents the index value for the color options
 * @param {number} [product.sizeIndex]  - If product variations with Size,
 *     this represents the index value for the size options
 * @param {String} btnAdd - selector for Add to { Cart | Wishlist | Registry } button
 */
export function addProductVariationToBasket (product, btnAdd) {
	return client.url(product.get('resourcePath'))
		// The order of setting the attributes is important, as the selection
		// of the Color value enables Size options if available.
		.then(() => {
			if (product.has('colorIndex')) {
				return selectAttributeByIndex('color', product.get('colorIndex'));
			}
			return Promise.resolve();
		})
		.then(() => {
			if (product.has('sizeIndex')) {
				return selectAttributeByIndex('size', product.get('sizeIndex'));
			}
			return Promise.resolve();
		})
		.then(() => {
			if (product.has('widthIndex')) {
				return selectAttributeByIndex('width', product.get('widthIndex'));
			}
			return Promise.resolve();
		})
		.then(() => client.waitForVisible(btnAdd)
			.waitForEnabled(btnAdd)
			.click(btnAdd));
}

/**
 * Clicks the first Remove link in a Cart or WishList
 *
 */
function _clickFirstRemoveLink (removeLink) {
	return client.elements(removeLink)
		.then(removeLinks => {
			if (removeLinks.value.length) {
				return client.elementIdClick(removeLinks.value[0].ELEMENT);
			}
			return Promise.resolve();
		});
}
	/**
	 * Clicks on an selector and wait for the page to reload
 	 * @param selectorToClick
	 * @param selectorToWait
	 * @returns {*|Promise.<T>}
	 */
export function clickAndWait(selectorToClick, selectorToWait) {
	return client.click(selectorToClick)
		.waitForVisible(selectorToWait);
	}


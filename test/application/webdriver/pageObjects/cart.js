'use strict';

import client from '../client';
import config from '../config';

export const CSS_CART_EMPTY = '.cart-empty';
export const CSS_CART_ROW = '.cart-row';
export const CSS_ORDER_SUBTOTAL = '.order-subtotal td:nth-child(2)';
export const BTN_UPDATE_CART = '.cart-footer button[name$="_updateCart"]';
export const BTN_CHECKOUT = 'button[name$="checkoutCart"]';

const basePath = '/cart';

// Pseudo private methods
function _createCssNthCartRow (idx) {
	return CSS_CART_ROW + ':nth-child(' + idx + ')';
}

function _createCssUpdateQtyInput (idx) {
	return [_createCssNthCartRow(idx), '.item-quantity input'].join(' ');
}

// Public methods
export function navigateTo (path = basePath) {
	return client.url(config.url + path);
}

export function removeItemByRow (rowNum) {
	var linkRemoveItem = _createCssNthCartRow(rowNum) + ' .item-user-actions button[value="Remove"]';
	return client.click(linkRemoveItem);
}

export function verifyCartEmpty () {
	return client.isExisting(CSS_CART_EMPTY);
}

export function getItemList () {
	return client
		.waitForExist('.item-list ' + CSS_CART_ROW)
		.elements('.item-list ' + CSS_CART_ROW);
}

export function getItemNameByRow (rowNum) {
	return client.getText(_createCssNthCartRow(rowNum) + ' .name');
}

export function getItemAttrByRow (rowNum, attr) {
	var itemAttr = _createCssNthCartRow(rowNum) + ' .attribute[data-attribute="' + attr + '"] .value';
	return client.getText(itemAttr);
}

export function updateQuantityByRow (rowNum, value) {
	return client.setValue(_createCssUpdateQtyInput(rowNum), value)
		.click(BTN_UPDATE_CART)
		.getValue(_createCssUpdateQtyInput(rowNum));
}

export function getPriceByRow (rowNum) {
	return client.getText(_createCssNthCartRow(rowNum) + ' .item-total .price-total');
}

export function updateSizeByRow (rowNum, sizeIndex) {
	return client
		.click(_createCssNthCartRow(rowNum) + ' .item-details .item-edit-details a')
		.waitForExist('.ui-dialog')
		.click('.ui-dialog .product-variations .swatches.size li:nth-child(' + sizeIndex + ') a')
		.pause(500)
		.click('.ui-dialog #add-to-cart')
		// wait for the page to reload, which completes after about 1500 ms
		.pause(1500)
		.getText(_createCssNthCartRow(rowNum) + ' .attribute[data-attribute="size"] .value');
}

/**
 * Retrieves the Cart's Sub-total value
 *
 */
export function getOrderSubTotal () {
	return client.getText(CSS_ORDER_SUBTOTAL);
}

/**
 * Redirects the browser to the Cart page and empties the Cart.
 *
 */
export function emptyCart () {
	return navigateTo()
		.then(() => client.elements('.item-quantity input'))
		.then(items => {
			if (items.value.length) {
				items.value.forEach(item =>
					client.elementIdClear(item.ELEMENT)
						.elementIdValue(item.ELEMENT, '0'));

				return client.pause(500)
					.then(() => client.click(BTN_UPDATE_CART));
			}
		});
}

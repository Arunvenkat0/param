'use strict';

var BaseClass = require('./BaseClass');
const CART_PATH = '/cart';
const CSS_CART_ROW = '.cart-row';
const CSS_CART_EMPTY = '.cart-empty';
const CSS_BUTTON_UPDATE_CART = '.cart-footer button[name$="_updateCart"]';


class CartPage extends BaseClass {

	constructor(client) {
		super(client);
		this.basePath = CART_PATH;
	}

	// Pseudo private methods
	_createCssNthCartRow (idx) {
		return CSS_CART_ROW + ':nth-child(' + idx + ')';
	}

	_createCssUpdateQtyInput (idx) {
		return [this._createCssNthCartRow(idx), '.item-quantity input'].join(' ');
	}

	// Public methods
	removeLineItemByRow (rowNum) {
		return this.client.click(this._createCssNthCartRow(rowNum) + ' .item-user-actions button[value="Remove"]');
	}

	isCartEmpty () {
		return this.client.isExisting(CSS_CART_EMPTY);
	}

	getItemList () {
		return this.client.elements('.item-list ' + CSS_CART_ROW);
	}

	getItemNameByRow (rowNum) {
		return this.client.getText(this._createCssNthCartRow(rowNum) + ' .name');
	}

	getItemAttrByRow (rowNum, attr) {
		return this.client.getText(this._createCssNthCartRow(rowNum) + ' .attribute[data-attribute="' + attr + '"] .value');
	}

	updateQuantityByRow (rowNum, value) {
		return this.client
			.setValue(this._createCssUpdateQtyInput(rowNum), value)
			.click(CSS_BUTTON_UPDATE_CART)
			.getValue(this._createCssUpdateQtyInput(rowNum));
	}

	getPriceByRow (rowNum) {
		return this.client.getText(this._createCssNthCartRow(rowNum) + ' .item-total .price-total');
	}

	updateSizeByRow (rowNum, sizeIndex) {
		return this.client
			.click(this._createCssNthCartRow(rowNum) + ' .item-details .item-edit-details a')
			.waitForExist('.ui-dialog')
			.click('.ui-dialog .product-variations .swatches.size li:nth-child(' + sizeIndex +') a')
			.pause(500)
			.click('.ui-dialog #add-to-cart')
			// wait for the page to refresh, which happens after a 500 timeout by default
			.pause(1500)
			.getText(this._createCssNthCartRow(rowNum)+ ' .attribute[data-attribute="size"] .value');
	}
}


module.exports = CartPage;

'use strict';

var Base = require('./base');

class CartPage extends Base {
	constructor(client) {
		super(client);
		this.basePath = '/cart';

		this.cssCartEmpty = '.cart-empty';
		this.cssCartRow = '.cart-row';
		this.btnUpdateCart = '.cart-footer button[name$="_updateCart"]';
	}

	// Pseudo private methods
	_createCssNthCartRow (idx) {
		return this.cssCartRow + ':nth-child(' + idx + ')';
	}

	_createCssUpdateQtyInput (idx) {
		return [this._createCssNthCartRow(idx), '.item-quantity input'].join(' ');
	}

	// Public methods
	removeItemByRow (rowNum) {
		var linkRemoveItem = this._createCssNthCartRow(rowNum) + ' .item-user-actions button[value="Remove"]';
		return this.client.click(linkRemoveItem);
	}

	verifyCartEmpty () {
		return this.client.isExisting(this.cssCartEmpty);
	}

	getItemList () {
		return this.client
			.waitForExist('.cart-row')
			.elements('.item-list ' + this.cssCartRow);
	}

	getItemNameByRow (rowNum) {
		return this.client.getText(this._createCssNthCartRow(rowNum) + ' .name');
	}

	getItemAttrByRow (rowNum, attr) {
		var itemAttr = this._createCssNthCartRow(rowNum) + ' .attribute[data-attribute="' + attr + '"] .value';
		return this.client.getText(itemAttr);
	}

	updateQuantityByRow (rowNum, value) {
		return this.client.setValue(this._createCssUpdateQtyInput(rowNum), value)
			.click(this.btnUpdateCart)
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

'use strict';

var BaseClass = require('./BaseClass');
var CART_PATH = '/cart';


class CartPage extends BaseClass {
	constructor(client) {
		super(client);
	}

	navigateTo (host) {
		return this.client.url(host + CART_PATH);
	}

	removeLineItemByRow (rowNum) {
		return this.client.click('.cart-row:nth-child(' + rowNum + ') .item-user-actions button[value="Remove"]');
	}

	isCartEmpty (rowNum) {
		return this.client.isExisting('.cart-empty');
	}

	getLineItems () {
		return this.client.elements('.item-list .cart-row');
	}

	getLineItemNameByRow (rowNum) {
		return this.client.getText('.cart-row:nth-child(' + rowNum + ') .name');
	}

	getLineItemAttrByRow (rowNum, attr) {
		return this.client.getText('.cart-row:nth-child(' + rowNum + ') .attribute[data-attribute="' + attr + '"] .value');
	}

	updateQuantityByRow (rowNum, value) {
		return this.client
			.setValue('.cart-row:nth-child(' + rowNum + ') .item-quantity input', value)
			.click('.cart-footer button[name$="_updateCart"]')
			.getValue('.cart-row:nth-child(1) .item-quantity input');
	}

	getPriceByRow (rowNum) {
		return this.client.getText('.cart-row:nth-child(' + rowNum + ') .item-total .price-total');
	}

	updateSizeByRow (rowNum, sizeIndex) {
		return this.client
			.click('.cart-row:nth-child(' + rowNum + ') .item-details .item-edit-details a')
			.waitForExist('.ui-dialog')
			.click('.ui-dialog .product-variations .swatches.size li:nth-child(' + sizeIndex +') a')
			.pause(500)
			.click('.ui-dialog #add-to-cart')
			// wait for the page to refresh, which happens after a 500 timeout by default
			.pause(1500)
			.getText('.cart-row:nth-child(' + rowNum + ') .attribute[data-attribute="size"] .value');
	}
}


module.exports = CartPage;

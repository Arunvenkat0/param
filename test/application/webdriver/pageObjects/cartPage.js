'use strict';

var CART_PATH = '/cart';

function CartPage (client) {
	this.client = client;
}

CartPage.prototype.navigateTo = function (host) {
	return this.client.url(host + CART_PATH);
};

CartPage.prototype.removeLineItemByRow = function (rowNum) {
	return this.client.click('.cart-row:nth-child(' + rowNum + ') .item-user-actions button[value="Remove"]');
};

CartPage.prototype.isCartEmpty = function (rowNum) {
	return this.client.isExisting('.cart-empty');
};

CartPage.prototype.getLineItems = function () {
	return this.client.elements('.item-list .cart-row');
};

CartPage.prototype.getLineItemNameByRow = function (rowNum) {
	return this.client.getText('.cart-row:nth-child(' + rowNum + ') .name');
};

CartPage.prototype.getLineItemAttrByRow = function (rowNum, attr) {
	return this.client.getText('.cart-row:nth-child(' + rowNum + ') .attribute[data-attribute="' + attr + '"] .value');
};

CartPage.prototype.updateQuantityByRow = function (rowNum, value) {
	return this.client
		.setValue('.cart-row:nth-child(' + rowNum + ') .item-quantity input', value)
		.click('.cart-footer button[name$="_updateCart"]')
		.getValue('.cart-row:nth-child(1) .item-quantity input');
};

CartPage.prototype.getPriceByRow = function (rowNum) {
	return this.client.getText('.cart-row:nth-child(' + rowNum + ') .item-total .price-total');
};

CartPage.prototype.updateSizeByRow = function (rowNum, sizeIndex) {
	return this.client
		.click('.cart-row:nth-child(' + rowNum + ') .item-details .item-edit-details a')
		.waitForExist('.ui-dialog')
		.click('.ui-dialog .product-variations .swatches.size li:nth-child(' + sizeIndex +') a')
		.pause(500)
		.click('.ui-dialog #add-to-cart')
		// wait for the page to refresh, which happens after a 500 timeout by default
		.pause(1500)
		.getText('.cart-row:nth-child(' + rowNum + ') .attribute[data-attribute="size"] .value');
};


module.exports = CartPage;

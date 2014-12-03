'use strict';

var account = require('./account'),
	bonusProductsView = require('../bonus-products-view'),
	product = require('./product'),
	quickview = require('../quickview'),
	storeinventory = require('../storeinventory');

/**
 * @private
 * @function
 * @description Binds events to the cart page (edit item's details, bonus item's actions, coupon code entry)
 */
function initializeEvents() {
	$('#cart-table').on('click', '.item-edit-details a', function (e) {
		e.preventDefault();
		quickview.show({
			url: e.target.href,
			source: 'cart'
		});
	})
	.on('click', '.bonus-item-actions a', function (e) {
		e.preventDefault();
		bonusProductsView.show(this.href);
	});

	// override enter key for coupon code entry
	$('form input[name$="_couponCode"]').on('keydown', function (e) {
		if (e.which === 13 && $(this).val().length === 0) { return false; }
	});
}

exports.init = function () {
	initializeEvents();
	if (SitePreferences.STORE_PICKUP) {
		storeinventory.init();
	}
	account.initCartLogin();
};

'use strict';

var account = require('./account'),
	bonusProductsView = require('../bonus-products-view'),
	page = require('../page'),
	quickview = require('../quickview'),
	storeinventory = require('../storeinventory'),
	util = require('../util');

/**
 * @private
 * @function
 * @description Binds events to the cart page (edit item's details, bonus item's actions, coupon code entry )
 */
function initializeEvents() {
	$('#cart-table').on('click', '.item-edit-details a', function (e) {
		e.preventDefault();
		quickview.show({
			url : e.target.href,
			source : 'cart'
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

var cart = {
	/**
	 * @function
	 * @description Updates the cart with new data
	 * @param {Object} postdata An Object representing the the new or uptodate data
	 * @param {Object} A callback function to be called
	 */
	update: function (postdata, callback) {
		var url = util.ajaxUrl(Urls.addProduct);
		$.post(url, postdata, callback || this.refresh);
	},
	/**
	 * @function
	 * @description Refreshes the cart without posting
	 */
	refresh: function () {
		// refresh without posting
		page.refresh();
	},
	/**
	 * @function
	 * @description Initializes the functionality on the cart
	 */
	init: function () {
		initializeEvents();
		if (SitePreferences.STORE_PICKUP) {
			storeinventory.init();
		}
		account.initCartLogin();
	}
};

module.exports = cart;
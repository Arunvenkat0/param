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
 * @description Updates the cart with new data
 * @param {Object} postdata An Object representing the the new or uptodate data
 * @param {Object} A callback function to be called
 */
function updateCart(postdata, callback) {
	var url = util.ajaxUrl(Urls.addProduct);
	$.post(url, postdata, callback || cart.refresh);
}
/**
 * @private
 * @function
 * @description Cache initialization of the cart page
 */
function initializeCache() {
	$cache = {
		cartTable : $("#cart-table"),
		itemsForm : $("#cart-items-form"),
		addCoupon : $("#add-coupon"),
		couponCode : $("form input[name$='_couponCode']")
	};
}
/**
 * @private
 * @function
 * @description Binds events to the cart page (edit item's details, bonus item's actions, coupon code entry )
 */
function initializeEvents() {
	$cache.cartTable.on("click", ".item-edit-details a", function (e) {
		e.preventDefault();
		quickView.show({
			url : e.target.href,
			source : "cart"
		});
	})
	.on("click", ".bonus-item-actions a", function (e) {
		e.preventDefault();
		bonusProductsView.show(this.href);
	});

	// override enter key for coupon code entry
	$cache.couponCode.on("keydown", function (e) {
		if (e.which === 13 && $(this).val().length===0) { return false; }
	});
}

/******* cart public object ********/
var cart = {
	/**
	 * @function
	 * @description Adds new item to the cart
	 * @param {Object} postdata An Object representing the the new or uptodate data
	 * @param {Object} A callback function to be called
	 */
	add : function (postdata, callback) {
		updateCart(postdata, callback);
	},
	/**
	 * @function
	 * @description Hook for removing item from the cart
	 *
	 */
	remove : function () {
		return;
	},
	/**
	 * @function
	 * @description Updates the cart with new data
	 * @param {Object} postdata An Object representing the the new or uptodate data
	 * @param {Object} A callback function to be called
	 */
	update : function (postdata, callback) {
		updateCart(postdata, callback);
	},
	/**
	 * @function
	 * @description Refreshes the cart without posting
	 */
	refresh : function () {
		// refresh without posting
		page.refresh();
	},
	/**
	 * @function
	 * @description Initializes the functionality on the cart
	 */
	init : function () {
		// edit shopping cart line item
		initializeCache();
		initializeEvents();
		if(site.storePickupEnabled){
			storeinventory.init();
		}
		account.initCartLogin();
	}
};

module.exports = cart;
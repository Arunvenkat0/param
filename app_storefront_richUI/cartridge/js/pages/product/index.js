'use strict';

var dialog = require('../../dialog'),
	sendToFriend = require('../../send-to-friend'),
	storeinventory = require('../../storeinventory'),
	tooltip = require('../../tooltip'),
	util = require('../../util'),
	addThis = require('./addThis'),
	addToCart = require('./addToCart'),
	availability = require('./availability'),
	image = require('./image'),
	powerReviews = require('./powerReviews'),
	productNav = require('./productNav'),
	productSet = require('./productSet'),
	recommendations = require('./recommendations'),
	variant = require('./variant');

/**
 * @private
 * @function
 * @description Initializes the DOM of the product detail page (images, reviews, recommendation and product-navigation).
 */
function initializeDom() {
	$('#pdpMain .product-detail .product-tabs').tabs();
	powerReviews();
	productNav();
	recommendations();
	tooltip.init();
}

/**
 * @function
 * @description Initializes events on the product detail page for the following elements:
 * - availability message
 * - add to cart functionality
 * - images and swatches
 * - variation selection
 * - option selection
 * - send to friend functionality
 */
function initializeEvents() {
	var $pdpMain = $('#pdpMain');

	if (SitePreferences.STORE_PICKUP) {
		storeinventory.buildStoreList($('.product-number span').html());
		storeinventory.init();
	}

	addThis();
	addToCart();
	availability();
	variant();
	image();
	sendToFriend.initializeDialog($pdpMain);
	productSet();

	// Add to Wishlist and Add to Gift Registry links behaviors
	$pdpMain.on('click', '.wl-action', function (e) {
		e.preventDefault();

		var data = util.getQueryStringParams($('.pdpForm').serialize());
		if (data.cartAction) {
			delete data.cartAction;
		}
		var url = util.appendParamsToUrl(this.href, data);
		url = this.protocol + '//' + this.hostname + ((url.charAt(0) === '/') ? url : ('/' + url));
		window.location.href = url;
	});

	// product options
	$pdpMain.on('change', '.product-options select', function () {
		var salesPrice = $pdpMain.find('.product-add-to-cart .price-sales');
		var selectedItem = $(this).children().filter(':selected').first();
		salesPrice.text(selectedItem.data('combined'));
	});

	// prevent default behavior of thumbnail link and add this Button
	$pdpMain.on('click', '.thumbnail-link, .addthis_toolbox a, .unselectable a', function (e) {
		e.preventDefault();
	});

	$pdpMain.find('.add-to-cart[disabled]')
		.attr('title', $pdpMain.find('.availability-msg')
		.html());

	$('.size-chart-link a').on('click', function (e) {
		e.preventDefault();
		dialog.open({
			url: $(e.target).attr('href')
		});
	});
}

var product = {
	initializeEvents: initializeEvents,
	init: function () {
		initializeDom();
		initializeEvents();
	}
};

module.exports = product;

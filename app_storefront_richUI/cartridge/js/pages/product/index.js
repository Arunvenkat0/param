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
 * @description Initialize product detail page with reviews, recommendation and product navigation.
 */
function initializeDom() {
	$('#pdpMain .product-detail .product-tabs').tabs();
	powerReviews();
	productNav();
	recommendations();
	tooltip.init();
}

/**
 * @description Initialize event handlers on product detail page
 */
function initializeEvents() {
	var $pdpMain = $('#pdpMain');

	addThis();
	addToCart();
	availability();
	variant();
	image();
	sendToFriend.initializeDialog($pdpMain);
	productSet();
	if (SitePreferences.STORE_PICKUP) {
		storeinventory.buildStoreList($('.product-number span').html());
		storeinventory.init();
	}

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

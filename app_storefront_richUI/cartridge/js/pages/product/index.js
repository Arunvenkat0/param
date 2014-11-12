'use strict';

var ajax = require('../../ajax'),
	components = require('../../components'),
	dialog = require('../../dialog'),
	sendToFriend = require('../../send-to-friend'),
	storeinventory = require('../../storeinventory'),
	tooltip = require('../../tooltip'),
	util = require('../../util'),
	addThis = require('./addThis'),
	addToCart = require('./addToCart'),
	availability = require('./availability'),
	content = require('./content'),
	image = require('./image'),
	swatch = require('./swatch');

/**
 * @private
 * @function
 * @description Loads product's navigation on the product detail page
 */
function loadProductNavigation() {
	var $pidInput = $('.pdpForm').find('input[name="pid"]').last(),
		$navContainer = $('#product-nav-container');
	// if no hash exists, or no pid exists, or nav container does not exist, return
	if (window.location.hash.length <= 1 || $pidInput.length === 0 || $navContainer.length === 0) {
		return;
	}

	var pid = $pidInput.val();
	var hashParams = window.location.hash.substr(1);
	if (hashParams.indexOf('pid=' + pid) < 0) {
		hashParams += '&pid=' + pid;
	}

	var url = Urls.productNav + (Urls.productNav.indexOf('?') < 0 ? '?' : '&') + hashParams;
	ajax.load({
		url:url,
		target: $navContainer
	});
}

/**
 * @private
 * @function
 * @description Creates product recommendation carousel using jQuery jcarousel plugin
 */
function loadRecommendations() {
	var $carousel = $('#carousel-recomendations');
	if (!$carousel || $carousel.length === 0 || $carousel.children().length === 0) {
		return;
	}
	$carousel.jcarousel(components.carouselSettings);
}

/**
 * @private
 * @function
 * @description Initializes the DOM of the product detail page (images, reviews, recommendation and product-navigation).
 */
function initializeDom() {
	$('#pdpMain .product-detail .product-tabs').tabs();
	if ($('#pwrwritediv').length > 0) {
		var options = $.extend(true, {}, dialog.settings, {
			autoOpen: true,
			height: 750,
			width: 650,
			dialogClass: 'writereview',
			title: 'Product Review',
			resizable: false
		});

		dialog.create({
			target: $('#pwrwritediv'),
			options: options
		});
	}

	loadRecommendations();
	loadProductNavigation();

	if ($('#product-set-list').length > 0) {
		var unavailable = $('#product-set-list form .add-to-cart[disabled]');
		if (unavailable.length > 0) {
			$('#add-all-to-cart').attr('disabled', 'disabled');
			$('#add-to-cart').attr('disabled', 'disabled'); // this may be a bundle
		}
	}

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
	// add or update shopping cart line item
	addToCart();

	availability();

	swatch();

	image.loadZoom();

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

	$pdpMain.on('click', '.productthumbnail', function () {
		// switch indicator
		$pdpMain.find('.product-thumbnails .selected').removeClass('selected');
		$(this).closest('li').addClass('selected');

		image.setMainImage($(this).data('lgimg'));
	});

	// dropdown variations
	$pdpMain.on('change', '.product-options select', function () {
		var salesPrice = $pdpMain.find('.product-add-to-cart .price-sales');
		var selectedItem = $(this).children().filter(':selected').first();
		salesPrice.text(selectedItem.data('combined'));
	});

	// prevent default behavior of thumbnail link and add this Button
	$pdpMain.on('click', '.thumbnail-link, .addthis_toolbox a, .unselectable a', function (e) {
		e.preventDefault();
	});

	// handle drop down variation attribute value selection event
	$pdpMain.on('change', '.variation-select', function () {
		if ($(this).val().length === 0) { return; }
		content.update($(this).val());
	});

	sendToFriend.initializeDialog($pdpMain);

	$pdpMain.find('.add-to-cart[disabled]')
		.attr('title', $pdpMain.find('.availability-msg')
		.html());

	$('.size-chart-link a').on('click', function (e) {
		e.preventDefault();
		dialog.open({
			url: $(e.target).attr('href')
		});
	});

	$pdpMain.on('click', '.prSnippetLink', function (e) {
		e.preventDefault();
		$('.product-tabs').tabs('select', '#tab4');
		$('html, body').scrollTop($('#tab4').offset().top);
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

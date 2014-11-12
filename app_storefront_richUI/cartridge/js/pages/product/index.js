'use strict';

var ajax = require('../../ajax'),
	components = require('../../components'),
	dialog = require('../../dialog'),
	minicart = require('../../minicart'),
	progress = require('../../progress'),
	quickview = require('../../quickview'),
	sendToFriend = require('../../send-to-friend'),
	storeinventory = require('../../storeinventory'),
	tooltip = require('../../tooltip'),
	util = require('../../util'),
	addThis = require('./addThis'),
	addToCart = require('./addToCart'),
	availability = require('./availability'),
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
	var $pdpMain = $('#pdpMain'),
		$pdpForm = $('.pdpForm'),
		$addToCart = $('#add-to-cart'),
		$addAllToCart = $('#add-all-to-cart'),
		$productSetList = $('#product-set-list');

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
		var lgImg = $(this).data('lgimg');

		// switch indicator
		$pdpMain.find('.product-thumbnails .selected').removeClass('selected');
		$(this).closest('li').addClass('selected');

		image.setMainImage(lgImg);
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
		var qty = $pdpForm.find('input[name="Quantity"]').first().val(),
			$productSet = $(this).closest('.subProduct'),
			params = {
				Quantity: isNaN(qty) ? '1' : qty,
				format: 'ajax',
				productlistid: $pdpForm.find('input[name="productlistid"]').first().val()
			},
			hasSwapImage = $(this).find('option:selected').attr('data-lgimg') !== null;

		progress.show($pdpMain);

		ajax.load({
			url: util.appendParamsToUrl($(this).val(), params),
			target: ($productSet.length > 0 && $productSet.children.length > 0) ? $productSet : $('#product-content'),
			callback: function () {
				addThis();
				addToCart();
				if (hasSwapImage) {
					image.replaceImages();
				}
				tooltip.init();
			}
		});
	});

	$pdpMain.on('click', '.product-detail .swatchanchor', function (e) {
		e.preventDefault();
		if ($(this).parents('li').hasClass('unselectable')) { return; }
		var qty = $pdpForm.find('input[name="Quantity"]').first().val(),
			params = {
				Quantity: isNaN(qty) ? '1' : qty,
				format: 'ajax',
				productlistid: $pdpForm.find('input[name="productlistid"]').first().val()
			},
			hasSwapImage = ($(this).attr('data-lgimg') !== null);

		progress.show($pdpMain);

		ajax.load({
			url: util.appendParamsToUrl(this.href, params),
			target: $('#product-content'),
			callback: function () {
				addThis();
				addToCart();
				if (SitePreferences.STORE_PICKUP) {
					storeinventory.buildStoreList($('.product-number span').html());
				}
				if (hasSwapImage) {
					image.replaceImages();
				}
				tooltip.init();
			}
		});
	});

	$productSetList.on('click', '.product-set-item .swatchanchor', function (e) {
		var params, qty, url, $psItem, $container;
		e.preventDefault();
		// get the querystring from the anchor element
		params = util.getQueryStringParams(this.search);
		$psItem = $(this).closest('.product-set-item');
		qty = $psItem.find('form input[name="Quantity"]').first().val();
		params.Quantity = isNaN(qty) ? '1' : qty;
		url = Urls.getSetItem + '?' + $.param(params);
		$container = $(this).closest('.product-set-item');

		ajax.load({
			url: url,
			target: $container,
			callback: function () {
				progress.hide();
				if ($productSetList.find('.add-to-cart[disabled]').length > 0) {
					$addAllToCart.attr('disabled', 'disabled');
					$addToCart.attr('disabled', 'disabled'); // this may be a bundle
				} else {
					$addAllToCart.removeAttr('disabled');
					$addToCart.removeAttr('disabled'); // this may be a bundle
				}
				addToCart($container);
				tooltip.init();
			}
		});
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

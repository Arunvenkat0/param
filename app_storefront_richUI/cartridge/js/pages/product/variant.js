'use strict';

var addThis = require('./addThis'),
	addToCart = require('./addToCart'),
	ajax = require('../../ajax'),
	image = require('./image'),
	progress = require('../../progress'),
	storeinventory = require('../../storeinventory'),
	tooltip = require('../../tooltip'),
	util = require('../../util');


/**
 * @description update product content with new variant from href, load new content to #product-content panel
 * @param {String} href - url of the new product variant
 **/
var updateContent = function (href) {
	var $pdpForm = $('.pdpForm'),
		qty = $pdpForm.find('input[name="Quantity"]').first().val(),
		params = {
			Quantity: isNaN(qty) ? '1' : qty,
			format: 'ajax',
			productlistid: $pdpForm.find('input[name="productlistid"]').first().val()
		};

	progress.show($('#pdpMain'));

	ajax.load({
		url: util.appendParamsToUrl(href, params),
		target: $('#product-content'),
		callback: function () {
			addThis();
			addToCart();
			if (SitePreferences.STORE_PICKUP) {
				storeinventory.buildStoreList($('.product-number span').html());
			}
			image.replaceImages();
			tooltip.init();
		}
	});
};

module.exports = function () {
	var $addToCart = $('#add-to-cart'),
		$addAllToCart = $('#add-all-to-cart'),
		$pdpMain = $('#pdpMain'),
		$productSetList = $('#product-set-list');
	// hover on swatch - should update main image with swatch image
	$pdpMain.on('hover', '.swatchanchor', function () {
		var largeImg = $(this).data('lgimg'),
			$imgZoom = $pdpMain.find('.main-image'),
			$mainImage = $pdpMain.find('.primary-image');

		if (!largeImg) { return; }
		// store the old data from main image for mouseleave handler
		$(this).data('lgimg', {
			hires: $imgZoom.attr('href'),
			url: $mainImage.attr('src'),
			alt: $mainImage.attr('alt'),
			title: $mainImage.attr('title')
		});
		// set the main image
		image.setMainImage(largeImg);
	});

	// click on swatch - should replace product content with new variant
	$pdpMain.on('click', '.product-detail .swatchanchor', function (e) {
		e.preventDefault();
		if ($(this).parents('li').hasClass('unselectable')) { return; }
		updateContent(this.href);
	});

	// change drop down variation attribute - should replace product content with new variant
	$pdpMain.on('change', '.variation-select', function () {
		if ($(this).val().length === 0) { return; }
		updateContent($(this).val());
	});

	// click on swatch for product set
	$productSetList.on('click', '.product-set-item .swatchanchor', function (e) {
		e.preventDefault();
		var url = Urls.getSetItem + this.search,
			$container = $(this).closest('.product-set-item'),
			qty = $container.find('form input[name="Quantity"]').first().val();
		if (isNaN(qty)) {
			qty = '1';
		}
		url = util.appendParamToURL(url, 'Quantity', qty);

		ajax.load({
			url: url,
			target: $container,
			callback: function () {
				if ($productSetList.find('.add-to-cart[disabled]').length > 0) {
					$addAllToCart.attr('disabled', 'disabled');
					// product set does not have an add-to-cart button, but product bundle does
					$addToCart.attr('disabled', 'disabled');
				} else {
					$addAllToCart.removeAttr('disabled');
					$addToCart.removeAttr('disabled');
				}
				addToCart($container);
				tooltip.init();
			}
		});
	});
};

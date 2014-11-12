'use strict';

var addToCart = require('./addToCart'),
	ajax = require('../../ajax'),
	content = require('./content'),
	image = require('./image'),
	tooltip = require('../../tooltip'),
	util = require('../../util');

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
		content.update(this.href);
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

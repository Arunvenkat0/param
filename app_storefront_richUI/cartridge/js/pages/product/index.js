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
	availability = require('./availability');

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
 * @function
 * @description Sets the main image attributes and the href for the surrounding <a> tag
 * @param {Object} atts Simple object with url, alt, title and hires properties
 */
function setMainImage(atts) {
	var imgZoom = $('#pdpMain .main-image');
	if (imgZoom.length > 0 && atts.hires && atts.hires !== '' && atts.hires !== 'null') {
		imgZoom.attr('href', atts.hires);
	}

	imgZoom.find('.primary-image').attr({
		src: atts.url,
		alt: atts.alt,
		title: atts.title
	});
}

/**
 * @function
 * @description helper function for swapping main image on swatch hover
 * @param {Element} element DOM element with custom data-lgimg attribute
 */
function swapImage(element) {
	var lgImg = $(element).data('lgimg');
	if (!lgImg) {
		return;
	}
	var newImg = $.extend({}, lgImg);
	var imgZoom = $('#pdpMain .main-image');
	var mainImage = imgZoom.find('.primary-image');
	// store current image info
	lgImg.hires = imgZoom.attr('href');
	lgImg.url = mainImage.attr('src');
	lgImg.alt = mainImage.attr('alt');
	lgImg.title = mainImage.attr('title');
	// reset element's lgimg data attribute
	$(element).data(lgImg);
	// set the main image
	setMainImage(newImg);
}

/**
 * @function
 * @description Enables the zoom viewer on the product detail page
 */
function loadZoom() {
	if (quickview.isActive() || util.isMobile()) { return; }

	//zoom properties
	var options = {
		zoomType: 'standard',
		alwaysOn: 0, // setting to 1 will load load high res images on page load
		zoomWidth: 575,
		zoomHeight: 349,
		position: 'right',
		preloadImages: 0, // setting to 1 will load load high res images on page load
		xOffset: 30,
		yOffset: 0,
		showEffect: 'fadein',
		hideEffect: 'fadeout'
	};

	// Added to prevent empty hires zoom feature (if images don't exist)
	var mainImage = $('#pdpMain').find('.main-image');
	var hiresImageSrc = mainImage.attr('href');
	if (hiresImageSrc && hiresImageSrc !== '' && hiresImageSrc.indexOf('noimagelarge') < 0) {
		mainImage.removeData('jqzoom').jqzoom(options);
	}
}
/**
 * @function
 * @description replaces the images in the image container. for example when a different color was clicked.
 */
function replaceImages() {
	var newImages = $('#update-images');
	var imageContainer = $('#pdpMain').find('.product-image-container');

	imageContainer.html(newImages.html());
	newImages.remove();
	setMainImageLink();

	loadZoom();
}
/**
 * @function
 * @description Adds css class (image-zoom) to the main product image in order to activate the zoom viewer on the product detail page.
 */
function setMainImageLink() {
	var $mainImage = $('#pdpMain .main-image');
	if (quickview.isActive() || util.isMobile()) {
		$mainImage.removeAttr('href');
	} else {
		$mainImage.addClass('image-zoom');
	}
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
	setMainImageLink();

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
 * @private
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
	addThis();
	if (SitePreferences.STORE_PICKUP) {
		storeinventory.buildStoreList($('.product-number span').html());
	}
	// add or update shopping cart line item
	addToCart();

	availability();

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

		setMainImage(lgImg);
		// load zoom if not quick view
		if (lgImg.hires !== '' && lgImg.hires.indexOf('noimagelarge') < 0) {
			setMainImageLink();
			loadZoom();
		} else {
			$pdpMain.find('.main-image').removeClass('image-zoom');
		}
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
		if ($(this).val().length === 0) {return;}
		var qty = $pdpForm.find('input[name="Quantity"]').first().val(),
			listid = $pdpForm.find('input[name="productlistid"]').first().val(),
			productSet = $(this).closest('.subProduct'),
			params = {
				Quantity: isNaN(qty) ? '1' : qty,
				format: 'ajax'
			};
		if (listid) {params.productlistid = listid;}
		var target = (productSet.length > 0 && productSet.children.length > 0) ? productSet : $('#product-content');
		var url = util.appendParamsToUrl($(this).val(), params);
		progress.show($pdpMain);
		var hasSwapImage = $(this).find('option:selected').attr('data-lgimg') !== null;

		ajax.load({
			url: url,
			callback: function (data) {
				target.html(data);
				addThis();
				addToCart();
				if (hasSwapImage) {
					replaceImages();
				}
				$('#update-images').remove();
				tooltip.init();
			}
		});
	});

	$pdpMain.on('hover', '.swatchanchor', function () {
		swapImage(this);
	});

	$pdpMain.on('click', '.product-detail .swatchanchor', function (e) {
		var $this = $(this),
			params = {},
			hasSwapImage, qty, listid, url;

		e.preventDefault();

		if ($this.parents('li').hasClass('unselectable')) {return;}

		hasSwapImage = ($this.attr('data-lgimg') !== null);
		qty = $pdpForm.find('input[name="Quantity"]').first().val();
		listid = $pdpForm.find('input[name="productlistid"]').first().val();
		params.Quantity = isNaN(qty) ? '1' : qty;
		if (listid) {
			params.productlistid = listid;
		}
		url = util.appendParamsToUrl(this.href, params);
		progress.show($pdpMain);

		ajax.load({
			url: url,
			target: $('#product-content'),
			callback: function () {
				addThis();
				addToCart();
				if (SitePreferences.STORE_PICKUP) {
					storeinventory.buildStoreList($('.product-number span').html());
				}
				if (hasSwapImage) {
					replaceImages();
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
		loadZoom();
		if (SitePreferences.STORE_PICKUP) {
			storeinventory.init();
		}
	}
};

module.exports = product;

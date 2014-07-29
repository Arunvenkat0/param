'use strict';

var ajax = require('./ajax'),
	cart = require('./cart'),
	components = require('./components'),
	dialog = require('./dialog'),
	minicart = require('./minicart'),
	progress = require('./progress'),
	quickview = require('./quickview'),
	sendToFriend = require('./send-to-friend'),
	storeinventory = require('./storeinventory'),
	tooltip = require('./tooltip'),
	util = require('./util')

var $cache;

/**
 * @private
 * @function
 * @description Loads product's navigation on the product detail page
 */
function loadProductNavigation() {
	var pidInput = $cache.pdpForm.find('input[name="pid"]').last();
	var navContainer = $('#product-nav-container');
	// if no hash exists, or no pid exists, or nav container does not exist, return
	if (window.location.hash.length <= 1 || pidInput.length === 0 || navContainer.length === 0) {
		return;
	}

	var pid = pidInput.val();
	var hashParams = window.location.hash.substr(1);
	if (hashParams.indexOf('pid=' + pid) < 0) {
		hashParams += '&pid=' + pid;
	}

	var url = Urls.productNav+(Urls.productNav.indexOf('?') < 0 ? '?' : '&') + hashParams;
	ajax.load({
		url:url, 
		target: navContainer
	});
}

/**
 * @private
 * @function
 * @description Creates product recommendation carousel using jQuery jcarousel plugin
 */
function loadRecommendations() {
	var carousel = $('#carousel-recomendations');
	if (!carousel || carousel.length === 0 || carousel.children().length === 0) {
		return;
	}
	carousel.jcarousel(components.carouselSettings);
}

/**
 * @function
 * @description Sets the main image attributes and the href for the surrounding <a> tag
 * @param {Object} atts Simple object with url, alt, title and hires properties
 */
function setMainImage(atts) {
	var imgZoom = $cache.pdpMain.find('.main-image');
	if (imgZoom.length > 0 && atts.hires && atts.hires != '' && atts.hires != 'null') {
		imgZoom.attr('href', atts.hires);
	}

	imgZoom.find('.primary-image').attr({
		'src' : atts.url,
		'alt' : atts.alt,
		'title' : atts.title
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
	var imgZoom = $cache.pdpMain.find('.main-image');
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
	if (quickview.isActive() || !app.zoomViewerEnabled) { return; }

	//zoom properties
	var options = {
		zoomType: 'standard',
		alwaysOn : 0, // setting to 1 will load load high res images on page load
		zoomWidth : 575,
		zoomHeight : 349,
		position: 'right',
		preloadImages: 0, // setting to 1 will load load high res images on page load
		xOffset: 30,
		yOffset: 0,
		showEffect : 'fadein',
		hideEffect: 'fadeout'
	};

	// Added to prevent empty hires zoom feature (if images don't exist)
	var mainImage = $cache.pdpMain.find('.main-image');
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
	var imageContainer = $cache.pdpMain.find('.product-image-container');

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
	if (quickview.isActive() || app.isMobileUserAgent) {
		$cache.pdpMain.find('.main-image').removeAttr('href');
	} else {
		$cache.pdpMain.find('.main-image').addClass('image-zoom');
	}
}

/**
 * @function
 * @description Removes css class (image-zoom) from the main product image in order to deactivate the zoom viewer on the product detail page.
 */
function removeImageZoom() {
	$cache.pdpMain.find('.main-image').removeClass('image-zoom');
}

/**
 * @private
 * @function
 * @description Initializes the DOM of the product detail page (images, reviews, recommendation and product-navigation).
 */
function initializeDom() {
	$cache.pdpMain.find('div.product-detail .product-tabs').tabs();
	if ($('#pwrwritediv').length > 0) {
		var options = $.extend(true, {}, dialog.settings, {
			autoOpen : true,
			height : 750,
			width : 650,
			dialogClass : 'writereview',
			title : 'Product Review',
			resizable : false
		});

		dialog.create({
			target : app.ui.reviewsContainer,
			options : options
		});
	}

	loadRecommendations($cache.container);
	loadProductNavigation();
	setMainImageLink();

	if ($cache.productSetList.length>0) {
		var unavailable = $cache.productSetList.find("form").find("button.add-to-cart[disabled]");
		if (unavailable.length > 0) {
			$cache.addAllToCart.attr("disabled", "disabled");
			$cache.addToCart.attr("disabled", "disabled"); // this may be a bundle
		}
	}

	tooltip.init();
}
/**
 * @private
 * @function
 * @description Initializes the cache on the product detail page.
 */
function initializeCache() {
	$cache = {
		pdpMain : $('#pdpMain'),
		productSetList : $('#product-set-list'),
		addToCart : $('#add-to-cart'),
		addAllToCart : $('#add-all-to-cart')
	};
	$cache.pdpForm = $cache.pdpMain.find('.pdpForm');
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
	product.initAddThis();
	if (site.storePickupEnabled) {
		storeinventory.buildStoreList($('.product-number span').html());
	}
	// add or update shopping cart line item
	product.initAddToCart();
	$cache.pdpMain.on('change keyup', '.pdpForm input[name="Quantity"]', function (e) {
		var availabilityContainer = $cache.pdpMain.find('.availability');
		product.getAvailability(
			$('#pid').val(),
			$(this).val(),
			function (data) {
				if (!data) {
					$cache.addToCart.removeAttr('disabled');
					availabilityContainer.find('.availability-qty-available').html();
					availabilityContainer.find('.availability-msg').show();
					return;
				} else {
					var avMsg = null;
					var avRoot = availabilityContainer.find('.availability-msg').html('');

					// Look through levels ... if msg is not empty, then create span el
					i (data.levels.IN_STOCK > 0) {
						avMsg = avRoot.find('.in-stock-msg');
						if (avMsg.length === 0) {
							avMsg = $('<p/>').addClass('in-stock-msg').appendTo(avRoot);
						}
						if (data.levels.PREORDER === 0 && data.levels.BACKORDER === 0 && data.levels.NOT_AVAILABLE === 0) {
							// Just in stock
							avMsg.text(Resources.IN_STOCK);
						} else {
							// In stock with conditions ...
							avMsg.text(data.inStockMsg);
						}
					}
					if (data.levels.PREORDER > 0) {
						avMsg = avRoot.find('.preorder-msg');
						if (avMsg.length === 0) {
							avMsg = $('<p/>').addClass('preorder-msg').appendTo(avRoot);
						}
						if (data.levels.IN_STOCK === 0 && data.levels.BACKORDER === 0 && data.levels.NOT_AVAILABLE === 0) {
							// Just in stock
							avMsg.text(Resources.PREORDER);
						} else {
							avMsg.text(data.preOrderMsg);
						}
					}
					if (data.levels.BACKORDER > 0) {
						avMsg = avRoot.find('.backorder-msg');
						if (avMsg.length === 0) {
							avMsg = $('<p/>').addClass('backorder-msg').appendTo(avRoot);
						}
						if (data.levels.IN_STOCK === 0 && data.levels.PREORDER === 0 && data.levels.NOT_AVAILABLE === 0) {
							// Just in stock
							avMsg.text(Resources.BACKORDER);
						} else {
							avMsg.text(data.backOrderMsg);
						}
					}
					if (data.inStockDate != '') {
						avMsg = avRoot.find('.in-stock-date-msg');
						if (avMsg.length === 0) {
							avMsg = $('<p/>').addClass('in-stock-date-msg').appendTo(avRoot);
						}
						avMsg.text(String.format(Resources.IN_STOCK_DATE,data.inStockDate));
					}
					if (data.levels.NOT_AVAILABLE > 0) {
						avMsg = avRoot.find('.not-available-msg');
						if (avMsg.length === 0) {
							avMsg = $('<p/>').addClass('not-available-msg').appendTo(avRoot);
						}
						if (data.levels.PREORDER === 0 && data.levels.BACKORDER === 0 && data.levels.IN_STOCK === 0) {
							avMsg.text(Resources.NOT_AVAILABLE);
						} else {
							avMsg.text(Resources.REMAIN_NOT_AVAILABLE);
						}
					}
					return;
				}
				$cache.addToCart.attr('disabled', 'disabled');
				availabilityContainer.find('.availability-msg').hide();
				var avQtyMsg = availabilityContainer.find('.availability-qty-available');
				if (avQtyMsg.length === 0) {
					avQtyMsg = $('<span/>').addClass('availability-qty-available').appendTo(availabilityContainer);
				}
				avQtyMsg.text(data.inStockMsg).show();

				var avQtyMsg = availabilityContainer.find('.availability-qty-available');
				if (avQtyMsg.length === 0) {
					avQtyMsg = $('<span/>').addClass('availability-qty-available').appendTo(availabilityContainer);
				}
				avQtyMsg.text(data.backorderMsg).show();
			});

	});

	// Add to Wishlist and Add to Gift Registry links behaviors
	$cache.pdpMain.on('click', '.wl-action', function (e) {
		e.preventDefault();

		var data = util.getQueryStringParams($('.pdpForm').serialize());
		if (data.cartAction) {
			delete data.cartAction;
		}
		var url = util.appendParamsToUrl(this.href, data);
		url = this.protocol + '//' + this.hostname + ((url.charAt(0) === '/') ? url : ('/' + url));
		window.location.href = url;
	});

	$cache.pdpMain.on('hover', '.swatches .swatchanchor', function () {
		swapImage(this);
	});
	// productthumbnail.onclick()
	$cache.pdpMain.on('click', '.productthumbnail', function () {
		var lgImg = $(this).data('lgimg');

		// switch indicator
		$cache.pdpMain.find('.product-thumbnails .selected').removeClass('selected');
		$(this).closest('li').addClass('selected');

		setMainImage(lgImg);
		// load zoom if not quick view
		if( lgImg.hires !== '' && lgImg.hires.indexOf('noimagelarge')<0 ){
			setMainImageLink();
			loadZoom();
		} else {
			removeImageZoom();
		}
	});

	// dropdown variations
	$cache.pdpMain.on('change', '.product-options select', function (e) {
		var salesPrice = $cache.pdpMain.find('.product-add-to-cart .price-sales');
		var selectedItem = $(this).children().filter(':selected').first();
		salesPrice.text(selectedItem.data('combined'));
	});

	// prevent default behavior of thumbnail link and add this Button
	$cache.pdpMain.on('click', '.thumbnail-link, .addthis_toolbox a', false);
	$cache.pdpMain.on('click', '.unselectable a', false);

	// handle drop down variation attribute value selection event
	$cache.pdpMain.on('change', '.variation-select', function(e){
		if ($(this).val().length === 0) {return;}
		var qty = $cache.pdpForm.find('input[name="Quantity"]').first().val(),
			listid = $cache.pdpForm.find('input[name="productlistid"]').first().val(),
			productSet = $(this).closest('.subProduct'),
			params = {
				Quantity : isNaN(qty) ? '1' : qty,
				format : 'ajax'
			};
		if (listid) {params.productlistid = listid;}
		var target = (productSet.length > 0 && productSet.children.length > 0) ? productSet : $('#product-content');
		var url = util.appendParamsToUrl($(this).val(), params);
		progress.show($cache.pdpMain);
		var hasSwapImage = $(this).find("option:selected").attr("data-lgimg") !== null;

		ajax.load({
			url: url,
			callback : function (data) {
				target.html(data);
				product.initAddThis();
				product.initAddToCart();
				if (hasSwapImage) {
					replaceImages();
				}
				$('#update-images').remove();
				tooltip.init();
			}
		});
	});

	// swatch anchor onclick()
	$cache.pdpMain.on('click', '.product-detail a[href].swatchanchor', function (e) {
		e.preventDefault();

		var el = $(this);
		if (el.parents('li').hasClass('unselectable')) {return;}

		var hasSwapImage = (el.attr('data-lgimg') !== null);

		var anchor = el,
			qty = $cache.pdpForm.find('input[name="Quantity"]').first().val(),
			listid = $cache.pdpForm.find('input[name="productlistid"]').first().val(),
			productSet = $(anchor).closest('.subProduct'),
			params = {
				Quantity : isNaN(qty) ? '1' : qty
			};
		if (listid) {params.productlistid = listid;}

		var target = (productSet.length > 0 && productSet.children.length > 0) ? productSet : $('#product-content');
		var url = util.appendParamsToUrl(this.href, params);
		progress.show($cache.pdpMain);

		ajax.load({
			url: url,
			callback : function (data) {
				target.html(data);
				product.initAddThis();
				product.initAddToCart();
				if(site.storePickupEnabled){storeinventory.buildStoreList($('.product-number span').html());}
				if (hasSwapImage) {
					replaceImages();
				}
				tooltip.init();
			}
		});
	});

	$cache.productSetList.on('click', '.product-set-item li a[href].swatchanchor', function (e) {
		e.preventDefault();
		// get the querystring from the anchor element
		var params = util.getQueryStringParams(this.search);
		var psItem = $(this).closest('.product-set-item');

		// set quantity to value from form
		var qty = psItem.find('form input[name="Quantity"]').first().val();
		params.Quantity = isNaN(qty) ? '1' : qty;

		var url = Urls.getSetItem + '?' + $.param(params);

		// get container
		var ic = $(this).closest('.product-set-item');
		ic.load(url, function () {
			progress.hide();
			if ($cache.productSetList.find('.add-to-cart[disabled]').length>0) {
				$cache.addAllToCart.attr('disabled', 'disabled');
				$cache.addToCart.attr('disabled', 'disabled'); // this may be a bundle
			}
			else {
				$cache.addAllToCart.removeAttr('disabled');
				$cache.addToCart.removeAttr('disabled'); // this may be a bundle
			}

			product.initAddToCart(ic);
			tooltip.init();
		});
	});

	$cache.addAllToCart.on('click', function (e) {
		e.preventDefault();
		var psForms = $cache.productSetList.find('form').toArray(),
			miniCartHtml = '',
			addProductUrl = util.ajaxUrl(Urls.addProduct);

		// add items to cart
		function addItems() {
			var form = $(psForms.shift());
			var itemid = form.find('input[name="pid"]').val();

			$.ajax({
				dataType : 'html',
				url: addProductUrl,
				data: form.serialize()
			})
			.done(function (response) {
				// success
				miniCartHtml = response;
			})
			.fail(function (xhr, textStatus) {
				// failed
				var msg = Resources.ADD_TO_CART_FAIL;
				$.validator.format(msg, itemid);
				if (textStatus === 'parsererror') {
					msg += '\n' + Resources.BAD_RESPONSE;
				} else {
					msg += '\n' + Resources.SERVER_CONNECTION_ERROR;
				}
				window.alert(msg);
			})
			.always(function () {
				if (psForms.length > 0) {
					addItems();
				}
				else {
					quickview.close();
					minicart.show(miniCartHtml);
				}
			});
		}
		addItems();
		return false;
	});
	sendToFriend.initializeDialog($cache.pdpMain, '.send-to-friend');

	$cache.pdpMain.find('.add-to-cart[disabled]').attr('title', $cache.pdpMain.find('.availability-msg').html());
}
/**
 * @private
 * @function
 * @description Event handler to handle the add to cart event
 */
function setAddToCartHandler(e) {
	e.preventDefault();
	var form = $(this).closest('form');
	var qty = form.find('input[name="Quantity"]');
	var isSubItem = $(this).hasClass('sub-product-item');
	if (qty.length === 0 || isNaN(qty.val()) || parseInt(qty.val(), 10) === 0) {
		qty.val('1');
	}

	var data = form.serialize();
	cart.update(data, function (response) {
		var uuid = form.find('input[name="uuid"]');
		if (uuid.length > 0 && uuid.val().length > 0) {
			cart.refresh();
		}
		else {
			if (!isSubItem) {
				quickview.close();
			}
			minicart.show(response);
		}
	});
}

var product = {
	init : function () {
		initializeCache();
		initializeDom();
		initializeEvents();
		loadZoom();
		if (site.storePickupEnabled){
			storeinventory.init();
		}
	},
	readReviews : function(){
		$('.product-tabs').tabs('select','#tab4');
		$('body').scrollTop($('#tab4').offset().top);
	},
	/**
	 * @function
	 * @description Loads a product into a given container div
	 * @param {Object} options An object with the following properties:
	 * - containerId - id of the container div, if empty then global app.containerId is used
	 * - source - source string e.g. search, cart etc.
	 * - label - label for the add to cart button, default is Add to Cart
	 * - url - url to get the product
	 * - id - id of the product to get, is optional only used when url is empty
	 */
	get : function (options) {
		var target = options.target || quickview.init();
		var source = options.source || '';
		var productListID = options.productlistid || '';

		var productUrl = options.url || util.appendParamToURL(Urls.getProductUrl, 'pid', options.id);
		if(source.length > 0) {
			productUrl = util.appendParamToURL(productUrl, 'source', source);
		}
		if(productListID.length > 0) {
			productUrl = util.appendParamToURL(productUrl, 'productlistid', productListID);
		}

		// show small loading image
		//progress.show(app.ui.primary);
		ajax.load({
			target : target,
			url : productUrl,
			data : options.data || '',
			// replace with callback passed in by options
			callback : options.callback || product.init
		});
	},
	/**
	 * @function
	 * @description Gets the availability to given product and quantity
	 */
	getAvailability : function (pid, quantity, callback) {
		ajax.getJson({
			url: util.appendParamsToUrl(Urls.getAvailability, {pid:pid, Quantity:quantity}),
			callback: callback
		});
	},
	/**
	 * @function
	 * @description Initializes the 'AddThis'-functionality for the social sharing plugin
	 */
	initAddThis : function () {
		var addThisServices = ['compact', 'facebook', 'myspace', 'google', 'twitter'],
			addThisToolbox = $('.addthis_toolbox'),
			addThisLinks = '',
			i,
			len = addThisServices.length;

		for (i = 0; i < len; i++) {
			if (addThisToolbox.find('.addthis_button_' + addThisServices[i]).length === 0) {
				addThisLinks += '<a class="addthis_button_' + addThisServices[i] + '"></a>';
			}
		}
		if (addThisLinks.length === 0) { return; }

		addThisToolbox.html(addThisLinks);
		try {
			addthis.toolbox('.addthis_toolbox');
		} catch(e) {
			return;
		}
	},
	/**
	 * @function
	 * @description Binds the click event to a given target for the add-to-cart handling
	 * @param {Element} target The target on which an add to cart event-handler will be set
	 */
	initAddToCart : function (target) {
		if (target) {
			target.on('click', '.add-to-cart', setAddToCartHandler);
		} else {
			$('.add-to-cart').on('click', setAddToCartHandler);
		}
	}
};

module.exports = product;

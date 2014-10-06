(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 *    (c) 2009-2014 Demandware Inc.
 *    Subject to standard usage terms and conditions
 *    For all details and documentation:
 *    https://bitbucket.com/demandware/sitegenesis
 */

'use strict';

var components = require('./components'),
	minicart = require('./minicart'),
	mulitcurrency = require('./multicurrency'),
	page = require('./page'),
	searchplaceholder = require('./searchplaceholder'),
	searchsuggest = require('./searchsuggest'),
	searchsuggestbeta = require('./searchsuggest-beta'),
	tooltip = require('./tooltip'),
	util = require('./util'),
	validator = require('./validator');

// if jQuery has not been loaded, load from google cdn
if (!window.jQuery) {
	var s = document.createElement('script');
	s.setAttribute('src', 'https://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js');
	s.setAttribute('type', 'text/javascript');
	document.getElementsByTagName('head')[0].appendChild(s);
}

require('./jquery-ext')();
require('./cookieprivacy')();

/**
 * @private
 * @function
 * @description Apply dialogify event handler to all elements that match one or more of the specified selectors.
 */
function initializeEvents() {
	var controlKeys = ['8', '13', '46', '45', '36', '35', '38', '37', '40', '39'];

	$('body')//.on('click', '.dialogify, [data-dlg-options], [data-dlg-action]', util.setDialogify)
	.on('keydown', 'textarea[data-character-limit]', function(e) {
		var text = $.trim($(this).val()),
			charsLimit = $(this).data('character-limit'),
			charsUsed = text.length;

			if ((charsUsed >= charsLimit) && (controlKeys.indexOf(e.which.toString()) < 0)) {
				e.preventDefault();
			}
	})
	.on('change keyup mouseup', 'textarea[data-character-limit]', function(e) {
		var text = $.trim($(this).val()),
			charsLimit = $(this).data('character-limit'),
			charsUsed = text.length,
			charsRemain = charsLimit - charsUsed;

		if(charsRemain < 0) {
			$(this).val( text.slice(0, charsRemain) );
			charsRemain = 0;
		}

		$(this).next('div.char-count').find('.char-remain-count').html(charsRemain);
	});

	/**
	 * initialize search suggestions, pending the value of the site preference(enhancedSearchSuggestions)
	 * this will either init the legacy(false) or the beta versions(true) of the the search suggest feature.
	 * */
	var $searchContainer = $('#navigation .header-search');
	if (SitePreferences.LISTING_SEARCHSUGGEST_LEGACY) {
		searchsuggestbeta.init($searchContainer, Resources.SIMPLE_SEARCH);
	} else {
		searchsuggest.init($searchContainer, Resources.SIMPLE_SEARCH);
	}

	// print handler
	$('.print-page').on('click', function () { window.print(); return false; });

	// add show/hide navigation elements
	$('.secondary-navigation .toggle').click(function(){
		$(this).toggleClass('expanded').next('ul').toggle();
	});

	// add generic toggle functionality
	$('.toggle').next('.toggle-content').hide();
	$('.toggle').click(function(){
		$(this).toggleClass('expanded').next('.toggle-content').toggle();
	});

	// subscribe email box
	var $subscribeEmail = $('.subscribe-email');
	if ($subscribeEmail.length > 0)	{
		$subscribeEmail.focus(function () {
			var val = $(this.val());
			if (val.length > 0 && val !== Resources.SUBSCRIBE_EMAIL_DEFAULT) {
				return; // do not animate when contains non-default value
			}

			$(this).animate({ color: '#999999'}, 500, 'linear', function () {
				$(this).val('').css('color','#333333');
			});
		}).blur(function () {
			var val = $.trim($(this.val()));
			if (val.length > 0) {
				return; // do not animate when contains value
			}
			$(this).val(Resources.SUBSCRIBE_EMAIL_DEFAULT)
				.css('color','#999999')
				.animate({color: '#333333'}, 500, 'linear');
		});
	}
}
/**
 * @private
 * @function
 * @description Adds class ('js') to html for css targeting and loads js specific styles.
 */
function initializeDom() {
	// add class to html for css targeting
	$('html').addClass('js');
	if (SitePreferences.LISTING_INFINITE_SCROLL) {
		$('html').addClass('infinite-scroll');
	}
	// load js specific styles
	util.limitCharacters();
}

var pages = {
	account: require('./pages/account'),
	cart: require('./pages/cart'),
	checkout: require('./pages/checkout'),
	compare: require('./pages/compare'),
	product: require('./pages/product'),
	registry: require('./pages/registry'),
	search: require('./pages/search'),
	storefront: require('./pages/storefront'),
	wishlist: require('./pages/wishlist')
};

var app = {
	init: function () {
		if (document.cookie.length === 0) {
			$('<div/>').addClass('browser-compatibility-alert').append($('<p/>').addClass('browser-error').html(Resources.COOKIES_DISABLED)).appendTo('#browser-check');
		}
		initializeDom();
		initializeEvents();

		// init specific global components
		tooltip.init();
		minicart.init();
		validator.init();
		components.init();
		searchplaceholder.init();
		mulitcurrency.init();
		// execute page specific initializations
		$.extend(page, pageContext);
		var ns = page.ns;
		console.log(ns);
		if (ns && pages[ns] && pages[ns].init) {
			pages[ns].init();
		}
	}
};

// general extension functions
(function () {
	String.format = function() {
		var s = arguments[0];
		var i, len=arguments.length - 1;
		for (i = 0; i < len; i++) {
			var reg = new RegExp('\\{' + i + '\\}', 'gm');
			s = s.replace(reg, arguments[i + 1]);
		}
		return s;
	};
})();

// initialize app
$(document).ready(function () {
	app.init();
});

},{"./components":4,"./cookieprivacy":5,"./jquery-ext":9,"./minicart":10,"./multicurrency":11,"./page":12,"./pages/account":13,"./pages/cart":14,"./pages/checkout":18,"./pages/compare":21,"./pages/product":23,"./pages/registry":24,"./pages/search":25,"./pages/storefront":26,"./pages/wishlist":27,"./searchplaceholder":32,"./searchsuggest":34,"./searchsuggest-beta":33,"./tooltip":37,"./util":38,"./validator":39}],2:[function(require,module,exports){
'use strict';

var progress= require('./progress'),
	util = require('./util');

var currentRequests = [];

/**
 * @function
 * @description Ajax request to get json response
 * @param {Boolean} async  Asynchronous or not
 * @param {String} url URI for the request
 * @param {Object} data Name/Value pair data request
 * @param {Function} callback  Callback function to be called
 */
var getJson = function (options) {
	options.url = util.toAbsoluteUrl(options.url);
	// return if no url exists or url matches a current request
	if(!options.url || currentRequests[options.url]) {
		return;
	}

	currentRequests[options.url] = true;

	// make the server call
	$.ajax({
		dataType : "json",
		url : options.url,
		async : (typeof options.async==="undefined" || options.async===null) ? true : options.async,
		data : options.data || {}
	})
	// success
	.done(function (response) {
		if(options.callback) {
			options.callback(response);
		}
	})
	// failed
	.fail(function (xhr, textStatus) {
		if(textStatus === "parsererror") {
			window.alert(Resources.BAD_RESPONSE);
		}
		if(options.callback) {
			options.callback(null);
		}
	})
	// executed on success or fail
	.always(function () {
		// remove current request from hash
		if(currentRequests[options.url]) {
			delete currentRequests[options.url];
		}
	});
};
/**
 * @function
 * @description ajax request to load html response in a given container
 * @param {String} url URI for the request
 * @param {Object} data Name/Value pair data request
 * @param {Function} callback  Callback function to be called
 * @param {Object} target Selector or element that will receive content
 */
var load = function (options) {
	options.url = util.toAbsoluteUrl(options.url);
	// return if no url exists or url matches a current request
	if(!options.url || currentRequests[options.url]) {
		return;
	}

	currentRequests[options.url] = true;

	// make the server call
	$.ajax({
		dataType : "html",
		url : util.appendParamToURL(options.url, "format", "ajax"),
		data : options.data
	})
	.done(function (response) {
		// success
		if(options.target) {
			$(options.target).empty().html(response);
		}
		if(options.callback) {
			options.callback(response);
		}

	})
	.fail(function (xhr, textStatus) {
		// failed
		if(textStatus === "parsererror") {
			window.alert(Resources.BAD_RESPONSE);
		}
		options.callback(null, textStatus);
	})
	.always(function () {
		progress.hide();
		// remove current request from hash
		if(currentRequests[options.url]) {
			delete currentRequests[options.url];
		}
	});
}

exports.getJson = getJson;
exports.load = load;
},{"./progress":30,"./util":38}],3:[function(require,module,exports){
'use strict';

var ajax = require('./ajax'),
	dialog = require('./dialog'),
	page = require('./page'),
	util = require('./util')

var selectedList = [];
var maxItems = 1;
var bliUUID = '';

/**
 * @private
 * @function
 * description Gets a list of bonus products related to a promoted product
 */
function getBonusProducts() {
	var o = {};
	o.bonusproducts = [];

	var i, len;
	for (i = 0, len = selectedList.length; i < len; i++) {
		var p = {
			pid : selectedList[i].pid,
			qty : selectedList[i].qty,
			options : {}
		};
		var a, alen, bp = selectedList[i];
		for (a = 0, alen = bp.options.length; a < alen; a++) {
			var opt = bp.options[a];
			p.options = {optionName:opt.name,optionValue:opt.value};
		}
		o.bonusproducts.push({product:p});
	}
	return o;
}
/**
 * @private
 * @function
 * @description Updates the summary page with the selected bonus product
 */
function updateSummary() {
	var $bonusProductList = $('#bonus-product-list')
	if (selectedList.length === 0) {
		$bonusProductList.find('li.selected-bonus-item').remove();
	} else {
		var ulList = $bonusProductList.find('ul.selected-bonus-items').first();
		var itemTemplate = ulList.children('.selected-item-template').first();
		var i, len;
		for (i = 0, len = selectedList.length; i < len; i++) {
			var item = selectedList[i];
			var li = itemTemplate.clone().removeClass('selected-item-template').addClass('selected-bonus-item');
			li.data('uuid', item.uuid).data('pid', item.pid);
			li.find('.item-name').html(item.name);
			li.find('.item-qty').html(item.qty);
			var ulAtts = li.find('.item-attributes');
			var attTemplate = ulAtts.children().first().clone();
			ulAtts.empty();
			var att;
			for (att in item.attributes) {
				var attLi = attTemplate.clone();
				attLi.addClass(att);
				attLi.children('.display-name').html(item.attributes[att].displayName);
				attLi.children('.display-value').html(item.attributes[att].displayValue);
				attLi.appendTo(ulAtts);
			}
			li.appendTo(ulList);
		}
		ulList.children('.selected-bonus-item').show();
	}

	// get remaining item count
	var remain = maxItems - selectedList.length;
	$bonusProductList.find('.bonus-items-available').text(remain);
	if (remain <= 0) {
		$bonusProductList.find('.button-select-bonus').attr('disabled', 'disabled');
	}
	else {
		$bonusProductList.find('.button-select-bonus').removeAttr('disabled');
	}
}

function initializeGrid () {
	var $bonusProduct = $('#bonus-product-dialog'),
		$bonusProductList = $('#bonus-product-list'),
	bliData = $bonusProductList.data('line-item-detail');
	maxItems = bliData.maxItems;
	bliUUID = bliData.uuid;

	if (bliData.itemCount >= maxItems) {
		$bonusProductList.find('.button-select-bonus').attr('disabled', 'disabled');
	}

	var cartItems = $bonusProductList.find('.selected-bonus-item');
	cartItems.each(function() {
		var ci = $(this);
		var product = {
			uuid: ci.data('uuid'),
			pid: ci.data('pid'),
			qty: ci.find('.item-qty').text(),
			name: ci.find('.item-name').html(),
			attributes: {}
		};
		var attributes = ci.find('ul.item-attributes li');
		attributes.each(function (){
			var li = $(this);
			product.attributes[li.data('attributeId')] = {
				displayName:li.children('.display-name').html(),
				displayValue:li.children('.display-value').html()
			};
		});
		selectedList.push(product);
	});

	$bonusProductList.on('click', '.bonus-product-item a[href].swatchanchor', function (e) {
		e.preventDefault();
	})
	.on('change', '.input-text', function (e){
		$bonusProductList.find('.button-select-bonus').removeAttr('disabled');
		$(this).closest('.bonus-product-form').find('.quantity-error').text('');
	})
	.on('click', '.button-select-bonus', function (e) {
		e.preventDefault();
		if (selectedList.length>=maxItems) {
			$bonusProductList.find('.button-select-bonus').attr('disabled', 'disabled');
			$bonusProductList.find('.bonus-items-available').text('0');
			return;
		}

		var form = $(this).closest('.bonus-product-form'),
			detail = $(this).closest('.product-detail');
			uuid = form.find('input[name="productUUID"]').val(),
			qtyVal = form.find('input[name="Quantity"]').val(),
			qty = isNaN(qtyVal) ? 1 : (+qtyVal);

		if (qty > maxItems) {
			$bonusProductList.find('.button-select-bonus').attr('disabled', 'disabled');
			form.find('.quantity-error').text(Resources.BONUS_PRODUCT_TOOMANY);
			return;
		}

		var product = {
			uuid: uuid,
			pid: form.find('input[name="pid"]').val(),
			qty: qty,
			name: detail.find('.product-name').text(),
			attributes: detail.find('.product-variations').data('current'),
			options: []
		};

		var optionSelects = form.find('.product-option');

		optionSelects.each(function (idx) {
			product.options.push({
				name: this.name,
				value: $(this).val(),
				display: $(this).children(':selected').first().html()
			});
		});
		selectedList.push(product);
		updateSummary();
	})
	.on('click', '.remove-link', function(e){
		e.preventDefault();
		var container = $(this).closest('.selected-bonus-item');
		if (!container.data('uuid')) { return; }

		var uuid = container.data('uuid');
		var i, len = selectedList.length;
		for (i = 0; i < len; i++) {
			if (selectedList[i].uuid === uuid) {
				selectedList.splice(i,1);
				break;
			}
		}
		updateSummary();
	})
	.on('click', '.add-to-cart-bonus', function (e) {
		e.preventDefault();
		var url = util.appendParamsToUrl(Urls.addBonusProduct, {bonusDiscountLineItemUUID: bliUUID});
		var bonusProducts = getBonusProducts();
		if (bonusProducts.bonusproducts[0].product.qty > maxItems) {
			bonusProducts.bonusproducts[0].product.qty = maxItems;
		}
		// make the server call
		$.ajax({
			type: 'POST',
			dataType: 'json',
			cache: false,
			contentType: 'application/json',
			url: url,
			data: JSON.stringify(bonusProducts)
		})
		.done(function (response) {
			// success
			page.refresh();
		})
		.fail(function (xhr, textStatus) {
			// failed
			if (textStatus === 'parsererror') {
				window.alert(Resources.BAD_RESPONSE);
			} else {
				window.alert(Resources.SERVER_CONNECTION_ERROR);
			}
		})
		.always(function () {
			$bonusProduct.dialog('close');
		});
	});
}

var bonusProductsView = {
	/**
	 * @function
	 * @description Opens the bonus product quick view dialog
	 */
	show : function (url) {
		var $bonusProduct = $('#bonus-product-dialog');
		// create the dialog
		dialog.create({
			target : $bonusProduct,
			options : {
				width: 795,
				dialogClass : 'quickview',
				title : Resources.BONUS_PRODUCTS
			}
		});

		// load the products then show
		ajax.load({
			target: $bonusProduct,
			url: url,
			callback: function () {
				$bonusProduct.dialog('open');
				initializeGrid();
				$('#bonus-product-dialog .emptyswatch').css('display','none');
			}
		});

	},
	/**
	 * @function
	 * @description Closes the bonus product quick view dialog
	 */
	close: function () {
		$bonusProduct.dialog('close');
	},
	/**
	 * @function
	 * @description Loads the list of bonus products into quick view dialog
	 */
	loadBonusOption: function () {
		var	$bonusDiscountContainer = $('.bonus-discount-container');
		if ($bonusDiscountContainer.length === 0) { return; }

		dialog.create({
			target : $bonusDiscountContainer,
			options : {
				height : 'auto',
				width : 350,
				dialogClass : 'quickview',
				title : Resources.BONUS_PRODUCT
			}
		});
		$bonusDiscountContainer.dialog('open');

		// add event handlers
		$bonusDiscountContainer.on('click', '.select-bonus-btn', function (e) {
			e.preventDefault();
			var uuid = $bonusDiscountContainer.data('lineitemid');
			var url = util.appendParamsToUrl(Urls.getBonusProducts, {
				bonusDiscountLineItemUUID: uuid,
				source: 'bonus'
			 });

			$bonusDiscountContainer.dialog('close');
			this.show(url);
		}.bind(this)).on('click', '.no-bonus-btn', function (e) {
			$bonusDiscountContainer.dialog('close');
		});
	},
};

module.exports = bonusProductsView;
},{"./ajax":2,"./dialog":6,"./page":12,"./util":38}],4:[function(require,module,exports){
'use strict';

/**
 * @function
 * @description capture recommendation of each product when it becomes visible in the carousel
 * @param c TBD
 * @param {Element} li The visible product element in the carousel
 * @param index TBD
 * @param state TBD
 */

function captureCarouselRecommendations(c, li, index, state) {
	if (!dw) { return; }

	$(li).find(".capture-product-id").each(function () {
		dw.ac.capture({
			id : $(this).text(),
			type : dw.ac.EV_PRD_RECOMMENDATION
		});
	});
}

var components = {
	carouselSettings : {
		scroll : 1,
		itemFallbackDimension: '100%',
		itemVisibleInCallback : app.captureCarouselRecommendations
	},
	init : function () {
		setTimeout(function(){
			// renders horizontal/vertical carousels for product slots
			$('#vertical-carousel').jcarousel($.extend({vertical : true}, this.carouselSettings));
			$('#horizontal-carousel').jcarousel(this.carouselSettings);
		}.bind(this), 1000);
	}
};

module.exports = components;
},{}],5:[function(require,module,exports){
'use strict';

/** @function cookieprivacy	Used to display/control the scrim containing the cookie privacy code **/

module.exports = function () {
	/**
	 * if we have not accepted cookies AND we're not on the Privacy Policy page, then show the notification
	 *
	 * NOTE: You will probably want to adjust the Privacy Page test to match your site's specific privacy / cookie page
	 */
	if (HasCookieAsset == true && document.cookie.indexOf('dw_cookies_accepted') < 0) {
		// Show the Content Asset
		if ($('h1.content-header').length == 0 || $('h1.content-header')[0].textContent.indexOf('Privacy Policy') < 0) {
			$('#overlay-background').css('display','block');
			$('#cookie-hint').css('display','block');
		}
	} else {
		// Otherwise, we don't need to show the asset, just enable the cookies
		enable_cookies();
	}

	// Close Button handler
	/**
	 * NOTE: The Close Button handler does the same thing as the 'I Accept" handler - it sets the cookies
	 * and clears the cookie notification.  In a strict situation where you MUST actively accept the cookies
	 * before proceeding, we recommend removing this button from the content asset as well as this handler.
	 */
	$('.privacy_close_noaction').on('click', function () {
		enable_cookies();
		close_all();
	});

	// Accept Button handler
	$('.privacypolicy_agreebtn').on('click', function () {
		enable_cookies();
		close_all();
	});

	function enable_cookies() {
		if (document.cookie.indexOf('dw=1') < 0) {
			document.cookie = 'dw=1; path=/';
		}
		if (document.cookie.indexOf('dw_cookies_accepted') < 0) {
			document.cookie = 'dw_cookies_accepted=1; path=/';
		}
	}

	function close_all() {
		$('#overlay-background').hide();
		$('#cookie-hint').hide();
	};
}
},{}],6:[function(require,module,exports){
'use strict';

var ajax = require('./ajax'),
	util = require('./util');

var dialog = {
	/**
	 * @function
	 * @description Appends a dialog to a given container (target)
	 * @param {Object} params  params.target can be an id selector or an jquery object
	 */
	create: function (params) {
		var id;
		// options.target can be an id selector or an jquery object
		var target = $(params.target || "#dialog-container");

		// if no element found, create one
		if (target.length === 0) {
			if (target.selector && target.selector.charAt(0) === "#") {
				id = target.selector.substr(1);
			}
			target = $("<div>").attr("id", id).addClass("dialog-content").appendTo("body");
		}

		// create the dialog
		this.container = target;
		this.container.dialog($.extend(true, {}, this.settings, params.options || {}));
		return this.container;
	},
	/**
	 * @function
	 * @description Opens a dialog using the given url (params.url)
	 * @param {Object} params.url should contain the url
	 */
	open: function (params) {
		if (!params.url || params.url.length === 0) { return; }

		this.container = this.create(params);
		params.url = util.appendParamsToUrl(params.url, {format:"ajax"});

		// finally load the dialog
		ajax.load({
			target : this.container,
			url : params.url,
			callback : function () {
				if (this.container.dialog("isOpen")) {return;}
				this.container.dialog("open");
			}.bind(this)
		});

	},
	/**
	 * @function
	 * @description Closes the dialog and triggers the "close" event for the dialog
	 */
	close: function () {
		if(!this.container) {
			return;
		}
		this.container.dialog("close");
	},
	/**
	 * @function
	 * @description Submits the dialog form with the given action
	 * @param {String} The action which will be triggered upon form submit
	 */
	submit: function (action) {
		var form = this.container.find("form:first");
		// set the action
		$("<input/>").attr({
			name: action,
			type: "hidden"
		}).appendTo(form);

		// serialize the form and get the post url
		var post = form.serialize();
		var url = form.attr("action");

		// post the data and replace current content with response content
		$.ajax({
			type: "POST",
			url: url,
			data: post,
			dataType: "html",
			success: function (data) {
				this.container.html(data);
			}.bind(this),
			failure: function (data) {
				window.alert(Resources.SERVER_ERROR);
			}
		});
	},
	settings: {
		autoOpen: false,
		resizable: false,
		bgiframe: true,
		modal: true,
		height: 'auto',
		width: '800',
		buttons: {},
		title: '',
		position: 'center',
		overlay: {
			opacity: 0.5,
			background: "black"
		},
		/**
		 * @function
		 * @description The close event
		 */
		close: function (event, ui) {
			$(this).dialog("destroy");
		}
	}
};

module.exports = dialog;

},{"./ajax":2,"./util":38}],7:[function(require,module,exports){
'use strict';

var ajax = require('./ajax'),
	util = require('./util');
/**
 * @function
 * @description Load details to a given gift certificate
 * @param {String} id The ID of the gift certificate
 * @param {Function} callback A function to called
 */
exports.checkBalance = function (id, callback) {
	// load gift certificate details
	var url = util.appendParamToURL(Urls.giftCardCheckBalance, "giftCertificateID", id);

	ajax.getJson({
		url: url,
		callback: callback
	});
};

},{"./ajax":2,"./util":38}],8:[function(require,module,exports){
'use strict';

var ajax = require('./ajax'),
	minicart = require('./minicart'),
	util = require('./util');

function setAddToCartHandler(e) {
	e.preventDefault();
	var form = $(this).closest("form");

	var options = {
		url : util.ajaxUrl(form.attr('action')),
		method : 'POST',
		cache: false,
		contentType : 'application/json',
		data : form.serialize()
	};
	$.ajax(options).done(function (response) {
		if( response.success ) {
			ajax.load({
				url : Urls.minicartGC,
				data :{lineItemId : response.result.lineItemId},
				callback : function(response){
					minicart.show(response);
					form.find('input,textarea').val('');
				}
			});
		} else {
			form.find('span.error').hide();
			for( id in response.errors.FormErrors ) {
				var error_el = $('#'+id).addClass('error').removeClass('valid').next('.error');
				if( !error_el || error_el.length===0 ) {
					error_el = $('<span for="'+id+'" generated="true" class="error" style=""></span>');
					$('#'+id).after(error_el);
				}
				error_el.text(response.errors.FormErrors[id].replace(/\\'/g,"'")).show();
			}
			console.log(JSON.stringify(response.errors));
		}
	}).fail(function (xhr, textStatus) {
		// failed
		if (textStatus === "parsererror") {
			window.alert(Resources.BAD_RESPONSE);
		} else {
			window.alert(Resources.SERVER_CONNECTION_ERROR);
		}
	});
}

exports.init = function(){
	$("#AddToBasketButton").on('click', setAddToCartHandler);
}

},{"./ajax":2,"./minicart":10,"./util":38}],9:[function(require,module,exports){
'use strict';
// jQuery extensions

module.exports = function () {
	// params
	// toggleClass - required
	// triggerSelector - optional. the selector for the element that triggers the event handler. defaults to the child elements of the list.
	// eventName - optional. defaults to 'click'
	$.fn.toggledList = function (options) {
		if (!options.toggleClass) { return this; }
		var list = this;
		return list.on(options.eventName || 'click', options.triggerSelector || list.children(), function (e) {
			e.preventDefault();
			var classTarget = options.triggerSelector ? $(this).parent() : $(this);
			classTarget.toggleClass(options.toggleClass);
			// execute callback if exists
			if (options.callback) {options.callback();}
		});
	};

	$.fn.syncHeight = function () {
		var arr = $.makeArray(this);
		arr.sort(function (a, b) {
			return $(a).height() - $(b).height();
		});
		return this.height($(arr[arr.length-1]).height());
	};
}
},{}],10:[function(require,module,exports){
'use strict';

var util = require('./util'),
	bonusProductsView = require('./bonus-products-view');

var timer = {
	id: null,
	clear: function () {
		if (this.id) {
			window.clearTimeout(this.id);
			delete this.id;
		}
	},
	start: function (duration, callback) {
		this.id = setTimeout(callback, duration);
	}
};

var minicart = {
	init : function () {
		this.$el = $('#mini-cart');
		this.$content = this.$el.find('.mini-cart-content');

		var $productList = this.$el.find('.mini-cart-products');
		$productList.children().not(':first').addClass('collapsed');
		$productList.find('.mini-cart-product').append('<div class="mini-cart-toggler">&nbsp;</div>');

		$productList.toggledList({toggleClass : "collapsed", triggerSelector:".mini-cart-toggler", eventName:"click"});

		// events
		this.$el.find('.mini-cart-total').on('mouseenter', function () {
			if (this.$content.not(':visible')) {
				this.slide();
			}
		}.bind(this));

		this.$content.on('mouseenter', function () {
			timer.clear();
		}).on('mouseleave', function () {
			timer.clear();
			timer.start(30, this.close.bind(this));
		}.bind(this));

		this.$el.find('.mini-cart-close').on('click', this.close);
	},
	/**
	 * @function
	 * @description Shows the given content in the mini cart
	 * @param {String} A HTML string with the content which will be shown
	 */
	show : function (html) {
		this.$el.html(html);
		util.scrollBrowser(0);
		this.init();
		this.slide();
		bonusProductsView.loadBonusOption();
	},
	/**
	 * @function
	 * @description Slides down and show the contents of the mini cart
	 */
	slide : function () {
		timer.clear();
		// show the item
		this.$content.slideDown('slow');
		// after a time out automatically close it
		timer.start(6000, this.close.bind(this));
	},
	/**
	 * @function
	 * @description Closes the mini cart with given delay
	 * @param {Number} delay The delay in milliseconds
	 */
	close : function (delay) {
		timer.clear();
		this.$content.slideUp(delay);
	},
};

module.exports = minicart;

},{"./bonus-products-view":3,"./util":38}],11:[function(require,module,exports){
'use strict';

var ajax = require('./ajax'),
	page = require('./page'),
	util = require('./util');

exports.init = function () {
	//listen to the drop down, and make a ajax call to mulitcurrency pipeline
	$('.currency-converter').on('change', function () {
			// request results from server
	 		ajax.getJson({
	 		 	url: util.appendParamsToUrl(Urls.currencyConverter , {
	 		 		format: 'ajax',
	 		 		currencyMnemonic: $('.currency-converter').val()
	 		 	}),
	 		 	callback: function(){
	 				location.reload();
	 		 	}
	 		 });
	});

	//hide the feature if user is in checkout
	if (page.title === 'Checkout'){
		$('.mc-class').css('display','none');
	}
};

},{"./ajax":2,"./page":12,"./util":38}],12:[function(require,module,exports){
'use strict';

var util = require('./util');

var page = {
	title : '',
	type : '',
	params : util.getQueryStringParams(window.location.search.substr(1)),
	redirect : function (newURL) {
		setTimeout('window.location.href="' + newURL + '"', 0);
	},
	refresh : function() {
		setTimeout('window.location.assign(window.location.href);', 500);
	}
};

module.exports = page;
},{"./util":38}],13:[function(require,module,exports){
'use strict';

var giftcert = require('../giftcert'),
	tooltip = require('../tooltip'),
	util = require('../util'),
	dialog = require('../dialog'),
	page = require('../page'),
	validator = require('../validator');

/**
 * @function
 * @description Initializes the events on the address form (apply, cancel, delete)
 * @param {Element} form The form which will be initialized
 */
function initializeAddressForm(form) {
	var $form = $('#edit-address-form');

	$form.find('input[name="format"]').remove();
	tooltip.init();
	//$("<input/>").attr({type:"hidden", name:"format", value:"ajax"}).appendTo(form);

	$form.on('click', '.apply-button', function(e) {
		e.preventDefault();
		var addressId = $form.find('input[name$="_addressid"]');
		addressId.val(addressId.val().replace(/[^\w+-]/g, '-'));
		if (!$form.valid()) {
			return false;
		}
		var url = util.appendParamsToUrl($form.attr('action'),{format: 'ajax'});
		var applyName = $form.find('.apply-button').attr('name');
		var options = {
			url: url,
			data: $form.serialize() + '&' + applyName + '=x',
			type: 'POST'
		};
		$.ajax(options).done(function (data){
			if (typeof(data) !== 'string') {
				if (data.success) {
					dialog.close();
					page.refresh();
				} else {
					alert(data.message);
					return false;
				}
			} else {
				$('#dialog-container').html(data);
				account.init();
				tooltip.init();
			}
		});
	})
	.on('click', '.cancel-button, .close-button', function(e){
		e.preventDefault();
		dialog.close();
	})
	.on('click', '.delete-button', function(e){
		e.preventDefault();
		if (confirm(String.format(Resources.CONFIRM_DELETE, Resources.TITLE_ADDRESS))) {
			var url = util.appendParamsToUrl(Urls.deleteAddress, {
				AddressID: $form.find('#addressid').val(),
				format: 'ajax'
			});
			$.ajax({
				url: url,
				method: 'POST',
				dataType: 'json'
			}).done(function(data){
				if (data.status.toLowerCase() === 'ok') {
					dialog.close();
					page.refresh();
				}
				else if (data.message.length>0) {
					alert(data.message);
					return false;
				}
				else {
					dialog.close();
					page.refresh();
				}
			});
		}
	});

	$('select[id$="_country"]', $form).on('change', function (){
		util.updateStateOptions($form);
	});

	validator.init();
}
/**
 * @private
 * @function
 * @description Toggles the list of Orders
 */
function toggleFullOrder () {
	$('.order-items')
		.find('li.hidden:first')
		.prev('li')
		.append('<a class="toggle">View All</a>')
		.children('.toggle')
		.click(function() {
			$(this).parent().siblings('li.hidden').show();
			$(this).remove();
		});
}
/**
 * @private
 * @function
 * @description Binds the events on the address form (edit, create, delete)
 */
function initAddressEvents() {
	var addresses = $('#addresses');
	if (addresses.length === 0) { return; }

	addresses.on('click', '.address-edit, .address-create', function (e) {
		e.preventDefault();
		dialog.open({
			url: this.href,
			options: {
				open: initializeAddressForm
			}
		});
	}).on('click', '.delete', function (e) {
		e.preventDefault();
		if (confirm(String.format(Resources.CONFIRM_DELETE, Resources.TITLE_ADDRESS))) {
			$.ajax({
				url: util.appendParamsToUrl($(this).attr('href'), {format: 'ajax'}),
				dataType: 'json'
			}).done(function(data){
				if (data.status.toLowerCase() === 'ok') {
					page.redirect(Urls.addressesList);
				} else if (data.message.length>0) {
					alert(data.message);
				} else {
					page.refresh();
				}
			});
		}
	});
}
/**
 * @private
 * @function
 * @description Binds the events of the payment methods list (delete card)
 */
function initPaymentEvents() {
	$('.add-card').on('click', function (e) {
		e.preventDefault();
		dialog.open({
			url: $(e.target).attr('href')
		});
	});

	var paymentList = $('.payment-list');
	if (paymentList.length === 0) { return; }

	util.setDeleteConfirmation(paymentList, String.format(Resources.CONFIRM_DELETE, Resources.TITLE_CREDITCARD));

	$('form[name="payment-remove"]').on('submit', function (e) {
		e.preventDefault();
		// override form submission in order to prevent refresh issues
		var button = $(this).find('.delete');
		$('<input/>').attr({
			type: 'hidden',
			name: button.attr('name'),
			value: button.attr('value') || 'delete card'
		}).appendTo($(this));
		var data = $(this).serialize();
		$.ajax({
			type: 'POST',
			url: $(this).attr('action'),
			data: data
		})
		.done(function (response) {
			page.redirect(Urls.paymentsList);
		});
	});
}
/**
 * @private
 * @function
 * @description init events for the loginPage
 */
function initLoginPage() {
	//o-auth binding for which icon is clicked
	$('.oAuthIcon').bind('click', function () {
		$('#OAuthProvider').val(this.id);
	});

	//toggle the value of the rememberme checkbox
	$('#dwfrm_login_rememberme').bind('change', function() {
		if ($('#dwfrm_login_rememberme').attr('checked')) {
			$('#rememberme').val('true');
		} else {
			$('#rememberme').val('false');
		}
	});

}
/**
 * @private
 * @function
 * @description Binds the events of the order, address and payment pages
 */
function initializeEvents() {
	toggleFullOrder();
	initAddressEvents();
	initPaymentEvents();
	initLoginPage();
}

var account = {
	init: function () {
		initializeEvents();
		giftcert.init();
	},
	initCartLogin: function () {
		initLoginPage();
	}
}

module.exports = account;

},{"../dialog":6,"../giftcert":8,"../page":12,"../tooltip":37,"../util":38,"../validator":39}],14:[function(require,module,exports){
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
},{"../bonus-products-view":3,"../page":12,"../quickview":31,"../storeinventory":36,"../util":38,"./account":13}],15:[function(require,module,exports){
'use strict';

var util = require('../../util');
var shipping = require('./shipping');

/**
 * @function
 * @description Selects the first address from the list of addresses
 */
exports.init = function () {
	var $form = $('.address');
	// select address from list
	$('select[name$="_addressList"]', $form).on('change', function () {
		var selected = $(this).children(':selected').first();
		var selectedAddress = $(selected).data('address');
		if (!selectedAddress) { return; }
		util.fillAddressFields(selectedAddress, $form);
		shipping.updateShippingMethodList();
		// re-validate the form
		$form.validate().form();
	});

	// update state options in case the country changes
	$('select[id$="_country"]', $form).on('change', function () {
		util.updateStateOptions($form);
	});
}

},{"../../util":38,"./shipping":20}],16:[function(require,module,exports){
'use strict';

var ajax = require('../../ajax'),
	formPrepare = require('./formPrepare'),
	giftcard = require('../../giftcard'),
	util = require('../../util'),
	validator = require('../../validator');

/**
 * @function
 * @description Fills the Credit Card form with the passed data-parameter and clears the former cvn input
 * @param {Object} data The Credit Card data (holder, type, masked number, expiration month/year)
 */
function setCCFields(data) {
	var $creditCard = $("#PaymentMethod_CREDIT_CARD");
	$creditCard.find('input[name$="creditCard_owner"]').val(data.holder);
	$creditCard.find('select[name$="_type"]').val(data.type);
	$creditCard.find('input[name$="_number"]').val(data.maskedNumber);
	$creditCard.find('[name$="_month"]').val(data.expirationMonth);
	$creditCard.find('[name$="_year"]').val(data.expirationYear);
	$creditCard.find('input[name$="_cvn"]').val('');

	// remove error messages
	$creditCard.find(".errormessage").removeClass("errormessage").filter("span").remove();
	$creditCard.find(".errorlabel").removeClass("errorlabel");
}

/**
 * @function
 * @description Updates the credit card form with the attributes of a given card
 * @param {String} cardID the credit card ID of a given card
 */
function populateCreditCardForm(cardID) {
	// load card details
	var url = util.appendParamToURL(Urls.billingSelectCC, "creditCardUUID", cardID);
	ajax.getJson({
		url: url,
		callback: function (data) {
			if(!data) {
				window.alert(Resources.CC_LOAD_ERROR);
				return false;
			}
			setCCFields(data);
		}
	});
}

/**
 * @function
 * @description Changes the payment method form depending on the passed paymentMethodID
 * @param {String} paymentMethodID the ID of the payment method, to which the payment method form should be changed to
 */
function changePaymentMethod(paymentMethodID) {
	var $paymentMethods = $('.payment-method');
	$paymentMethods.removeClass('payment-method-expanded');
	var pmc = $paymentMethods.filter('#PaymentMethod_' + paymentMethodID);
	if (pmc.length===0) {
		pmc = $('#PaymentMethod_Custom');
	}
	pmc.addClass('payment-method-expanded');

	// ensure checkbox of payment method is checked
	$('#is-' + paymentMethodID)[0].checked = true;

	var bmlForm = $('#PaymentMethod_BML');
	bmlForm.find('select[name$="_year"]').removeClass('required');
	bmlForm.find('select[name$="_month"]').removeClass('required');
	bmlForm.find('select[name$="_day"]').removeClass('required');
	bmlForm.find('input[name$="_ssn"]').removeClass('required');

	if (paymentMethodID === 'BML') {
		var yr = bmlForm.find('select[name$="_year"]');
		bmlForm.find('select[name$="_year"]').addClass('required');
		bmlForm.find('select[name$="_month"]').addClass('required');
		bmlForm.find('select[name$="_day"]').addClass('required');
		bmlForm.find('input[name$="_ssn"]').addClass('required');
	}
	validator.init();
	formPrepare.init('[name$="billing_save"]', 'form[id$="billing"]');
}

/**
 * @function
 * @description loads billing address, Gift Certificates, Coupon and Payment methods
 */
exports.init = function () {
	var $checkoutForm = $('.checkout-billing'),
		$paymentMethodId = $('input[name$="_selectedPaymentMethodID"]'),
		$addGiftCert = $('#add-giftcert'),
		$giftCertCode = $('input[name$="_giftCertCode"]'),
		$addCoupon = $('#add-coupon'),
		$couponCode = $('input[name$="_couponCode"]');

	if( !$paymentMethodId ) return;

	formPrepare.init('[name$="billing_save"]', 'form[id$="billing"]');

	$paymentMethodId.on('click', function () {
		changePaymentMethod($(this).val());
	});

	// get selected payment method from payment method form
	var $selectedPaymentMethodId = $paymentMethodId.filter(':checked');
	if($('.payment-method-options').length > 0 ){
		changePaymentMethod($selectedPaymentMethodId.length===0 ? 'CREDIT_CARD' : $selectedPaymentMethodId.val());
	}
	// select credit card from list
	$("#creditCardList").on('change', function () {
		var cardUUID = $(this).val();
		if(!cardUUID) { return; }
		populateCreditCardForm(cardUUID);
	});

	// handle whole form submit (bind click to continue checkout button)
	// append form fields of current payment form to this submit
	// in order to validate the payment method form inputs too

	$('button[name$="_billing_save"]').on('click', function (e) {
		// determine if the order total was paid using gift cert or a promotion
		if ($('#noPaymentNeeded').length > 0 && $('.giftcert-pi').length > 0) {
			// as a safety precaution, uncheck any existing payment methods
			$selectedPaymentMethodId.removeAttr('checked');
			// add selected radio button with gift card payment method
			$('<input/>').attr({
				name: $paymentMethodId.first().attr('name'),
				type: 'radio',
				checked: 'checked',
				value: Constants.PI_METHOD_GIFT_CERTIFICATE
			}).appendTo($checkoutForm);
		}

		var tc = $checkoutForm.find('input[name$="bml_termsandconditions"]');
		if ($paymentMethodId.filter(':checked').val()==='BML' && !$checkoutForm.find('input[name$="bml_termsandconditions"]')[0].checked) {
			alert(Resources.BML_AGREE_TO_TERMS);
			return false;
		}

	});

	$('#check-giftcert').on('click', function (e) {
		e.preventDefault();
		$balance = $('.balance');
		if ($giftCertCode.length === 0 || $giftCertCode.val().length === 0) {
			var error = $balance.find('span.error');
			if (error.length===0) {
				error = $('<span>').addClass('error').appendTo($balance);
			}
			error.html(Resources.GIFT_CERT_MISSING);
			return;
		}

		giftcard.checkBalance($giftCertCode.val(), function (data) {
			if (!data || !data.giftCertificate) {
				$balance.html(Resources.GIFT_CERT_INVALID).removeClass('success').addClass('error');
				return;
			}
			$balance.html(Resources.GIFT_CERT_BALANCE + ' ' + data.giftCertificate.balance).removeClass('error').addClass('success');
		});
	});

	$addGiftCert.on('click', function(e) {
		e.preventDefault();
		var code = $giftCertCode.val(),
			$error = $checkoutForm.find('.giftcert-error');
		if (code.length === 0) {
			$error.html(Resources.GIFT_CERT_MISSING);
			return;
		}

		var url = util.appendParamsToUrl(Urls.redeemGiftCert, {giftCertCode: code, format: 'ajax'});
		$.getJSON(url, function(data) {
			var fail = false;
			var msg = '';
			if (!data) {
				msg = Resources.BAD_RESPONSE;
				fail = true;
			} else if (!data.success) {
				msg = data.message.split('<').join('&lt;').split('>').join('&gt;');
				fail = true;
			}
			if (fail) {
				$error.html(msg);
				return;
			} else {
				window.location.assign(Urls.billing);
			}
		});
	});

	$addCoupon.on('click', function(e){
		e.preventDefault();
		var $error = $checkoutForm.find('.coupon-error'),
			code = $couponCode.val();
		if (code.length===0) {
			$error.html(Resources.COUPON_CODE_MISSING);
			return;
		}

		var url = util.appendParamsToUrl(Urls.addCoupon, {couponCode: code,format: 'ajax'});
		$.getJSON(url, function(data) {
			var fail = false;
			var msg = '';
			if (!data) {
				msg = Resources.BAD_RESPONSE;
				fail = true;
			}
			else if (!data.success) {
				msg = data.message.split('<').join('&lt;').split('>').join('&gt;');
				fail = true;
			}
			if (fail) {
				$error.html(msg);
				return;
			}

			//basket check for displaying the payment section, if the adjusted total of the basket is 0 after applying the coupon
			//this will force a page refresh to display the coupon message based on a parameter message
			if(data.success && data.baskettotal==0){
				window.location.assign(Urls.billing);
			}
		});
	});

	// trigger events on enter
	$couponCode.on('keydown', function(e) {
		if (e.which === 13) {
			e.preventDefault();
			$addCoupon.click();
		}
	});
	$giftCertCode.on('keydown', function(e) {
		if (e.which === 13) {
			e.preventDefault();
			$addGiftCert.click();
		}
	});
}

},{"../../ajax":2,"../../giftcard":7,"../../util":38,"../../validator":39,"./formPrepare":17}],17:[function(require,module,exports){
'use strict';

/**
 * @function
 * @description disable continue button on the page if required inputs are not filled
 * @input String the selector string of the continue button
 * @input String the selector string for the form
 */
exports.init = function (continueSelector, formSelector) {
	var $continue = $(continueSelector);
	var $form = $(formSelector);
	var validator = $form.validate();
	var $requiredInputs = $('.required', $form).find(':input');
	// check for required input
	function hasEmptyRequired() {
		// filter out only the visible fields - this allows the checking to work on
		// billing page where some payment methods inputs are hidden
		var requiredValues = $requiredInputs.filter(':visible').map(function () {
			return $(this).val();
		});
		return $.inArray('', requiredValues) !== -1;
	};

	// validate form on init
	if (!hasEmptyRequired()) {
		// only validate form when all required fields are filled to avoid
		// throwing errors on empty form
		if (validator.form()) {
			$continue.removeAttr('disabled');
		}
	} else {
		$continue.attr('disabled', 'disabled');
	}

	function validateInputs() {
		if ($(this).val() === '') {
			$continue.attr('disabled', 'disabled');
		} else {
			// enable continue button on last required field that is valid
			// only validate single field
			if (validator.element(this) && !hasEmptyRequired()) {
				$continue.removeAttr('disabled');
			} else {
				$continue.attr('disabled', 'disabled');
			}
		}
	}

	$requiredInputs.off('change', validateInputs).on('change', validateInputs);
}

},{}],18:[function(require,module,exports){
'use strict';

var address = require('./address'),
	billing = require('./billing'),
	multiship = require('./multiship'),
	shipping = require('./shipping');

/**
 * @function Initializes the page events depending on the checkout stage (shipping/billing)
 */
exports.init = function () {
	address.init();
	if ($('.checkout-shipping').length > 0) {
		shipping.init();
	} else if ($('.checkout-multi-shipping').length > 0) {
		multiship.init();
	} else {
		billing.init();
	}

	//if on the order review page and there are products that are not available diable the submit order button
	if ($('.order-summary-footer').length > 0) {
		if ($('.notavailable').length > 0) {
			$('.order-summary-footer .submit-order .button-fancy-large').attr('disabled', 'disabled');
		}
	}
}

},{"./address":15,"./billing":16,"./multiship":19,"./shipping":20}],19:[function(require,module,exports){
'use strict';

var address = require('./address'),
	formPrepare = require('./formPrepare'),
	dialog = require('../../dialog'),
	util = require('../../util');

/**
 * @function
 * @description Initializes gift message box for multiship shipping, the message box starts off as hidden and this will display it if the radio button is checked to yes, also added event handler to listen for when a radio button is pressed to display the message box
 */
function initMultiGiftMessageBox() {
	$.each( $(".item-list"), function(){
		var $this = $(this),
			$isGiftYes = $this.find('.js-isgiftyes'),
			$isGiftNo = $this.find('.js-isgiftno'),
			$giftMessage = $this.find('.gift-message-text');

		//handle initial load
		if ($isGiftYes.is(':checked')) {
			$giftMessage.css('display','block');
		}

		//set event listeners
		$this.on('change', function(){
			if ($isGiftYes.is(':checked')) {
				$giftMessage.css('display','block');
			} else if ($isGiftNo.is(':checked')) {
				$giftMessage.css('display','none');
			}
		});
	});
}


/**
 * @function
 * @description capture add edit adddress form events
 */
function addEditAddress(target) {
	var $addressForm = $('form[name$="multishipping_editAddress"]'),
		$addressDropdown = $addressForm.find('select[name$=_addressList]'),
		$addressList = $addressForm.find('.address-list'),
		add = true,
		selectedAddressUUID = $(target).parent().siblings('.select-address').val();

	$addressDropdown.on('change', function (e) {
		e.preventDefault();
		var selectedAddress = $addressList.find('select').val();
		if (selectedAddress !== 'newAddress') {
			selectedAddress = $.grep($addressList.data('addresses'), function(add) {
				return add.UUID === selectedAddress;
			})[0];
			add = false;
			// proceed to fill the form with the selected address
			util.fillAddressFields(selectedAddress, $addressForm);
		} else {
			//reset the form if the value of the option is not a UUID
			$addressForm.find('.input-text, .input-select').val('');
		}
	});

	$addressForm.on('click', '.cancel', function (e) {
		e.preventDefault();
		dialog.close();
	});

	$addressForm.on('submit', function (e) {
		e.preventDefault();
		$.getJSON(Urls.addEditAddress, $addressForm.serialize(), function (response) {
			if (!response.success) {
				// @TODO: figure out a way to handle error on the form
				console.log('error!');
				return;
			}
			var address = response.address,
				$shippingAddress = $(target).closest('.shippingaddress'),
				$select = $shippingAddress.find('.select-address'),
				$selected = $select.find('option:selected'),
				newOption = '<option value="' + address.UUID + '">'
					+ ((address.ID) ? '(' + address.ID + ')' : address.firstName + ' ' + address.lastName) + ', '
					+ address.address1 + ', ' + address.city + ', ' + address.stateCode + ', ' + address.postalCode
					+ '</option>';
			dialog.close();
			if (add) {
				$('.shippingaddress select').removeClass('no-option').append(newOption);
				$('.no-address').hide();
			} else {
				$('.shippingaddress select').find('option[value="' + address.UUID + '"]').html(newOption);
			}
			// if there's no previously selected option, select it
			if (!$selected.length > 0 || $selected.val() === '') {
				$select.find('option[value="' + address.UUID + '"]').prop('selected', 'selected').trigger('change');
			}
		});
	});

	//preserve the uuid of the option for the hop up form
	if (selectedAddressUUID) {
		//update the form with selected address
		$addressList.find('option').each(function() {
			//check the values of the options
			if ($(this).attr('value') === selectedAddressUUID) {
				$(this).attr('selected','selected');
				$addressDropdown.trigger('change');
			}
		});
	}
}

/**
 * @function
 * @description shows gift message box in multiship, and if the page is the multi shipping address page it will call initmultishipshipaddress() to initialize the form
 */
exports.init = function () {
	initMultiGiftMessageBox();
	if ($(".cart-row .shippingaddress .select-address").length > 0){
		formPrepare.init({
			continueSelector: '[name$="addressSelection_save"]',
			formSelector: '[id$="multishipping_addressSelection"]'
		});
	}
	$('.edit-address').on('click', 'a', function (e) {
		dialog.open({url: this.href, options: {open: function() {
			address.init();
			addEditAddress(e.target);
		}}});
		// return false to prevent global dialogify event from triggering
		return false;
	});
}

},{"../../dialog":6,"../../util":38,"./address":15,"./formPrepare":17}],20:[function(require,module,exports){
'use strict';

var ajax = require('../../ajax'),
	formPrepare = require('./formPrepare'),
	progress = require('../../progress'),
	tooltip = require('../../tooltip'),
	util = require('../../util');

var shippingMethods;
/**
 * @function
 * @description Initializes gift message box, if shipment is gift
 */
function giftMessageBox() {
	// show gift message box, if shipment is gift
	$(".gift-message-text").toggle($("#is-gift-yes")[0].checked);
}

/**
 * @function
 * @description updates the order summary based on a possibly recalculated basket after a shipping promotion has been applied
 */
function updateSummary() {
	var $summary = $("#secondary.summary");
	// indicate progress
	progress.show($summary);

	// load the updated summary area
	$summary.load(Urls.summaryRefreshURL, function () {
		// hide edit shipping method link
		$summary.fadeIn("fast");
		$summary.find('.checkout-mini-cart .minishipment .header a').hide();
		$summary.find('.order-totals-table .order-shipping .label a').hide();
	});
}

/**
 * @function
 * @description Helper method which constructs a URL for an AJAX request using the
 * entered address information as URL request parameters.
 */
function getShippingMethodURL(url, extraParams) {
	var $form = $('.address');
	var params = {
		address1: $form.find('input[name$="_address1"]').val(),
		address2: $form.find('input[name$="_address2"]').val(),
		countryCode: $form.find('select[id$="_country"]').val(),
		stateCode: $form.find('select[id$="_state"]').val(),
		postalCode: $form.find('input[name$="_postal"]').val(),
		city: $form.find('input[name$="_city"]').val()
	};
	return util.appendParamsToUrl(url, $.extend(params, extraParams));
}

/**
 * @function
 * @description selects a shipping method for the default shipment and updates the summary section on the right hand side
 * @param
 */
function selectShippingMethod(shippingMethodID) {
	// nothing entered
	if(!shippingMethodID) {
		return;
	}
	// attempt to set shipping method
	var url = getShippingMethodURL(Urls.selectShippingMethodsList, {shippingMethodID: shippingMethodID});
	 ajax.getJson({
		url: url,
		callback: function (data) {
			updateSummary();
			if(!data || !data.shippingMethodID) {
				window.alert("Couldn't select shipping method.");
				return false;
			}
			// display promotion in UI and update the summary section,
			// if some promotions were applied
			$(".shippingpromotions").empty();

			// TODO the for loop below isn't doing anything?
			// if (data.shippingPriceAdjustments && data.shippingPriceAdjustments.length > 0) {
			// 	var len = data.shippingPriceAdjustments.length;
			// 	for (var i=0; i < len; i++) {
			// 		var spa = data.shippingPriceAdjustments[i];
			// 	}
			// }
		}
	});
}

/**
 * @function
 * @description Make an AJAX request to the server to retrieve the list of applicable shipping methods
 * based on the merchandise in the cart and the currently entered shipping address
 * (the address may be only partially entered).  If the list of applicable shipping methods
 * has changed because new address information has been entered, then issue another AJAX
 * request which updates the currently selected shipping method (if needed) and also updates
 * the UI.
 */
function updateShippingMethodList() {
	var $shippingMethodList = $("#shipping-method-list");
	if (!$shippingMethodList || $shippingMethodList.length === 0) { return; }
	var url = getShippingMethodURL(Urls.shippingMethodsJSON);

	 ajax.getJson({
		url: url,
		callback: function (data) {
			if(!data) {
				window.alert("Couldn't get list of applicable shipping methods.");
				return false;
			}
			if (shippingMethods && shippingMethods.toString() === data.toString()) {
				// No need to update the UI.  The list has not changed.
				return true;
			}

			// We need to update the UI.  The list has changed.
			// Cache the array of returned shipping methods.
			shippingMethods = data;
			// indicate progress
			progress.show($shippingMethodList);

			// load the shipping method form
			var smlUrl = getShippingMethodURL(Urls.shippingMethodsList);
			$shippingMethodList.load(smlUrl, function () {
				$shippingMethodList.fadeIn("fast");
				// rebind the radio buttons onclick function to a handler.
				$shippingMethodList.find("[name$='_shippingMethodID']").click(function () {
					selectShippingMethod($(this).val());
				});

				// update the summary
				updateSummary();
				progress.hide();
				tooltip.init();
				//if nothing is selected in the shipping methods select the first one
				if ($shippingMethodList.find('.input-radio:checked').length === 0) {
					$shippingMethodList.find('.input-radio:first').attr('checked', true);
				}
			});
		}
	});
}

exports.init = function () {
	formPrepare.init({
		continueSelector: '[name$="shippingAddress_save"]',
		formSelector:'[id$="singleshipping_shippingAddress"]'
	});
	$('#is-gift-yes, #is-gift-no').on('click', function (e) {
		giftMessageBox();
	});

	$('.address').on('change',
		'input[name$="_addressFields_address1"], input[name$="_addressFields_address2"], select[name$="_addressFields_states_state"], input[name$="_addressFields_city"], input[name$="_addressFields_zip"]',
		updateShippingMethodList
	);

	giftMessageBox();
	updateShippingMethodList();
}

exports.updateShippingMethodList = updateShippingMethodList;

},{"../../ajax":2,"../../progress":30,"../../tooltip":37,"../../util":38,"./formPrepare":17}],21:[function(require,module,exports){
'use strict';

var ajax = require('../ajax'),
	page = require('../page'),
	product = require('./product'),
	productTile = require('../product-tile'),
	quickview = require('../quickview');

/**
 * @private
 * @function
 * @description Binds the click events to the remove-link and quick-view button
 */
function initializeEvents() {
	$('#compare-table').on("click", ".remove-link", function (e) {
		e.preventDefault();
		ajax.getJson({
			url : this.href,
			callback : function (response) {
				page.refresh();
			}
		});
	})
	.on("click", ".open-quick-view", function (e) {
		e.preventDefault();
		var form = $(this).closest("form");
		quickview.show({
			url:form.attr("action"),
			source:"quickview",
			data:form.serialize()
		});
	});

	$('#compare-category-list').on("change", function () {
		$(this).closest("form").submit();
	});
}

exports.init = function () {
	productTile.init();
	initializeEvents();
	product.initAddToCart();
}
},{"../ajax":2,"../page":12,"../product-tile":29,"../quickview":31,"./product":23}],22:[function(require,module,exports){
module.exports = function (data, $container) {
	if (!data) {
		$container.find('.availability-msg').html(Resources.ITEM_STATUS_NOTAVAILABLE);
		return;
	}
	var avMsg;
	var avRoot = $container.find('.availability-msg').html('');

	// Look through levels ... if msg is not empty, then create span el
	if (data.levels.IN_STOCK > 0) {
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
	/* TODO: This has never been reached before. Consider removing?
	$addToCart.attr('disabled', 'disabled');
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
	*/
}
},{}],23:[function(require,module,exports){
'use strict';

var ajax = require('../../ajax'),
	cart = require('../cart'),
	components = require('../../components'),
	dialog = require('../../dialog'),
	minicart = require('../../minicart'),
	progress = require('../../progress'),
	quickview = require('../../quickview'),
	sendToFriend = require('../../send-to-friend'),
	storeinventory = require('../../storeinventory'),
	tooltip = require('../../tooltip'),
	util = require('../../util'),
	quantityEvent = require('./events/quantity');

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
	var imgZoom = $('#pdpMain .main-image');
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
	var $mainImage = $('#pdpMain .main-image')
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
			autoOpen : true,
			height : 750,
			width : 650,
			dialogClass : 'writereview',
			title : 'Product Review',
			resizable : false
		});

		dialog.create({
			target : $('#pwrwritediv'),
			options : options
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
	product.initAddThis();
	if (SitePreferences.STORE_PICKUP) {
		storeinventory.buildStoreList($('.product-number span').html());
	}
	// add or update shopping cart line item
	product.initAddToCart();
	$pdpMain.on('change keyup', '.pdpForm input[name="Quantity"]', function (e) {
		var $availabilityContainer = $pdpMain.find('.availability');
		product.getAvailability($('#pid').val(), $(this).val(), function (data) {
			quantityEvent(data, $availabilityContainer);
		});
	});

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
				Quantity : isNaN(qty) ? '1' : qty,
				format : 'ajax'
			};
		if (listid) {params.productlistid = listid;}
		var target = (productSet.length > 0 && productSet.children.length > 0) ? productSet : $('#product-content');
		var url = util.appendParamsToUrl($(this).val(), params);
		progress.show($pdpMain);
		var hasSwapImage = $(this).find('option:selected').attr('data-lgimg') !== null;

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

	$pdpMain.on('hover', '.swatchanchor', function () {
		swapImage(this);
	});

	$pdpMain.on('click', '.product-detail .swatchanchor', function (e) {
		var $this = $(this),
			params = {},
			hasSwapImage, qty,listid, url;

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
			callback: function (data) {
				product.initAddThis();
				product.initAddToCart();
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
				product.initAddToCart($container);
				tooltip.init();
			}
		});
	});

	$addAllToCart.on('click', function (e) {
		e.preventDefault();
		var psForms = $productSetList.find('form').toArray(),
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
				} else {
					quickview.close();
					minicart.show(miniCartHtml);
				}
			});
		}
		addItems();
		return false;
	});
	sendToFriend.initializeDialog($pdpMain);

	$pdpMain.find('.add-to-cart[disabled]').attr('title', $pdpMain.find('.availability-msg').html());
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
		initializeDom();
		initializeEvents();
		loadZoom();
		if (SitePreferences.STORE_PICKUP){
			storeinventory.init();
		}
	},
	readReviews : function(){
		$('.product-tabs').tabs('select','#tab4');
		$('body').scrollTop($('#tab4').offset().top);
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

},{"../../ajax":2,"../../components":4,"../../dialog":6,"../../minicart":10,"../../progress":30,"../../quickview":31,"../../send-to-friend":35,"../../storeinventory":36,"../../tooltip":37,"../../util":38,"../cart":14,"./events/quantity":22}],24:[function(require,module,exports){
'use strict';

var ajax = require('../ajax'),
	product = require('./product'),
	quickview = require('../quickview'),
	sendToFriend = require('../send-to-friend'),
	util = require('../util');

/**
 * @function
 * @description Loads address details to a given address and fills the address form
 * @param {String} addressID The ID of the address to which data will be loaded
 */
function populateForm(addressID, $form) {
	// load address details
	var url = Urls.giftRegAdd + addressID;
	ajax.getJson({
		url: url,
		callback: function (data) {
			if(!data || !data.address) {
				window.alert(Resources.REG_ADDR_ERROR);
				return false;
			}
			// fill the form
			$form.find('[name$="_addressid"]').val(data.address.ID);
			$form.find('[name$="_firstname"]').val(data.address.firstName);
			$form.find('[name$="_lastname"]').val(data.address.lastName);
			$form.find('[name$="_address1"]').val(data.address.address1);
			$form.find('[name$="_address2"]').val(data.address.address2);
			$form.find('[name$="_city"]').val(data.address.city);
			$form.find('[name$="_country"]').val(data.address.countryCode).trigger('change');
			$form.find('[name$="_postal"]').val(data.address.postalCode);
			$form.find('[name$="_state"]').val(data.address.stateCode);
			$form.find('[name$="_phone"]').val(data.address.phone);
			// $form.parent('form').validate().form();
		}
	});
}

/**
 * @private
 * @function
 * @description Initializes events for the gift registration
 */
function initializeEvents() {
	var $form = $('form[name$="_giftregistry"]'),
		$beforeAddress = $form.find('fieldset[name="address-before"]'),
		$afterAddress = $form.find('fieldset[name="address-after"]');

	$('.usepreevent').on('click', function () {
		$(':input', $beforeAddress).each(function () {
			var fieldName = $(this).attr('name'),
				$afterField = $afterAddress.find('[name="' + fieldName.replace('Before', 'After') + '"]');
			$afterField.val($(this).val()).trigger('change');
		});
	})
	$form.on('change', 'select[name$="_addressBeforeList"]', function (e) {
		var addressID = $(this).val();
		if (addressID.length === 0) { return; }
		populateForm(addressID, $beforeAddress);
	})
	.on('change', 'select[name$="_addressAfterList"]', function (e) {
		var addressID = $(this).val();
		if (addressID.length === 0) { return; }
		populateForm(addressID, $afterAddress);
	});

	$beforeAddress.on('change', 'select[name$="_country"]', function () {
		util.updateStateOptions($beforeAddress);
	});

	$afterAddress.on('change', 'select[name$="_country"]', function () {
		util.updateStateOptions($afterAddress);
	});

	$('form[name$="_giftregistry_items"]').on('click', '.item-details a', function (e) {
		e.preventDefault();
		var productListID = $('input[name=productListID]').val();
		quickview.show({
			url : e.target.href,
			source : 'giftregistry',
			productlistid : productListID
		});
	});
}

exports.init = function () {
	initializeEvents();
	product.initAddToCart();
	sendToFriend.initializeDialog('.list-table-header');
	util.setDeleteConfirmation('.item-list', String.format(Resources.CONFIRM_DELETE, Resources.TITLE_GIFTREGISTRY));
};

},{"../ajax":2,"../quickview":31,"../send-to-friend":35,"../util":38,"./product":23}],25:[function(require,module,exports){
'use strict';

var productCompare = require('../product-compare'),
	productTile = require('../product-tile'),
	progress = require('../progress'),
	util = require('../util');

function infiniteScroll() {
	// getting the hidden div, which is the placeholder for the next page
	var loadingPlaceHolder = $('.infinite-scroll-placeholder[data-loading-state="unloaded"]');
	// get url hidden in DOM
	var gridUrl = loadingPlaceHolder.attr('data-grid-url');

	if (loadingPlaceHolder.length === 1 && util.elementInViewport(loadingPlaceHolder.get(0), 250)) {
		// switch state to 'loading'
		// - switches state, so the above selector is only matching once
		// - shows loading indicator
		loadingPlaceHolder.attr('data-loading-state','loading');
		loadingPlaceHolder.addClass('infinite-scroll-loading');

		/**
		 * named wrapper function, which can either be called, if cache is hit, or ajax repsonse is received
		 */
		var fillEndlessScrollChunk = function (html) {
			loadingPlaceHolder.removeClass('infinite-scroll-loading');
			loadingPlaceHolder.attr('data-loading-state','loaded');
			jQuery('div.search-result-content').append(html);
		};

		// old condition for caching was `'sessionStorage' in window && sessionStorage["scroll-cache_" + gridUrl]`
		// it was removed to temporarily address RAP-2649
		if (false) {
			// if we hit the cache
			fillEndlessScrollChunk(sessionStorage['scroll-cache_' + gridUrl]);
		} else {
			// else do query via ajax
			$.ajax({
				type: 'GET',
				dataType: 'html',
				url: gridUrl,
				success: function (response) {
					// put response into cache
					try {
						sessionStorage['scroll-cache_' + gridUrl] = response;
					} catch (e) {
						// nothing to catch in case of out of memory of session storage
						// it will fall back to load via ajax
					}
					// update UI
					fillEndlessScrollChunk(response);
					productTile.init();
				}
			});
		}
	}
};
/**
 * @private
 * @function
 * @description replaces breadcrumbs, lefthand nav and product listing with ajax and puts a loading indicator over the product listing
 */
function updateProductListing() {
	var hash = location.href.split('#')[1];
	if (hash === 'results-content' || hash === 'results-products') { return; }
	var refineUrl;

	if (hash.length > 0) {
		refineUrl = window.location.pathname + "?" + hash;
	} else {
		return;
	}
	progress.show($('.search-result-content'));
	$('#main').load(util.appendParamToURL(refineUrl, 'format', 'ajax'), function () {
		productCompare.init();
		productTile.init();
		progress.hide();
	});
}

/**
 * @private
 * @function
 * @description Initializes events for the following elements:<br/>
 * <p>refinement blocks</p>
 * <p>updating grid: refinements, pagination, breadcrumb</p>
 * <p>item click</p>
 * <p>sorting changes</p>
 */
function initializeEvents() {
	var $main = $('#main');
	// compare checked
	$main.on('click', 'input[type="checkbox"].compare-check', function (e) {
		var cb = $(this);
		var tile = cb.closest('.product-tile');

		var func = this.checked ? productCompare.addProduct : productCompare.removeProduct;
		var itemImg = tile.find('.product-image a img').first();
		func({
			itemid : tile.data('itemid'),
			uuid : tile[0].id,
			img : itemImg,
			cb : cb
		});

	});

	// handle toggle refinement blocks
	$main.on('click', '.refinement h3', function (e) {
		$(this).toggleClass('expanded')
		.siblings('ul').toggle();
	});

	// handle events for updating grid
	$main.on('click', '.refinements a, .pagination a, .breadcrumb-refinement-value a', function (e) {
		if ($(this).parent().hasClass('unselectable')) { return; }
		var catparent = $(this).parents('.category-refinement');
		var folderparent = $(this).parents('.folder-refinement');

		//if the anchor tag is uunderneath a div with the class names & , prevent the double encoding of the url
		//else handle the encoding for the url
		if (catparent.length > 0 || folderparent.length > 0) {
			return true;
		} else {
			var uri = util.getUri(this);
			if (uri.query.length > 1) {
				window.location.hash = uri.query.substring(1);
			} else {
				window.location.href = this.href;
			}
			return false;
		}
	});

	// handle events item click. append params.
	$main.on('click', '.product-tile a:not("#quickviewbutton")', function (e) {
		var a = $(this);
		// get current page refinement values
		var wl = window.location;

		var qsParams = (wl.search.length > 1) ? util.getQueryStringParams(wl.search.substr(1)) : {};
		var hashParams = (wl.hash.length > 1) ? util.getQueryStringParams(wl.hash.substr(1)) : {};

		// merge hash params with querystring params
		var params = $.extend(hashParams, qsParams);
		if (!params.start) {
			params.start = 0;
		}
		// get the index of the selected item and save as start parameter
		var tile = a.closest('.product-tile');
		var idx = tile.data('idx') ? + tile.data('idx') : 0;

		// convert params.start to integer and add index
		params.start = (+params.start) + (idx + 1);
		// set the hash and allow normal action to continue
		a[0].hash = $.param(params);
	});

	// handle sorting change
	$main.on('change', '.sort-by select', function (e) {
		var refineUrl = $(this).find('option:selected').val();
		var uri = util.getUri(refineUrl);
		window.location.hash = uri.query.substr(1);
		return false;
	})
	.on('change', '.items-per-page select', function (e) {
		var refineUrl = $(this).find('option:selected').val();
		if (refineUrl == 'INFINITE_SCROLL') {
			$('html').addClass('infinite-scroll').removeClass('disable-infinite-scroll');
		} else {
			$('html').addClass('disable-infinite-scroll').removeClass('infinite-scroll');
			var uri = util.getUri(refineUrl);
			window.location.hash = uri.query.substr(1);
		}
		return false;
	});

	// handle hash change
	$(window).hashchange(function () {
		updateProductListing();
	});
}

exports.init = function () {
	productCompare.init();
	if (SitePreferences.LISTING_INFINITE_SCROLL) {
		$(window).on('scroll', infiniteScroll);
	}
	productTile.init();
	initializeEvents();
}

},{"../product-compare":28,"../product-tile":29,"../progress":30,"../util":38}],26:[function(require,module,exports){
' use strict';

/**
 * @function
 * @description Triggers the scroll event on a carousel element
 * @param {Object} carousel
 */
function slideCarousel_initCallback(carousel) {
	// create navigation for slideshow
	var numSlides = $('#homepage-slider li').size();
	var slideShowNav = '<div class="jcarousel-control">';
	for (var i = 1; i <= numSlides; i++) {
		slideShowNav = slideShowNav + '<a href="#" class="link-' + i + '">' + i + '</a>';
	}
	slideShowNav = slideShowNav + '</div>';
	$('#homepage-slider .jcarousel-clip').append(slideShowNav);

	$('.jcarousel-control a').bind('click', function() {
		carousel.scroll(jQuery.jcarousel.intval($(this).text()));
		return false;
	});
	$('.slide').width($('#wrapper').width());
}

// TODO what are these TBDs? Check with Carousel API? Use a simpler carousel?
/**
 * @function
 * @description Activates the visibility of the next element in the carousel
 * @param {Object} carousel -- necessity needs TBD!
 * @param {Object} item --  necessity needs TBD!
 * @param {Number} idx Index of the item which should be activated
 * @param {Object} state --  necessity needs TBD!
 */
function slideCarousel_itemVisible(carousel, item, idx, state) {
	$('.jcarousel-control a').removeClass('active');
	$('.jcarousel-control').find('.link-'+idx).addClass('active');
}
exports.init = function () {
	$('#homepage-slider').jcarousel({
		scroll: 1,
		auto: 4,
		buttonNextHTML: null,
		buttonPrevHTML: null,
		itemFallbackDimension: '100%',
		initCallback: slideCarousel_initCallback,
		itemFirstInCallback: slideCarousel_itemVisible
	});
};

},{}],27:[function(require,module,exports){
'use strict';

var page = require('../page'),
	product = require('./product'),
	sendToFriend = require('../send-to-friend'),
	util = require('../util');

exports.init = function () {
	product.initAddToCart();
	sendToFriend.initializeDialog(".list-table-header");
	$('#editAddress').on('change', function () {
		page.redirect(util.appendParamToURL(Urls.wishlistAddress, "AddressID", $(this).val()));
	});

	//add js logic to remove the , from the qty feild to pass regex expression on client side
	$('.option-quantity-desired input').on('focusout', function () {
		$(this).val($(this).val().replace(',',''));
	});
};

},{"../page":12,"../send-to-friend":35,"../util":38,"./product":23}],28:[function(require,module,exports){
'use strict';

var ajax = require('./ajax'),
	page = require('./page'),
	util = require('./util'),
	Promise = require('promise');

var _currentCategory = '',
	MAX_ACTIVE = 6;

/**
 * @private
 * @function
 * @description Verifies the number of elements in the compare container and updates it with sequential classes for ui targeting
 */
function refreshContainer() {
	var $compareContainer = $('#compare-items');
	var $compareItems = $compareContainer.find('.compare-item');
	var numActive = $compareItems.filter('.active').length;

	if (numActive < 2) {
		$('#compare-items-button').attr('disabled', 'disabled');
	} else {
		$('#compare-items-button').removeAttr('disabled');
	}

	// update list with sequential classes for ui targeting

	for (var i = 0; i < $compareItems.length; i++) {
		$compareItems.removeClass('compare-item-' + i);
		$compareItems.eq(i).addClass('compare-item-' + i);
	}

	$compareContainer.toggle(numActive > 0);

}
/**
 * @private
 * @function
 * @description Adds an item to the compare container and refreshes it
 */
function addToList(data) {
	// get the first compare-item not currently active
	var $item = $('#compare-items').find('.compare-item').not('.active').first(),
		$productTile = $('#' + data.uuid);

	if ($item.length === 0) {
		if ($productTile.length > 0) {
			$productTile.find('.compare-check')[0].checked = false;
		}
		window.alert(Resources.COMPARE_ADD_FAIL)
		return;
	} // safety only

	// if already added somehow, return
	if ($('[data-uuid="' + data.uuid + '"]').length > 0) {
		return;
	}
	// set as active item
	$item.addClass('active')
		.attr('data-uuid', data.uuid)
		.data('itemid', data.itemid);

	// replace the item image
	$item.children('.compareproduct').first()
		.attr({
			src: $(data.img).attr('src'),
			alt: $(data.img).attr('alt')
		});

	// refresh container state
	refreshContainer();

	if ($productTile.length === 0) { return; }

	// ensure that the associated checkbox is checked
	$productTile.find('.compare-check')[0].checked = true;
}
/**
 * @private
 * @function
 * description Removes an item from the compare container and refreshes it
 */
function removeFromList(uuid) {
	var $item = $('[data-uuid="' + uuid + '"]');
	if ($item.length === 0) { return; }

	// replace the item image
	$item.children('.compareproduct').first()
		.attr({
			src: Urls.compareEmptyImage,
			alt: Resources.EMPTY_IMG_ALT
		});

	// remove class, data and id from item
	$item.removeClass('active')
		.removeAttr('data-uuid')
		.removeAttr('data-itemid')
		.data('uuid', '')
		.data('itemid', '');

	// use clone to prevent image flash when removing item from list
	var cloneItem = $item.clone();
	$item.remove();
	cloneItem.appendTo($('#compare-items-panel'));
	refreshContainer();

	// ensure that the associated checkbox is not checked
	var $productTile = $('#' + uuid);
	if ($productTile.length === 0 ) {return;}
	$productTile.find('.compare-check')[0].checked = false;
}

function addProductAjax(args) {
	var promise = new Promise(function (resolve, reject) {
		$.ajax({
			url: Urls.compareAdd,
			data: {
				pid: args.itemid,
				category: _currentCategory
			},
			dataType: 'json',
		}).done(function (response) {
			if (!response || !response.success) {
				reject(new Error(Resources.COMPARE_ADD_FAIL));
			} else {
				resolve(response);
			}
		}).fail(function (jqxhr, status, err) {
			reject(new Error(err));
		})
	});
	return promise;
}

/**
 * @function
 * @description Adds product to the compare table
 */
function addProduct(args) {
	var promise;
	var $items = $('#compare-items').find('.compare-item');
	var $cb = $(args.cb);
	var numActive = $items.filter('.active').length;
	if (numActive === MAX_ACTIVE) {
		if (!window.confirm(Resources.COMPARE_CONFIRMATION)) {
			$cb[0].checked = false;
			return;
		}

		// remove product using id
		var $item = $items.first();
		var uuid = $item.data('uuid');
		promise = removeProduct({
			itemid: item.data('itemid'),
			uuid: uuid,
			cb: $('#' + uuid).find('.compare-check')
		});
	} else {
		promise = Promise.resolve(0);
	}
	return promise.then(function () {
		refreshContainer();
		return addProductAjax(args).then(function () {
			addToList(args);
		});
	}).then(null, function (err) {
		if ($cb && $cb.length > 0) {$cb[0].checked = false;}
		window.alert(err.message);
	});
}

/**
 * @function
 * @description Removes product from the compare table
 */
function removeProduct(args) {
	if (!args.itemid) {return;}
	var $cb = args.cb ? $(args.cb) : null;
	var promise = new Promise(function (resolve, reject) {
		$.ajax({
			url: Urls.compareRemove,
			data: {
				pid: args.itemid,
				category: _currentCategory
			},
			dataType: 'json'
		}).done(function (response) {
			if (!response || !response.success) {
				reject(new Error(Resources.COMPARE_REMOVE_FAIL));
			} else {
				resolve(response);
			}
		}).fail(function (jqxhr, status, err) {
			reject(new Error(err));
		});
	});
	return promise.then(function () {
		removeFromList(args.uuid);
	}, function (err) {
		if ($cb && $cb.length > 0) {$cb[0].checked = true;}
		window.alert(err.message);
	});
}

function removeItem($item) {
	var uuid = $item.data('uuid'),
		$productTile = $('#' + uuid);
	removeProduct({
		itemid: $item.data('itemid'),
		uuid: uuid,
		cb: ($productTile.length === 0) ? null : $productTile.find('.compare-check')
	});
	refreshContainer();
}

/**
 * @private
 * @function
 * @description Initializes the DOM-Object of the compare container
 */
function initializeDom() {
	var $compareContainer = $('#compare-items');
	_currentCategory = $compareContainer.data('category') || '';
	var $active = $compareContainer.find('.compare-item').filter('.active');
	$active.each(function () {
		var $proudctTile = $('#' +  $(this).data('uuid'));
		if ($productTile.length === 0) {return;}
		$productTile.find('.compare-check')[0].checked = true;
	});
	// set container state
	refreshContainer();
}

/**
 * @private
 * @function
 * @description Initializes the events on the compare container
 */
function initializeEvents() {
	// add event to buttons to remove products
	$('.compare-item-remove').on('click', function (e) {
		removeItem($(this).closest('.compare-item'));
	});

	// Button to go to compare page
	$('#compare-items-button').on('click', function () {
		page.redirect(util.appendParamToURL(Urls.compareShow, 'category', _currentCategory));
	});

	// Button to clear all compared items
	// rely on refreshContainer to take care of hiding the container
	$('#clear-compared-items').on('click', function () {
		$('#compare-items .active').each(function () {
			removeItem($(this));
		});
	});
}

exports.init = function () {
	initializeDom();
	initializeEvents();
}

exports.addProduct = addProduct;
exports.removeProduct = removeProduct;

},{"./ajax":2,"./page":12,"./util":38,"promise":41}],29:[function(require,module,exports){
'use strict';

var product = require('./pages/product'),
	quickview = require('./quickview');

function initQuickViewButtons() {
	$('.tiles-container .product-image').on('mouseenter', function (e) {
		var $qvButton = $('#quickviewbutton');
		if ($qvButton.length === 0) {
			$qvButton = $('<a id="quickviewbutton"/>');
		}
		var $link = $(this).children('.thumb-link:first');
		$qvButton.attr({
			'href': $link.attr('href'),
			'title': $link.attr('title')
		}).appendTo(this);
		$qvButton.on('click', function (e) {
			e.preventDefault();
			quickview.show({
				url: $(this).attr('href'),
				source: 'quickview',
				callback: product.init
			});
		});
	});
}
/**
 * @private
 * @function
 * @description Initializes events on the product-tile for the following elements:
 * - swatches
 * - thumbnails
 */
function initializeEvents() {
	initQuickViewButtons();

	$('.swatch-list').on('mouseleave', function () {
		// Restore current thumb image
		var $tile = $(this).closest(".grid-tile"),
			$thumb = $tile.find(".product-image a.thumb-link img").filter(":first"),
			data = $thumb.data("current");

		$thumb.attr({
			src : data.src,
			alt : data.alt,
			title : data.title
		});
	});
	$('.swatch-list .swatch').on('click', function (e) {
		e.preventDefault();
		if ($(this).hasClass('selected')) { return; }

		var $tile = $(this).closest('.grid-tile');
		$(this).closest('.swatch-list').find('.swatch.selected').removeClass('selected');
		$(this).addClass('selected');
		$tile.find('.thumb-link').attr('href', $(this).attr('href'));
		$tile.find('name-link').attr('href', $(this).attr('href'));

		var data = $(this).children('img').filter(':first').data('thumb');
		var $thumb = tile.find('.product-image .thumb-link img').filter(':first');
		var currentAttrs = {
			src : data.src,
			alt : data.alt,
			title : data.title
		};
		$thumb.attr(currentAttrs);
		$thumb.data('current', currentAttrs);
	}).on('mouseenter', function () {
		// get current thumb details
		var $tile = $(this).closest('.grid-tile'),
			$thumb = $tile.find('.product-image .thumb-link img').filter(':first'),
			data = $(this).children('img').filter(':first').data('thumb'),
			current = $thumb.data('current');

		// If this is the first time, then record the current img
		if (!current) {
			$thumb.data('current',{
				src: $thumb[0].src,
				alt: $thumb[0].alt,
				title: $thumb[0].title
			});
		}

		// Set the tile image to the values provided on the swatch data attributes
		$thumb.attr({
			src : data.src,
			alt : data.alt,
			title : data.title
		});
	});
}


exports.init = function () {
	var $tiles = $('.tiles-container').find(".product-tile");
	if ($tiles.length===0) { return; }
	$tiles.syncHeight()
		.each(function (idx) {
			$(this).data("idx",idx);
		});
	initializeEvents();
};

},{"./pages/product":23,"./quickview":31}],30:[function(require,module,exports){
'use strict';

var $loader;

/**
 * @function
 * @description Shows an AJAX-loader on top of a given container
 * @param {Element} container The Element on top of which the AJAX-Loader will be shown
 */
var show = function (container) {
	var target = (!container || $(container).length === 0) ? $("body") : $(container);
	$loader = $loader || $(".loader");

	if ($loader.lengt === 0) {
		$loader = $("<div/>").addClass("loader")
			.append($("<div/>").addClass("loader-indicator"), $("<div/>").addClass("loader-bg"));
	}
	return $loader.appendTo(target).show();
};
/**
 * @function
 * @description Hides an AJAX-loader
 */
var hide = function () {
	if ($loader) { 
		$loader.hide(); 
	}
};

exports.show = show;
exports.hide = hide;

},{}],31:[function(require,module,exports){
'use strict';

var ajax = require('./ajax'),
	dialog = require('./dialog'),
	progress = require('./progress'),
	util = require('./util');

var quickview = {
	init : function () {
		if (!this.exists()) {
			this.$container = $('<div/>').attr('id', '#QuickViewDialog').appendTo(document.body);
		}
	},

	initializeQuickViewNav : function(qvUrl) {
		// from the url of the product in the quickview
		var qvUrlTail = qvUrl.substring(qvUrl.indexOf('?')),
			qvUrlPidParam = qvUrlTail.substring(0, qvUrlTail.indexOf('&'));
		qvUrl = qvUrl.substring(0, qvUrl.indexOf('?'));

		if (qvUrlPidParam.indexOf('pid') > 0){
			// if storefront urls are turned off
			// append the pid to the url
			qvUrl = qvUrl + qvUrlPidParam;
		}

		this.searchesultsContainer = $('#search-result-items').parent();
		this.productLinks = this.searchesultsContainer.find('.thumb-link');

		this.btnNext = $('.quickview-next');
		this.btnPrev = $('.quickview-prev');

		if (this.productLinks.length === 0) {
			this.btnNext.hide();
			this.btnPrev.hide();
			return;
		}

		this.btnNext.click(this.navigateQuickview.bind(this));
		this.btnPrev.click(this.navigateQuickview.bind(this));

		var productLinksUrl = '';
		for (var i = 0; i < this.productLinks.length; i++) {
			var productLinksUrlTail = this.productLinks[i].href.substring(this.productLinks[i].href.indexOf('?'));
			var productLinksUrlPidParam = productLinksUrlTail.substring(0, qvUrlTail.indexOf('&'));
			if (productLinksUrlPidParam.indexOf('pid') > 0){
				//append the pid to the url
				//if storefront urls are turned off
				productLinksUrl = this.productLinks[i].href.substring(0, this.productLinks[i].href.indexOf('?'));
				productLinksUrl = productLinksUrl + productLinksUrlPidParam;
			} else {
				productLinksUrl = this.productLinks[i].href.substring(0, this.productLinks[i].href.indexOf('?'));
			}

			if (productLinksUrl == ''){
				productLinksUrl = this.productLinks[i].href;
			}
			if (qvUrl == productLinksUrl) {
				this.productLinkIndex = i;
			}
		}

		if (this.productLinkIndex == this.productLinks.length - 1) {
			this.btnNext.hide();
		}

		if (this.productLinkIndex == 0) {
			this.btnPrev.hide();
		}

		//hide the buttons on the compare page
		if ($('.compareremovecell').length > 0){
			this.btnNext.hide();
			this.btnPrev.hide();
		}
	},
	navigateQuickview : function (e) {
		e.preventDefault();
		var button = $(e.currentTarget);

		if (button.hasClass('quickview-next')) {
			this.productLinkIndex++;
		} else {
			this.productLinkIndex--;
		}

		this.show({
			url : this.productLinks[this.productLinkIndex].href,
			source : 'quickview'
		});
	},

	// show quick view dialog and send request to the server to get the product
	// options.source - source of the dialog i.e. search/cart
	// options.url - product url
	show : function (options) {
		if (!this.exists()) {
			this.init();
		}
		var that = this;
		var target = this.$container;
		var url = options.url;
		var source = options.source;
		var productListId = options.productlistid || '';
		if (source.length > 0) {
			url = util.appendParamToURL(url, 'source', source);
		}
		if (productListId.length > 0) {
			url = util.appendParamToURL(url, 'productlistid', productListId)
		}

		ajax.load({
			target: target,
			url: url,
			callback: function () {
				dialog.create({
					target: target,
					options: {
						height: 'auto',
						width: 920,
						modal: true,
						dialogClass: 'quickview',
						title: 'Product Quickview',
						resizable: false,
						position: 'center',
						open: function() {
							// allow for click outside modal to close the modal
							$('.ui-widget-overlay').on('click', this.close.bind(this));
							if (options.callback) options.callback();
						}.bind(this)
					}
				});
				target.dialog('open');
				this.initializeQuickViewNav(url);
			}.bind(this)
		});
	},
	// close the quick view dialog
	close : function () {
		if (this.exists()) {
			this.$container.dialog('close').empty();
		}
	},
	exists : function () {
		return this.$container && (this.$container.length > 0);
	},
	isActive : function () {
		return this.exists() && (this.$container.children.length > 0);
	}
};

module.exports = quickview;
},{"./ajax":2,"./dialog":6,"./progress":30,"./util":38}],32:[function(require,module,exports){
'use strict';

/**
 * @private
 * @function
 * @description Binds event to the place holder (.blur)
 */
function initializeEvents() {
	$('#q').focus(function () {
		var input = $(this);
		if (input.val() === input.attr('placeholder')) {
			input.val('');
		}
	})
	.blur(function () {
		var input = $(this);
		if (input.val() === '' || input.val() === input.attr('placeholder')) {
			input.val(input.attr('placeholder'));
		}
	})
	.blur();
}

exports.init = initializeEvents;

},{}],33:[function(require,module,exports){
'use strict';
var util = require('./util');

var currentQuery = null,
	lastQuery = null,
	runningQuery = null,
	listTotal = -1,
	listCurrent = -1,
	delay = 30,
	$resultsContainer;
/**
 * @function
 * @description Handles keyboard's arrow keys
 * @param keyCode Code of an arrow key to be handled
 */
function handleArrowKeys(keyCode) {
	switch (keyCode) {
		case 38:
			// keyUp
			listCurrent = (listCurrent <= 0) ? (listTotal - 1) : (listCurrent - 1);
			break;
		case 40:
			// keyDown
			listCurrent = (listCurrent >= listTotal - 1) ? 0 : listCurrent + 1;
			break;
		default:
			// reset
			listCurrent = -1;
			return false;
	}

	$resultsContainer.children().removeClass('selected').eq(listCurrent).addClass('selected');
	$searchField.val($resultsContainer.find('.selected .suggestionterm').first().text());
	return true;
}

var searchsuggest = {
	/**
	 * @function
	 * @description Configures parameters and required object instances
	 */
	init : function (container, defaultValue) {
		var $searchContainer = $(container),
			$searchForm = $searchContainer.find('form[name="simpleSearch"]'),
			$searchField = $searchForm.find('input[name="q"]'),
			fieldDefault = defaultValue;

		// disable browser auto complete
		$searchField.attr('autocomplete', 'off');

		// on focus listener (clear default value)
		$searchField.focus(function () {
			if (!$resultsContainer) {
				// create results container if needed
				$resultsContainer = $('<div/>').attr('id', 'search-suggestions').appendTo($searchContainer);
			}
			if ($searchField.val() === fieldDefault) {
				$searchField.val('');
			}
		});
		// on blur listener
		$searchField.blur(function () {
			setTimeout(this.clearResults, 200);
		}.bind(this));
		// on key up listener
		$searchField.keyup(function (e) {

			// get keyCode (window.event is for IE)
			var keyCode = e.keyCode || window.event.keyCode;

			// check and treat up and down arrows
			if (handleArrowKeys(keyCode)) {
				return;
			}
			// check for an ENTER or ESC
			if(keyCode === 13 || keyCode === 27) {
				this.clearResults();
				return;
			}

			currentQuery = $searchField.val().trim();

			// no query currently running, init a update
			if (runningQuery == null) {
				runningQuery = currentQuery;
				setTimeout('this.suggest()', delay);
			}
		}.bind(this));
	},

	/**
	 * @function
	 * @description trigger suggest action
	 */
	suggest : function() {
		// check whether query to execute (runningQuery) is still up to date and had not changed in the meanwhile
		// (we had a little delay)
		if (runningQuery !== currentQuery) {
			// update running query to the most recent search phrase
			runningQuery = currentQuery;
		}

		// if it's empty clear the results box and return
		if (runningQuery.length === 0) {
			this.clearResults();
			runningQuery = null;
			return;
		}

		// if the current search phrase is the same as for the last suggestion call, just return
		if (lastQuery === runningQuery) {
			runningQuery = null;
			return;
		}

		// build the request url
		var reqUrl = util.appendParamToURL(Urls.searchsuggest, 'q', runningQuery, 'legacy', 'false');

		// execute server call
		$.get(reqUrl, function (data) {
			var suggestionHTML = data,
				ansLength = suggestionHTML.trim().length;

			// if there are results populate the results div
			if (ansLength === 0) {
				this.clearResults();
			} else {
				// update the results div
				$resultsContainer.html(suggestionHTML).fadeIn(200);
			}

			// record the query that has been executed
			lastQuery = runningQuery;
			// reset currently running query
			runningQuery = null;

			// check for another required update (if current search phrase is different from just executed call)
			if (currentQuery !== lastQuery) {
				// ... and execute immediately if search has changed while this server call was in transit
				runningQuery = currentQuery;
				setTimeout("this.suggest()", delay);
			}
			this.hideLeftPanel();
		}.bind(this));
	},
	/**
	 * @function
	 * @description
	 */
	clearResults : function () {
		if (!$resultsContainer) { return; }
		$resultsContainer.fadeOut(200, function() {$resultsContainer.empty()});
	},
	/**
	 * @function
	 * @description
	 */
	hideLeftPanel : function () {
		//hide left panel if there is only a matching suggested custom phrase
		if($('.search-suggestion-left-panel-hit').length == 1 && ($('.search-phrase-suggestion a').text().replace(/(^[\s]+|[\s]+$)/g, '').toUpperCase() == $('.search-suggestion-left-panel-hit a').text().toUpperCase())){
			$('.search-suggestion-left-panel').css('display','none');
			$('.search-suggestion-wrapper-full').addClass('search-suggestion-wrapper');
			$('.search-suggestion-wrapper').removeClass('search-suggestion-wrapper-full');
		}
	}
};

module.exports = searchsuggest;
},{"./util":38}],34:[function(require,module,exports){
'use strict';

var util = require('./util');

var qlen = 0,
	listTotal = -1,
	listCurrent = -1,
	delay = 300,
	fieldDefault = null,
	suggestionsJson = null,
	$searchForm,
	$searchField,
	$searchContainer,
	$resultsContainer;
/**
 * @function
 * @description Handles keyboard's arrow keys
 * @param keyCode Code of an arrow key to be handled
 */
function handleArrowKeys(keyCode) {
	switch (keyCode) {
		case 38:
			// keyUp
			listCurrent = (listCurrent <= 0) ? (listTotal - 1) : (listCurrent - 1);
			break;
		case 40:
			// keyDown
			listCurrent = (listCurrent >= listTotal - 1) ? 0 : listCurrent + 1;
			break;
		default:
			// reset
			listCurrent = -1;
			return false;
	}

	$resultsContainer.children().removeClass('selected').eq(listCurrent).addClass('selected');
	$searchField.val($resultsContainer.find('.selected .suggestionterm').first().text());
	return true;
}
var searchsuggest = {
	/**
	 * @function
	 * @description Configures parameters and required object instances
	 */
	init : function (container, defaultValue) {
		// initialize vars
		$searchContainer = $(container);
		$searchForm = $searchContainer.find('form[name="simpleSearch"]');
		$searchField = $searchForm.find('input[name="q"]');
		fieldDefault = defaultValue;

		// disable browser auto complete
		$searchField.attr('autocomplete', 'off');

		// on focus listener (clear default value)
		$searchField.focus(function () {
			if(!$resultsContainer) {
				// create results container if needed
				$resultsContainer = $('<div/>').attr('id', 'suggestions').appendTo($searchContainer).css({
					'top': $searchContainer[0].offsetHeight,
					'left': 0,
					'width': $searchField[0].offsetWidth
				});
			}
			if($searchField.val() === fieldDefault) {
				$searchField.val('');
			}
		});
		// on blur listener
		$searchField.blur(function () {
			setTimeout(this.clearResults, 200);
		}.bind(this));
		// on key up listener
		$searchField.keyup(function (e) {

			// get keyCode (window.event is for IE)
			var keyCode = e.keyCode || window.event.keyCode;

			// check and treat up and down arrows
			if (handleArrowKeys(keyCode)) {
				return;
			}
			// check for an ENTER or ESC
			if (keyCode === 13 || keyCode === 27) {
				this.clearResults();
				return;
			}

			var lastVal = $searchField.val();

			// if is text, call with delay
			setTimeout(function () { 
				this.suggest(lastVal); 
			}.bind(this), delay);
		}.bind(this));
		// on submit we do not submit the form, but change the window location
		// in order to avoid https to http warnings in the browser
		// only if it's not the default value and it's not empty
		$searchForm.submit(function (e) {
			e.preventDefault();
			var searchTerm = $searchField.val();
			if(searchTerm === fieldDefault || searchTerm.length === 0) {
				return false;
			}
			window.location = util.appendParamToURL($(this).attr('action'), 'q', searchTerm);
		});
	},

	/**
	 * @function
	 * @description trigger suggest action
	 * @param lastValue
	 */
	suggest : function (lastValue) {
		// get the field value
		var part = $searchField.val();

		// if it's empty clear the resuts box and return
		if(part.length === 0) {
			this.clearResults();
			return;
		}

		// if part is not equal to the value from the initiated call,
		// or there were no results in the last call and the query length
		// is longer than the last query length, return
		// #TODO: improve this to look at the query value and length
		if((lastValue !== part) || (listTotal === 0 && part.length > qlen)) {
			return;
		}
		qlen = part.length;

		// build the request url
		var reqUrl = util.appendParamToURL(Urls.searchsuggest, 'q', part, 'legacy', 'true');

		// get remote data as JSON
		$.getJSON(reqUrl, function (data) {
			// get the total of results
			var suggestions = data,
				ansLength = suggestions.length,
				listTotal = ansLength;

			// if there are results populate the results div
			if (ansLength === 0) {
				this.clearResults();
				return;
			}
			suggestionsJson = suggestions;
			var html = '';
			for (var i=0; i < ansLength; i++) {
				html+='<div><div class="suggestionterm">' + suggestions[i].suggestion + '</div><span class="hits">' + suggestions[i].hits + '</span></div>';
			}

			// update the results div
			$resultsContainer.html(html).show().on('hover', 'div', function () {
				$(this).toggleClass = 'selected';
			}).on('click', 'div', function () {
				// on click copy suggestion to search field, hide the list and submit the search
				$searchField.val($(this).children('.suggestionterm').text());
				this.clearResults();
				$searchForm.trigger('submit');
			}.bind(this));
		}.bind(this));
	},
	/**
	 * @function
	 * @description
	 */
	clearResults : function () {
		if (!$resultsContainer) { return; }
		$resultsContainer.empty().hide();
	}
};

module.exports = searchsuggest;
},{"./util":38}],35:[function(require,module,exports){
'use strict';

var ajax = require('./ajax'),
	dialog = require('./dialog'),
	util = require('./util'),
	validator = require('./validator');

var sendToFriend = {
	init: function () {
		var $form = $("#send-to-friend-form"),
			$dialog = $("#send-to-friend-dialog");
		util.limitCharacters();
		$dialog.on('click', '.preview-button, .send-button, .edit-button', function (e) {
			e.preventDefault();
			$form.validate();
			if (!$form.valid()) {
				return false;
			}
			var requestType = $form.find('#request-type');
			if (requestType.length > 0) {
				requestType.remove();
			}
			$('<input/>').attr({id: 'request-type', type: 'hidden', name: $(this).attr('name'), value: $(this).attr('value')}).appendTo($form);
			var data = $form.serialize();
			ajax.load({url:$form.attr("action"),
				data: data,
				target: $dialog,
				callback: function () {
					validator.init();
					util.limitCharacters();
					$('.ui-dialog-content').dialog('option', 'position', 'center');
				}
			});
		})
		.on('click', '.cancel-button, .close-button', function (e) {
			e.preventDefault();
			$dialog.dialog('close');
		});
	},
	initializeDialog : function (eventDelegate) {
		$(eventDelegate).on('click', '.send-to-friend', function (e) {
			e.preventDefault();
			var dlg = dialog.create({
				target: $("#send-to-friend-dialog"),
				options: {
					width: 800,
					height: 'auto',
					title: this.title,
					open: function () {
						sendToFriend.init();
						validator.init();
					}
				}
			});

			var data = util.getQueryStringParams($("form.pdpForm").serialize());
			if (data.cartAction) {
				delete data.cartAction;
			}
			var url = util.appendParamsToUrl(this.href, data);
			url = this.protocol + '//' + this.hostname + ((url.charAt(0) === '/') ? url : ('/' + url));
			ajax.load({
				url: util.ajaxUrl(url),
				target: dlg,
				callback: function () {
					dlg.dialog('open');	 // open after load to ensure dialog is centered
				}
			});
		});
	}
};

module.exports = sendToFriend;

},{"./ajax":2,"./dialog":6,"./util":38,"./validator":39}],36:[function(require,module,exports){
'use strict';

var ajax = require('./ajax'),
	page = require('./page'),
	util = require('./util');

var pid,
	currentTemplate = $('#wrapper.pt_cart').length ? 'cart' : 'pdp';

var storeinventory = {
	init: function () {
		var self = this;
		this.$preferredStorePanel = $('<div id="preferred-store-panel">');
		// check for items that trigger dialog
		$('#cart-table .set-preferred-store').on('click', function (e) {
			e.preventDefault();
			self.loadPreferredStorePanel($(this).parent().attr('id'));
		});

		//disable the radio button for home deliveries if the store inventory is out of stock
		$('#cart-table .item-delivery-options .home-delivery .not-available').each(function(){
			$(this).parents('.home-delivery').children('input').attr('disabled','disabled');
		});

		$('body').on('click', '#pdpMain .set-preferred-store', function (e) {
			self.loadPreferredStorePanel($(this).parent().attr('id'));
			return false;
		});

		$('.item-delivery-options input.radio-url').on('click', function () {
			self.setLineItemStore($(this));
		});

		if ($(".checkout-shipping").length > 0) {
			this.shippingLoad();
		}

		//disable the cart button if there is pli set to instore and the status is 'Not Available' and it is marked as an instore pli
		$('.item-delivery-options').each(function () {
			var $instore = $(this).children('.instore-delivery');
			if (($instore.children('input').attr('disabled') === 'disabled')
				&& ($instore.children('.selected-store-availability').children('.store-error').length > 0)
				&& ($instore.children('input').attr('checked') === 'checked')) {
				$('.cart-action-checkout button').attr('disabled', 'disabled');
			}
		});
	},
	setLineItemStore: function(radio) {
		// @TODO refactor DOM manipulation
		$(radio).parent().parent().children().toggleClass('hide');
		$(radio).parent().parent().toggleClass('loading');
		ajax.getJson({
			url: util.appendParamsToUrl($(radio).attr('data-url') , {storeid : $(radio).siblings('.storeid').attr('value')}),
			callback: function(data){
				$(radio).attr('checked','checked');
				$(radio).parent().parent().toggleClass('loading');
				$(radio).parent().parent().children().toggleClass('hide');
			}
		});

		//scan the plis to see if there are any that are not able to go through checkout, if none are found re-enable the checkout button
		var countplis = 0;
		$('.item-delivery-options').each(function(){
			var $instore = $(this).children('.instore-delivery');
			if (($instore.children('input').attr('disabled') === 'disabled')
				&& ($instore.children('.selected-store-availability').children('.store-error').length > 0)
				&& ($instore.children('input').attr('checked') === 'checked')) {
					$('.cart-action-checkout button').attr('disabled', 'disabled');
				} else {
					countplis++;
				}
			});
			if (countplis > 0 && $('.error-message').length === 0){
				$('.cart-action-checkout button').removeAttr("disabled", "disabled")
			}
	},
	buildStoreList: function (pid) {
		var self = this;
		this.$storeList = $('<div class="store-list">');
		// request results from server
		ajax.getJson({
			url: util.appendParamsToUrl(Urls.storesInventory, {
				pid: pid,
				zipCode: User.zip
			}),
			callback: function (data) {
				// clear any previous results, then build new
				self.$storeList.empty();
				var listings = $("<ul class='store-list'/>");
				if (data && data.length > 0) {
					for (var i = 0; i < 10 && i < data.length; i++) {
						var item = data[i],
							displayButton;
						//Disable button if there is no stock for item
						if (item.statusclass == 'store-in-stock') {
							displayButton = '<button value="' + item.storeId + '" class="button-style-1 select-store-button" data-stock-status="' + item.status+'">' + Resources.SELECT_STORE + '</button>';
						} else {
							displayButton = '<button value="' + item.storeId + '" class="button-style-1 select-store-button" data-stock-status="' + item.status + '" disabled="disabled">' + Resources.SELECT_STORE + '</button>';
						}

						listings.append('<li class="store-' + item.storeId + item.status.replace(/ /g, '-') + ' store-tile">' +
							'<span class="store-tile-address ">' + item.address1 + ',</span>' +
							'<span class="store-tile-city ">' + item.city + '</span>' +
							'<span class="store-tile-state ">' + item.stateCode + '</span>' +
							'<span class="store-tile-postalCode ">' + item.postalCode + '</span>' +
							'<span class="store-tile-status ' + item.statusclass + '">' + item.status + '</span>' +
							displayButton +
							'</li>');
					}
				// no records
				} else {
					if (User.zip) {
						self.$storeList.append("<div class='no-results'>No Results</div>");
					}
				}

				// set up pagination for results
				var storeTileWidth = 176,
					numListings = listings.find('li').size(),
					listingsNav = $('<div id="listings-nav"/>'),
					selectedButtonText;
				for (var i = 0, link = 1; i <= numListings; i++) {
					if (numListings >  i) {
						listingsNav.append('<a data-index="'+ i +'">'+link+'</a>');
					}
					link++;
					i = i + 2;
				}
				listingsNav.find('a').on('click', function () {
					$(this).siblings().removeClass('active');
					$(this).addClass('active');
					$('.store-list').animate({
						'left': storeTileWidth * $(this).data('index') * - 1
					}, 1000);
				}).first().addClass('active');
				self.$storeList.after(listingsNav);

				// check for preferred store id, highlight, move to top
				if (currentTemplate === 'cart'){
					selectedButtonText = Resources.SELECTED_STORE;
				} else {
					selectedButtonText = Resources.PREFERRED_STORE;
				}
				listings.find('.store-' + User.storeId).addClass('selected').find('.select-store-button ').text(selectedButtonText);

				self.bubbleStoreUp(listings, User.storeId);

				// if there is a block to show results on page (pdp)
				if (currentTemplate !== 'cart') {
					var onPageList = listings.clone(),
						$div = $('div#' + pid);
					$div.find('.store-list').remove();
					$div.append(onPageList);

					if (onPageList.find('li').size() > 1) {
						$div.find('li:gt(0)').each(function(){
							$(this).addClass('extended-list');
						});
						$('.more-stores').remove();
						$div.after('<span class="more-stores">' + Resources.SEE_MORE + '</span>');
						$div.parent().find('.more-stores').on('click', function () {
							if ($(this).text() ===  Resources.SEE_MORE) {
								$(this).text(Resources.SEE_LESS).addClass('active');
							} else {
								$(this).text(Resources.SEE_MORE).removeClass('active');
							}
							$div.find(' ul.store-list').toggleClass('expanded');
						});
					}
				}

				// update panel with new list
				listings.width(numListings * storeTileWidth).appendTo(self.$storeList);

				// set up 'set preferred store' action on new elements
				// @TODO this needs to be refactored
				listings.find('button.select-store-button').on('click', function (e) {
					var $this = $(this);
					var selectedStoreId = $this.val();
					if (currentTemplate === 'cart') {
						//update selected store and set the lineitem
						var liuuid = self.$preferredStorePanel.find('.srcitem').attr('value');
						$('div[name="' + liuuid + '-sp"] .selected-store-address').html(
							$this.siblings('.store-tile-address').text()
							+ ' <br />'
							+ $this.siblings('.store-tile-city').text()
							+ ' , '
							+ $this.siblings('.store-tile-state').text()
							+ ' '
							+$this.siblings('.store-tile-postalCode').text()
						);
						$('div[name="' + liuuid + '-sp"] .storeid').val($this.val());
						$('div[name="' + liuuid + '-sp"] .selected-store-availability').html($this.siblings('.store-tile-status'));
						$('div[name="' + liuuid + '-sp"] .radio-url').removeAttr('disabled');
						$('div[name="' + liuuid + '-sp"] .radio-url').click();
						self.$preferredStorePanel.dialog("close");
					} else {
						if (User.storeId !== selectedStoreId) {
							// set as selected
							self.setPreferredStore(selectedStoreId);
							self.bubbleStoreUp (onPageList, selectedStoreId);
							$('.store-list li.selected').removeClass('selected').find('.select-store-button').text(Resources.SELECT_STORE);
							$('.store-list li.store-' + selectedStoreId + ' .select-store-button').text(Resources.PREFERRED_STORE).parent().addClass('selected');
						}
					}
					//if there is a dialog box open in the cart for editing a pli and the user selected a new store
					//add an event to for a page refresh on the cart page if the update button has not been clicked
					//reason - the pli has been updated but the update button was not clicked, leaving the cart visually in accurate.
					//when the update button is clicked it forces a refresh.
					if ($('#cart-table').length > 0 && $('.select-store-button').length > 0) {
						$('.ui-dialog .ui-icon-closethick:first').bind('click', function (){
							page.refresh();
						});
					}
				});
			} // end ajax callback
		});
	},

	bubbleStoreUp: function(list, id) {
		var preferredEntry = list.find('li.store-' + id).clone();
		preferredEntry.removeClass('extended-list');
		list.find('.store-tile').not('extended-list').addClass('extended-list');
		list.find('.store-' + id).remove();
		list.prepend(preferredEntry);
	},

	loadPreferredStorePanel: function(pid) {
		var self = this;
		//clear error messages from other product tiles if they exists in the dom
		this.$preferredStorePanel.find('.error-message').remove();

		// clear any previous results
		this.$preferredStorePanel.empty();

		// show form if no zip set
		if (User.zip === null || User.zip === '') {
			this.$preferredStorePanel.append('<div><input type="text" id="userZip" class="entered-zip" placeholder="'
					+ Resources.ENTER_ZIP
					+ '"/><button id="set-user-zip" class="button-style-1">'
					+ Resources.SEARCH
					+ '</button></div>')
				.find('#set-user-zip').on('click', function () {
					var enteredZip = $('.ui-dialog #preferred-store-panel input.entered-zip').last().val();
					var regexObj = {
						canada: /^[ABCEGHJKLMNPRSTVXY]\d[ABCEGHJKLMNPRSTVWXYZ]( )?\d[ABCEGHJKLMNPRSTVWXYZ]\d$/i,
						usa: /^\d{5}(-\d{4})?$/
					};
					var validZipEntry = false;

					//check Canadian postal code
					var regexp = new RegExp(regexObj.canada);
					if (regexp.test(enteredZip)) {
						validZipEntry = true;
					}
					//check us zip codes
					var regexp = new RegExp(regexObj.usa);
					if (regexp.test(enteredZip)) {
						validZipEntry = true;
					}
					//good zip
					if (validZipEntry) {
						$('#preferred-store-panel .error-message').remove();
						self.setUserZip(enteredZip);
						self.loadPreferredStorePanel(pid);
					//bad zip
					} else {
						if ($('#preferred-store-panel .error-message').length == 0){
							$('#preferred-store-panel div').append('<div class="error-message">' + Resources.INVALID_ZIP + '</div>');
						}
					}
				});
			$('#userZip').on('keypress', function (e) {
				code = e.keyCode ? e.keyCode : e.which;
				if (code.toString() === 13) {
					$('#set-user-zip').trigger('click');
				}
			});

			// clear any on-page results
			$('.store-stock .store-list').remove();
			$('.availability .more-stores').remove();

		// zip is set, build list
		} else {
			this.buildStoreList(pid);
			this.$preferredStorePanel
				.append('<div>For ' + User.zip + ' <span class="update-location">' + Resources.CHANGE_LOCATION + '</span></div>')
				.append(this.$storeList);
			this.$preferredStorePanel.find('.update-location').on('click', function () {
				this.setUserZip(null);
				this.loadPreferredStorePanel(pid);
			}.bind(this));
		}

		// append close button for pdp
		if (currentTemplate !== 'cart') {
			if (User.storeId !== null) {
				this.$preferredStorePanel.append('<button class="close button-style-1  set-preferred-store">' + Resources.CONTINUE_WITH_STORE + '</button>');
			} else if (User.zip !== null) {
				this.$preferredStorePanel.append('<button class="close button-style-1">' + Resources.CONTINUE + '</button>');
			}
		} else {
			this.$preferredStorePanel.append('<input type="hidden" class="srcitem" value="' + pid + '">');
		}

		// open the dialog
		this.$preferredStorePanel.dialog({
			width: 550,
			autoOpen: true,
			modal: true,
			title: Resources.STORE_NEAR_YOU
		});

		// action for close/continue
		$('.close').on('click', function () {
			this.$preferredStorePanel.dialog('close');
		}.bind(this));

		//remove the continue button if selecting a zipcode
		if (User.zip === null || User.zip === '') {
			this.$preferredStorePanel.find('.set-preferred-store').last().remove();
		}

		//disable continue button if a preferred store has not been selected
		if ($('.store-list .selected').length > 0){
			this.$preferredStorePanel.find('.close').attr('disabled', false);
		} else {
			this.$preferredStorePanel.find('.close').attr('disabled', true);
		}
	},

	setUserZip: function(zip) {
		User.zip = zip;
		$.ajax({
			type: 'POST',
			url: Urls.setZipCode,
			data: {
				zipCode: zip
			}
		});
	},

	setPreferredStore: function(id) {
		User.storeId = id;
		$.post(Urls.setPreferredStore, {storeId: id}, function(data) {
			$('.selected-store-availability').html(data);
			//enable continue button when a preferred store has been selected
			$('#preferred-store-panel .close').attr('disabled', false);
		});
	},

	shippingLoad: function() {
		var $checkoutForm = $('.address');
		$checkoutForm.off('click');
		$checkoutForm.on('click', '.is-gift-yes, .is-gift-no', function (e) {
			$(this).parent().siblings('.gift-message-text').toggle($(this).checked);
		});
	}
};

module.exports = storeinventory;

},{"./ajax":2,"./page":12,"./util":38}],37:[function(require,module,exports){
'use strict';

/**
 * @function
 * @description Initializes the tooltip-content and layout
 */
exports.init = function () {
	$('.tooltip').tooltip({
		track: true,
		showURL: false,
		bodyHandler: function() {
			// add a data attribute of data-layout="some-class" to your tooltip-content container if you want a custom class
			var tooltipClass = "";
			if (tooltipClass = $(this).find('.tooltip-content').data("layout")) {
				tooltipClass = " class='" + tooltipClass + "' ";
			}
		return "<div " + tooltipClass + ">" + $(this).find('.tooltip-content').html() + "</div>";
		}
	});
};

},{}],38:[function(require,module,exports){
'use strict';
var // dialog = require('./dialog'),
	validator = require('./validator')

var util = {
	/**
	 * @function
	 * @description appends the parameter with the given name and value to the given url and returns the changed url
	 * @param {String} url the url to which the parameter will be added
	 * @param {String} name the name of the parameter
	 * @param {String} value the value of the parameter
	 */
	appendParamToURL: function (url, name, value) {
		var c = '?';
		if(url.indexOf(c) !== -1) {
			c = '&';
		}
		return url + c + name + '=' + encodeURIComponent(value);
	},
	/**
	 * @function
	 * @description
	 * @param {String}
	 * @param {String}
	 */
	elementInViewport: function (el, offsetToTop) {
		var top = el.offsetTop,
			left = el.offsetLeft,
			width = el.offsetWidth,
			height = el.offsetHeight;

		while (el.offsetParent) {
			el = el.offsetParent;
			top += el.offsetTop;
			left += el.offsetLeft;
		}

		if (typeof(offsetToTop) != 'undefined') {
			top -= offsetToTop;
		}

		if ( window.pageXOffset != null) {
			return (
				top < (window.pageYOffset + window.innerHeight) &&
				left < (window.pageXOffset + window.innerWidth) &&
				(top + height) > window.pageYOffset &&
				(left + width) > window.pageXOffset
			);
		}

		if (document.compatMode == "CSS1Compat") {
			return (
				top < (window.document.documentElement.scrollTop + window.document.documentElement.clientHeight) &&
				left < (window.document.documentElement.scrollLeft + window.document.documentElement.clientWidth) &&
				(top + height) > window.document.documentElement.scrollTop &&
				(left + width) > window.document.documentElement.scrollLeft
			);
		}
	},
	/**
	 * @function
	 * @description appends the parameters to the given url and returns the changed url
	 * @param {String} url the url to which the parameters will be added
	 * @param {String} params a JSON string with the parameters
	 */
	appendParamsToUrl: function (url, params) {
		var uri = this.getUri(url),
			includeHash = arguments.length < 3 ? false : arguments[2];

		var qsParams = $.extend(uri.queryParams, params);
		var result = uri.path + '?' + $.param(qsParams);
		if (includeHash) {
			result+=uri.hash;
		}
		if (result.indexOf('http') < 0 && result.charAt(0) !== '/') {
			result = '/' + result;
		}
		return result;
	},

	/**
	 * @function
	 * @description Appends the parameter 'format=ajax' to a given path
	 * @param {String} path the relative path
	 */
	ajaxUrl: function (path) {
		return this.appendParamToURL(path, "format", "ajax");
	},

	/**
	 * @function
	 * @description
	 * @param {String} url
	 */
	toAbsoluteUrl: function (url) {
		if (url.indexOf('http') !== 0 && url.charAt(0) !== '/') {
			url = '/' + url;
		}
		return url;
	},
	/**
	 * @function
	 * @description Loads css dynamically from given urls
	 * @param {Array} urls Array of urls from which css will be dynamically loaded.
	 */
	loadDynamicCss: function (urls) {
		var i, len = urls.length;
		for (i = 0; i < len; i++) {
			this.loadedCssFiles.push(this.loadCssFile(urls[i]));
		}
	},

	/**
	 * @function
	 * @description Loads css file dynamically from given url
	 * @param {String} url The url from which css file will be dynamically loaded.
	 */
	loadCssFile: function (url) {
		return $("<link/>").appendTo($("head")).attr({
			type : "text/css",
			rel : "stylesheet"
		}).attr("href", url); // for i.e. <9, href must be added after link has been appended to head
	},
	// array to keep track of the dynamically loaded CSS files
	loadedCssFiles: [],

	/**
	 * @function
	 * @description Removes all css files which were dynamically loaded
	 */
	clearDynamicCss : function () {
		var i = this.loadedCssFiles.length;
		while(0 > i--) {
			$(this.loadedCssFiles[i]).remove();
		}
		this.loadedCssFiles = [];
	},
	/**
	 * @function
	 * @description Extracts all parameters from a given query string into an object
	 * @param {String} qs The query string from which the parameters will be extracted
	 */
	getQueryStringParams : function (qs) {
		if (!qs || qs.length === 0) { return {}; }
		var params = {},
			unescapedQS = unescape(qs);
		// Use the String::replace method to iterate over each
		// name-value pair in the string.
		unescapedQS.replace( new RegExp("([^?=&]+)(=([^&]*))?", "g"),
			function ( $0, $1, $2, $3 ) {
				params[$1] = $3;
			}
		);
		return params;
	},
	/**
	 * @function
	 * @description Returns an URI-Object from a given element with the following properties:
	 * - protocol
	 * - host
	 * - hostname
	 * - port
	 * - path
	 * - query
	 * - queryParams
	 * - hash
	 * - url
	 * - urlWithQuery
	 * @param {Object} o The HTML-Element
	 */
	getUri: function (o) {
		var a;
		if (o.tagName && $(o).attr('href')) {
			a = o;
		} else if (typeof o === 'string') {
			a = document.createElement('a');
			a.href = o;
		} else {
			return null;
		}
		return {
			protocol: a.protocol, //http:
			host: a.host, //www.myexample.com
			hostname: a.hostname, //www.myexample.com'
			port: a.port, //:80
			path: a.pathname, // /sub1/sub2
			query: a.search, // ?param1=val1&param2=val2
			queryParams: a.search.length > 1 ? this.getQueryStringParams(a.search.substr(1)) : {},
			hash: a.hash, // #OU812,5150
			url: a.protocol + '//' + a.host + a.pathname,
			urlWithQuery: a.protocol + '//' + a.host + a.port + a.pathname + a.search
		};
	},

	fillAddressFields: function (address, $form) {
		for (var field in address) {
			// if the key in address object ends with 'Code', remove that suffix
			// keys that ends with 'Code' are postalCode, stateCode and countryCode
			$form.find('[name$="' + field.replace('Code', '') + '"]').val(address[field]);
			// update the state fields
			if (field === 'countryCode') {
				$form.find('[name$="country"]').trigger('change');
				// retrigger state selection after country has changed
				// this results in duplication of the state code, but is a necessary evil
				// for now because sometimes countryCode comes after stateCode
				$form.find('[name$="state"]').val(address['stateCode']);
			}
		}
	},
	/**
	 * @function
	 * @description Updates the states options to a given country
	 * @param {String} countrySelect The selected country
	 */
	updateStateOptions: function (form) {
		var $form = $(form),
			$country = $form.find('select[id$="_country"]'),
			country = Countries[$country.val()]
		if ($country.length === 0 || !country) {
			return;
		}
		var arrHtml = [],
			$stateField = $country.data("stateField") ? $country.data("stateField") : $form.find("select[name$='_state']"),
			$postalField = $country.data("postalField") ? $country.data("postalField") : $form.find("input[name$='_postal']"),
			$stateLabel = ($stateField.length > 0) ? $form.find("label[for='" + $stateField[0].id + "'] span").not(".required-indicator") : undefined,
			$postalLabel = ($postalField.length > 0) ? $form.find("label[for='" + $postalField[0].id + "'] span").not(".required-indicator") : undefined,
			prevStateValue = $stateField.val();
		// set the label text
		if ($postalLabel) {
			$postalLabel.html(country.postalLabel);
		}
		if ($stateLabel) {
			$stateLabel.html(country.regionLabel);
		} else {
			return;
		}
		var s;
		for (s in country.regions) {
			arrHtml.push('<option value="' + s + '">' + country.regions[s] + '</option>');
		}
		// clone the empty option item and add to stateSelect
		var o1 = $stateField.children().first().clone();
		$stateField.html(arrHtml.join('')).removeAttr('disabled').children().first().before(o1);
		// if a state was selected previously, save that selection
		if (prevStateValue && $.inArray(prevStateValue, country.regions)) {
			$stateField.val(prevStateValue);
		} else {
			$stateField[0].selectedIndex = 0;
		}
	},
	/**
	 * @function
	 * @description Updates the number of the remaining character
	 * based on the character limit in a text area
	 */
	limitCharacters: function () {
		$('form').find('textarea[data-character-limit]').each(function(){
			var characterLimit = $(this).data("character-limit");
			var charCountHtml = String.format(Resources.CHAR_LIMIT_MSG,
				'<span class="char-remain-count">' + characterLimit + '</span>',
				'<span class="char-allowed-count">' + characterLimit + '</span>');
			var charCountContainer = $(this).next('div.char-count');
			if (charCountContainer.length === 0) {
				charCountContainer = $('<div class="char-count"/>').insertAfter($(this));
			}
			charCountContainer.html(charCountHtml);
			// trigger the keydown event so that any existing character data is calculated
			$(this).change();
		});
	},
	/**
	 * @function
	 * @description Binds the onclick-event to a delete button on a given container,
	 * which opens a confirmation box with a given message
	 * @param {String} container The name of element to which the function will be bind
	 * @param {String} message The message the will be shown upon a click
	 */
	setDeleteConfirmation: function(container, message) {
		$(container).on('click', '.delete', function(e){
			return confirm(message);
		});
	},
	/**
	 * @function
	 * @description Scrolls a browser window to a given x point
	 * @param {String} The x coordinate
	 */
	scrollBrowser: function (xLocation) {
		$('html, body').animate({ scrollTop: xLocation }, 500);
	},

	isMobile: function () {
		var mobileAgentHash = ['mobile','tablet','phone','ipad','ipod','android','blackberry','windows ce','opera mini','palm'];
		var	idx = 0;
		var isMobile = false;
		var userAgent = (navigator.userAgent).toLowerCase();

		while (mobileAgentHash[idx] && !isMobile) {
			isMobile = (userAgent.indexOf(mobileAgentHash[idx]) >= 0);
			idx++;
		}
		return isMobile;
	}
};

module.exports = util;

},{"./validator":39}],39:[function(require,module,exports){
'use strict';

var naPhone = /^\(?([2-9][0-8][0-9])\)?[\-\. ]?([2-9][0-9]{2})[\-\. ]?([0-9]{4})(\s*x[0-9]+)?$/,
	regex = {
		phone : {
			us : naPhone,
			ca : naPhone
		},
		postal : {
			us : /^\d{5}(-\d{4})?$/,
			ca : /^[ABCEGHJKLMNPRSTVXY]{1}\d{1}[A-Z]{1} *\d{1}[A-Z]{1}\d{1}$/,
			gb : /^GIR?0AA|[A-PR-UWYZ]([0-9]{1,2}|([A-HK-Y][0-9]|[A-HK-Y][0-9]([0-9]|[ABEHMNPRV-Y]))|[0-9][A-HJKS-UW])?[0-9][ABD-HJLNP-UW-Z]{2}$/
		},
		email : /^[\w.%+\-]+@[\w.\-]+\.[\w]{2,6}$/,
		notCC : /^(?!(([0-9 -]){13,19})).*$/
	},
	settings = {
		// global form validator settings
		errorClass : 'error',
		errorElement : 'span',
		onkeyup : false,
		onfocusout : function (element) {
			if(!this.checkable(element)) {
				this.element(element);
			}
		}
	};
/**
 * @function
 * @description Validates a given phone number against the countries phone regex
 * @param {String} value The phone number which will be validated
 * @param {String} el The input field
 */
function validatePhone(value, el) {
	var country = $(el).closest('form').find('.country');
	if (country.length === 0 || country.val().length === 0 || !regex.phone[country.val().toLowerCase()]) {
		return true;
	}

	var rgx = regex.phone[country.val().toLowerCase()];
	var isOptional = this.optional(el);
	var isValid = rgx.test($.trim(value));

	return isOptional || isValid;
}
/**
 * @function
 * @description Validates a given email
 * @param {String} value The email which will be validated
 * @param {String} el The input field
 */
function validateEmail(value, el) {
	var isOptional = this.optional(el);
	var isValid = regex.email.test($.trim(value));
	return isOptional || isValid;
}

/**
 * @function
 * @description Validates that a credit card owner is not a Credit card number
 * @param {String} value The owner field which will be validated
 * @param {String} el The input field
 */
function validateOwner(value, el) {
	var isValid = regex.notCC.test($.trim(value));
	return isValid;
}

/**
 * Add phone validation method to jQuery validation plugin.
 * Text fields must have 'phone' css class to be validated as phone
 */
$.validator.addMethod('phone', validatePhone, Resources.INVALID_PHONE);

/**
 * Add email validation method to jQuery validation plugin.
 * Text fields must have 'email' css class to be validated as email
 */
$.validator.addMethod('email', validateEmail, Resources.INVALID_EMAIL);

/**
 * Add CCOwner validation method to jQuery validation plugin.
 * Text fields must have 'owner' css class to be validated as not a credit card
 */
$.validator.addMethod("owner", validateOwner, Resources.INVALID_OWNER);

/**
 * Add gift cert amount validation method to jQuery validation plugin.
 * Text fields must have 'gift-cert-amont' css class to be validated
 */
$.validator.addMethod('gift-cert-amount', function (value, el){
	var isOptional = this.optional(el);
	var isValid = (!isNaN(value)) && (parseFloat(value) >= 5) && (parseFloat(value) <= 5000);
	return isOptional || isValid;
}, Resources.GIFT_CERT_AMOUNT_INVALID);

/**
 * Add positive number validation method to jQuery validation plugin.
 * Text fields must have 'positivenumber' css class to be validated as positivenumber
 */
$.validator.addMethod('positivenumber', function (value, element) {
	if($.trim(value).length === 0) { return true; }
	return (!isNaN(value) && Number(value) >= 0);
}, ''); // '' should be replaced with error message if needed

var validator = {
	regex: regex,
	settings: settings,
	init: function () {
		var self = this;
		$('form:not(.suppress)').each(function () {
			$(this).validate(self.settings);
		});
	},
	initForm: function(f) {
		$(f).validate(this.settings);
	}
};

module.exports = validator;

},{}],40:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],41:[function(require,module,exports){
'use strict';

module.exports = require('./lib/core.js')
require('./lib/done.js')
require('./lib/es6-extensions.js')
require('./lib/node-extensions.js')
},{"./lib/core.js":42,"./lib/done.js":43,"./lib/es6-extensions.js":44,"./lib/node-extensions.js":45}],42:[function(require,module,exports){
'use strict';

var asap = require('asap')

module.exports = Promise;
function Promise(fn) {
  if (typeof this !== 'object') throw new TypeError('Promises must be constructed via new')
  if (typeof fn !== 'function') throw new TypeError('not a function')
  var state = null
  var value = null
  var deferreds = []
  var self = this

  this.then = function(onFulfilled, onRejected) {
    return new self.constructor(function(resolve, reject) {
      handle(new Handler(onFulfilled, onRejected, resolve, reject))
    })
  }

  function handle(deferred) {
    if (state === null) {
      deferreds.push(deferred)
      return
    }
    asap(function() {
      var cb = state ? deferred.onFulfilled : deferred.onRejected
      if (cb === null) {
        (state ? deferred.resolve : deferred.reject)(value)
        return
      }
      var ret
      try {
        ret = cb(value)
      }
      catch (e) {
        deferred.reject(e)
        return
      }
      deferred.resolve(ret)
    })
  }

  function resolve(newValue) {
    try { //Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
      if (newValue === self) throw new TypeError('A promise cannot be resolved with itself.')
      if (newValue && (typeof newValue === 'object' || typeof newValue === 'function')) {
        var then = newValue.then
        if (typeof then === 'function') {
          doResolve(then.bind(newValue), resolve, reject)
          return
        }
      }
      state = true
      value = newValue
      finale()
    } catch (e) { reject(e) }
  }

  function reject(newValue) {
    state = false
    value = newValue
    finale()
  }

  function finale() {
    for (var i = 0, len = deferreds.length; i < len; i++)
      handle(deferreds[i])
    deferreds = null
  }

  doResolve(fn, resolve, reject)
}


function Handler(onFulfilled, onRejected, resolve, reject){
  this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null
  this.onRejected = typeof onRejected === 'function' ? onRejected : null
  this.resolve = resolve
  this.reject = reject
}

/**
 * Take a potentially misbehaving resolver function and make sure
 * onFulfilled and onRejected are only called once.
 *
 * Makes no guarantees about asynchrony.
 */
function doResolve(fn, onFulfilled, onRejected) {
  var done = false;
  try {
    fn(function (value) {
      if (done) return
      done = true
      onFulfilled(value)
    }, function (reason) {
      if (done) return
      done = true
      onRejected(reason)
    })
  } catch (ex) {
    if (done) return
    done = true
    onRejected(ex)
  }
}

},{"asap":46}],43:[function(require,module,exports){
'use strict';

var Promise = require('./core.js')
var asap = require('asap')

module.exports = Promise
Promise.prototype.done = function (onFulfilled, onRejected) {
  var self = arguments.length ? this.then.apply(this, arguments) : this
  self.then(null, function (err) {
    asap(function () {
      throw err
    })
  })
}
},{"./core.js":42,"asap":46}],44:[function(require,module,exports){
'use strict';

//This file contains the ES6 extensions to the core Promises/A+ API

var Promise = require('./core.js')
var asap = require('asap')

module.exports = Promise

/* Static Functions */

function ValuePromise(value) {
  this.then = function (onFulfilled) {
    if (typeof onFulfilled !== 'function') return this
    return new Promise(function (resolve, reject) {
      asap(function () {
        try {
          resolve(onFulfilled(value))
        } catch (ex) {
          reject(ex);
        }
      })
    })
  }
}
ValuePromise.prototype = Promise.prototype

var TRUE = new ValuePromise(true)
var FALSE = new ValuePromise(false)
var NULL = new ValuePromise(null)
var UNDEFINED = new ValuePromise(undefined)
var ZERO = new ValuePromise(0)
var EMPTYSTRING = new ValuePromise('')

Promise.resolve = function (value) {
  if (value instanceof Promise) return value

  if (value === null) return NULL
  if (value === undefined) return UNDEFINED
  if (value === true) return TRUE
  if (value === false) return FALSE
  if (value === 0) return ZERO
  if (value === '') return EMPTYSTRING

  if (typeof value === 'object' || typeof value === 'function') {
    try {
      var then = value.then
      if (typeof then === 'function') {
        return new Promise(then.bind(value))
      }
    } catch (ex) {
      return new Promise(function (resolve, reject) {
        reject(ex)
      })
    }
  }

  return new ValuePromise(value)
}

Promise.all = function (arr) {
  var args = Array.prototype.slice.call(arr)

  return new Promise(function (resolve, reject) {
    if (args.length === 0) return resolve([])
    var remaining = args.length
    function res(i, val) {
      try {
        if (val && (typeof val === 'object' || typeof val === 'function')) {
          var then = val.then
          if (typeof then === 'function') {
            then.call(val, function (val) { res(i, val) }, reject)
            return
          }
        }
        args[i] = val
        if (--remaining === 0) {
          resolve(args);
        }
      } catch (ex) {
        reject(ex)
      }
    }
    for (var i = 0; i < args.length; i++) {
      res(i, args[i])
    }
  })
}

Promise.reject = function (value) {
  return new Promise(function (resolve, reject) { 
    reject(value);
  });
}

Promise.race = function (values) {
  return new Promise(function (resolve, reject) { 
    values.forEach(function(value){
      Promise.resolve(value).then(resolve, reject);
    })
  });
}

/* Prototype Methods */

Promise.prototype['catch'] = function (onRejected) {
  return this.then(null, onRejected);
}

},{"./core.js":42,"asap":46}],45:[function(require,module,exports){
'use strict';

//This file contains then/promise specific extensions that are only useful for node.js interop

var Promise = require('./core.js')
var asap = require('asap')

module.exports = Promise

/* Static Functions */

Promise.denodeify = function (fn, argumentCount) {
  argumentCount = argumentCount || Infinity
  return function () {
    var self = this
    var args = Array.prototype.slice.call(arguments)
    return new Promise(function (resolve, reject) {
      while (args.length && args.length > argumentCount) {
        args.pop()
      }
      args.push(function (err, res) {
        if (err) reject(err)
        else resolve(res)
      })
      fn.apply(self, args)
    })
  }
}
Promise.nodeify = function (fn) {
  return function () {
    var args = Array.prototype.slice.call(arguments)
    var callback = typeof args[args.length - 1] === 'function' ? args.pop() : null
    var ctx = this
    try {
      return fn.apply(this, arguments).nodeify(callback, ctx)
    } catch (ex) {
      if (callback === null || typeof callback == 'undefined') {
        return new Promise(function (resolve, reject) { reject(ex) })
      } else {
        asap(function () {
          callback.call(ctx, ex)
        })
      }
    }
  }
}

Promise.prototype.nodeify = function (callback, ctx) {
  if (typeof callback != 'function') return this

  this.then(function (value) {
    asap(function () {
      callback.call(ctx, null, value)
    })
  }, function (err) {
    asap(function () {
      callback.call(ctx, err)
    })
  })
}

},{"./core.js":42,"asap":46}],46:[function(require,module,exports){
(function (process){

// Use the fastest possible means to execute a task in a future turn
// of the event loop.

// linked list of tasks (single, with head node)
var head = {task: void 0, next: null};
var tail = head;
var flushing = false;
var requestFlush = void 0;
var isNodeJS = false;

function flush() {
    /* jshint loopfunc: true */

    while (head.next) {
        head = head.next;
        var task = head.task;
        head.task = void 0;
        var domain = head.domain;

        if (domain) {
            head.domain = void 0;
            domain.enter();
        }

        try {
            task();

        } catch (e) {
            if (isNodeJS) {
                // In node, uncaught exceptions are considered fatal errors.
                // Re-throw them synchronously to interrupt flushing!

                // Ensure continuation if the uncaught exception is suppressed
                // listening "uncaughtException" events (as domains does).
                // Continue in next event to avoid tick recursion.
                if (domain) {
                    domain.exit();
                }
                setTimeout(flush, 0);
                if (domain) {
                    domain.enter();
                }

                throw e;

            } else {
                // In browsers, uncaught exceptions are not fatal.
                // Re-throw them asynchronously to avoid slow-downs.
                setTimeout(function() {
                   throw e;
                }, 0);
            }
        }

        if (domain) {
            domain.exit();
        }
    }

    flushing = false;
}

if (typeof process !== "undefined" && process.nextTick) {
    // Node.js before 0.9. Note that some fake-Node environments, like the
    // Mocha test runner, introduce a `process` global without a `nextTick`.
    isNodeJS = true;

    requestFlush = function () {
        process.nextTick(flush);
    };

} else if (typeof setImmediate === "function") {
    // In IE10, Node.js 0.9+, or https://github.com/NobleJS/setImmediate
    if (typeof window !== "undefined") {
        requestFlush = setImmediate.bind(window, flush);
    } else {
        requestFlush = function () {
            setImmediate(flush);
        };
    }

} else if (typeof MessageChannel !== "undefined") {
    // modern browsers
    // http://www.nonblocking.io/2011/06/windownexttick.html
    var channel = new MessageChannel();
    channel.port1.onmessage = flush;
    requestFlush = function () {
        channel.port2.postMessage(0);
    };

} else {
    // old browsers
    requestFlush = function () {
        setTimeout(flush, 0);
    };
}

function asap(task) {
    tail = tail.next = {
        task: task,
        domain: isNodeJS && process.domain,
        next: null
    };

    if (!flushing) {
        flushing = true;
        requestFlush();
    }
};

module.exports = asap;


}).call(this,require('_process'))
},{"_process":40}]},{},[1]);

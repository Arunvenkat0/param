'use strict';

var ajax = require('../../ajax'),
	addThis = require('./addThis'),
	addToCart = require('./addToCart'),
	image = require('./image'),
	progress = require('../../progress'),
	storeinventory = require('../../storeinventory'),
	tooltip = require('../../tooltip'),
	util = require('../../util');

/*
 * @description load new product content panel
 * @param {String} href - the url of the new product content
 **/
module.exports.update = function (href) {
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

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
	$('#compare-table').on('click', '.remove-link', function (e) {
		e.preventDefault();
		ajax.getJson({
			url: this.href,
			callback: function () {
				page.refresh();
			}
		});
	})
	.on('click', '.open-quick-view', function (e) {
		e.preventDefault();
		var form = $(this).closest('form');
		quickview.show({
			url: form.attr('action'),
			source: 'quickview',
			data: form.serialize()
		});
	});

	$('#compare-category-list').on('change', function () {
		$(this).closest('form').submit();
	});
}

exports.init = function () {
	productTile.init();
	initializeEvents();
	product.initAddToCart();
};

'use strict';

var page = require('../../page'),
	util = require('../../util');

/**
 * @private
 * @function
 * @description Event handler to handle the add to cart event
 */
function setAddToCartHandler(e) {
	e.preventDefault();
	var $form = $(this).closest('form');
	var qty = $form.find('input[name="Quantity"]');
	var isSubItem = $(this).hasClass('sub-product-item');
	if (qty.length === 0 || isNaN(qty.val()) || parseInt(qty.val(), 10) === 0) {
		qty.val('1');
	}

	var data = $form.serialize();
	var url = util.ajaxUrl(Urls.addProduct);
	$.ajax({
		type: 'POST',
		url: url,
		data: data,
		success: function (response) {
			var $uuid = $form.find('input[name="uuid"]');
			if ($uuid.length > 0 && $uuid.val().length > 0) {
				page.refresh();
			} else {
				if (!isSubItem) {
					quickview.close();
				}
				minicart.show(response);
			}
		}
	});
}

/**
 * @function
 * @description Binds the click event to a given target for the add-to-cart handling
 * @param {Element} target The target on which an add to cart event-handler will be set
 */
module.exports = function (target) {
	if (target) {
		target.on('click', '.add-to-cart', setAddToCartHandler);
	} else {
		$('.add-to-cart').on('click', setAddToCartHandler);
	}
}

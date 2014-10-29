'use strict';

var addToCartHandler = require('./product/addToCartHandler'),
	page = require('../page'),
	sendToFriend = require('../send-to-friend'),
	util = require('../util');

exports.init = function () {
	addToCartHandler();
	sendToFriend.initializeDialog('.list-table-header');
	$('#editAddress').on('change', function () {
		page.redirect(util.appendParamToURL(Urls.wishlistAddress, 'AddressID', $(this).val()));
	});

	//add js logic to remove the , from the qty feild to pass regex expression on client side
	$('.option-quantity-desired input').on('focusout', function () {
		$(this).val($(this).val().replace(',', ''));
	});
};

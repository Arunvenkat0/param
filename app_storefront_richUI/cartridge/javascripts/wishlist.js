'use strict';

var page = require('./page'),
	product = require('./product'),
	sendToFiend = require('./send-to-friend'),
	util = require('./util');

exports.init = function () {
	product.initAddToCart();
	sendToFriend.initializeDialog(".list-table-header", ".send-to-friend");
	$('#editAddress').on('change', function () {
		page.redirect(util.appendParamToURL(app.urls.wishlistAddress, "AddressID", $(this).val()));
	});
	
	//add js logic to remove the , from the qty feild to pass regex expression on client side
	$('.option-quantity-desired input').on('focusout', function () {
		$(this).val($(this).val().replace(',',''));	
	});
};

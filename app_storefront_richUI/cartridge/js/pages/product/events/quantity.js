'use strict';

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
	if (data.inStockDate !== '') {
		avMsg = avRoot.find('.in-stock-date-msg');
		if (avMsg.length === 0) {
			avMsg = $('<p/>').addClass('in-stock-date-msg').appendTo(avRoot);
		}
		avMsg.text(String.format(Resources.IN_STOCK_DATE, data.inStockDate));
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
};

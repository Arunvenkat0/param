'use strict';

var inventory = require('./');

var cartInventory = {
	setSelectedStore: function (storeId) {
		var $selectedStore = $('.store-tile.' + storeId),
			$lineItem = $('.cart-row[data-uuid="' + this.uuid +'"]'),
			storeAddress = $selectedStore.find('.store-address').html(),
			storeStatus = $selectedStore.find('.store-status').data('status'),
			storeStatusText = $selectedStore.find('.store-status').text();
		$lineItem.find('.instore-delivery .selected-store-address')
			.data('storeId', storeId)
			.attr('data-store-id', storeId)
			.html(storeAddress);
		$lineItem.find('.instore-delivery .selected-store-availability')
			.data('status', storeStatus)
			.attr('data-status', storeStatus)
			.text(storeStatusText);
		$lineItem.find('.instore-delivery input[name="' + this.uuid + '-store"]').val(storeId);
	},
	cartSelectStore: function () {
		var self = this;
		inventory.getStoresInventory(this.uuid).then(function (stores) {
			inventory.selectStoreDialog({
				stores: stores,
				selectedStoreId: self.selectedStore,
				selectedStoreText: Resources.SELECTED_STORE,
				continueCallback: function () {},
				selectStoreCallback: self.setSelectedStore.bind(self)
			});
		}).done();
	},
	init: function () {
		var self = this;
		$('.item-delivery-options .set-preferred-store').on('click', function (e) {
			e.preventDefault();
			self.uuid = $(this).data('uuid');
			self.selectedStore = $(this).closest('.instore-delivery').find('.selected-store-address').data('storeId');
			if (!User.zip) {
				inventory.zipPrompt(function () {
					self.cartSelectStore();
				});
			} else {
				self.cartSelectStore();
			}
		});
	}
};

module.exports = cartInventory;

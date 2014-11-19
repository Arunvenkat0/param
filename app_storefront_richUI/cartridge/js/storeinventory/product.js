'use strict';

var inventory = require('./');

module.exports = function () {
	var $availabilityContainer = $('.availability-results'),
		pid = $('input[name="pid"]').val();

	$('#pdpMain').on('click', '.set-preferred-store', function (e) {
		e.preventDefault();
		if (!User.zip) {
			inventory.zipPrompt(function () {
				inventory.getStoresInventory(pid).then(inventory.selectStoreDialog.bind(inventory));
			});
		} else {
			inventory.getStoresInventory(pid).then(inventory.selectStoreDialog.bind(inventory));
		}
	});

	if ($availabilityContainer.length) {
		if (User.storeId) {
			inventory.getStoresInventory(pid).then(inventory.storesListing.bind(inventory));
		}

		$availabilityContainer.on('click', '.stores-toggle', function (e) {
			e.preventDefault();
			$('.store-list-pdp .store-list-item').toggleClass('visible');
			if ($(this).hasClass('collapsed')) {
				$(this).text(Resources.SEE_LESS);
			} else {
				$(this).text(Resources.SEE_MORE);
			}
			$(this).toggleClass('collapsed');
		});
	}
}

'use strict';

var ajax = require('../ajax'),
	product = require('./product'),
	quickview = require('../quickview'),
	sendToFriend = require('../send-to-friend'),
	util = require('../util')

/**
 * @function
 * @description Loads address details to a given address and fills the 'Pre-Event-Shipping' address form
 * @param {String} addressID The ID of the address to which data will be loaded
 */
function populateBeforeAddressForm(addressID) {
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
			$cache.addressBeforeFields.filter('[name$="_addressid"]').val(data.address.ID);
			$cache.addressBeforeFields.filter('[name$="_firstname"]').val(data.address.firstName);
			$cache.addressBeforeFields.filter('[name$="_lastname"]').val(data.address.lastName);
			$cache.addressBeforeFields.filter('[name$="_address1"]').val(data.address.address1);
			$cache.addressBeforeFields.filter('[name$="_address2"]').val(data.address.address2);
			$cache.addressBeforeFields.filter('[name$="_city"]').val(data.address.city);
			$cache.addressBeforeFields.filter('[name$="_postal"]').val(data.address.postalCode);
			$cache.addressBeforeFields.filter('[name$="_state"]').val(data.address.stateCode);
			$cache.addressBeforeFields.filter('[name$="_country"]').val(data.address.countryCode);
			$cache.addressBeforeFields.filter('[name$="_phone"]').val(data.address.phone);
			$cache.registryForm.validate().form();
		}
	});
}

/**
 * @function
 * @description Loads address details to a given address and fills the 'Post-Event-Shipping' address form
 * @param {String} addressID The ID of the address to which data will be loaded
 */
function populateAfterAddressForm(addressID) {
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
			$cache.addressAfterFields.filter('[name$="_addressid"]').val(data.address.ID);
			$cache.addressAfterFields.filter('[name$="_firstname"]').val(data.address.firstName);
			$cache.addressAfterFields.filter('[name$="_lastname"]').val(data.address.lastName);
			$cache.addressAfterFields.filter('[name$="_address1"]').val(data.address.address1);
			$cache.addressAfterFields.filter('[name$="_address2"]').val(data.address.address2);
			$cache.addressAfterFields.filter('[name$="_city"]').val(data.address.city);
			$cache.addressAfterFields.filter('[name$="_postal"]').val(data.address.postalCode);
			$cache.addressAfterFields.filter('[name$="_state"]').val(data.address.stateCode);
			$cache.addressAfterFields.filter('[name$="_country"]').val(data.address.countryCode);
			$cache.addressAfterFields.filter('[name$="_phone"]').val(data.address.phone);
			$cache.registryForm.validate().form();
		}
	});
}
/**
 * @function
 * @description copy pre-event address fields to post-event address fields
 */
function copyBeforeAddress() {
	$cache.addressBeforeFields.each(function () {
		var fieldName = $(this).attr('name');
		var afterField = $cache.addressAfterFields.filter('[name="' + fieldName.replace("Before","After") + '""]');
		afterField.val($(this).val());
	});
}

/**
 * @private
 * @function
 * @description Cache initialization of the gift registration
 */
function initializeCache() {
	$cache.registryForm = $('form[name$="_giftregistry"]');
	$cache.copyAddress = $cache.registryForm.find('input[name$="_copyAddress"]');
	$cache.addressBeforeFields = $cache.registryForm.find('fieldset[name="address-before"] input:not(:checkbox), fieldset[name="address-before"] select');
	$cache.addressAfterFields = $cache.registryForm.find('fieldset[name="address-after"] input:not(:checkbox), fieldset[name="address-after"] select');
}
/**
 * @private
 * @function
 * @description DOM-Object initialization of the gift registration
 */
function initializeDom() {
	$cache.addressBeforeFields.filter('[name$="_country"]')
		.data('stateField', $cache.addressBeforeFields.filter('[name$="_state"]'))
		.data('postalField', $cache.addressBeforeFields.filter('[name$="_postal"]'));
	$cache.addressAfterFields.filter('[name$="_country"]')
		.data('stateField', $cache.addressAfterFields.filter('[name$="_state"]'))
		.data('postalField', $cache.addressAfterFields.filter('[name$="_postal"]'));

	if ($cache.copyAddress.length && $cache.copyAddress[0].checked) {
		// fill the address after fields
		copyBeforeAddress();
		$cache.addressAfterFields.attr('disabled', 'disabled');
	}
}
/**
 * @private
 * @function
 * @description Initializes events for the gift registration
 */
function initializeEvents() {
	sendToFriend.initializeDialog('.list-table-header', '.send-to-friend');
	util.setDeleteConfirmation('.item-list', String.format(Resources.CONFIRM_DELETE, Resources.TITLE_GIFTREGISTRY));

	$('.usepreevent').on('click', function () {
		$(':input', $beforeAddress).each(function () {
			var fieldName = $(this).attr('name'),
				$afterField = $afterAddress.find('[name="' + fieldName.replace('Before', 'After') + '"]');
			$afterField.val($(this).val());
		});
	})
	$form.on('change', 'select[name$="_addressBeforeList"]', function (e) {
		var addressID = $(this).val();
		if (addressID.length===0) { return; }
		populateBeforeAddressForm(addressID);
	})
	.on('change', 'select[name$="_addressAfterList"]', function (e) {
		var addressID = $(this).val();
		if (addressID.length === 0) { return; }
		populateAfterAddressForm(addressID);
	})
	});

	$('form').on('change', 'select[name$="_country"]', function(e) {
		util.updateStateOptions(this);

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
	initializeCache();
	initializeDom();
	initializeEvents();
	product.initAddToCart();
};

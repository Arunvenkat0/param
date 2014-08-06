'use strict';

var util = require('../../util');

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
		// TODO fill in the fields using the same function as the addEditAddress $selectButton
		for (var field in selectedAddress) {
			// if the key in selectedAddress object ends with 'Code', remove that suffix
			$form.find('[name$="' + field.replace('Code', '') + '"]').val(selectedAddress[field]);
			// update the state fields
			if (field === 'countryCode') {
				$form.find('[name$="' + field.replace('Code', '') + '"]').trigger('change');
				// retrigger state selection after country has changed
				// this results in duplication of the state code, but is a necessary evil
				// for now because sometimes countryCode comes after stateCode
				$form.find('[name$="state"]').val(selectedAddress['stateCode']);
			}
		}
		updateShippingMethodList();
		// re-validate the form
		$form.validate().form();
	});

	// update state options in case the country changes
	$('select[id$="_country"]', $form).on('change', function () {
		util.updateStateOptions($form);
	});
}
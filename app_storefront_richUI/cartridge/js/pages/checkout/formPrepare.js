'use strict';

/**
 * @function
 * @description disable continue button on the page if required inputs are not filled
 * @input String the selector string of the continue button
 * @input String the selector string for the form
 */
exports.init = function (continueSelector, formSelector) {
	var $continue = $(continueSelector);
	var $form = $(formSelector);
	var validator = $form.validate();
	var $requiredInputs = $('.required', $form).find(':input');
	// check for required input
	function hasEmptyRequired() {
		// filter out only the visible fields - this allows the checking to work on
		// billing page where some payment methods inputs are hidden
		var requiredValues = $requiredInputs.filter(':visible').map(function () {
			return $(this).val();
		});
		return $.inArray('', requiredValues) !== -1;
	};

	// validate form on init
	if (!hasEmptyRequired()) {
		// only validate form when all required fields are filled to avoid
		// throwing errors on empty form
		if (validator.form()) {
			$continue.removeAttr('disabled');
		}
	} else {
		$continue.attr('disabled', 'disabled');
	}

	function validateInputs() {
		if ($(this).val() === '') {
			$continue.attr('disabled', 'disabled');
		} else {
			// enable continue button on last required field that is valid
			// only validate single field
			if (validator.element(this) && !hasEmptyRequired()) {
				$continue.removeAttr('disabled');
			} else {
				$continue.attr('disabled', 'disabled');
			}
		}
	}

	$requiredInputs.off('change', validateInputs).on('change', validateInputs);
}

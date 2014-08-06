'use strict';

var ajax = require('../../ajax'),
	dialog = require('../../dialog'),
	progress = require('../../progress'),
	tooltip = require('../../tooltip'),
	util = require('../../util');

var billing = require('./billing'),
	multiship = require('./multiship');

var $cache = {},
	shippingMethods = null;

/**
 * @function
 * @description Helper method which constructs a URL for an AJAX request using the
 * entered address information as URL request parameters.
 */
function getShippingMethodURL(url, extraParams) {
	var params = {
		address1: $cache.address1.val(),
		address2: $cache.address2.val(),
		countryCode: $cache.countryCode.val(),
		stateCode: $cache.stateCode.val(),
		postalCode: $cache.postalCode.val(),
		city: $cache.city.val()
	};
	return util.appendParamsToUrl(url, $.extend(params, extraParams));
}

/**
 * @function
 * @description updates the order summary based on a possibly recalculated basket after a shipping promotion has been applied
 */
function updateSummary() {
	var url = Urls.summaryRefreshURL;
	var summary = $("#secondary.summary");
	// indicate progress
	progress.show(summary);

	// load the updated summary area
	summary.load( url, function () {
		// hide edit shipping method link
		summary.fadeIn("fast");
		summary.find('.checkout-mini-cart .minishipment .header a').hide();
		summary.find('.order-totals-table .order-shipping .label a').hide();
	});
}
/**
 * @function
 * @description selects a shipping method for the default shipment and updates the summary section on the right hand side
 * @param
 */
function selectShippingMethod(shippingMethodID) {
	// nothing entered
	if(!shippingMethodID) {
		return;
	}
	// attempt to set shipping method
	var url = getShippingMethodURL(Urls.selectShippingMethodsList, {shippingMethodID: shippingMethodID});
	 ajax.getJson({
		url: url,
		callback: function (data) {
			updateSummary();
			if(!data || !data.shippingMethodID) {
				window.alert("Couldn't select shipping method.");
				return false;
			}
			// display promotion in UI and update the summary section,
			// if some promotions were applied
			$(".shippingpromotions").empty();
			if(data.shippingPriceAdjustments && data.shippingPriceAdjustments.length > 0) {
				var i,len=data.shippingPriceAdjustments.length;
				for(i=0; i<len; i++) {
					var spa = data.shippingPriceAdjustments[i];
				}
			}
		}
	});
}

/**
 * @function
 * @description Make an AJAX request to the server to retrieve the list of applicable shipping methods
 * based on the merchandise in the cart and the currently entered shipping address
 * (the address may be only partially entered).  If the list of applicable shipping methods
 * has changed because new address information has been entered, then issue another AJAX
 * request which updates the currently selected shipping method (if needed) and also updates
 * the UI.
 */
function updateShippingMethodList() {
	var $shippingMethodList = $("#shipping-method-list");
	if (!$shippingMethodList || $shippingMethodList.length === 0) { return; }
	var url = getShippingMethodURL(Urls.shippingMethodsJSON);

	 ajax.getJson({
		url: url,
		callback: function (data) {
			if(!data) {
				window.alert("Couldn't get list of applicable shipping methods.");
				return false;
			}
			if (shippingMethods && shippingMethods.toString() === data.toString())
			{
				// No need to update the UI.  The list has not changed.
				return true;
			}

			// We need to update the UI.  The list has changed.
			// Cache the array of returned shipping methods.
			shippingMethods = data;

			var smlUrl = getShippingMethodURL(Urls.shippingMethodsList);

			// indicate progress
			progress.show($shippingMethodList);

			// load the shipping method form
			$shippingMethodList.load( smlUrl, function () {
				$shippingMethodList.fadeIn("fast");
				// rebind the radio buttons onclick function to a handler.
				$shippingMethodList.find("[name$='_shippingMethodID']").click(function () {
					selectShippingMethod($(this).val());
				});

				// update the summary
				updateSummary();
				progress.hide();
				tooltip.init();
			});
		}
	});
}

//shipping page logic
//checkout gift message counter
/**
 * @function
 * @description Initializes gift message box, if shipment is gift
 */
function giftMessageBox() {
	// show gift message box, if shipment is gift
	$(".gift-message-text").toggle($("#is-gift-yes")[0].checked);

}

/**
 * @function
 * @description capture add edit adddress form events
 */
function addEditAddress(target) {
	var $addressForm = $('form[name$="multishipping_editAddress"]'),
		$selectButton = $addressForm.find('button[name$=_selectAddress]'),
		$addressList = $addressForm.find('.address-list'),
		add = true;
	$selectButton.on('click', function (e) {
		e.preventDefault();
		var selectedAddress = $addressList.find('select').val();
		if (selectedAddress !== 'newAddress') {
			selectedAddress = $.grep($addressList.data('addresses'), function(add) {
				return add.UUID === selectedAddress;
			})[0];
			add = false;
			// proceed to fill the form with the selected address
			for (var field in selectedAddress) {
				// if the key in selectedAddress object ends with 'Code', remove that suffix
				$addressForm.find('[name$=' + field.replace('Code', '') + ']').val(selectedAddress[field]);
			}
		}
	});

	$addressForm.on('click', '.cancel', function (e) {
		e.preventDefault();
		dialog.close();
	});

	$addressForm.on('submit', function (e) {
		e.preventDefault();
		$.getJSON(Urls.addEditAddress, $addressForm.serialize(), function (response) {
			if (!response.success) {
				// @TODO: figure out a way to handle error on the form
				console.log('error!');
				return;
			}
			var address = response.address,
				$shippingAddress = $(target).closest('.shippingaddress'),
				$select = $shippingAddress.find('.select-address'),
				$selected = $select.find('option:selected'),
				newOption = '<option value="' + address.UUID + '">'
					+ ((address.ID) ? '(' + address.ID + ')' : address.firstName + ' ' + address.lastName) + ', '
					+ address.address1 + ', ' + address.city + ', ' + address.stateCode + ', ' + address.postalCode
					+ '</option>';
			dialog.close();
			if (add) {
				$('.shippingaddress select').removeClass('no-option').append(newOption);
				$('.no-address').hide();
			} else {
				$('.shippingaddress select').find('option[value="' + address.UUID + '"]').html(newOption);
			}
			// if there's no previously selected option, select it
			if (!$selected.length > 0 || $selected.val() === '') {
				$select.find('option[value="' + address.UUID + '"]').prop('selected', 'selected').trigger('change');
			}
		});
	});
}
/**
 * @function
 * @description shows gift message box, if shipment is gift
 */
function shippingLoad() {
	$('#is-gift-yes, #is-gift-no').on('click', function (e) {
		giftMessageBox();
	});

	$('.address').on('change',
		'input[name$="_addressFields_address1"], input[name$="_addressFields_address2"], input[name$="_addressFields_state"], input[name$="_addressFields_city"], input[name$="_addressFields_zip"]',
		updateShippingMethodList
	);

	giftMessageBox();
	updateShippingMethodList();
}
/**
 * @function
 * @description Selects the first address from the list of addresses
 */
function addressLoad() {
	var $form = $('.address');
	// select address from list
	$('select[id$="_addressList"]', $form).on('change', function () {
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

/**
 * @function
 * @description Fills the Credit Card form with the passed data-parameter and clears the former cvn input
 * @param {Object} data The Credit Card data (holder, type, masked number, expiration month/year)
 */
function setCCFields(data) {
	$cache.ccOwner.val(data.holder);
	$cache.ccType.val(data.type);
	$cache.ccNum.val(data.maskedNumber);
	$cache.ccMonth.val(data.expirationMonth);
	$cache.ccYear.val(data.expirationYear);
	$cache.ccCcv.val("");

	// remove error messages
	$cache.ccContainer.find(".errormessage").toggleClass("errormessage").filter("span").remove();

	$cache.ccContainer.find(".errorlabel").toggleClass("errorlabel");
}

/**
 * @function
 * @description Updates the credit card form with the attributes of a given card
 * @param {String} cardID the credit card ID of a given card
 */
function populateCreditCardForm(cardID) {
	// load card details
	var url = util.appendParamToURL(Urls.billingSelectCC, "creditCardUUID", cardID);
	ajax.getJson({
		url: url,
		callback: function (data) {
			if(!data) {
				window.alert(Resources.CC_LOAD_ERROR);
				return false;
			}
			setCCFields(data);
		}
	});
}

/**
 * @function
 * @description Initializes the cache of the checkout UI
 */
function initializeCache() {
	$cache.checkoutForm = $(".address");
	$cache.firstName = $cache.checkoutForm.find("input[name$='_firstName']");
	$cache.lastName = $cache.checkoutForm.find("input[name$='_lastName']");
	$cache.address1 = $cache.checkoutForm.find("input[name$='_address1']");
	$cache.address2 = $cache.checkoutForm.find("input[name$='_address2']");
	$cache.city = $cache.checkoutForm.find("input[name$='_city']");
	$cache.postalCode = $cache.checkoutForm.find("input[name$='_postal']");
	$cache.phone = $cache.checkoutForm.find("input[name$='_phone']");
	$cache.countryCode = $cache.checkoutForm.find("select[id$='_country']");
	$cache.stateCode = $cache.checkoutForm.find("select[id$='_state']");

	if ($cache.checkoutForm.hasClass("checkout-billing")) {
		// billing only
		$cache.ccContainer = $("#PaymentMethod_CREDIT_CARD");
		$cache.ccOwner = $cache.ccContainer.find("input[name$='creditCard_owner']");
		$cache.ccType = $cache.ccContainer.find("select[name$='_type']");
		$cache.ccNum = $cache.ccContainer.find("input[name$='_number']");
		$cache.ccMonth = $cache.ccContainer.find("[name$='_month']");
		$cache.ccYear = $cache.ccContainer.find("[name$='_year']");
		$cache.ccCcv = $cache.ccContainer.find("input[name$='_cvn']");
	}
}
/**
 * @function Initializes the page events depending on the checkout stage (shipping/billing)
 */
function initializeEvents() {
	addressLoad();
	if ($(".checkout-shipping").length > 0) {
		shippingLoad();
		//on the single shipping page, update the list of shipping methods when the state feild changes
		$('#dwfrm_singleshipping_shippingAddress_addressFields_states_state').bind('change', function(){
			updateShippingMethodList();
		});
	}
	else if ($(".checkout-multi-shipping").length > 0) {
		multiship.init();
	} else{
		billing.init();
	}

	//if on the order review page and there are products that are not available diable the submit order button
	if($('.order-summary-footer').length > 0){
		if($('.notavailable').length > 0){
			$('.order-summary-footer .submit-order .button-fancy-large').attr( 'disabled', 'disabled' );
		}
	}

	$('.edit-address').on('click', 'a', function (e) {
		dialog.open({url: this.href, options: {open: function() {
			initializeCache();
			addressLoad();
			addEditAddress(e.target);
		}}});
		// return false to prevent global dialogify event from triggering
		return false;
	});
}

exports.init = function () {
	initializeCache();
	initializeEvents();
};

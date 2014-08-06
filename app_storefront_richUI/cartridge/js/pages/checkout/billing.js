'use strict';

var giftcard = require('../../giftcard'),
	util = require('../../util'),
	validator = require('../../validator');

/**
 * @function
 * @description Fills the Credit Card form with the passed data-parameter and clears the former cvn input
 * @param {Object} data The Credit Card data (holder, type, masked number, expiration month/year)
 */
function setCCFields(data) {
	var $creditCard = $("#PaymentMethod_CREDIT_CARD");
	$creditCard.find('input[name$="creditCard_owner"]').val(data.holder);
	$creditCard.find('select[name$="_type"]').val(data.type);
	$creditCard.find('input[name$="_number"]').val(data.maskedNumber);
	$creditCard.find('[name$="_month"]').val(data.expirationMonth);
	$creditCard.find('[name$="_year"]').val(data.expirationYear);
	$creditCard.find('input[name$="_cvn"]').val('');

	// remove error messages
	$creditCard.find(".errormessage").removeClass("errormessage").filter("span").remove();
	$creditCard.find(".errorlabel").removeClass("errorlabel");
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
 * @description Changes the payment method form depending on the passed paymentMethodID
 * @param {String} paymentMethodID the ID of the payment method, to which the payment method form should be changed to
 */
function changePaymentMethod(paymentMethodID) {
	var $paymentMethods = $('.payment-method');
	$paymentMethods.removeClass('payment-method-expanded');
	var pmc = $paymentMethods.filter('#PaymentMethod_' + paymentMethodID);
	if (pmc.length===0) {
		pmc = $('#PaymentMethod_Custom');
	}
	pmc.addClass('payment-method-expanded');

	// ensure checkbox of payment method is checked
	$('#is-' + paymentMethodID)[0].checked = true;

	var bmlForm = $('#PaymentMethod_BML');
	bmlForm.find('select[name$="_year"]').removeClass('required');
	bmlForm.find('select[name$="_month"]').removeClass('required');
	bmlForm.find('select[name$="_day"]').removeClass('required');
	bmlForm.find('input[name$="_ssn"]').removeClass('required');

	if (paymentMethodID === 'BML') {
		var yr = bmlForm.find('select[name$="_year"]');
		bmlForm.find('select[name$="_year"]').addClass('required');
		bmlForm.find('select[name$="_month"]').addClass('required');
		bmlForm.find('select[name$="_day"]').addClass('required');
		bmlForm.find('input[name$="_ssn"]').addClass('required');
	}
	validator.init();
}

/**
 * @function
 * @description loads billing address, Gift Certificates, Coupon and Payment methods
 */
exports.init = function () {
	var $checkoutForm = $('.checkout-billing'),
		$paymentMethodId = $('input[name$="_selectedPaymentMethodID"]'),
		$addGiftCert = $('#add-giftcert'),
		$giftCertCode = $('input[name$="_giftCertCode"]'),
		$addCoupon = $('#add-coupon'),
		$couponCode = $('input[name$="_couponCode"]');

	if( !$paymentMethodId ) return;

	$paymentMethodId.on('click', function () {
		changePaymentMethod($(this).val());
	});

	// get selected payment method from payment method form
	var $selectedPaymentMethodId = $paymentMethodId.filter(':checked');
	if($('.payment-method-options').length > 0 ){
		changePaymentMethod($selectedPaymentMethodId.length===0 ? 'CREDIT_CARD' : $selectedPaymentMethodId.val());
	}
	// select credit card from list
	$("#creditCardList").on('change', function () {
		var cardUUID = $(this).val();
		if(!cardUUID) { return; }
		populateCreditCardForm(cardUUID);
	});

	// handle whole form submit (bind click to continue checkout button)
	// append form fields of current payment form to this submit
	// in order to validate the payment method form inputs too

	$('button[name$="_billing_save"]').on('click', function (e) {
		// determine if the order total was paid using gift cert or a promotion
		if ($('#noPaymentNeeded').length > 0 && $('.giftcert-pi').length > 0) {
			// as a safety precaution, uncheck any existing payment methods
			$selectedPaymentMethodId.removeAttr('checked');
			// add selected radio button with gift card payment method
			$('<input/>').attr({
				name: $paymentMethodId.first().attr('name'),
				type: 'radio',
				checked: 'checked',
				value: Constants.PI_METHOD_GIFT_CERTIFICATE
			}).appendTo($checkoutForm);
		}

		var tc = $checkoutForm.find('input[name$="bml_termsandconditions"]');
		if ($paymentMethodId.filter(':checked').val()==='BML' && !$checkoutForm.find('input[name$="bml_termsandconditions"]')[0].checked) {
			alert(Resources.BML_AGREE_TO_TERMS);
			return false;
		}

	});

	$('#check-giftcert').on('click', function (e) {
		e.preventDefault();
		$balance = $('.balance');
		if ($giftCertCode.length === 0 || $giftCertCode.val().length === 0) {
			var error = $balance.find('span.error');
			if (error.length===0) {
				error = $('<span>').addClass('error').appendTo($balance);
			}
			error.html(Resources.GIFT_CERT_MISSING);
			return;
		}

		giftcard.checkBalance($giftCertCode.val(), function (data) {
			if (!data || !data.giftCertificate) {
				$balance.html(Resources.GIFT_CERT_INVALID).removeClass('success').addClass('error');
				return;
			}
			$balance.html(Resources.GIFT_CERT_BALANCE + ' ' + data.giftCertificate.balance).removeClass('error').addClass('success');
		});
	});

	$addGiftCert.on('click', function(e) {
		e.preventDefault();
		var code = $giftCertCode.val(),
			$error = $checkoutForm.find('.giftcert-error');
		if (code.length === 0) {
			$error.html(Resources.GIFT_CERT_MISSING);
			return;
		}

		var url = util.appendParamsToUrl(Urls.redeemGiftCert, {giftCertCode: code, format: 'ajax'});
		$.getJSON(url, function(data) {
			var fail = false;
			var msg = '';
			if (!data) {
				msg = Resources.BAD_RESPONSE;
				fail = true;
			} else if (!data.success) {
				msg = data.message.split('<').join('&lt;').split('>').join('&gt;');
				fail = true;
			}
			if (fail) {
				$error.html(msg);
				return;
			} else {
				window.location.assign(Urls.billing);
			}
		});
	});

	$addCoupon.on('click', function(e){
		e.preventDefault();
		var $error = $checkoutForm.find('.coupon-error'),
			code = $couponCode.val();
		if (code.length===0) {
			$error.html(Resources.COUPON_CODE_MISSING);
			return;
		}

		var url = util.appendParamsToUrl(Urls.addCoupon, {couponCode: code,format: 'ajax'});
		$.getJSON(url, function(data) {
			var fail = false;
			var msg = '';
			if (!data) {
				msg = Resources.BAD_RESPONSE;
				fail = true;
			}
			else if (!data.success) {
				msg = data.message.split('<').join('&lt;').split('>').join('&gt;');
				fail = true;
			}
			if (fail) {
				$error.html(msg);
				return;
			}

			//basket check for displaying the payment section, if the adjusted total of the basket is 0 after applying the coupon
			//this will force a page refresh to display the coupon message based on a parameter message
			if(data.success && data.baskettotal==0){
				window.location.assign(Urls.billing);
			}
		});
	});

	// trigger events on enter
	$couponCode.on('keydown', function(e) {
		if (e.which === 13) {
			e.preventDefault();
			$addCoupon.click();
		}
	});
	$giftCertCode.on('keydown', function(e) {
		if (e.which === 13) {
			e.preventDefault();
			$addGiftCert.click();
		}
	});
}
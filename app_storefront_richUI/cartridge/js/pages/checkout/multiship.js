'use strict';

/**
* @function
* @description this function inits the form so that uses client side validation before submitting to the server
*/
function initmultishipshipaddress() {
	var $continue = $('.formactions button'),
		$selects = $('.select-address');

	var hasEmptySelect = function () {
		var selectValues = $selects.children(':selected').map(function (){
			return this.value;
		});
		return $.inArray('', selectValues) !== -1;
	};
	// if we found a empty value disable the button
	if (hasEmptySelect()){
		$continue.attr('disabled','disabled');
	} else {
		$continue.removeAttr('disabled');
	}
	//add listeners to the selects to enable the continue button
	$selects.on('change', function(){
		if (this.value === ''){
			$continue.attr('disabled','disabled');
		} else {
			//check to see if any select box has a empty vlaue
			if (hasEmptySelect()) {
				$continue.attr('disabled','disabled');
			} else {
				$continue.removeAttr('disabled');
			}
		}
	});
}

/**
 * @function
 * @description Initializes gift message box for multiship shipping, the message box starts off as hidden and this will display it if the radio button is checked to yes, also added event handler to listen for when a radio button is pressed to display the message box
 */
function initMultiGiftMessageBox() {
	$.each( $(".item-list"), function(){
		var $this = $(this),
			$isGiftYes = $this.find('.js-isgiftyes'),
			$isGiftNo = $this.find('.js-isgiftno'),
			$giftMessage = $this.find('.gift-message-text');

		//handle initial load
		if ($isGiftYes.is(':checked')) {
			$giftMessage.css('display','block');
		}

		//set event listeners
		$this.on('change', function(){
			if ($isGiftYes.is(':checked')) {
				$giftMessage.css('display','block');
			} else if ($isGiftNo.is(':checked')) {
				$giftMessage.css('display','none');
			}
		});
	});
}

/**
 * @function
 * @description shows gift message box in multiship, and if the page is the multi shipping address page it will call initmultishipshipaddress() to initialize the form
 */
exports.init = function () {
	initMultiGiftMessageBox();
	if ($(".cart-row .shippingaddress .select-address").length > 0){
		initmultishipshipaddress();
	} else {
		$('.formactions button').attr('disabled','disabled');
	}
}
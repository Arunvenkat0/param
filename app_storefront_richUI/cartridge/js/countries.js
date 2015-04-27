'use strict';

var util = require('./util');

exports.init = function init () {
	$('.country-selector .current-country').on('click', function () {
		$('.country-selector .selector').toggleClass('active');
		$(this).toggleClass('selector-active');
		$(this).find('.selector-icon').toggleClass('fa-angle-down fa-angle-up');
	});
	$('.country-selector').on('change', function () {
		var selectedOption = $(this).find('option:selected')[0];
		var url = selectedOption.getAttribute('data-href');
		var currency = selectedOption.getAttribute('data-currency');
		$.ajax({
			dataType: 'json',
			url: Urls.setSessionCurrency,
			data: {
				format: 'ajax',
				currencyMnemonic: currency
			}
		})
		.done(function (response) {
			if (!response.success) {
				throw new Error('Unable to set currency');
			}
			window.location.href = url;
		})
	});
}

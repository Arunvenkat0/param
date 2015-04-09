'use strict';

var util = require('./util');

exports.init = function init () {
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

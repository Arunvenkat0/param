'use strict';

/**
 * @function
 * @description Initializes the tooltip-content and layout
 */
exports.init = function () {
	$('.tooltip').tooltip({
		track: true,
		showURL: false,
		bodyHandler: function () {
			// add a data attribute of data-layout="some-class" to your tooltip-content container if you want a custom class
			var tooltipClass = '';
			if ($(this).find('.tooltip-content').data('layout')) {
				tooltipClass = ' class="' + $(this).find('.tooltip-content').data('layout') + '" ';
			}
		return '<div ' + tooltipClass + '>' + $(this).find('.tooltip-content').html() + '</div>';
		}
	});
};

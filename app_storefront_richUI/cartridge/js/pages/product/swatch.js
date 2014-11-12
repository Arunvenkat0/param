'use strict';

var image = require('./image');

module.exports = function () {
	$('#pdpMain').on('hover', '.swatchanchor', function (e) {
		var largeImg = $(this).data('lgimg'),
			$imgZoom = $('#pdpMain .main-image'),
			$mainImage = $('#pdpMain .primary-image');

		if (!largeImg) { return; }
		// store the old data from main image for mouseleave handler
		$(this).data('lgimg', {
			hires: $imgZoom.attr('href'),
			url: $mainImage.attr('src'),
			alt: $mainImage.attr('alt'),
			title: $mainImage.attr('title')
		});
		// set the main image
		image.setMainImage(largeImg);
	});
}

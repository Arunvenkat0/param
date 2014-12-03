'use strict';
var dialog = require('../../dialog'),
	util = require('../../util');

/**
 * @description Enables the zoom viewer on the product detail page
 */
var loadZoom = function () {
	var $imgZoom = $('#pdpMain .main-image'),
		zoomOptions = {
			zoomType: 'standard',
			alwaysOn: 0, // setting to 1 will load load high res images on page load
			zoomWidth: 575,
			zoomHeight: 349,
			position: 'right',
			preloadImages: 0, // setting to 1 will load load high res images on page load
			xOffset: 30,
			yOffset: 0,
			showEffect: 'fadein',
			hideEffect: 'fadeout'
		},
		hiresUrl;

	if ($imgZoom.length === 0 || dialog.isActive() || util.isMobile()) {
		return;
	}
	hiresUrl = $imgZoom.attr('href');

	if (hiresUrl && hiresUrl !== 'null' && hiresUrl.indexOf('noimagelarge') === -1) {
		$imgZoom.addClass('image-zoom');
		$imgZoom.removeData('jqzoom').jqzoom(zoomOptions);
	} else {
		$imgZoom.removeClass('image-zoom');
	}
};

/**
 * @description Sets the main image attributes and the href for the surrounding <a> tag
 * @param {Object} atts Object with url, alt, title and hires properties
 */
var setMainImage = function (atts) {
	$('#pdpMain .primary-image').attr({
		src: atts.url,
		alt: atts.alt,
		title: atts.title
	});
	if (!dialog.isActive() && !util.isMobile()) {
		$('#pdpMain .main-image').attr('href', atts.hires);
	}
	loadZoom();
};

/**
 * @description Replaces the images in the image container, for eg. when a different color was clicked.
 */
var replaceImages = function () {
	var $newImages = $('#update-images'),
		$imageContainer = $('#pdpMain .product-image-container');
	if ($newImages.length === 0) { return; }

	$imageContainer.html($newImages.html());
	$newImages.remove();
	loadZoom();
};

/* @module image
 * @description this module handles the primary image viewer on PDP
 **/

/**
 * @description by default, this function sets up zoom and event handler for thumbnail click
 **/
module.exports = function () {
	if (dialog.isActive() || util.isMobile()) {
		$('#pdpMain .main-image').removeAttr('href');
	}
	loadZoom();
	// handle product thumbnail click event
	$('#pdpMain').on('click', '.productthumbnail', function () {
		// switch indicator
		$(this).closest('.product-thumbnails').find('.thumb.selected').removeClass('selected');
		$(this).closest('.thumb').addClass('selected');

		setMainImage($(this).data('lgimg'));
	});
};
module.exports.loadZoom = loadZoom;
module.exports.setMainImage = setMainImage;
module.exports.replaceImages = replaceImages;

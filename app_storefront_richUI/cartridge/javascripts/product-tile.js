'use strict';

var quickview = require('./quickview');

/**
 * @private
 * @function
 * @description Initializes events on the product-tile for the following elements:
 * - swatches
 * - thumbnails
 */
function initializeEvents() {
	quickview.initializeButton($(".tiles-container"), '.product-image');

	$('.swatch-list').on('mouseleave', function () {
		// Restore current thumb image
		var $tile = $(this).closest(".grid-tile"),
			$thumb = $tile.find(".product-image a.thumb-link img").filter(":first"),
			data = $thumb.data("current");
		
		$thumb.attr({
			src : data.src,
			alt : data.alt,
			title : data.title
		});
	});
	$('.swatch-list .swatch').on('click', function (e) {
		e.preventDefault();
		if ($(this).hasClass('selected')) { return; }

		var $tile = $(this).closest('.grid-tile');
		$(this).closest('.swatch-list').find('.swatch.selected').removeClass('selected');
		$(this).addClass('selected');
		$tile.find('.thumb-link').attr('href', $(this).attr('href'));
		$tile.find('name-link').attr('href', $(this).attr('href'));

		var data = $(this).children('img').filter(':first').data('thumb');
		var $thumb = tile.find('.product-image .thumb-link img').filter(':first');
		var currentAttrs = {
			src : data.src,
			alt : data.alt,
			title : data.title
		};
		$thumb.attr(currentAttrs);
		$thumb.data('current', currentAttrs);
	}).on('mouseenter', function () {
		// get current thumb details
		var $tile = $(this).closest('.grid-tile'),
			$thumb = $tile.find('.product-image .thumb-link img').filter(':first'),
			data = $(this).children('img').filter(':first').data('thumb'),
			current = $thumb.data('current');

		// If this is the first time, then record the current img
		if (!current) {
			$thumb.data('current',{
				src: $thumb[0].src,
				alt: $thumb[0].alt,
				title: $thumb[0].title
			});
		}

		// Set the tile image to the values provided on the swatch data attributes
		$thumb.attr({
			src : data.src,
			alt : data.alt,
			title : data.title
		});
	});
}


exports.init = function () {
	var $tiles = $('.tiles-container').find(".product-tile");
	if ($tiles.length===0) { return; }
	$tiles.syncHeight()
		.each(function (idx) {
			$(this).data("idx",idx);
		});
	initializeEvents();
};

' use strict';

/**
 * @function
 * @description Triggers the scroll event on a carousel element
 * @param {Object} carousel
 */
function slideCarousel_initCallback(carousel) {
	// create navigation for slideshow
	var numSlides = $('#homepage-slider li').size();
	var slideShowNav = '<div class="jcarousel-control">';
	for (var i = 1; i <= numSlides; i++) {
		slideShowNav = slideShowNav + '<a href="#" class="link-' + i + '">' + i + '</a>';
	}
	slideShowNav = slideShowNav + '</div>';
	$('#homepage-slider .jcarousel-clip').append(slideShowNav);

	$('.jcarousel-control a').bind('click', function() {
		carousel.scroll(jQuery.jcarousel.intval($(this).text()));
		return false;
	});
	$('.slide').width($('#wrapper').width());
}

// TODO what are these TBDs? Check with Carousel API? Use a simpler carousel?
/**
 * @function
 * @description Activates the visibility of the next element in the carousel
 * @param {Object} carousel -- necessity needs TBD!
 * @param {Object} item --  necessity needs TBD!
 * @param {Number} idx Index of the item which should be activated
 * @param {Object} state --  necessity needs TBD!
 */
function slideCarousel_itemVisible(carousel, item, idx, state) {
	$('.jcarousel-control a').removeClass('active');
	$('.jcarousel-control').find('.link-'+idx).addClass('active');
}
exports.init = function () {
	$('#homepage-slider').slider.jcarousel({
		scroll: 1,
		auto: 4,
		buttonNextHTML: null,
		buttonPrevHTML: null,
		itemFallbackDimension: '100%',
		initCallback: slideCarousel_initCallback,
		itemFirstInCallback: slideCarousel_itemVisible
	});
};

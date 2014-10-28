/* global dw */

'use strict';

/**
 * @function
 * @description capture recommendation of each product when it becomes visible in the carousel
 * @param c TBD
 * @param {Element} li The visible product element in the carousel
 * @param index TBD
 * @param state TBD
 */

function captureCarouselRecommendations(c, li) {
	if (!dw) { return; }

	$(li).find('.capture-product-id').each(function () {
		dw.ac.capture({
			id: $(this).text(),
			type: dw.ac.EV_PRD_RECOMMENDATION
		});
	});
}

var components = {
	carouselSettings: {
		scroll: 1,
		itemFallbackDimension: '100%',
		itemVisibleInCallback: captureCarouselRecommendations
	},
	init: function () {
		setTimeout(function () {
			// renders horizontal/vertical carousels for product slots
			$('#vertical-carousel').jcarousel($.extend({vertical: true}, this.carouselSettings));
			$('#horizontal-carousel').jcarousel(this.carouselSettings);
		}.bind(this), 1000);
	}
};

module.exports = components;

/**
 * @class app.components
 */
(function (app, dw, $) {
	/**
	 * @function
	 * @description capture recommendation of each product when it becomes visible in the carousel
	 * @param c TBD
	 * @param {Element} li The visible product element in the carousel
	 * @param index TBD
	 * @param state TBD
	 */
	function captureCarouselRecommendations(c, li, index, state) {
		if (!dw) { return; }

		$(li).find(".capture-product-id").each(function () {
			dw.ac.capture({
				id : $(this).text(),
				type : dw.ac.EV_PRD_RECOMMENDATION
			});
		});
	}

	/******* app.components public object ********/
	app.components = {
		carouselSettings : {
			scroll : 1,
			itemFallbackDimension: '100%',
			itemVisibleInCallback : app.captureCarouselRecommendations
		},
		init : function () {
			setTimeout(function(){
			// renders horizontal/vertical carousels for product slots
			$('#vertical-carousel').jcarousel($.extend({vertical : true}, app.components.carouselSettings));
			$('#horizontal-carousel').jcarousel(app.components.carouselSettings);
			}, 1000);
		}
	};
}(window.app = window.app || {}, window.dw, jQuery));
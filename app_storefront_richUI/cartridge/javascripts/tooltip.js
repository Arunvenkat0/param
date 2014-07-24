/**
@class app.tooltip
*/
(function (app, $) {
	var $cache = {};
	app.tooltips = {
		/**
		 * @function
		 * @description Initializes the tooltip-content and layout
		 */
		init : function () {

			$('.tooltip').tooltip({
				track: true,
				showURL: false,
			    bodyHandler: function() {
					// add a data attribute of data-layout="some-class" to your tooltip-content container if you want a custom class
					var tooltipClass = "";
					if( tooltipClass = $(this).find('.tooltip-content').data("layout") ) {
						tooltipClass = " class='" + tooltipClass + "' ";
					}
		        	return "<div " + tooltipClass + ">" + $(this).find('.tooltip-content').html() + "</div>";
				},
				showURL: false
			});
		}
	};

}(window.app = window.app || {}, jQuery));
/**
 * @class app.mulitcurrency
 */
(function (app, $) {
	/**
	 * @private
	 * @function
	 * @description Binds event to the place holder (.blur)
	 */
	function initializeEvents() {
		//listen to the drop down, and make a ajax call to mulitcurrency pipeline
		$('.currency-converter').on("change", function () {
 			// request results from server
 	 		app.ajax.getJson({
 	 		 	url: app.util.appendParamsToUrl(app.urls.currencyConverter , {format:"ajax",currencyMnemonic:$('select.currency-converter').val()}),
 	 		 	callback: function(data){
 	 				location.reload();
 	 		 	}// end ajax callback
 	 		 });
		});
		
		//hide the feature if user is in checkout
		if(app.page.title=="Checkout"){
			$('.mc-class').css('display','none');
		}
		
	}

	/******* app.mulitcurrency public object ********/
	app.mulitcurrency = {
		/**
		 * @function
		 * @description 
		 */
		init : function () {
			initializeEvents();
		}
	};
}(window.app = window.app || {}, jQuery));
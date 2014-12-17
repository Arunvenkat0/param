/*
 * All java script logic for the mobile layout.
 *
 * The code relies on the jQuery JS library to
 * be also loaded.
 *
 * The logic extends the JS namespace app.*
 */
(function(app, $, undefined) {
	app.responsive = {

		mobileLayoutWidth : 500,

		toggleGridWideTileView : function(){
			/*	toggle grid/wide tile	*/
			if(jQuery('.toggle-grid').length == 0 && (jQuery('.pt_order').length == 0) && (jQuery('.pt_content-search-result').length == 0))
			{
				jQuery('.results-hits').prepend('<a class="toggle-grid" href="'+location.href+'">+</a>');
				jQuery('.toggle-grid').click(function(){
					jQuery('.search-result-content').toggleClass('wide-tiles');
					return false;
				});
			}
		}
	}
}(window.app = window.app || {}, jQuery));

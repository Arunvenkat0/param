'use strict';

var dialog = require('./dialog');

/**
 * @function cookieprivacy	Used to display/control the scrim containing the cookie privacy code
 **/
module.exports = function () {
	/**
	 * If we have not accepted cookies AND we're not on the Privacy Policy page, then show the notification
	 * NOTE: You will probably want to adjust the Privacy Page test to match your site's specific privacy / cookie page
	 */
	 var isPrivacyPolicyPage = $('.content-header').length !== 0 && $('.content-header').text().indexOf('Privacy Policy') !== -1;
	if (SitePreferences.COOKIE_HINT === true && document.cookie.indexOf('dw_cookies_accepted') < 0) {
		if (!isPrivacyPolicyPage) {
			dialog.open({
				url: Urls.cookieHint,
				options: {
					buttons: {
						//NOTE: The Close Button handler does the same thing as the 'I Accept" handler - it sets the cookies
						// and clears the cookie notification.  In a strict situation where you MUST actively accept the cookies
						// before proceeding, we recommend removing this button from the content asset as well as this handler.
						'I Agree': buttonHandler,
						'Close': buttonHandler
					}
				}
			});
		}
	} else {
		// Otherwise, we don't need to show the asset, just enable the cookies
		enable_cookies();
	}

	// Close Button handler

	function buttonHandler() {
		$(this).dialog('close');
		enable_cookies();
	}

	function enable_cookies() {
		if (document.cookie.indexOf('dw=1') < 0) {
			document.cookie = 'dw=1; path=/';
		}
		if (document.cookie.indexOf('dw_cookies_accepted') < 0) {
			document.cookie = 'dw_cookies_accepted=1; path=/';
		}
	}
}

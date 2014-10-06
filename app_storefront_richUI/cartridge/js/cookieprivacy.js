'use strict';

/** @function cookieprivacy	Used to display/control the scrim containing the cookie privacy code **/

module.exports = function () {
	/**
	 * if we have not accepted cookies AND we're not on the Privacy Policy page, then show the notification
	 *
	 * NOTE: You will probably want to adjust the Privacy Page test to match your site's specific privacy / cookie page
	 */
	if (SitePreferences.COOKIE_HINT === true && document.cookie.indexOf('dw_cookies_accepted') < 0) {
		// Show the Content Asset
		if ($('h1.content-header').length == 0 || $('h1.content-header')[0].textContent.indexOf('Privacy Policy') < 0) {
			$('#overlay-background').css('display','block');
			$('#cookie-hint').css('display','block');
		}
	} else {
		// Otherwise, we don't need to show the asset, just enable the cookies
		enable_cookies();
	}

	// Close Button handler
	/**
	 * NOTE: The Close Button handler does the same thing as the 'I Accept" handler - it sets the cookies
	 * and clears the cookie notification.  In a strict situation where you MUST actively accept the cookies
	 * before proceeding, we recommend removing this button from the content asset as well as this handler.
	 */
	$('.privacy_close_noaction').on('click', function () {
		enable_cookies();
		close_all();
	});

	// Accept Button handler
	$('.privacypolicy_agreebtn').on('click', function () {
		enable_cookies();
		close_all();
	});

	function enable_cookies() {
		if (document.cookie.indexOf('dw=1') < 0) {
			document.cookie = 'dw=1; path=/';
		}
		if (document.cookie.indexOf('dw_cookies_accepted') < 0) {
			document.cookie = 'dw_cookies_accepted=1; path=/';
		}
	}

	function close_all() {
		$('#overlay-background').hide();
		$('#cookie-hint').hide();
	};
}

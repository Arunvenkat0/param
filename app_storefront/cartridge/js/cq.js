'use strict';
/* global CQuotient */

function clickThruAfter() {
	var recommenderName = localStorage.getItem('cq.recommenderName');
	var currentProductId = $('[itemprop="productID"]').val();
	if (!recommenderName) {return;}
	var anchors;
	if (localStorage.getItem('cq.anchors')) {
		anchors = localStorage.getItem('cq.anchors');
		localStorage.removeItem('cq.anchors');
	}
	if (window.CQuotient) {
		CQuotient.activities.push({
			activityType: 'clickReco',
			parameters: {
				cookieId: CQuotient.getCQCookieId(),
				userId: CQuotient.getCQUserId(),
				recommenderName: recommenderName,
				anchors: anchors,
				products: {
					id: currentProductId
				}
			}
		});
	}
	localStorage.removeItem('cq.recommendername');
}

exports.init = function () {
	// set cookie before click through from product tile
	$('body').on('click', '.product-tile[data-recommendername] a', function () {
		// if currently on a product page, send its productId as the anchor
		if (window.pageContext.type === 'product') {
			localStorage.setItem('cq.anchors', $('[itemprop="productID"]').val());
		}
		var recommenderName = $(this).parents('.product-tile').data('recommendername');
		localStorage.setItem('cq.recommenderName', recommenderName);
	});

	clickThruAfter();
};

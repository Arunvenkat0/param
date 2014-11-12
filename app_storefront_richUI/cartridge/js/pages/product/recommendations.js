'use strict';

var carousel = require('../../carousel');

/**
 * @description Creates product recommendation carousel using jQuery jcarousel plugin
 **/
module.exports = function () {
	var $carousel = $('#carousel-recomendations');
	if (!$carousel || $carousel.length === 0 || $carousel.children().length === 0) {
		return;
	}
	$carousel.jcarousel(carousel.settings);
};

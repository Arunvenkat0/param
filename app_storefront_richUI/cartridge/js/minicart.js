'use strict';

var util = require('./util'),
	bonusProductsView = require('./bonus-products-view');

var timer = {
	id: null,
	clear: function () {
		if (this.id) {
			window.clearTimeout(this.id);
			delete this.id;
		}
	},
	start: function (duration, callback) {
		this.id = setTimeout(callback, duration);
	}
};

var minicart = {
	init: function () {
		this.$el = $('#mini-cart');
		this.$content = this.$el.find('.mini-cart-content');

		var $productList = this.$el.find('.mini-cart-products');
		$productList.children().not(':first').addClass('collapsed');
		$productList.find('.mini-cart-product').append('<div class="mini-cart-toggler">&nbsp;</div>');

		$productList.toggledList({
			toggleClass: 'collapsed',
			triggerSelector: '.mini-cart-toggler',
			eventName: 'click'});

		// events
		this.$el.find('.mini-cart-total').on('mouseenter', function () {
			if (this.$content.not(':visible')) {
				this.slide();
			}
		}.bind(this));

		this.$content.on('mouseenter', function () {
			timer.clear();
		}).on('mouseleave', function () {
			timer.clear();
			timer.start(30, this.close.bind(this));
		}.bind(this));

		this.$el.find('.mini-cart-close').on('click', this.close);
	},
	/**
	 * @function
	 * @description Shows the given content in the mini cart
	 * @param {String} A HTML string with the content which will be shown
	 */
	show: function (html) {
		this.$el.html(html);
		util.scrollBrowser(0);
		this.init();
		this.slide();
		bonusProductsView.loadBonusOption();
	},
	/**
	 * @function
	 * @description Slides down and show the contents of the mini cart
	 */
	slide: function () {
		timer.clear();
		// show the item
		this.$content.slideDown('slow');
		// after a time out automatically close it
		timer.start(6000, this.close.bind(this));
	},
	/**
	 * @function
	 * @description Closes the mini cart with given delay
	 * @param {Number} delay The delay in milliseconds
	 */
	close: function (delay) {
		timer.clear();
		this.$content.slideUp(delay);
	},
};

module.exports = minicart;

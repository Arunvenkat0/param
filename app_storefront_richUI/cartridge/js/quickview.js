'use strict';

var dialog = require('./dialog'),
	util = require('./util'),
	_ = require('lodash');


var makeUrl = function (url, source, productListID) {
	if (source) {
		url = util.appendParamToURL(url, 'source', source);
	}
	if (productListID) {
		url = util.appendParamToURL(url, 'productlistid', productListID);
	}
	return url;
};

var quickview = {
	init: function () {
		if (!this.exists()) {
			this.$container = $('<div/>').attr('id', '#QuickViewDialog').appendTo(document.body);
		}
		this.productLinks = $('#search-result-items .thumb-link').map(function (index, thumbLink) {
			return $(thumbLink).attr('href');
		});
	},

	initializeQuickViewNav: function (qvUrl) {
		var $btnNext = $('.quickview-next'),
			$btnPrev = $('.quickview-prev');

		// remove any param
		qvUrl = qvUrl.substring(0, qvUrl.indexOf('?'));

		this.productLinkIndex = _(this.productLinks).findIndex(function (url) {
			return url === qvUrl;
		});

		// hide the buttons on the compare page or when there are no other products
		if (this.productLinks.length <= 1 || $('.compareremovecell').length > 0) {
			$btnNext.hide();
			$btnPrev.hide();
			return;
		}

		if (this.productLinkIndex === this.productLinks.length - 1) {
			$btnNext.attr('disabled', 'disabled');
		}
		if (this.productLinkIndex === 0) {
			$btnPrev.attr('disabled', 'disabled');
		}

		$btnNext.on('click', function (e) {
			e.preventDefault();
			this.navigateQuickview(1);
		}.bind(this));
		$btnPrev.on('click', function (e) {
			e.preventDefault();
			this.navigateQuickview(-1);
		}.bind(this));
	},

	/**
	 * @param {Number} step - How many products away from current product to navigate to. Negative number means navigate backward
	 */
	navigateQuickview: function (step) {
		// default step to 0
		this.productLinkIndex += (step ? step : 0);
		var url = makeUrl(this.productLinks[this.productLinkIndex], 'quickview');
		dialog.replace({
			url: url,
			callback: this.initializeQuickViewNav.bind(this, url)
		});
	},

	/**
	 * @description show quick view dialog
	 * @param {object} options
	 * @param {stirng} options.url - url of the product details
	 * @param {string} options.source - source of the dialog to be appended to URL
	 * @param {string} options.productlistid - to be appended to URL
	 * @param {function} options.callback - callback once the dialog is opened
	 */
	show: function (options) {
		var url;
		if (!this.exists()) {
			this.init();
		}
		url = makeUrl(options.url, options.source, options.productlistid);

		dialog.open({
			target: this.$container,
			url: url,
			options: {
				width: 920,
				title: 'Product Quickview',
				open: function () {
					this.initializeQuickViewNav(url);
					if (typeof options.callback === 'function') { options.callback(); }
				}.bind(this)
			}
		});
	},
	// close the quick view dialog
	close: function () {
		if (this.exists()) {
			this.$container.dialog('close').empty();
		}
	},
	exists: function () {
		return this.$container && (this.$container.length > 0);
	},
	isActive: function () {
		return this.exists() && (this.$container.children.length > 0);
	}
};

module.exports = quickview;

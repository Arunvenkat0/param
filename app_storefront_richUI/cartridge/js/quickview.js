'use strict';

var ajax = require('./ajax'),
	dialog = require('./dialog'),
	progress = require('./progress'),
	util = require('./util');

var quickview = {
	init: function () {
		if (!this.exists()) {
			this.$container = $('<div/>').attr('id', '#QuickViewDialog').appendTo(document.body);
		}
	},

	initializeQuickViewNav: function (qvUrl) {
		// from the url of the product in the quickview
		var qvUrlTail = qvUrl.substring(qvUrl.indexOf('?')),
			qvUrlPidParam = qvUrlTail.substring(0, qvUrlTail.indexOf('&'));
		qvUrl = qvUrl.substring(0, qvUrl.indexOf('?'));

		if (qvUrlPidParam.indexOf('pid') > 0) {
			// if storefront urls are turned off
			// append the pid to the url
			qvUrl = qvUrl + qvUrlPidParam;
		}

		this.searchesultsContainer = $('#search-result-items').parent();
		this.productLinks = this.searchesultsContainer.find('.thumb-link');

		this.btnNext = $('.quickview-next');
		this.btnPrev = $('.quickview-prev');

		if (this.productLinks.length === 0) {
			this.btnNext.hide();
			this.btnPrev.hide();
			return;
		}

		this.btnNext.click(this.navigateQuickview.bind(this));
		this.btnPrev.click(this.navigateQuickview.bind(this));

		var productLinksUrl = '';
		for (var i = 0; i < this.productLinks.length; i++) {
			var productLinksUrlTail = this.productLinks[i].href.substring(this.productLinks[i].href.indexOf('?'));
			var productLinksUrlPidParam = productLinksUrlTail.substring(0, qvUrlTail.indexOf('&'));
			if (productLinksUrlPidParam.indexOf('pid') > 0) {
				//append the pid to the url
				//if storefront urls are turned off
				productLinksUrl = this.productLinks[i].href.substring(0, this.productLinks[i].href.indexOf('?'));
				productLinksUrl = productLinksUrl + productLinksUrlPidParam;
			} else {
				productLinksUrl = this.productLinks[i].href.substring(0, this.productLinks[i].href.indexOf('?'));
			}

			if (productLinksUrl == '') {
				productLinksUrl = this.productLinks[i].href;
			}
			if (qvUrl == productLinksUrl) {
				this.productLinkIndex = i;
			}
		}

		if (this.productLinkIndex == this.productLinks.length - 1) {
			this.btnNext.hide();
		}

		if (this.productLinkIndex == 0) {
			this.btnPrev.hide();
		}

		//hide the buttons on the compare page
		if ($('.compareremovecell').length > 0) {
			this.btnNext.hide();
			this.btnPrev.hide();
		}
	},
	navigateQuickview: function (e) {
		e.preventDefault();
		var button = $(e.currentTarget);

		if (button.hasClass('quickview-next')) {
			this.productLinkIndex++;
		} else {
			this.productLinkIndex--;
		}

		this.show({
			url: this.productLinks[this.productLinkIndex].href,
			source: 'quickview'
		});
	},

	// show quick view dialog and send request to the server to get the product
	// options.source - source of the dialog i.e. search/cart
	// options.url - product url
	show: function (options) {
		if (!this.exists()) {
			this.init();
		}
		var that = this;
		var target = this.$container;
		var url = options.url;
		var source = options.source;
		var productListId = options.productlistid || '';
		if (source.length > 0) {
			url = util.appendParamToURL(url, 'source', source);
		}
		if (productListId.length > 0) {
			url = util.appendParamToURL(url, 'productlistid', productListId)
		}

		ajax.load({
			target: target,
			url: url,
			callback: function () {
				dialog.create({
					target: target,
					options: {
						height: 'auto',
						width: 920,
						modal: true,
						dialogClass: 'quickview',
						title: 'Product Quickview',
						resizable: false,
						position: 'center',
						open: function () {
							// allow for click outside modal to close the modal
							$('.ui-widget-overlay').on('click', this.close.bind(this));
							if (options.callback) options.callback();
						}.bind(this)
					}
				});
				target.dialog('open');
				this.initializeQuickViewNav(url);
			}.bind(this)
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

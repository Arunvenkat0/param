'use strict';

var dialog = require('./dialog'),
	product = require('./pages/product'),
	progress = require('./progress');

var quickView = {
	initializeButton : function (container, target) {
		var that = this;
		// quick view button
		$(container).on("mouseenter", target, function (e) {
			var $qvButton = $('#quickviewbutton');
			if ($qvButton.length === 0) {
				$qvButton = $('<a id="quickviewbutton"/>');
			}
			$qvButton.on("click", function (e) {
				e.preventDefault();
				that.show({
					url : $(this).attr("href"),
					source : "quickview"
				});
			});

			var $link = $(this).children("a:first");
			$qvButton.attr({
				'href': $link.attr('href'),
				'title': $link.attr('title')
			}).appendTo($(this));
		});
	},
	init : function () {
		if (!this.exists()) {
			this.$container = $('<div/>').attr('id', '#QuickViewDialog').appendTo(document.body);
		}
	},
	
	initializeQuickViewNav : function(qvUrl) {
		// from the url of the product in the quickview
		var qvUrlTail = qvUrl.substring(qvUrl.indexOf('?')),
			qvUrlPidParam = qvUrlTail.substring(0, qvUrlTail.indexOf('&'));
		qvUrl = qvUrl.substring(0, qvUrl.indexOf('?'));
		
		if (qvUrlPidParam.indexOf('pid') > 0){
			// if storefront urls are turned off
			// append the pid to the url
			qvUrl = qvUrl + qvUrlPidParam;
		}
		
		this.searchesultsContainer = $('#search-result-items').parent();
		this.productLinks = this.searchesultsContainer.find('.thumb-link');

		this.btnNext = $('.quickview-next');
		this.btnPrev = $('.quickview-prev');

		this.btnNext.click(this.navigateQuickview.bind(this));
		this.btnPrev.click(this.navigateQuickview.bind(this));

		var productLinksUrl = '';
		for (var i = 0; i < this.productLinks.length; i++) {
			productLinksUrlTail = this.productLinks[i].href.substring(this.productLinks[i].href.indexOf('?'));
			productLinksUrlPidParam = productLinksUrlTail.substring(0, qvUrlTail.indexOf('&'));
			if (productLinksUrlPidParam.indexOf('pid') > 0){
				//append the pid to the url
				//if storefront urls are turned off
				productLinksUrl = this.productLinks[i].href.substring(0, this.productLinks[i].href.indexOf('?'));
				productLinksUrl = productLinksUrl + productLinksUrlPidParam;
			} else {
				productLinksUrl = this.productLinks[i].href.substring(0, this.productLinks[i].href.indexOf('?'));
			}
		
			if (productLinksUrl == ''){
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
		if ($('.compareremovecell').length > 0){
			this.btnNext.hide();
			this.btnPrev.hide();
		}
	},
	navigateQuickview : function (e) {
		e.preventDefault();
		var button = $(e.currentTarget);

		if (button.hasClass('quickview-next')) {
			this.productLinkIndex++;
		} else {
			this.productLinkIndex--;
		}

		this.show({
			url : this.productLinks[this.productLinkIndex].href,
			source : 'quickview'
		});
	},
	
	// show quick view dialog and send request to the server to get the product
	// options.source - source of the dialog i.e. search/cart
	// options.url - product url
	show : function (options) {
		var that = this;
		options.target = this.init();
		options.callback = function () {
			product.init();
			dialog.create({
				target : that.$container,
				options : {
					height : 'auto',
					width : 920,
					dialogClass : 'quickview',
					title : 'Product Quickview',
					resizable : false,
					position : 'center',
					open : function () {
						progress.hide();
					}
				}
			});
			that.$container.dialog('open');
			that.initializeQuickViewNav(this.url);
		};
		product.get(options);
	},
	// close the quick view dialog
	close : function () {
		if(this.exists()) {
			this.$container.dialog('close').empty();
		}
	},
	exists : function () {
		return this.$container && (this.$container.length > 0);
	},
	isActive : function () {
		return this.exists() && (this.$container.children.length > 0);
	}
};

module.exports = quickview;
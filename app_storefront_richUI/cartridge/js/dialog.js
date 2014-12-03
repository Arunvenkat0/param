'use strict';

var ajax = require('./ajax'),
	util = require('./util'),
	_ = require('lodash');

var dialog = {
	/**
	 * @function
	 * @description Appends a dialog to a given container (target)
	 * @param {Object} params  params.target can be an id selector or an jquery object
	 */
	create: function (params) {
		var $target, id;

		if (_.isString(params.target)) {
			if (params.target.charAt(0) === '#') {
				$target = $(params.target);
			} else {
				$target = $('#' + params.target);
			}
		} else if (params.target instanceof jQuery) {
			$target = params.target;
		} else {
			$target = $('#dialog-container');
		}

		// if no element found, create one
		if ($target.length === 0) {
			if ($target.selector && $target.selector.charAt(0) === '#') {
				id = $target.selector.substr(1);
				$target = $('<div>').attr('id', id).addClass('dialog-content').appendTo('body');
			}
		}

		// create the dialog
		this.$container = $target;
		this.$container.dialog($.extend(true, {}, this.settings, params.options || {}));
		return this.$container;
	},
	/**
	 * @function
	 * @description Opens a dialog using the given url (options.url) or html (options.html)
	 * @param {Object} options
	 * @param {Object} options.url should contain the url
	 * @param {String} options.html contains the html of the dialog content
	 */
	open: function (options) {
		// close any open dialog
		this.close();
		this.$container = this.create(options);
		this.replace(options);
	},
	/**
	 * @description populate the dialog with html content, then open it
	 * @param {String} html
	 **/
	openWithContent: function (html) {
		if (!this.$container) { return; }
		this.$container.empty().html(html);
		if (!this.$container.dialog('isOpen')) {
			this.$container.dialog('open');
		}
	},
	/**
	 * @description Replace the content of current dialog
	 * @param {object} options
	 * @param {string} options.url - If the url property is provided, an ajax call is performed to get the content to replace
	 * @param {string} options.html - If no url property is provided, use html provided to replace
	 */
	replace: function (options) {
		if (!this.$container) {
			return;
		}
		if (options.url) {
			options.url = util.appendParamToURL(options.url, 'format', 'ajax');
			ajax.load({
				url: options.url,
				callback: function (response) {
					this.openWithContent(response);
				}.bind(this)
			});
		} else if (options.html) {
			this.openWithContent(options.html);
		}
	},
	/**
	 * @function
	 * @description Closes the dialog
	 */
	close: function () {
		if (!this.$container) {
			return;
		}
		this.$container.dialog('close');
	},
	/**
	 * @function
	 * @description Submits the dialog form with the given action
	 * @param {String} The action which will be triggered upon form submit
	 */
	submit: function (action) {
		var $form = this.$container.find('form:first');
		// set the action
		$('<input/>').attr({
			name: action,
			type: 'hidden'
		}).appendTo($form);
		// serialize the form and get the post url
		var data = $form.serialize();
		var url = $form.attr('action');
		// make sure the server knows this is an ajax request
		if (data.indexOf('ajax') === -1) {
			data += '&format=ajax';
		}
		// post the data and replace current content with response content
		$.ajax({
			type: 'POST',
			url: url,
			data: data,
			dataType: 'html',
			success: function (html) {
				this.$container.html(html);
			}.bind(this),
			failure: function () {
				window.alert(Resources.SERVER_ERROR);
			}
		});
	},
	exists: function () {
		return this.$container && (this.$container.length > 0);
	},
	isActive: function () {
		return this.exists() && (this.$container.children.length > 0);
	},
	settings: {
		autoOpen: false,
		bgiframe: true,
		buttons: {},
		height: 'auto',
		modal: true,
		overlay: {
			opacity: 0.5,
			background: 'black'
		},
		position: 'center',
		resizable: false,
		title: '',
		width: '800',
		close: function () {
			$(this).dialog('destroy').remove();
		}
	}
};

module.exports = dialog;

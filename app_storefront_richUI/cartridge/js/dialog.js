'use strict';

var ajax = require('./ajax'),
	util = require('./util');

var dialog = {
	/**
	 * @function
	 * @description Appends a dialog to a given container (target)
	 * @param {Object} params  params.target can be an id selector or an jquery object
	 */
	create: function (params) {
		var id;
		// options.target can be an id selector or an jquery object
		var target = $(params.target || '#dialog-container');

		// if no element found, create one
		if (target.length === 0) {
			if (target.selector && target.selector.charAt(0) === '#') {
				id = target.selector.substr(1);
			}
			target = $('<div>').attr('id', id).addClass('dialog-content').appendTo('body');
		}

		// create the dialog
		this.container = target;
		this.container.dialog($.extend(true, {}, this.settings, params.options || {}));
		return this.container;
	},
	/**
	 * @function
	 * @description Opens a dialog using the given url (params.url)
	 * @param {Object} params.url should contain the url
	 */
	open: function (params) {
		if (!params.url || params.url.length === 0) { return; }

		this.container = this.create(params);
		params.url = util.appendParamsToUrl(params.url, {format: 'ajax'});

		// finally load the dialog
		ajax.load({
			target: this.container,
			url: params.url,
			callback: function () {
				if (this.container.dialog('isOpen')) { return; }
				this.container.dialog('open');
			}.bind(this)
		});
	},
	/**
	 * @function
	 * @description Closes the dialog and triggers the "close" event for the dialog
	 */
	close: function () {
		if (!this.container) {
			return;
		}
		this.container.dialog('close');
	},
	/**
	 * @function
	 * @description Submits the dialog form with the given action
	 * @param {String} The action which will be triggered upon form submit
	 */
	submit: function (action) {
		var $form = this.container.find('form:first');
		// set the action
		$("<input/>").attr({
			name: action,
			type: "hidden"
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
				this.container.html(html);
			}.bind(this),
			failure: function () {
				window.alert(Resources.SERVER_ERROR);
			}
		});
	},
	settings: {
		autoOpen: false,
		resizable: false,
		bgiframe: true,
		modal: true,
		height: 'auto',
		width: '800',
		buttons: {},
		title: '',
		overlay: {
			opacity: 0.5,
			background: 'black'
		},
		/**
		 * @function
		 * @description The close event
		 */
		close: function () {
			$(this).dialog('destroy');
		}
	}
};

module.exports = dialog;

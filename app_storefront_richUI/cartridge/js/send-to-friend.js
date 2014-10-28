'use strict';

var ajax = require('./ajax'),
	dialog = require('./dialog'),
	util = require('./util'),
	validator = require('./validator');

var sendToFriend = {
	init: function () {
		var $form = $('#send-to-friend-form'),
			$dialog = $('#send-to-friend-dialog');
		util.limitCharacters();
		$dialog.on('click', '.preview-button, .send-button, .edit-button', function (e) {
			e.preventDefault();
			$form.validate();
			if (!$form.valid()) {
				return false;
			}
			var requestType = $form.find('#request-type');
			if (requestType.length > 0) {
				requestType.remove();
			}
			$('<input/>').attr({id: 'request-type', type: 'hidden', name: $(this).attr('name'), value: $(this).attr('value')}).appendTo($form);
			var data = $form.serialize();
			ajax.load({url:$form.attr('action'),
				data: data,
				target: $dialog,
				callback: function () {
					validator.init();
					util.limitCharacters();
					$('.ui-dialog-content').dialog('option', 'position', 'center');
				}
			});
		})
		.on('click', '.cancel-button, .close-button', function (e) {
			e.preventDefault();
			$dialog.dialog('close');
		});
	},
	initializeDialog: function (eventDelegate) {
		$(eventDelegate).on('click', '.send-to-friend', function (e) {
			e.preventDefault();
			var dlg = dialog.create({
				target: $('#send-to-friend-dialog'),
				options: {
					width: 800,
					height: 'auto',
					title: this.title,
					open: function () {
						sendToFriend.init();
						validator.init();
					}
				}
			});

			var data = util.getQueryStringParams($('.pdpForm').serialize());
			if (data.cartAction) {
				delete data.cartAction;
			}
			var url = util.appendParamsToUrl(this.href, data);
			url = this.protocol + '//' + this.hostname + ((url.charAt(0) === '/') ? url : ('/' + url));
			ajax.load({
				url: util.ajaxUrl(url),
				target: dlg,
				callback: function () {
					dlg.dialog('open');	// open after load to ensure dialog is centered
				}
			});
		});
	}
};

module.exports = sendToFriend;

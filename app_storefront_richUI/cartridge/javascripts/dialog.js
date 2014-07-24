/**
 * @class app.dialog
 */
(function (app, $) {
	// private

	var $cache = {};
	// end private

	/******* app.dialog public object ********/
	app.dialog = {
		/**
		 * @function
		 * @description Appends a dialog to a given container (target)
		 * @param {Object} params  params.target can be an id selector or an jquery object
		 */
		create : function (params) {
			// options.target can be an id selector or an jquery object
			var target = $(params.target || "#dialog-container");

			// if no element found, create one
			if(target.length === 0) {
				if(target.selector && target.selector.charAt(0) === "#") {
					id = target.selector.substr(1);
				}
				target = $("<div>").attr("id", id).addClass("dialog-content").appendTo("body");
			}

			// create the dialog
			$cache.container=target;
			$cache.container.dialog($.extend(true, {}, app.dialog.settings, params.options || {}));
			return $cache.container;
		},
		/**
		 * @function
		 * @description Opens a dialog using the given url (params.url)
		 * @param {Object} params.url should contain the url
		 */
		open : function (params) {
			if (!params.url || params.url.length===0) { return; }

			$cache.container = app.dialog.create(params);
			params.url = app.util.appendParamsToUrl(params.url, {format:"ajax"});

			// finally load the dialog
			app.ajax.load({
				target : $cache.container,
				url : params.url,
				callback : function () {
					if ($cache.container.dialog("isOpen")) { return; }
					$cache.container.dialog("open");
				}
			});

		},
		/**
		 * @function
		 * @description Closes the dialog and triggers the "close" event for the dialog
		 */
		close : function () {
			if(!$cache.container) {
				return;
			}
			$cache.container.dialog("close");
		},
		/**
		 * @function
		 * @description Triggers the "apply" event for the dialog
		 */
		triggerApply : function () {
			$(this).trigger("dialogApplied");
		},
		/**
		 * @function
		 * @description Attaches the given callback function upon dialog "apply" event
		 */
		onApply : function (callback) {
			if(callback) {
				$(this).bind("dialogApplied", callback);
			}
		},
		/**
		 * @function
		 * @description Triggers the "delete" event for the dialog
		 */
		triggerDelete : function () {
			$(this).trigger("dialogDeleted");
		},
		/**
		 * @function
		 * @description Attaches the given callback function upon dialog "delete" event
		 * @param {String} The callback function to be called
		 */
		onDelete : function (callback) {
			if(callback) {
				$(this).bind("dialogDeleted", callback);
			}
		},
		/**
		 * @function
		 * @description Submits the dialog form with the given action
		 * @param {String} The action which will be triggered upon form submit
		 */
		submit : function (action) {
			var form = $cache.container.find("form:first");
			// set the action
			$("<input/>").attr({
				name : action,
				type : "hidden"
			}).appendTo(form);

			// serialize the form and get the post url
			var post = form.serialize();
			var url = form.attr("action");

			// post the data and replace current content with response content
			$.ajax({
				type : "POST",
				url : url,
				data : post,
				dataType : "html",
				success : function (data) {
					$cache.container.html(data);
				},
				failure : function (data) {
					window.alert(app.resources.SERVER_ERROR);
				}
			});
		},
		settings : {
			autoOpen : false,
			resizable : false,
			bgiframe : true,
			modal : true,
			height : 'auto',
			width : '800',
			buttons : {},
			title : '',
			position : 'center',
			overlay : {
				opacity : 0.5,
				background : "black"
			},
			/**
			 * @function
			 * @description The close event
			 */
			close : function (event, ui) {
				$(this).dialog("destroy");
			}
		}
	};
}(window.app = window.app || {}, jQuery));
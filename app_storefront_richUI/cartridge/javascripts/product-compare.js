'use strict';

var ajax = require('./ajax'),
	page = require('./page'),
	util = require('./util');

var _currentCategory = "",
	_isClearing = false,
	MAX_ACTIVE = 6,
	CI_PREFIX = "ci-";

/**
 * @private
 * @function
 * @description Verifies the number of elements in the compare container and updates it with sequential classes for ui targeting
 */
function refreshContainer() {
	var $compareContainer = $('#compare-items');
	if (_isClearing) { return; }

	var ac = $compareContainer.find(".active").length;

	if (ac < 2) {
		$("#compare-items-button").attr("disabled", "disabled");
	} else {
		$("#compare-items-button").removeAttr("disabled");
	}

	// update list with sequential classes for ui targeting
	var $compareItems = $compareContainer.find('.compare-item');
	for( i=0; i < $compareItems.length; i++ ){
		$compareItems.removeClass('compare-item-' + i);
		$($compareItems[i]).addClass('compare-item-' + i);
	}

	$compareContainer.toggle(ac > 0);

}
/**
 * @private
 * @function
 * @description Adds an item to the compare container and refreshes it
 */
function addToList(data) {
	// get the first compare-item not currently active
	var $item = $('#compare-items').find(".compare-item").not(".active").first(),
		$tile = $('#' + data.uuid);

	if ($item.length === 0) {
		if ($tile.length > 0) {
			$tile.find(".compare-check")[0].checked = false;
		}
		window.alert(app.resources.COMPARE_ADD_FAIL)
		return;
	} // safety only

	// if already added somehow, return
	if ($('#' + CI_PREFIX + data.uuid).length > 0) {
		return;
	}
	// set as active item
	$item.addClass("active")
		.attr("id", CI_PREFIX+data.uuid)
		.data("itemid", data.itemid);

	// replace the item image
	$item.children(".compareproduct").first()
		.attr({src : $(data.img).attr("src"), alt : $(data.img).attr("alt")});

	// refresh container state
	refreshContainer();

	if ($tile.length === 0) { return; }

	// ensure that the associated checkbox is checked
	$tile.find(".compare-check")[0].checked = true;
}
/**
 * @private
 * @function
 * description Removes an item from the compare container and refreshes it
 */
function removeFromList(uuid) {
	var $item = $('#' + CI_PREFIX + uuid);
	if ($item.length === 0) { return; }

	// replace the item image
	$item.children('.compareproduct').first()
		.attr({src : app.urls.compareEmptyImage, alt : app.resources.EMPTY_IMG_ALT});

	// remove class, data and id from item
	$item.removeClass('active')
		.removeAttr('id')
		.removeAttr('data-itemid')
		.data('itemid', '');

	// use clone to prevent image flash when removing item from list
	var cloneItem = $item.clone();
	$item.remove();
	cloneItem.appendTo($('#compare-items-panel'));
	refreshContainer();

	// ensure that the associated checkbox is not checked
	var $tile = $('#' + uuid);
	if ($tile.length === 0 ) { return; }
	$tile.find('.compare-check')[0].checked = false;
}

/**
 * @function
 * @description Removes product from the compare table
 */
function removeProduct (args) {
	if (!args.itemid) { return; }
	var cb = args.cb ? $(args.cb) : null;
	var ajaxCall = args.ajaxCall ? $(args.ajaxCall) : true;
	if (ajaxCall) {
		app.ajax.getJson({
			url : app.urls.compareRemove,
			data : { 'pid' : args.itemid, 'category' : _currentCategory },
			callback : function (response) {
				if (!response || !response.success) {
					// response failed. uncheck the checkbox return
					if (cb && cb.length > 0) { cb[0].checked = true; }
					window.alert(app.resources.COMPARE_REMOVE_FAIL);
					return;
				}

				// item successfully removed session, now remove from to list...
				removeFromList(args.uuid);
			}
		});
	} else {
		.ajax.getJson({
			url : app.urls.compareRemove,
			// TODO this is ATROCIOUS
			async: false,
			data : { 'pid' : args.itemid, 'category' : _currentCategory },
			callback : function (response) {
				if (!response || !response.success) {
					// response failed. uncheck the checkbox return
					if (cb && cb.length > 0) { cb[0].checked = true; }
					window.alert(app.resources.COMPARE_REMOVE_FAIL);
					return;
				}

				// item successfully removed session, now remove from to list...
				removeFromList(args.uuid);
			}
		});
	}
}

/**
 * @function
 * @description Adds product to the compare table
 */
function addProduct (args) {
	var $items = $('#compare-items').find(".compare-item");
	var cb = $(args.cb);
	var ac = $items.filter(".active").length;
	if(ac===MAX_ACTIVE) {
		if(!window.confirm(app.resources.COMPARE_CONFIRMATION)) {
			cb[0].checked = false;
			return;
		}

		// remove product using id
		var item = $items.first();

		// safety check only. should never occur.
		if (item[0].id.indexOf(CI_PREFIX)!==0) {
			cb[0].checked = false;
			window.alert(app.resources.COMPARE_ADD_FAIL);
			return;
		}
		var uuid = item[0].id.substr(CI_PREFIX.length);
		removeProduct({
			itemid: item.data("itemid"),
			uuid: uuid,
			cb: $("#"+uuid).find(".compare-check"),
			ajaxCall: false
		});
	}

	ajax.getJson({
		url : app.urls.compareAdd,
		data : { 'pid' : args.itemid, 'category' : _currentCategory },
		callback : function (response) {
			if (!response || !response.success) {
				// response failed. uncheck the checkbox return
				cb[0].checked = false;
				window.alert(app.resources.COMPARE_ADD_FAIL);
				return;
			}

			// item successfully stored in session, now add to list...
			addToList(args);
		}
	});
}

/**
 * @private
 * @function
 * @description Initializes the DOM-Object of the compare container
 */
function initializeDom() {
	var $compareContainer = $('#compare-items');
	_currentCategory = $compareContainer.data("category") || "";
	var $active = $compareContainer.find(".compare-item").filter(".active");
	$active.each(function () {
		var uuid = this.id.substr(CI_PREFIX.length),
			$tile = $('#' + uuid);
		if ($tile.length === 0 ) { return; }

		$tile.find(".compare-check")[0].checked = true;
	});
	// set container state
	refreshContainer();
}
/**
 * @private
 * @function
 * @description Initializes the events on the compare container
 */
function initializeEvents() {
	// add event to buttons to remove products
	$('.compare-item-remove').on('click', function (e) {
		var $item = $(this).closest('.compare-item'),
			uuid = $item[0].id.substr(CI_PREFIX.length),
			$tile = $('#' + uuid);

		removeProduct( {
			itemid : $item.data('itemid'),
			uuid : uuid,
			cb :  ($tile.length === 0) ? null : $tile.find('.compare-check')
		});
		refreshContainer();
	});

	// Button to go to compare page
	$('#compare-items-button').on('click', function () {
		page.redirect(util.appendParamToURL(app.urls.compareShow, "category", _currentCategory));
	});

	// Button to clear all compared items
	$('#clear-compared-items').on("click", function () {
		// TODO: this _isClearing business seems like a hack to me --Tri
		_isClearing = true;
		$('#compare-items').hide()
			.find(".active .compare-item-remove")
			.trigger("click", [false]);
		_isClearing = false;
	});
}

exports.init = function () {
	initializeDom();
	initializeEvents();
}

exports.addProduct = addProduct;
exports.removeProduct = removeProduct;

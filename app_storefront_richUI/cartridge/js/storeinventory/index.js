'use strict';

var _ = require('lodash'),
	ajax = require('../ajax'),
	dialog = require('../dialog'),
	page = require('../page'),
	TPromise = require('promise'),
	util = require('../util');

var newLine = '\n';
var storeTemplate = function (store) {
	return [
		'<li class="store-tile ' + store.storeId + (store.storeId === User.storeId ? ' selected' : '') +'">',
		'	<p class="store-address">',
		'		' + store.address1 + '<br/>',
		'		' + store.city + ', ' + store.stateCode + ' ' + store.postalCode,
		'	</p>',
		'	<p class="store-status ' + store.statusclass + '">' + store.status + '</p>',
		'	<button class="select-store-button" data-store-id="' + store.storeId +
		'" data-stock-status="' + store.status + '"' + (store.statusclass !== 'store-in-stock' ? 'disabled="disabled"' : '') + '>',
		'		' + (store.storeId === User.storeId ? Resources.PREFERRED_STORE : Resources.SELECT_STORE),
		'	</button>',
		'</li>'
	].join(newLine);
}

var storeListTemplate = function (stores) {
	if (stores && stores.length) {
		return [
			'<div class="store-list-container">',
			'<ul class="store-list">',
			_.map(stores, storeTemplate).join(newLine),
			'</ul>',
			'</div>',
			'<div class="store-list-pagination">',
			'</div>'
		].join(newLine);
	} else {
		return '<div class="no-results">No Results</div>';
	}
};

var pdpStoreTemplate = function (store) {
	return [
		'<li class="store-list-item ' + (store.storeId === User.storeId ? ' selected' : '') + '">',
		'	<div class="store-address">' + store.address1 + ', ' + store.city + ' ' + store.stateCode +
		' ' + store.postalCode + '</div>',
		'	<div class="store-status ' + store.statusclass + '">' + store.status + '</div>',
		'</li>'
	].join(newLine);
}

var pdpStoresListingTemplate = function (stores) {
	if (stores && stores.length) {
		return [
			'<div class="store-list-pdp-container">',
			(stores.length > 1 ? '	<a class="stores-toggle collapsed" href="#">' + Resources.SEE_MORE + '</a>' : ''),
			'	<ul class="store-list-pdp">',
			_.map(stores, pdpStoreTemplate).join(newLine),
			'	</ul>',
			'</div>'
		].join(newLine);
	}
}

var zipPromptTemplate = function () {
	return [
		'<div id="preferred-store-panel">',
		'	<input type="text" id="user-zip" placeholder="' + Resources.ENTER_ZIP + '" name="zipCode"/>',
		'</div>'
	].join(newLine);
};

/**
 * @description test whether zipcode is valid for either US or Canada
 * @return {Boolean} true if the zipcode is valid for either country, false if it's invalid for both
 **/
var validateZipCode = function (zipCode) {
	var regexes = {
		canada: /^[ABCEGHJKLMNPRSTVXY]\d[ABCEGHJKLMNPRSTVWXYZ]( )?\d[ABCEGHJKLMNPRSTVWXYZ]\d$/i,
		usa: /^\d{5}(-\d{4})?$/
	},
		valid = false;
	if (!zipCode) { return; }
	_.each(regexes, function (re) {
		var regexp = new RegExp(re);
		valid = regexp.test(zipCode);
	});
	return valid;
}

var storeinventory = {
	init: function () {
		var self = this,
			$availabilityContainer = $('.availability-results'),
			pid = $('input[name="pid"]').val()
		this.$preferredStorePanel = $('<div id="preferred-store-panel">');
		//
		$('#cart-table .set-preferred-store').on('click', function (e) {
			e.preventDefault();
			self.loadPreferredStorePanel($(this).parent().attr('id'));
		});

		//disable the radio button for home deliveries if the store inventory is out of stock
		$('#cart-table .item-delivery-options .home-delivery .not-available').each(function () {
			$(this).parents('.home-delivery').children('input').attr('disabled', 'disabled');
		});

		$('.item-delivery-options input.radio-url').on('click', function () {
			self.setLineItemStore($(this));
		});

		if ($('.checkout-shipping').length > 0) {
			this.shippingLoad();
		}

		//disable the cart button if there is pli set to instore and the status is 'Not Available' and it is marked as an instore pli
		$('.item-delivery-options').each(function () {
			var $instore = $(this).children('.instore-delivery');
			if (($instore.children('input').attr('disabled') === 'disabled') &&
				($instore.children('.selected-store-availability').children('.store-error').length > 0) &&
				($instore.children('input').attr('checked') === 'checked')) {
				$('.cart-action-checkout button').attr('disabled', 'disabled');
			}
		});
	},

	zipPrompt: function (callback) {
		var self = this;
		dialog.open({
			html: zipPromptTemplate(),
			options: {
				title: Resources.STORE_NEAR_YOU,
				width: 500,
				buttons: [
					{
						text: Resources.SEARCH,
						click: function () {
							var zipCode = $('#user-zip').val();
							if (validateZipCode(zipCode)) {
								self.setUserZip(zipCode);
								if (callback) {
									callback(zipCode);
								}
							}
						}
					}
				],
				open: function () {
					$('#user-zip').on('keypress', function (e) {
						if (e.which === 13) {
							// trigger the search button
							$('.ui-dialog-buttonset .ui-button').trigger('click');
						}
					});
				}
			}
		});
	},
	setLineItemStore: function (radio) {
		// @TODO refactor DOM manipulation
		$(radio).parent().parent().children().toggleClass('hide');
		$(radio).parent().parent().toggleClass('loading');
		ajax.getJson({
			url: util.appendParamsToUrl($(radio).attr('data-url') , {storeid: $(radio).siblings('.storeid').attr('value')}),
			callback: function () {
				$(radio).attr('checked', 'checked');
				$(radio).parent().parent().toggleClass('loading');
				$(radio).parent().parent().children().toggleClass('hide');
			}
		});

		//scan the plis to see if there are any that are not able to go through checkout, if none are found re-enable the checkout button
		var countplis = 0;
		$('.item-delivery-options').each(function () {
			var $instore = $(this).children('.instore-delivery');
			if (($instore.children('input').attr('disabled') === 'disabled') &&
				($instore.children('.selected-store-availability').children('.store-error').length > 0) &&
				($instore.children('input').attr('checked') === 'checked')) {
					$('.cart-action-checkout button').attr('disabled', 'disabled');
				} else {
					countplis++;
				}
			});
			if (countplis > 0 && $('.error-message').length === 0) {
				$('.cart-action-checkout button').removeAttr('disabled', 'disabled');
			}
	},
	getStoresInventory: function (pid) {
		return TPromise.resolve($.ajax({
			url: util.appendParamsToUrl(Urls.storesInventory, {
				pid: pid,
				zipCode: User.zip
			}),
			dataType: 'json'
		}));
	},
	selectStoreDialog: function (stores) {
		var self = this,
			storeList = storeListTemplate(stores);
		dialog.open({
			html: storeList,
			options: {
				title: Resources.SELECT_STORE + ' - ' + User.zip,
				buttons: [
					{
						text: Resources.CHANGE_LOCATION,
						click: function () {
							self.setUserZip(null);
							self.zipPrompt();
						}.bind(this)
					}, {
						text: Resources.CONTINUE,
						click: function () {
							self.storesListing(stores);
							dialog.close();
						}
					}
				],
				open: function () {
					$('.select-store-button').on('click', function (e) {
						e.preventDefault();
						var storeId = $(this).data('storeId');
						// if the store is already selected, don't select again
						if (storeId === User.storeId) { return; }
						self.setPreferredStore(storeId);
					});
				}
			},
		});
	},
	// list all stores on PDP page
	storesListing: function (stores) {
		if ($('.store-list-pdp-container').length) {
			$('.store-list-pdp-container').remove();
		}
		$('.availability-results').append(pdpStoresListingTemplate(stores));
	},
	buildStoreList2: function (pid) {
		var self = this;
		this.$storeList = $('<div class="store-list">');
		// request results from server
		ajax.getJson({
			url: util.appendParamsToUrl(Urls.storesInventory, {
				pid: pid,
				zipCode: User.zip
			}),
			callback: function (data) {
				// clear any previous results, then build new
				self.$storeList.empty();
				var listings = $('<ul class="store-list"/>');
				if (data && data.length > 0) {
					for (var i = 0; i < 10 && i < data.length; i++) {
						var item = data[i],
							displayButton;
						//Disable button if there is no stock for item
						if (item.statusclass === 'store-in-stock') {
							displayButton = '<button value="' + item.storeId + '" class="button-style-1 select-store-button" data-stock-status="' + item.status + '">' + Resources.SELECT_STORE + '</button>';
						} else {
							displayButton = '<button value="' + item.storeId + '" class="button-style-1 select-store-button" data-stock-status="' + item.status + '" disabled="disabled">' + Resources.SELECT_STORE + '</button>';
						}

						listings.append('<li class="store-' + item.storeId + item.status.replace(/ /g, '-') + ' store-tile">' +
							'<span class="store-tile-address ">' + item.address1 + ',</span>' +
							'<span class="store-tile-city ">' + item.city + '</span>' +
							'<span class="store-tile-state ">' + item.stateCode + '</span>' +
							'<span class="store-tile-postalCode ">' + item.postalCode + '</span>' +
							'<span class="store-tile-status ' + item.statusclass + '">' + item.status + '</span>' +
							displayButton +
							'</li>');
					}
				// no records
				} else {
					if (User.zip) {
						self.$storeList.append('<div class="no-results">No Results</div>');
					}
				}

				// set up pagination for results
				var storeTileWidth = 176,
					numListings = listings.find('li').size(),
					listingsNav = $('<div id="listings-nav"/>'),
					selectedButtonText;
				for (var j = 0, link = 1; j <= numListings; j++) {
					if (numListings > j) {
						listingsNav.append('<a data-index="' + j + '">' + link + '</a>');
					}
					link++;
					j = j + 2;
				}
				listingsNav.find('a').on('click', function () {
					$(this).siblings().removeClass('active');
					$(this).addClass('active');
					$('.store-list').animate({
						'left': storeTileWidth * $(this).data('index') * - 1
					}, 1000);
				}).first().addClass('active');
				self.$storeList.after(listingsNav);

				// check for preferred store id, highlight, move to top
				if (currentTemplate === 'cart') {
					selectedButtonText = Resources.SELECTED_STORE;
				} else {
					selectedButtonText = Resources.PREFERRED_STORE;
				}
				listings.find('.store-' + User.storeId).addClass('selected').find('.select-store-button ').text(selectedButtonText);

				self.bubbleStoreUp(listings, User.storeId);

				// if there is a block to show results on page (pdp)
				if (currentTemplate !== 'cart') {
					var onPageList = listings.clone(),
						$div = $('div#' + pid);
					$div.find('.store-list').remove();
					$div.append(onPageList);

					if (onPageList.find('li').size() > 1) {
						$div.find('li:gt(0)').each(function () {
							$(this).addClass('extended-list');
						});
						$('.more-stores').remove();
						$div.after('<span class="more-stores">' + Resources.SEE_MORE + '</span>');
						$div.parent().find('.more-stores').on('click', function () {
							if ($(this).text() ===  Resources.SEE_MORE) {
								$(this).text(Resources.SEE_LESS).addClass('active');
							} else {
								$(this).text(Resources.SEE_MORE).removeClass('active');
							}
							$div.find(' ul.store-list').toggleClass('expanded');
						});
					}
				}

				// update panel with new list
				listings.width(numListings * storeTileWidth).appendTo(self.$storeList);

				// set up 'set preferred store' action on new elements
				// @TODO this needs to be refactored
				listings.find('button.select-store-button').on('click', function () {
					var $this = $(this);
					var selectedStoreId = $this.val();
					if (currentTemplate === 'cart') {
						//update selected store and set the lineitem
						var liuuid = self.$preferredStorePanel.find('.srcitem').attr('value');
						$('div[name="' + liuuid + '-sp"] .selected-store-address').html(
							$this.siblings('.store-tile-address').text() +
							' <br />' +
							$this.siblings('.store-tile-city').text() +
							' , ' +
							$this.siblings('.store-tile-state').text() +
							' ' +
							$this.siblings('.store-tile-postalCode').text()
						);
						$('div[name="' + liuuid + '-sp"] .storeid').val($this.val());
						$('div[name="' + liuuid + '-sp"] .selected-store-availability').html($this.siblings('.store-tile-status'));
						$('div[name="' + liuuid + '-sp"] .radio-url').removeAttr('disabled');
						$('div[name="' + liuuid + '-sp"] .radio-url').click();
						self.$preferredStorePanel.dialog('close');
					} else {
						if (User.storeId !== selectedStoreId) {
							// set as selected
							self.setPreferredStore(selectedStoreId);
							self.bubbleStoreUp (onPageList, selectedStoreId);
							$('.store-list li.selected').removeClass('selected').find('.select-store-button').text(Resources.SELECT_STORE);
							$('.store-list li.store-' + selectedStoreId + ' .select-store-button').text(Resources.PREFERRED_STORE).parent().addClass('selected');
						}
					}
					//if there is a dialog box open in the cart for editing a pli and the user selected a new store
					//add an event to for a page refresh on the cart page if the update button has not been clicked
					//reason - the pli has been updated but the update button was not clicked, leaving the cart visually in accurate.
					//when the update button is clicked it forces a refresh.
					if ($('#cart-table').length > 0 && $('.select-store-button').length > 0) {
						$('.ui-dialog .ui-icon-closethick:first').bind('click', function () {
							page.refresh();
						});
					}
				});
			} // end ajax callback
		});
	},

	bubbleStoreUp: function (list, id) {
		var preferredEntry = list.find('li.store-' + id).clone();
		preferredEntry.removeClass('extended-list');
		list.find('.store-tile').not('extended-list').addClass('extended-list');
		list.find('.store-' + id).remove();
		list.prepend(preferredEntry);
	},

	loadPreferredStorePanel: function (pid) {
		var self = this;
		//clear error messages from other product tiles if they exists in the dom
		this.$preferredStorePanel.find('.error-message').remove();

		// clear any previous results
		this.$preferredStorePanel.empty();

		// show form if no zip set
		if (User.zip === null || User.zip === '') {
			this.$preferredStorePanel.append('<div><input type="text" id="userZip" class="entered-zip" placeholder="' +
					Resources.ENTER_ZIP +
					'"/><button id="set-user-zip" class="button-style-1">' +
					Resources.SEARCH +
					'</button></div>')
				.find('#set-user-zip').on('click', function () {
					var enteredZip = $('.ui-dialog #preferred-store-panel input.entered-zip').last().val();
					var regexObj = {
						canada: /^[ABCEGHJKLMNPRSTVXY]\d[ABCEGHJKLMNPRSTVWXYZ]( )?\d[ABCEGHJKLMNPRSTVWXYZ]\d$/i,
						usa: /^\d{5}(-\d{4})?$/
					};
					var validZipEntry = false;
					var regexp;
					//check Canadian postal code
					regexp = new RegExp(regexObj.canada);
					if (regexp.test(enteredZip)) {
						validZipEntry = true;
					}
					//check us zip codes
					regexp = new RegExp(regexObj.usa);
					if (regexp.test(enteredZip)) {
						validZipEntry = true;
					}
					//good zip
					if (validZipEntry) {
						$('#preferred-store-panel .error-message').remove();
						self.setUserZip(enteredZip);
						self.loadPreferredStorePanel(pid);
					//bad zip
					} else {
						if ($('#preferred-store-panel .error-message').length === 0) {
							$('#preferred-store-panel div').append('<div class="error-message">' + Resources.INVALID_ZIP + '</div>');
						}
					}
				});
			$('#userZip').on('keypress', function (e) {
				var code = e.keyCode ? e.keyCode : e.which;
				if (code.toString() === 13) {
					$('#set-user-zip').trigger('click');
				}
			});

			// clear any on-page results
			$('.store-stock .store-list').remove();
			$('.availability .more-stores').remove();

		// zip is set, build list
		} else {
			this.buildStoreList(pid);
			this.$preferredStorePanel
				.append('<div>For ' + User.zip + ' <span class="update-location">' + Resources.CHANGE_LOCATION + '</span></div>')
				.append(this.$storeList);
			this.$preferredStorePanel.find('.update-location').on('click', function () {
				this.setUserZip(null);
				this.loadPreferredStorePanel(pid);
			}.bind(this));
		}

		// append close button for pdp
		if (currentTemplate !== 'cart') {
			if (User.storeId !== null) {
				this.$preferredStorePanel.append('<button class="close button-style-1  set-preferred-store">' + Resources.CONTINUE_WITH_STORE + '</button>');
			} else if (User.zip !== null) {
				this.$preferredStorePanel.append('<button class="close button-style-1">' + Resources.CONTINUE + '</button>');
			}
		} else {
			this.$preferredStorePanel.append('<input type="hidden" class="srcitem" value="' + pid + '">');
		}

		// open the dialog
		this.$preferredStorePanel.dialog({
			width: 550,
			autoOpen: true,
			modal: true,
			title: Resources.STORE_NEAR_YOU
		});

		// action for close/continue
		$('.close').on('click', function () {
			this.$preferredStorePanel.dialog('close');
		}.bind(this));

		//remove the continue button if selecting a zipcode
		if (User.zip === null || User.zip === '') {
			this.$preferredStorePanel.find('.set-preferred-store').last().remove();
		}

		//disable continue button if a preferred store has not been selected
		if ($('.store-list .selected').length > 0) {
			this.$preferredStorePanel.find('.close').attr('disabled', false);
		} else {
			this.$preferredStorePanel.find('.close').attr('disabled', true);
		}
	},

	setUserZip: function (zip) {
		User.zip = zip;
		$.ajax({
			type: 'POST',
			url: Urls.setZipCode,
			data: {
				zipCode: zip
			}
		});
	},

	setPreferredStore: function (id) {
		User.storeId = id;
		$.ajax({
			url: Urls.setPreferredStore,
			type: 'POST',
			data: {storeId: id},
			success: function (data) {
				$('.selected-store-availability').html(data);
				$('.store-list .store-tile.selected').removeClass('selected').find('.select-store-button').text(Resources.SELECT_STORE);
				$('.store-list .store-tile.' + id).addClass('selected').find('.select-store-button').text(Resources.PREFERRED_STORE);
			}
		});
	},

	shippingLoad: function () {
		var $checkoutForm = $('.address');
		$checkoutForm.off('click');
		$checkoutForm.on('click', '.is-gift-yes, .is-gift-no', function () {
			$(this).parent().siblings('.gift-message-text').toggle($(this).checked);
		});
	}
};

module.exports = storeinventory;

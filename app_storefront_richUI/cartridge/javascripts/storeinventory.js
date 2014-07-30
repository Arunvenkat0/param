'use strict';

var ajax = require('./ajax'),
	page = require('./page'),
	util = require('./util');

var pid,
	currentTemplate = $('#wrapper.pt_cart').length ? 'cart' : 'pdp';

var storeinventory = {
	init : function () {
		var that = this;
		// check for items that trigger dialog
		$('#cart-table .set-preferred-store').on('click', function (e) {
			e.preventDefault();
			that.loadPreferredStorePanel($(this).parent().attr('id'));
		});
		
		//disable the radio button for home deliveries if the store inventory is out of stock
		$('#cart-table .item-delivery-options .home-delivery .not-available').each(function(){
			$(this).parents('.home-delivery').children('input').attr('disabled','disabled');
		});

		$('body').on('click', '#pdpMain .set-preferred-store', function (e) {
			that.loadPreferredStorePanel($(this).parent().attr('id'));
			return false;
		});

		$('.item-delivery-options input.radio-url').on('click', function () {
			that.setLineItemStore($(this));
		});

		if ($(".checkout-shipping").length > 0) {
			this.shippingLoad();
		}

		//disable the cart button if there is pli set to instore and the status is 'Not Available' and it is marked as an instore pli
		$('.item-delivery-options').each(function () {
			var $instore = $(this).children('.instore-delivery');
			if (($instore.children("input").attr('disabled') == 'disabled')
				&& ($instore.children('.selected-store-availability').children('.store-error').length > 0)
				&& ($instore.children("input").attr('checked') == 'checked')) {
				$('.cart-action-checkout button').attr("disabled", "disabled");
			}
		});
	},
	setLineItemStore: function(radio) {
		// @TODO refactor DOM manipulation
		$(radio).parent().parent().children().toggleClass('hide');
		$(radio).parent().parent().toggleClass('loading');
		ajax.getJson({
			url: util.appendParamsToUrl($(radio).attr('data-url') , {storeid : $(radio).siblings('.storeid').attr('value')}),
			callback: function(data){
				$(radio).attr('checked','checked');
				$(radio).parent().parent().toggleClass('loading');
				$(radio).parent().parent().children().toggleClass('hide');
			}
		});

		//scan the plis to see if there are any that are not able to go through checkout, if none are found re-enable the checkout button
		var countplis = 0;
		$('.item-delivery-options').each(function(){
			var $instore = $(this).children('.instore-delivery');
			if (($instore.children("input").attr('disabled')=='disabled')
				&& ($instore.children('.selected-store-availability').children('.store-error').length > 0)
				&& ($instore.children("input").attr('checked')=='checked')){
					$('.cart-action-checkout button').attr("disabled", "disabled");
				} else {
					countplis++;
				}
			});
			if (countplis > 0 && $('.error-message').length === 0){
				$('.cart-action-checkout button').removeAttr("disabled", "disabled")
			}
	},
	buildStoreList: function (pid) {
		var that = this,
			$storeList = $('.store-list');
		// request results from server
		ajax.getJson({
			url: util.appendParamsToUrl(Urls.storesInventory , {pid:pid, zipCode: User.zip}),
			callback: function (data) {
				// clear any previous results, then build new
				$storeList.empty();
				var listings = $("<ul class='store-list'/>");
				if (data && data.length > 0) {
					for (var i = 0; i < 10 && i < data.length; i++) {
						var item = data[i],
							displayButton;
						//Disable button if there is no stock for item
						if (item.statusclass == 'store-in-stock') {
							displayButton = '<button value="' + item.storeId + '" class="button-style-1 select-store-button" data-stock-status="' + item.status+'">' + Resources.SELECT_STORE + '</button>';
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
					if (User.zip){
						$storeList.append("<div class='no-results'>No Results</div>");
					}
				}

				// set up pagination for results
				var storeTileWidth = 176,
					numListings = listings.find('li').size(),
					listingsNav = $('<div id="listings-nav"/>'),
					selectedButtonText;
				for (var i = 0, link = 1; i <= numListings; i++) {
					if (numListings >  i) { 
						listingsNav.append('<a data-index="'+ i +'">'+link+'</a>'); 
					}
					link++;
					i = i + 2;
				}
				listingsNav.find('a').on('click', function () {
					$(this).siblings().removeClass('active');
					$(this).addClass('active');
					$('.store-list').animate({
						'left': storeTileWidth * $(this).data('index') * - 1
					}, 1000);
				}).first().addClass('active');
				$storeList.after(listingsNav);

				// check for preferred store id, highlight, move to top
				if (currentTemplate === 'cart'){
					selectedButtonText = Resources.SELECTED_STORE;
				} else {
					selectedButtonText = Resources.PREFERRED_STORE;
				}
				listings.find('.store-' + User.storeId).addClass('selected').find('.select-store-button ').text(selectedButtonText);

				that.bubbleStoreUp(listings, User.storeId);

				// if there is a block to show results on page (pdp)
				if (currentTemplate !== 'cart') {
					var onPageList = listings.clone(),
						$div = $('div#' + pid);
					$div.find('.store-list').remove();
					$div.append(onPageList);

					if (onPageList.find('li').size() > 1) {
						$div.find('li:gt(0)').each(function(){
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
				listings.width(numListings * storeTileWidth).appendTo($storeList);

				// set up 'set preferred store' action on new elements
				listings.find('button.select-store-button').click(function(e){
					var selectedStoreId = $(this).val();
					if (currentTemplate === 'cart') {
						//update selected store and set the lineitem
						var liuuid = $('#preferred-store-panel').find('.srcitem').attr('value');
						$('div[name="'+liuuid+'-sp"] .selected-store-address').html($(this).siblings('.store-tile-address').text()+' <br />'+jQuery(this).siblings('.store-tile-city').text()+' , '+jQuery(this).siblings('.store-tile-state').text()+' '+jQuery(this).siblings('.store-tile-postalCode').text());
						$('div[name="'+liuuid+'-sp"] .storeid').val($(this).val());
						$('div[name="'+liuuid+'-sp"] .selected-store-availability').html($(this).siblings('.store-tile-status'));
						$('div[name="'+liuuid+'-sp"] .radio-url').removeAttr('disabled');
						$('div[name="'+liuuid+'-sp"] .radio-url').click();
						$('#preferred-store-panel').dialog("close");
					} else {
						if (User.storeId !== selectedStoreId) {
							// set as selected
							app.storeinventory.setPreferredStore(selectedStoreId);
							app.storeinventory.bubbleStoreUp (onPageList, selectedStoreId);
							$('.store-list li.selected').removeClass('selected').find('.select-store-button').text(Resources.SELECT_STORE);
							$('.store-list li.store-' + selectedStoreId + ' .select-store-button').text(Resources.PREFERRED_STORE).parent().addClass('selected');
						}
					}
					//if there is a dialog box open in the cart for editing a pli and the user selected a new store
					//add an event to for a page refresh on the cart page if the update button has not been clicked
					//reason - the pli has been updated but the update button was not clicked, leaving the cart visually in accurate.  
					//when the update button is clicked it forces a refresh.
					if ($('#cart-table').length > 0 && $('.select-store-button').length > 0) {
						$('.ui-dialog .ui-icon-closethick:first').bind( "click", function(){
							page.refresh();
						});
					}
				});
			} // end ajax callback
		});
	},

	bubbleStoreUp : function(list, id) {
		var preferredEntry = list.find('li.store-' + id).clone();
		preferredEntry.removeClass('extended-list');
		list.find('.store-tile').not('extended-list').addClass('extended-list');
		list.find('li.store-' + id).remove();
		list.prepend(preferredEntry);
	},

	loadPreferredStorePanel : function(pid) {
		var that = this,
			$preferredStorePanel = $('#preferred-store-panel');
	//clear error messages from other product tiles if they exists in the dom
		if($('#preferred-store-panel div .error-message').length > 0){
			$('#preferred-store-panel div .error-message').remove();
		}
		// clear any previous results
		$preferredStorePanel.empty();

		// show form if no zip set
		if (User.zip === null || User.zip === "") {
			$preferredStorePanel.append('<div><input type="text" id="userZip" class="entered-zip" placeholder="' + Resources.ENTER_ZIP + '"/><button id="set-user-zip" class="button-style-1">' + Resources.SEARCH + '</button></div>')
				.find('#set-user-zip').on('click', function () {
					var enteredZip = $('.ui-dialog #preferred-store-panel input.entered-zip').last().val();
					var regexObj = {
						canada : /^[ABCEGHJKLMNPRSTVXY]\d[ABCEGHJKLMNPRSTVWXYZ]( )?\d[ABCEGHJKLMNPRSTVWXYZ]\d$/i,
						usa : /^\d{5}(-\d{4})?$/
					};
					var validZipEntry = false;

					//check Canadian postal code
					var regexp = new RegExp(regexObj.canada);
					if (regexp.test(enteredZip)) {
						validZipEntry = true;
					}
					//check us zip codes
					var regexp = new RegExp(regexObj.usa);
					if (regexp.test(enteredZip)) {
						validZipEntry = true;
					}
					//good zip
					if (validZipEntry) {
						$('#preferred-store-panel div .error-message').remove();
						that.setUserZip(enteredZip);
						that.loadPreferredStorePanel(pid);
					//bad zip
					} else {
						if ($('#preferred-store-panel div .error-message').length == 0){
							$('#preferred-store-panel div').append('<div class="error-message">' + Resources.INVALID_ZIP + '</div>');
						}
					}
				});
			$('#userZip').on('keypress', function (e) {
				code = e.keyCode ? e.keyCode : e.which;
				if (code.toString() === 13) {
					$('#set-user-zip').trigger('click');
				}
			});

			// clear any on-page results
			$('.store-stock .store-list').remove();
			$('.availability .more-stores').remove();

		// zip is set, build list
		} else {
			app.storeinventory.buildStoreList(pid);
			$preferredStorePanel
				.append("<div>For " + User.zip + " <span class='update-location'>" + Resources.CHANGE_LOCATION + "</span></div>" )
				.append($('.store-list'));
			$preferredStorePanel.find('.update-location').on('click', function () {
				that.setUserZip(null);
				that.loadPreferredStorePanel(pid);
			});
		}

		// append close button for pdp
		if (currentTemplate !== "cart") {
			if (User.storeId !== null) {
				$preferredStorePanel.append("<button class='close button-style-1  set-preferred-store'>" + Resources.CONTINUE_WITH_STORE + "</button>");
			} else if (User.zip !== null) {
				$preferredStorePanel.append("<button class='close button-style-1'>" + Resources.CONTINUE + "</button>");
			}
		} else {
			$preferredStorePanel.append("<input type='hidden' class='srcitem' value='" + pid + "'>");
		}

		// open the dialog
		$preferredStorePanel.dialog({
			width: 550,
			modal: true,
			title: Resources.STORE_NEAR_YOU
		});

		// action for close/continue
		$('.close').click(function(){
			$preferredStorePanel.dialog("close");
		});

		//remove the continue button if selecting a zipcode
		if (User.zip === null || User.zip === "") {
			$('#preferred-store-panel .set-preferred-store').last().remove();
		}
		
		//disable continue button if a preferred store has not been selected
		if ($('.store-list .selected').length > 0){
			$('#preferred-store-panel .close').attr('disabled', false);
		} else {
			$('#preferred-store-panel .close').attr('disabled', true);
		}
	},

	setUserZip : function(zip) {
		User.zip = zip;
		$.ajax({
			type: "POST",
			url: Urls.setZipCode,
			data: { zipCode : zip }
		});
	},

	setPreferredStore : function(id) {
		User.storeId = id;
		$.post(Urls.setPreferredStore, { storeId : id }, function(data) {
			$('.selected-store-availability').html(data);
			//enable continue button when a preferred store has been selected
			$('#preferred-store-panel .close').attr('disabled', false);
		});
	},

	shippingLoad : function() {
		var $checkoutForm = $(".address");
		$checkoutForm.off("click");
		$checkoutForm.on("click", ".is-gift-yes, .is-gift-no", function (e) {
			$(this).parent().siblings(".gift-message-text").toggle($(this).checked);
		});
	}
};

module.exports = storeinventory;
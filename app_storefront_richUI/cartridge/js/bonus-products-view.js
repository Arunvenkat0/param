'use strict';

var ajax = require('./ajax'),
	dialog = require('./dialog'),
	page = require('./page'),
	util = require('./util');

var selectedList = [];
var maxItems = 1;
var bliUUID = '';

/**
 * @private
 * @function
 * description Gets a list of bonus products related to a promoted product
 */
function getBonusProducts() {
	var o = {};
	o.bonusproducts = [];

	var i, len;
	for (i = 0, len = selectedList.length; i < len; i++) {
		var p = {
			pid: selectedList[i].pid,
			qty: selectedList[i].qty,
			options: {}
		};
		var a, alen, bp = selectedList[i];
		for (a = 0, alen = bp.options.length; a < alen; a++) {
			var opt = bp.options[a];
			p.options = {optionName:opt.name, optionValue:opt.value};
		}
		o.bonusproducts.push({product:p});
	}
	return o;
}

var selectedItemTemplate = function (data) {
	var attributes = '';
	for (var attrID in data.attributes) {
		var attr = data.attributes[attrID];
		attributes += '<li data-attribute-id="' + attrID + '">\n';
		attributes += '<span class="display-name">' + attr.displayName + '</span>: ';
		attributes += '<span class="display-value">' + attr.displayValue + '</span>\n';
		attributes += '</li>';
	}
	attributes += '<li class="item-qty">\n';
	attributes += '<span class="display-name">Qty</span>: ';
	attributes += '<span class="display-value">' + data.qty + '</span>';
	return [
		'<li class="selected-bonus-item" data-uuid="' + data.uuid + '" data-pid="' + data.pid + '">',
		'<i class="remove-link fa fa-remove" title="Remove this product" href="#"></i>',
		'<div class="item-name">' + data.name + '</div>',
		'<ul class="item-attributes">',
		attributes,
		'<ul>',
		'<li>',
	].join('\n');
};

// hide swatches that are not selected or not part of a Product Variation Group
var hideSwatches = function () {
	$('.bonus-product-item .swatches li').not('.selected').not('.variation-group-value').hide();
};

/**
 * @private
 * @function
 * @description Updates the summary page with the selected bonus product
 */
function updateSummary() {
	var $bonusProductList = $('#bonus-product-list');
	if (selectedList.length === 0) {
		$bonusProductList.find('li.selected-bonus-item').remove();
	} else {
		var ulList = $bonusProductList.find('ul.selected-bonus-items').first();
		var itemTemplate = ulList.children('.selected-item-template').first();
		var i, len;
		for (i = 0, len = selectedList.length; i < len; i++) {
			var item = selectedList[i];
			var li = selectedItemTemplate(item);
			$(li).appendTo(ulList);
		}
	}

	// get remaining item count
	var remain = maxItems - selectedList.length;
	$bonusProductList.find('.bonus-items-available').text(remain);
	if (remain <= 0) {
		$bonusProductList.find('.select-bonus-item').attr('disabled', 'disabled');
	} else {
		$bonusProductList.find('.select-bonus-item').removeAttr('disabled');
	}
}

function initializeGrid () {
	var $bonusProduct = $('#bonus-product-dialog'),
		$bonusProductList = $('#bonus-product-list'),
	bliData = $bonusProductList.data('line-item-detail');
	maxItems = bliData.maxItems;
	bliUUID = bliData.uuid;

	if (bliData.itemCount >= maxItems) {
		$bonusProductList.find('.select-bonus-item').attr('disabled', 'disabled');
	}

	var cartItems = $bonusProductList.find('.selected-bonus-item');
	cartItems.each(function () {
		var ci = $(this);
		var product = {
			uuid: ci.data('uuid'),
			pid: ci.data('pid'),
			qty: ci.find('.item-qty').text(),
			name: ci.find('.item-name').html(),
			attributes: {}
		};
		var attributes = ci.find('ul.item-attributes li');
		attributes.each(function () {
			var li = $(this);
			product.attributes[li.data('attributeId')] = {
				displayName:li.children('.display-name').html(),
				displayValue:li.children('.display-value').html()
			};
		});
		selectedList.push(product);
	});

	$bonusProductList.on('click', '.bonus-product-item a[href].swatchanchor', function (e) {
		e.preventDefault();
		var url = this.href,
			$this = $(this);
		url = util.appendParamsToUrl(url, {
			'source': 'bonus',
			'format': 'ajax'
		});
		$.ajax({
			url: url,
			success: function (response) {
				$this.closest('.bonus-product-item').empty().html(response);
				hideSwatches();
			}
		});
	})
	.on('change', '.input-text', function () {
		$bonusProductList.find('.select-bonus-item').removeAttr('disabled');
		$(this).closest('.bonus-product-form').find('.quantity-error').text('');
	})
	.on('click', '.select-bonus-item', function (e) {
		e.preventDefault();
		if (selectedList.length >= maxItems) {
			$bonusProductList.find('.select-bonus-item').attr('disabled', 'disabled');
			$bonusProductList.find('.bonus-items-available').text('0');
			return;
		}

		var form = $(this).closest('.bonus-product-form'),
			detail = $(this).closest('.product-detail'),
			uuid = form.find('input[name="productUUID"]').val(),
			qtyVal = form.find('input[name="Quantity"]').val(),
			qty = (isNaN(qtyVal)) ? 1 : (+qtyVal);

		if (qty > maxItems) {
			$bonusProductList.find('.select-bonus-item').attr('disabled', 'disabled');
			form.find('.quantity-error').text(Resources.BONUS_PRODUCT_TOOMANY);
			return;
		}

		var product = {
			uuid: uuid,
			pid: form.find('input[name="pid"]').val(),
			qty: qty,
			name: detail.find('.product-name').text(),
			attributes: detail.find('.product-variations').data('attributes'),
			options: []
		};

		var optionSelects = form.find('.product-option');

		optionSelects.each(function () {
			product.options.push({
				name: this.name,
				value: $(this).val(),
				display: $(this).children(':selected').first().html()
			});
		});
		selectedList.push(product);
		updateSummary();
	})
	.on('click', '.remove-link', function (e) {
		e.preventDefault();
		var container = $(this).closest('.selected-bonus-item');
		if (!container.data('uuid')) { return; }

		var uuid = container.data('uuid');
		var i, len = selectedList.length;
		for (i = 0; i < len; i++) {
			if (selectedList[i].uuid === uuid) {
				selectedList.splice(i, 1);
				break;
			}
		}
		updateSummary();
	})
	.on('click', '.add-to-cart-bonus', function (e) {
		e.preventDefault();
		var url = util.appendParamsToUrl(Urls.addBonusProduct, {bonusDiscountLineItemUUID: bliUUID});
		var bonusProducts = getBonusProducts();
		if (bonusProducts.bonusproducts[0].product.qty > maxItems) {
			bonusProducts.bonusproducts[0].product.qty = maxItems;
		}
		// make the server call
		$.ajax({
			type: 'POST',
			dataType: 'json',
			cache: false,
			contentType: 'application/json',
			url: url,
			data: JSON.stringify(bonusProducts)
		})
		.done(function () {
			// success
			page.refresh();
		})
		.fail(function (xhr, textStatus) {
			// failed
			if (textStatus === 'parsererror') {
				window.alert(Resources.BAD_RESPONSE);
			} else {
				window.alert(Resources.SERVER_CONNECTION_ERROR);
			}
		})
		.always(function () {
			$bonusProduct.dialog('close');
		});
	});
}

var bonusProductsView = {
	/**
	 * @function
	 * @description Loads the list of bonus products into quick view dialog
	 */
	show: function (url) {
		var $bonusProduct = $('#bonus-product-dialog');
		// create the dialog
		dialog.open({
			target: $bonusProduct,
			url: url,
			options: {
				position: {
					my: 'center',
					at: 'top',
					of: window
				},
				width: 795,
				dialogClass: 'quickview',
				title: Resources.BONUS_PRODUCTS
			},
			callback: function () {
				initializeGrid();
				hideSwatches();
			}
		});
	},
	/**
	 * @function
	 * @description
	 */
	loadBonusOption: function () {
		var	self = this,
			$bonusDiscountContainer = $('.bonus-discount-container').clone();
		if ($bonusDiscountContainer.length === 0) { return; }

		// get the html from minicart, then trash it
		$('.bonus-discount-container').remove();

		dialog.open({
			html: $bonusDiscountContainer.html(),
			options: {
				width: 400,
				title: Resources.BONUS_PRODUCT,
				buttons: [{
					text: Resources.SELECT_BONUS_PRODUCTS,
					click: function () {
						var uuid = $('.bonus-product-promo').data('lineitemid'),
							url = util.appendParamsToUrl(Urls.getBonusProducts, {
								bonusDiscountLineItemUUID: uuid,
								source: 'bonus'
							});
						$(this).dialog('close');
						self.show(url);
					}
				}, {
					text: Resources.NO_THANKS,
					click: function () {
						$(this).dialog('close');
					}
				}]
			}
		});
	},
};

module.exports = bonusProductsView;

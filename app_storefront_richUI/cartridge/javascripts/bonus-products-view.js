'use strict';

var ajax = require('./ajax'),
	dialog = require('./dialog'),
	page = require('./page'),
	util = require('./util')

var selectedList = [];
var maxItems = 1;
var bliUUID = "";

var $bonusProduct = $("#bonus-product-dialog"),
	$resultArea = $("#product-result-area"),
	$bonusDiscountContainer = $(".bonus-discount-container");

/**
 * @private
 * @function
 * description Gets a list of bonus products related to a promoted product
 */
function getBonusProducts() {
	var o = {};
	o.bonusproducts = [];

	var i, len;
	for (i=0, len=selectedList.length;i<len;i++) {
		var p = { pid : selectedList[i].pid,	qty : selectedList[i].qty, options : {} };
		var a, alen, bp=selectedList[i];
		for (a=0,alen=bp.options.length;a<alen;a++) {
			var opt = bp.options[a];
			p.options = {optionName:opt.name,optionValue:opt.value};
		}
		o.bonusproducts.push({product:p});
	}
	return o;
}
/**
 * @private
 * @function
 * @description Updates the summary page with the selected bonus product
 */
function updateSummary() {
	if (selectedList.length===0) {
		$cache.bonusProductList.find("li.selected-bonus-item").remove();
	}
	else {
		var ulList = $cache.bonusProductList.find("ul.selected-bonus-items").first();
		var itemTemplate = ulList.children(".selected-item-template").first();
		var i, len;
		for (i=0, len=selectedList.length;i<len;i++) {
			var item = selectedList[i];
			var li = itemTemplate.clone().removeClass("selected-item-template").addClass("selected-bonus-item");
			li.data("uuid", item.uuid).data("pid", item.pid);
			li.find(".item-name").html(item.name);
			li.find(".item-qty").html(item.qty);
			var ulAtts = li.find(".item-attributes");
			var attTemplate = ulAtts.children().first().clone();
			ulAtts.empty();
			var att;
			for (att in item.attributes) {
				var attLi = attTemplate.clone();
				attLi.addClass(att);
				attLi.children(".display-name").html(item.attributes[att].displayName);
				attLi.children(".display-value").html(item.attributes[att].displayValue);
				attLi.appendTo(ulAtts);
			}
			li.appendTo(ulList);
		}
		ulList.children(".selected-bonus-item").show();
	}

	// get remaining item count
	var remain = maxItems - selectedList.length;
	$cache.bonusProductList.find(".bonus-items-available").text(remain);
	if (remain <= 0) {
		$cache.bonusProductList.find("button.button-select-bonus").attr("disabled", "disabled");
	}
	else {
		$cache.bonusProductList.find("button.button-select-bonus").removeAttr("disabled");
	}
}

function initializeGrid () {
	$cache.bonusProductList = $("#bonus-product-list"),
		bliData = $cache.bonusProductList.data("line-item-detail");

	maxItems = bliData.maxItems;
	bliUUID = bliData.uuid;

	if (bliData.itemCount>=maxItems) {
		$cache.bonusProductList.find("button.button-select-bonus").attr("disabled", "disabled");
	}

	var cartItems = $cache.bonusProductList.find(".selected-bonus-item");

	cartItems.each(function() {
		var ci = $(this);

		var product = {
			uuid : ci.data("uuid"),
			pid : ci.data("pid"),
			qty : ci.find(".item-qty").text(),
			name : ci.find(".item-name").html(),
			attributes: {}
		};
		var attributes = ci.find("ul.item-attributes li");
		attributes.each(function(){
			var li = $(this);
			product.attributes[li.data("attributeId")] = {
				displayName:li.children(".display-name").html(),
				displayValue:li.children(".display-value").html()
			};
		});
		selectedList.push(product);
	});


	$cache.bonusProductList.on("click", "div.bonus-product-item a[href].swatchanchor", function (e) {
		e.preventDefault();
	})
	.on("click", "button.button-select-bonus", function (e) {
		e.preventDefault();
		if (selectedList.length>=maxItems) {
			$cache.bonusProductList.find("button.button-select-bonus").attr("disabled", "disabled");
			$cache.bonusProductList.find("bonus-items-available").text("0");
			return;
		}

		var form = $(this).closest("form.bonus-product-form"),
			detail = $(this).closest(".product-detail");
			uuid = form.find("input[name='productUUID']").val(),
			qtyVal = form.find("input[name='Quantity']").val(),
			qty = isNaN(qtyVal) ? 1 : (+qtyVal);

		var product = {
			uuid : uuid,
			pid : form.find("input[name='pid']").val(),
			qty : qty,
			name : detail.find(".product-name").text(),
			attributes : detail.find(".product-variations").data("current"),
			options : []
		};

		var optionSelects = form.find("select.product-option");

		optionSelects.each(function (idx) {
			product.options.push({
				name : this.name,
				value : $(this).val(),
				display : $(this).children(":selected").first().html()
			});
		});
		selectedList.push(product);
		updateSummary();
	})
	.on("click", ".remove-link", function(e){
		e.preventDefault();
		var container = $(this).closest("li.selected-bonus-item");
		if (!container.data("uuid")) { return; }

		var uuid = container.data("uuid");
		var i, len = selectedList.length;
		for(i=0;i<len;i++) {
			if (selectedList[i].uuid===uuid) {
				selectedList.splice(i,1);
				break;
			}
		}
		updateSummary();
	})
	.on("click", ".add-to-cart-bonus", function (e) {
		e.preventDefault();
		var url = util.appendParamsToUrl(Urls.addBonusProduct, {bonusDiscountLineItemUUID:bliUUID});
		var bonusProducts = getBonusProducts();
		if (bonusProducts.bonusproducts[0].product.qty > maxItems) {
			bonusProducts.bonusproducts[0].product.qty = maxItems;
		} 
		// make the server call
		$.ajax({
			type : "POST",
			dataType : "json",
			cache	: false,
			contentType : "application/json",
			url : url,
			data : JSON.stringify(bonusProducts)
		})
		.done(function (response) {
			// success
			page.refresh();
		})
		.fail(function (xhr, textStatus) {
			// failed
			if(textStatus === "parsererror") {
				window.alert(Resources.BAD_RESPONSE);
			} else {
				window.alert(Resources.SERVER_CONNECTION_ERROR);
			}
		})
		.always(function () {
			$cache.bonusProduct.dialog("close");
		});
		
	});
}

bonusProductsView = {
	/**
	 * @function
	 * @description Initializes the bonus product dialog
	 */
	init : function () {
		$cache = {
			bonusProduct : $("#bonus-product-dialog"),
			resultArea : $("#product-result-area")
		};
	},
	/**
	 * @function
	 * @description Opens the bonus product quick view dialog
	 */
	show : function (url) {
		// create the dialog
		$bonusProduct = dialog.create({
			target : $bonusProduct,
			options : {
				width: 795,
				dialogClass : 'quickview',
				title : Resources.BONUS_PRODUCTS
			}
		});

		// load the products then show
		ajax.load({
			target : $bonusProduct,
			url : url,
			callback : function () {
				$bonusProduct.dialog('open');
				initializeGrid();
				$('#bonus-product-dialog .emptyswatch').css('display','none');
			}
		});

	},
	/**
	 * @function
	 * @description Closes the bonus product quick view dialog
	 */
	close : function () {
		$bonusProduct.dialog('close');
	},
	/**
	 * @function
	 * @description Loads the list of bonus products into quick view dialog
	 */
	loadBonusOption : function () {
		if ($bonusDiscountContainer.length===0) { return; }

		dialog.create({
			target : $bonusDiscountContainer,
			options : {
				height : 'auto',
				width : 350,
				dialogClass : 'quickview',
				title : Resources.BONUS_PRODUCT
			}
		});
		$bonusDiscountContainer.dialog('open');

		// add event handlers
		$bonusDiscountContainer.on("click", ".select-bonus-btn", function (e) {
			e.preventDefault();
			var uuid = $bonusDiscountContainer.data("lineitemid");
			var url = util.appendParamsToUrl(Urls.getBonusProducts,
												 {
													bonusDiscountLineItemUUID : uuid,
													source : "bonus"
												 });

			$bonusDiscountContainer.dialog('close');
			this.show(url);
		}.bind(this)).on("click", ".no-bonus-btn", function (e) {
			$bonusDiscountContainer.dialog('close');
		});
	},
};

module.exports = bonusProductsView;
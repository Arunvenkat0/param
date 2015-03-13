'use strict';

/**
 * Renders product detail pages, snippets/includes used on product detail pages as well as product tiles for product
 * listings.
 *
 * @module controller/Product
 */

/* API Includes */
var Cart = require('~/cartridge/scripts/model/Cart');
var PagingModel = require('dw/web/PagingModel');
var Product = require('~/cartridge/scripts/model/Product');
var ProductSearchModel = require('dw/catalog/ProductSearchModel');
var Search = require('~/cartridge/scripts/model/Search');

/* Script Modules */
var guard = require('~/cartridge/scripts/guard');
var pageMeta = require('~/cartridge/scripts/meta');
var view = require('~/cartridge/scripts/view');

/**
 * Renders a full product detail page. If the http parameter "format" is set to
 * "json" the product details are rendered as JSON response.
 */
function show() {

    var product = Product.get(request.httpParameterMap.pid.stringValue);

    if (product.isVisible()) {
        pageMeta.update(product);

        var productView = view.get('view/ProductView', {
            product        : product,
            DefaultVariant : product.getDefaultVariant()
        });

        var productOptionSelections = productView.getProductOptionSelections(request.httpParameterMap);
        var productVariationSelections = productView.getProductVariationSelections(request.httpParameterMap);

        productView.CurrentOptionModel = productOptionSelections.ProductOptionModel;
        productView.ProductOptionModels = productOptionSelections.ProductOptionModels;
        productView.CurrentVariationModel = productVariationSelections.ProductVariationModel;
        productView.ProductVariationModels = productVariationSelections.ProductVariationModels;

        productView.render(product.getTemplate() || 'product/product');
    }
    else {
        response.setStatus(404);
        view.get().render('error/notfound');
    }

}

/**
 * Renders a full product detail page. If the http parameter "format" is set to
 * "json" the product details are rendered as JSON response.
 */
function detail() {

    var product = Product.get(request.httpParameterMap.pid.stringValue);

    if (product.isVisible()) {
        var productView = view.get('view/ProductView', {
            product        : product,
            DefaultVariant : product.getDefaultVariant()
        });

        var productOptionSelections = productView.getProductOptionSelections(request.httpParameterMap);
        var productVariationSelections = productView.getProductVariationSelections(request.httpParameterMap);

        productView.CurrentOptionModel = productOptionSelections.ProductOptionModel;
        productView.ProductOptionModels = productOptionSelections.ProductOptionModels;
        productView.CurrentVariationModel = productVariationSelections.ProductVariationModel;
        productView.ProductVariationModels = productVariationSelections.ProductVariationModels;

        productView.render(product.getTemplate() || 'product/productdetail');
    }
    else {
        response.setStatus(404);
        view.get().render('error/notfound');
    }

}

/**
 * Returns product availability data as a JSON object. Called via product.js
 * (reloadAvailability). Input: pid (required) - product ID quantity (required) -
 * the quantity to use for determining availability
 */
function getAvailability() {

    var product = Product.get(request.httpParameterMap.pid.stringValue);

    if (product.isVisible()) {
        response.renderJSON(product.getAvailability(request.httpParameterMap.Quantity.stringValue));
    }
    else {
        response.setStatus(404);
        view.get().render('error/notfound');
    }

}

/**
 * Renders a product tile, e.g. used within family and search result pages.
 */
function hitTile() {

    var product = Product.get(request.httpParameterMap.pid.stringValue);

    if (product.isVisible()) {
        var productView = view.get('view/ProductView', {
            product       : product,
            showswatches  : true,
            showpricing   : true,
            showpromotion : true,
            showrating    : true,
            showcompare   : true
        });

        // special handling for dictionary key 'product' as the template requires it in lower case
        delete productView.Product;
        productView.product = product.object;

        productView.render(product.getTemplate() || 'product/producttile');
    }

}

/**
 * Renders a navigation include on product detail pages. Provides next/back links for customers to traverse a product
 * list, like search result list etc.
 */
function productNavigation() {

    var params = request.httpParameterMap;
    var product = Product.get(params.pid.stringValue);

    if (product.isVisible()) {

        // construct the search based on the HTTP params & set the categoryID
        var productSearchModel = Search.initializeProductSearchModel(params);

        // need to reset pid in search
        productSearchModel.setProductID(null);

        // special handling if no category ID is given in URL
        if (!params.cgid.value) {
            var category = null;

            if (product.getPrimaryCategory()) {
                category = product.getPrimaryCategory();
            }
            else if (product.getVariationModel().getMaster()) {
                category = product.getVariationModel().getMaster().getPrimaryCategory();
            }

            category && category.isOnline() && productSearchModel.setCategoryID(category.getID());
        }

        // execute the product search
        productSearchModel.search();

        // construct the paging model
        var productPagingModel = new PagingModel(productSearchModel.productSearchHits, productSearchModel.count);
        productPagingModel.setPageSize(3);
        productPagingModel.setStart(params.start.intValue - 2);

        view.get({
            ProductPagingModel  : productPagingModel,
            ProductSearchResult : productSearchModel
        }).render('search/productnav');

    }
    else {
        response.setStatus(404);
        view.get().render('error/notfound');
    }

}

/**
 * Renders variation selection controls for the given PID.
 */
function variation() {

    var product = Product.get(request.httpParameterMap.pid.stringValue);

    if (product.isVisible()) {

        var productView = view.get('view/ProductView', {
            product : product
        });

        var productVariationSelections = productView.getProductVariationSelections(request.httpParameterMap);
        var currentVariationModel = productVariationSelections.ProductVariationModel;

        product = Product.get(productVariationSelections.SelectedProduct);

        // TODO this is apparently nowhere set to true..
        var resetAttributes = false;

        if (product.isMaster()) {
            product = Product.get(product.getDefaultVariant());
            resetAttributes = false;
        }

        if (request.httpParameterMap.source.stringValue === 'bonus') {
	        var bonusDiscountLineItems = Cart.get().getBonusDiscountLineItems();
            var bonusDiscountLineItem = null;

            for (var i = 0; i < bonusDiscountLineItems.length; i++) {
                if (bonusDiscountLineItems[i].UUID === request.httpParameterMap.bonusDiscountLineItemUUID.stringValue) {
                    bonusDiscountLineItem = bonusDiscountLineItems[i];
                    break;
                }
            }

            view.get('view/ProductView', {
                product               : product,
                CurrentVariationModel : currentVariationModel,
                BonusDiscountLineItem : bonusDiscountLineItem
            }).render('product/components/bonusproduct');
        }
        else if (request.httpParameterMap.format.stringValue) {
            view.get('view/ProductView', {
                product         : product,
                GetImages       : true,
                resetAttributes : resetAttributes
            }).render('product/productcontent');
        }
        else {
            view.get('view/ProductView', {
                product               : product,
                CurrentVariationModel : currentVariationModel
            }).render('product/product');
        }
    }
    else {
	    response.setStatus(404);
        view.get().render('error/notfound');
    }

}

/**
 * Renders variation selection controls for the product set item identified by the given PID.
 */
function variationPS() {

    var product = Product.get(request.httpParameterMap.pid.stringValue);

    if (product.isVisible()) {

        var productView = view.get('view/ProductView', {
            product : product
        });

        var productVariationSelections = productView.getProductVariationSelections(request.httpParameterMap);
        product = Product.get(productVariationSelections.SelectedProduct);

        if (product.isMaster()) {
            product = Product.get(product.getDefaultVariant());
        }

        if (request.httpParameterMap.format.stringValue) {
            view.get('view/ProductView', {product : product}).render('product/components/productsetproduct');
        }
        else {
            view.get('view/ProductView', {product : product}).render('product/product');
        }
    }
    else {
	    response.setStatus(404);
	    view.get().render('error/notfound');
    }

}

/**
 * Renders the last visited products based on the session information.
 */
function includeLastVisited() {

    response.renderTemplate('product/lastvisited', {
        LastVisitedProducts : require('~/cartridge/scripts/model/RecentlyViewedItems').getRecentlyViewedProducts(3)
    });

}

/**
 * Renders a list of bonus products for a bonus discount line item.
 */
function getBonusProducts() {

    var bonusDiscountLineItems = Cart.get().getBonusDiscountLineItems();
    var bonusDiscountLineItem = null;

    for (var i = 0; i < bonusDiscountLineItems.length; i++) {
        if (bonusDiscountLineItems[i].UUID === request.httpParameterMap.bonusDiscountLineItemUUID.stringValue) {
            bonusDiscountLineItem = bonusDiscountLineItems[i];
            break;
        }
    }

    view.get({
        BonusDiscountLineItem : bonusDiscountLineItem
    }).render('product/bonusproductgrid');

}

/**
 * Renders a set item view for the given PID.
 */
function getSetItem() {

    var product = Product.get(request.httpParameterMap.pid.stringValue);

    if (product.isVisible()) {
        view.get('view/ProductView', {
            product : product,
            isSet   : true
        }).render('product/components/productsetproduct');
    }
    else {
	    response.setStatus(404);
	    view.get().render('error/notfound');
    }

}

/*
 * Web exposed methods
 */
/** @see module:controller/Product~show */
exports.Show                = guard.filter(['get'], show);
/*v @see module:controller/Product~detail */
exports.Detail              = guard.filter(['get'], detail);
/*v @see module:controller/Product~getAvailability */
exports.GetAvailability     = guard.filter(['get'], getAvailability);
/** @see module:controller/Product~hitTile */
exports.HitTile             = guard.filter(['get'], hitTile);
/** @see module:controller/Product~productNavigation */
exports.Productnav          = guard.filter(['get'], productNavigation);
/** @see module:controller/Product~variation */
exports.Variation           = guard.filter(['get'], variation);
/** @see module:controller/Product~variationPS */
exports.VariationPS         = guard.filter(['get'], variationPS);
/** @see module:controller/Product~includeLastVisited */
exports.IncludeLastVisited  = guard.filter(['get'], includeLastVisited);
/** @see module:controller/Product~getBonusProducts */
exports.GetBonusProducts    = guard.filter(['get'], getBonusProducts);
/** @see module:controller/Product~getSetItem */
exports.GetSetItem          = guard.filter(['get'], getSetItem);

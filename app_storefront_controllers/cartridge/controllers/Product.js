'use strict';

/**
 * This controller renders product detail pages and  snippets or includes used on product detail pages.
 * Also renders product tiles for product listings.
 *
 * @module controllers/Product
 */

var params = request.httpParameterMap;

/* Script Modules */
var app = require('~/cartridge/scripts/app');
var guard = require('~/cartridge/scripts/guard');

/**
 * Renders the product template.
 */
function show() {

    var product = app.getModel('Product').get(params.pid.stringValue);

    if (product.isVisible()) {
        require('~/cartridge/scripts/meta').update(product);

        var productView = app.getView('Product', {
            product: product,
            DefaultVariant: product.getDefaultVariant()
        });

        productView.CurrentOptionModel = product.updateOptionSelection(params);
        productView.CurrentVariationModel = product.updateVariationSelection(params);

        productView.render(product.getTemplate() || 'product/product');
    } else {
        // @FIXME Correct would be to set a 404 status code but that breaks the page as it utilizes
        // remote includes which the WA won't resolve.
        response.setStatus(410);
        app.getView().render('error/notfound');
    }

}

/**
 * Renders the productdetail template.
 */
function detail() {

    var Product = app.getModel('Product');
    var product = Product.get(params.pid.stringValue);

    if (product.isVisible()) {
        var productView = app.getView('Product', {
            product: product,
            DefaultVariant: product.getDefaultVariant()
        });

        productView.CurrentOptionModel = product.updateOptionSelection(params);
        productView.CurrentVariationModel = product.updateVariationSelection(params);

        productView.render(product.getTemplate() || 'product/productdetail');
    } else {
        // @FIXME Correct would be to set a 404 status code but that breaks the page as it utilizes
        // remote includes which the WA won't resolve
        response.setStatus(410);
        app.getView().render('error/notfound');
    }

}

/**
 * Returns product availability data as a JSON object. Called via product.js
 * (reloadAvailability). Input: pid (required) - product ID quantity (required) -
 * the quantity to use for determining availability
 */
function getAvailability() {

    var Product = app.getModel('Product');
    var product = Product.get(params.pid.stringValue);

    if (product.isVisible()) {
        let r = require('~/cartridge/scripts/util/Response');

        r.renderJSON(product.getAvailability(params.Quantity.stringValue));
    } else {
        // @FIXME Correct would be to set a 404 status code but that breaks the page as it utilizes
        // remote includes which the WA won't resolve
        response.setStatus(410);
        app.getView().render('error/notfound');
    }

}

/**
 * Renders a product tile, used within family and search result pages.
 */
function hitTile() {

    var Product = app.getModel('Product');
    var product = Product.get(params.pid.stringValue);

    if (product.isVisible()) {
        var productView = app.getView('Product', {
            product: product,
            showswatches: true,
            showpricing: true,
            showpromotion: true,
            showrating: true,
            showcompare: true
        });

        // Special handling for dictionary key 'product' as the template requires it in lower case.
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

    var Product = app.getModel('Product');
    var product = Product.get(params.pid.stringValue);

    if (product.isVisible()) {
        var PagingModel;
        var productPagingModel;

        // Construct the search based on the HTTP params and set the categoryID.
        var Search = app.getModel('Search');
        var productSearchModel = Search.initializeProductSearchModel(params);

        // Reset pid in search.
        productSearchModel.setProductID(null);

        // Special handling if no category ID is given in URL.
        if (!params.cgid.value) {
            var category = null;

            if (product.getPrimaryCategory()) {
                category = product.getPrimaryCategory();
            } else if (product.getVariationModel().getMaster()) {
                category = product.getVariationModel().getMaster().getPrimaryCategory();
            }

            if (category && category.isOnline()) {
                productSearchModel.setCategoryID(category.getID());
            }
        }

        // Execute the product searchs
        productSearchModel.search();

        // construct the paging model
        PagingModel = require('dw/web/PagingModel');
        productPagingModel = new PagingModel(productSearchModel.productSearchHits, productSearchModel.count);
        productPagingModel.setPageSize(3);
        productPagingModel.setStart(params.start.intValue - 2);

        app.getView({
            ProductPagingModel: productPagingModel,
            ProductSearchResult: productSearchModel
        }).render('search/productnav');

    } else {
        // @FIXME Correct would be to set a 404 status code but that breaks the page as it utilizes
        // remote includes which the WA won't resolve
        response.setStatus(410);
        app.getView().render('error/notfound');
    }

}

/**
 * Renders variation selection controls for the given PID.
 */
function variation() {

    var Product = app.getModel('Product');
    var product = Product.get(params.pid.stringValue);
    var resetAttributes = false;

    if (product.isVisible()) {

        var currentVariationModel = product.updateVariationSelection(params);

        var selectedVariant = currentVariationModel.getSelectedVariant();
        if (selectedVariant) {
            product = Product.get(selectedVariant);
        }

        if (params.source.stringValue === 'bonus') {
            var Cart = app.getModel('Cart');
            var bonusDiscountLineItems = Cart.get().getBonusDiscountLineItems();
            var bonusDiscountLineItem = null;

            for (var i = 0; i < bonusDiscountLineItems.length; i++) {
                if (bonusDiscountLineItems[i].UUID === params.bonusDiscountLineItemUUID.stringValue) {
                    bonusDiscountLineItem = bonusDiscountLineItems[i];
                    break;
                }
            }

            app.getView('Product', {
                product: product,
                CurrentVariationModel: currentVariationModel,
                BonusDiscountLineItem: bonusDiscountLineItem
            }).render('product/components/bonusproduct');
        } else if (params.format.stringValue) {
            app.getView('Product', {
                product: product,
                GetImages: true,
                resetAttributes: resetAttributes,
                CurrentVariationModel: currentVariationModel
            }).render('product/productcontent');
        } else {
            app.getView('Product', {
                product: product,
                CurrentVariationModel: currentVariationModel
            }).render('product/product');
        }
    } else {
        // @FIXME Correct would be to set a 404 status code but that breaks the page as it utilizes
        // remote includes which the WA won't resolve
        response.setStatus(410);
        app.getView().render('error/notfound');
    }

}

/**
 * Renders variation selection controls for the product set item identified by the given PID.
 */
function variationPS() {

    var Product = app.getModel('Product');
    var product = Product.get(params.pid.stringValue);

    if (product.isVisible()) {

        var productView = app.getView('Product', {
            product: product
        });

        var productVariationSelections = productView.getProductVariationSelections(params);
        product = Product.get(productVariationSelections.SelectedProduct);

        if (product.isMaster()) {
            product = Product.get(product.getDefaultVariant());
        }

        if (params.format.stringValue) {
            app.getView('Product', {product: product}).render('product/components/productsetproduct');
        } else {
            app.getView('Product', {product: product}).render('product/product');
        }
    } else {
        // @FIXME Correct would be to set a 404 status code but that breaks the page as it utilizes
        // remote includes which the WA won't resolve
        response.setStatus(410);
        app.getView().render('error/notfound');
    }

}

/**
 * Renders the last visited products based on the session information.
 */
function includeLastVisited() {
    app.getView({
        LastVisitedProducts: app.getModel('RecentlyViewedItems').getRecentlyViewedProducts(3)
    }).render('product/lastvisited');
}

/**
 * Renders a list of bonus products for a bonus discount line item.
 */
function getBonusProducts() {
    var Cart = app.getModel('Cart');
    var bonusDiscountLineItems = Cart.get().getBonusDiscountLineItems();
    var bonusDiscountLineItem = null;

    for (var i = 0; i < bonusDiscountLineItems.length; i++) {
        if (bonusDiscountLineItems[i].UUID === params.bonusDiscountLineItemUUID.stringValue) {
            bonusDiscountLineItem = bonusDiscountLineItems[i];
            break;
        }
    }

    app.getView({
        BonusDiscountLineItem: bonusDiscountLineItem
    }).render('product/bonusproductgrid');

}

/**
 * Renders a set item view for the given PID.
 */
function getSetItem() {

    var Product = app.getModel('Product');
    var product = Product.get(params.pid.stringValue);

    if (product.isVisible()) {
        app.getView('Product', {
            product: product,
            isSet: true
        }).render('product/components/productsetproduct');
    } else {
        // @FIXME Correct would be to set a 404 status code but that breaks the page as it utilizes
        // remote includes which the WA won't resolve
        response.setStatus(410);
        app.getView().render('error/notfound');
    }

}

/**
 * Renders the product detail page within the context of a category.
 * Note: this function is not obsolete and must remain as it is used by hardcoded platform rewrite rules.
 */
function showInCategory() {
    show();
}

/*
 * Web exposed methods
 */
/** @see module:controllers/Product~show */
exports.Show                = guard.ensure(['get'], show);
/** @see module:controllers/Product~showInCategory */
exports.ShowInCategory      = guard.ensure(['get'], showInCategory);
/** @see module:controllers/Product~detail */
exports.Detail              = guard.ensure(['get'], detail);
/** @see module:controllers/Product~getAvailability */
exports.GetAvailability     = guard.ensure(['get'], getAvailability);
/** @see module:controllers/Product~hitTile */
exports.HitTile             = guard.ensure(['get'], hitTile);
/** @see module:controllers/Product~productNavigation */
exports.Productnav          = guard.ensure(['get'], productNavigation);
/** @see module:controllers/Product~variation */
exports.Variation           = guard.ensure(['get'], variation);
/** @see module:controllers/Product~variationPS */
exports.VariationPS         = guard.ensure(['get'], variationPS);
/** @see module:controllers/Product~includeLastVisited */
exports.IncludeLastVisited  = guard.ensure(['get'], includeLastVisited);
/** @see module:controllers/Product~getBonusProducts */
exports.GetBonusProducts    = guard.ensure(['get'], getBonusProducts);
/** @see module:controllers/Product~getSetItem */
exports.GetSetItem          = guard.ensure(['get'], getSetItem);

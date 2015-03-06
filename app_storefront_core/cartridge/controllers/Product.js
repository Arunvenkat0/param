'use strict';

/** @module controller/Product */

/* API Includes */
var PagingModel = require('dw/web/PagingModel');
var Product = require('~/cartridge/scripts/object/Product');
var ProductSearchModel = require('dw/catalog/ProductSearchModel');
var Search = require('~/cartridge/scripts/object/Search');

/* Script Modules */
var guard = require('./dw/guard');
var pageMeta = require('~/cartridge/scripts/meta');
var view = require('~/cartridge/scripts/_view');

/**
 * Renders a full product detail page. If the http parameter "format" is set to
 * "json" the product details are rendered as JSON response.
 */
function Show() {

    var product = Product.get(request.httpParameterMap.pid.stringValue);

    if (product.isVisible()) {
        pageMeta.update(product);

        var productView = view.get('Product', {
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
        view.get('ProductNotFound').render('error/notfound');
    }

}

/**
 * Renders a full product detail page. If the http parameter "format" is set to
 * "json" the product details are rendered as JSON response.
 */
function Show_NoViews() {

    var pid = request.httpParameterMap.pid.stringValue;
    var product = Product.get(pid);

    if (product.isVisible()) {
        pageMeta.update(product);

        var productOptionSelections = require('~/cartridge/scripts/util/ProductOptionSelection').getProductOptionSelections(product, request.httpParameterMap);
        var productVariationSelections = require('~/cartridge/scripts/util/ProductVariationSelection').getProductVariationSelections(product, request.httpParameterMap);

        response.renderTemplate(product.getTemplate() || 'product/product', {
            Product                : product.object,
            DefaultVariant         : product.getDefaultVariant(),
            CurrentOptionModel     : productOptionSelections.ProductOptionModel,
            ProductOptionModels    : productOptionSelections.ProductOptionModels,
            CurrentVariationModel  : productVariationSelections.ProductVariationModel,
            ProductVariationModels : productVariationSelections.ProductVariationModels
        });
    }
    else {
        response.renderTemplate('error/notfound');
    }

}


/**
 * Renders a full product detail page. If the http parameter "format" is set to
 * "json" the product details are rendered as JSON response.
 */
function Detail() {

    var product = Product.get(request.httpParameterMap.pid.stringValue);

    if (product.isVisible()) {
        var productView = view.get('Product', {
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
        view.get('ProductNotFound').render('error/notfound');
    }

}

/**
 * Returns product availability data as a JSON object. Called via product.js
 * (reloadAvailability). Input: pid (required) - product ID quantity (required) -
 * the quantity to use for determining availability
 */
function GetAvailability() {

    var product = Product.get(request.httpParameterMap.pid.stringValue);

    if (product.isVisible()) {
        response.renderJSON(product.getAvailability(request.httpParameterMap.Quantity.stringValue));
    }
    else {
        view.get('ProductNotFound').render('error/notfound');
    }

}

/**
 * TODO
 */
function HitTile() {

    var product = Product.get(request.httpParameterMap.pid.stringValue);

    if (product.isVisible()) {
        var productView = view.get('Product', {
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
 * TODO
 */
function Productnav() {

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

        view.get('ProductNavigation', {
            ProductPagingModel  : productPagingModel,
            ProductSearchResult : productSearchModel
        }).render('search/productnav');

    }
    else {
        view.get('ProductNotFound').render('error/notfound');
    }

}

/**
 * TODO
 */
function Variation() {

    var product = Product.get(request.httpParameterMap.pid.stringValue);

    if (product.isVisible()) {

        var productView = view.get('Product', {
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
            // TODO - refactor once basket can be retrieved via API
            var CartController = require('./Cart');
            var GetBasketResult = CartController.GetBasket();

            var bonusDiscountLineItems = GetBasketResult.Basket.BonusDiscountLineItems;
            var bonusDiscountLineItem = null;

            for (var i = 0; i < bonusDiscountLineItems.length; i++) {
                if (bonusDiscountLineItems[i].UUID === request.httpParameterMap.bonusDiscountLineItemUUID.stringValue) {
                    bonusDiscountLineItem = bonusDiscountLineItems[i];
                    break;
                }
            }

            view.get('Product', {
                product               : product,
                CurrentVariationModel : currentVariationModel,
                BonusDiscountLineItem : bonusDiscountLineItem
            }).render('product/components/bonusproduct');
        }
        else if (request.httpParameterMap.format.stringValue) {
            view.get('Product', {
                product         : product,
                GetImages       : true,
                resetAttributes : resetAttributes
            }).render('product/productcontent');
        }
        else {
            view.get('Product', {
                product               : product,
                CurrentVariationModel : currentVariationModel
            }).render('product/product');
        }
    }
    else {
        view.get('ProductNotFound').render('error/notfound');
    }

}

/**
 * TODO
 */
function VariationPS() {

    var product = Product.get(request.httpParameterMap.pid.stringValue);

    if (product.isVisible()) {

        var productView = view.get('Product', {
            product : product
        });

        var productVariationSelections = productView.getProductVariationSelections(request.httpParameterMap);
        product = Product.get(productVariationSelections.SelectedProduct);

        if (product.isMaster()) {
            product = Product.get(product.getDefaultVariant());
        }

        if (request.httpParameterMap.format.stringValue) {
            view.get('Product', {product : product}).render('product/components/productsetproduct');
        }
        else {
            view.get('Product', {product : product}).render('product/product');
        }
    }
    else {
        view.get('ProductNotFound').render('error/notfound');
    }

}

/**
 * Renders the last visited products based on the session information.
 */
function IncludeLastVisited() {

    response.renderTemplate('product/lastvisited', {
        LastVisitedProducts : require('~/cartridge/scripts/object/RecentlyViewedItems').getRecentlyViewedProducts(3)
    });

}

/**
 * Renders a list of bonus products for a bonus discount line item.
 */
function GetBonusProducts() {

    // TODO - refactor once basket can be retrieved via API
    var CartController = require('./Cart');
    var GetBasketResult = CartController.GetBasket();

    var bonusDiscountLineItems = GetBasketResult.Basket.BonusDiscountLineItems;
    var bonusDiscountLineItem = null;

    for (var i = 0; i < bonusDiscountLineItems.length; i++) {
        if (bonusDiscountLineItems[i].UUID === request.httpParameterMap.bonusDiscountLineItemUUID.stringValue) {
            bonusDiscountLineItem = bonusDiscountLineItems[i];
            break;
        }
    }

    response.renderTemplate('product/bonusproductgrid', {
        BonusDiscountLineItem : bonusDiscountLineItem
    });

}

/**
 * TODO
 */
function GetSetItem() {

    var product = Product.get(request.httpParameterMap.pid.stringValue);

    if (product.isVisible()) {
        view.get('Product', {
            product : product,
            isSet   : true
        }).render('product/components/productsetproduct');
    }
    else {
        view.get('ProductNotFound').render('error/notfound');
    }

}

/*
 * Web exposed methods
 */
exports.Show = guard.get(Show);
exports.Detail = guard.get(Detail);
exports.GetAvailability = guard.get(GetAvailability);
exports.HitTile = guard.get(HitTile);
exports.Productnav = guard.get(Productnav);
exports.Variation = guard.get(Variation);
exports.VariationPS = guard.get(VariationPS);
exports.IncludeLastVisited = guard.get(IncludeLastVisited);
exports.GetBonusProducts = guard.get(GetBonusProducts);
exports.GetSetItem = guard.get(GetSetItem);

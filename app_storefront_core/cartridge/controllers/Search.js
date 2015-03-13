'use strict';

/**
 * Controller handling search, category and family pages.
 *
 * @module controller/Search
 */

/* API Includes */
var PagingModel = require('dw/web/PagingModel');
var Search = require('~/cartridge/scripts/model/Search');

/* Script Modules */
var guard = require('~/cartridge/scripts/guard');
var pageMeta = require('~/cartridge/scripts/meta');
var view = require('~/cartridge/scripts/view');

/**
 * Renders a full featured product search result page.
 * If the http parameter "format" is set to "ajax" only the product grid is rendered instead of the full page.
 */
function show() {

    var params = request.httpParameterMap;

    if (params.format.stringValue === 'ajax' || params.format.stringValue === 'page-element') {
        // TODO refactor and merge showProductGrid() code into here
        showProductGrid();
        return;
    }

    // TODO - replace with script API equivalent once available
    var SearchRedirectURLResult = new dw.system.Pipelet('SearchRedirectURL').execute({
        SearchPhrase : params.q.value
    });

    if (SearchRedirectURLResult.result === PIPELET_NEXT) {
        response.renderTemplate('util/redirect', {
            Location : SearchRedirectURLResult.Location,
            CacheTag : true
        });
        return;
    }

    // construct the search based on the HTTP params & set the categoryID
    var productSearchModel = Search.initializeProductSearchModel(params);
    var contentSearchModel = Search.initializeContentSearchModel(params);

    // execute the product search
    productSearchModel.search();
    contentSearchModel.search();

    if (productSearchModel.emptyQuery && contentSearchModel.emptyQuery) {
        response.redirect(dw.web.URLUtils.abs('Home-Show'));
    }
    else if (productSearchModel.count > 0) {

        if ((productSearchModel.count > 1) || productSearchModel.refinedSearch || (contentSearchModel.count > 0)) {
            var productPagingModel = new PagingModel(productSearchModel.productSearchHits, productSearchModel.count);
            params.start.submitted && productPagingModel.setStart(params.start.intValue);

            if (params.sz.submitted && request.httpParameterMap.sz.intValue <= 60) {
                productPagingModel.setPageSize(params.sz.intValue);
            }
            else {
                productPagingModel.setPageSize(12);
            }

            productSearchModel.category && pageMeta.update(productSearchModel.category);

            if (productSearchModel.categorySearch && !productSearchModel.refinedCategorySearch && productSearchModel.category.template) {
                // dynamic template
                view.get({
                    ProductSearchResult : productSearchModel,
                    ContentSearchResult : contentSearchModel,
                    ProductPagingModel  : productPagingModel
                }).render(productSearchModel.category.template);
            }
            else {
                view.get({
                    ProductSearchResult : productSearchModel,
                    ContentSearchResult : contentSearchModel,
                    ProductPagingModel  : productPagingModel
                }).render('rendering/category/categoryproducthits');
            }
        }
        else {
            var targetProduct = productSearchModel.getProducts().next();
            var productID = null;

            // If the target was not a master, simply use the product ID
            if (targetProduct.isMaster()) {

                // In the case a variation master, the master is the representative for
                // all it's variants. If there is only one variant, return the variant's
                // product ID.
                var iter = productSearchModel.getProductSearchHits();
                if (iter.hasNext()) {
                    var productSearchHit = iter.next();
                    if (productSearchHit.getRepresentedProducts().size() === 1) {
                        productID = productSearchHit.getFirstRepresentedProduct().getID();
                    }
                }
            }
            else {
                productID = targetProduct.getID();
            }

            response.renderTemplate('util/redirect', {
                Location : dw.web.URLUtils.http('Product-Show', 'pid', productID)
            });
        }
    }
    else {
        view.get({
            ProductSearchResult : productSearchModel,
            ContentSearchResult : contentSearchModel
        }).render('search/nohits');
    }

}


/**
 * Renders a full featured content search result page.
 */
function showContent() {

    var params = request.httpParameterMap;

    var productSearchModel = Search.initializeProductSearchModel(params);
    var contentSearchModel = Search.initializeContentSearchModel(params);

    // execute the product search
    productSearchModel.search();
    contentSearchModel.search();

    if (productSearchModel.emptyQuery && contentSearchModel.emptyQuery) {
        response.redirect(dw.web.URLUtils.abs('Home-Show'));
    }
    else if (contentSearchModel.count > 0) {

        var contentPagingModel = new PagingModel(contentSearchModel.content, contentSearchModel.count);
        contentPagingModel.setPageSize(16);
        params.start.submitted && contentPagingModel.setStart(params.start.intValue);

        if (contentSearchModel.folderSearch && !contentSearchModel.refinedFolderSearch && contentSearchModel.folder.template) {
            // dynamic template
            view.get({
                ProductSearchResult : productSearchModel,
                ContentSearchResult : contentSearchModel,
                ContentPagingModel  : contentPagingModel
            }).render(contentSearchModel.folder.template);
        }
        else {
            view.get({
                ProductSearchResult : productSearchModel,
                ContentSearchResult : contentSearchModel,
                ContentPagingModel  : contentPagingModel
            }).render('rendering/folder/foldercontenthits');
        }
    }
    else {
        view.get({
            ProductSearchResult : productSearchModel,
            ContentSearchResult : contentSearchModel
        }).render('search/nohits');
    }

}

/**
 * Determines search suggestions based on a given input and renders the JSON response for the list of suggestions.
 */
function getSuggestions() {

    /*
     * Switches between legacy and beta versions of the search suggest feature based on the site preference (enhancedSearchSuggestions).
     */
    if (!(request.httpParameterMap.legacy && request.httpParameterMap.legacy === 'true')) {
        view.get().render('search/suggestionsbeta');
    }
    else {
        // TODO - refactor once search suggestion can be retrieved via th script API
        var GetSearchSuggestionsResult = new dw.system.Pipelet('GetSearchSuggestions').execute({
            MaxSuggestions : 10,
            SearchPhrase   : request.httpParameterMap.q.value
        });

        view.get({
            Suggestions : GetSearchSuggestionsResult.Suggestions
        }).render('search/suggestions');

    }

}


/**
 * Renders the partial content of the product grid of a search result as rich html.
 */
function showProductGrid() {

    var params = request.httpParameterMap;

    // construct the search based on the HTTP params & set the categoryID
    var productSearchModel = Search.initializeProductSearchModel(params);
    var contentSearchModel = Search.initializeContentSearchModel(params);

    // execute the product search
    productSearchModel.search();
    contentSearchModel.search();

    var productPagingModel = new PagingModel(productSearchModel.productSearchHits, productSearchModel.count);
    params.start.submitted && productPagingModel.setStart(params.start.intValue);

    if (params.sz.submitted && params.sz.intValue <= 60) {
        productPagingModel.setPageSize(params.sz.intValue);
    }
    else {
        productPagingModel.setPageSize(12);
    }

    if (dw.system.Site.getCurrent().getCustomPreferenceValue('enableInfiniteScroll') && params.format.stringValue === 'page-element') {
        view.get({
            ProductSearchResult : productSearchModel,
            ProductPagingModel  : productPagingModel
        }).render('search/productgridwrapper');
    }
    else {
        if (productSearchModel.categorySearch && !productSearchModel.refinedCategorySearch && productSearchModel.category.template) {
            // dynamic template
            view.get({
                ProductSearchResult : productSearchModel,
                ContentSearchResult : contentSearchModel,
                ProductPagingModel  : productPagingModel
            }).render(productSearchModel.category.template);
        }
        else {
            view.get({
                ProductSearchResult : productSearchModel,
                ContentSearchResult : contentSearchModel,
                ProductPagingModel  : productPagingModel
            }).render('rendering/category/categoryproducthits');
        }
    }

}

/*
 * Web exposed methods
 */
/** @see module:controller/Search~show */
exports.Show            = guard.ensure(['get'], show);
/** @see module:controller/Search~showContent */
exports.ShowContent     = guard.ensure(['get'], showContent);
/** @see module:controller/Search~getSuggestions */
exports.GetSuggestions  = guard.ensure(['get'], getSuggestions);

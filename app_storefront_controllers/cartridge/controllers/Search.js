'use strict';

/**
 * Controller handling search, category and family pages.
 *
 * @module controllers/Search
 */

/* API Includes */
var ISML = require('dw/template/ISML');
var PagingModel = require('dw/web/PagingModel');
var URLUtils = require('dw/web/URLUtils');

/* Script Modules */
var app = require('~/cartridge/scripts/app');
var guard = require('~/cartridge/scripts/guard');

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
        SearchPhrase: params.q.value
    });

    if (SearchRedirectURLResult.result === PIPELET_NEXT) {
        ISML.renderTemplate('util/redirect', {
            Location: SearchRedirectURLResult.Location,
            CacheTag: true
        });
        return;
    }

    // Constructs the search based on the HTTP params and sets the categoryID.
    var Search = app.getModel('Search');
    var productSearchModel = Search.initializeProductSearchModel(params);
    var contentSearchModel = Search.initializeContentSearchModel(params);

    // execute the product search
    productSearchModel.search();
    contentSearchModel.search();

    if (productSearchModel.emptyQuery && contentSearchModel.emptyQuery) {
        response.redirect(URLUtils.abs('Home-Show'));
    } else if (productSearchModel.count > 0) {

        if ((productSearchModel.count > 1) || productSearchModel.refinedSearch || (contentSearchModel.count > 0)) {
            var productPagingModel = new PagingModel(productSearchModel.productSearchHits, productSearchModel.count);
            if (params.start.submitted) {
                productPagingModel.setStart(params.start.intValue);
            }

            if (params.sz.submitted && request.httpParameterMap.sz.intValue <= 60) {
                productPagingModel.setPageSize(params.sz.intValue);
            } else {
                productPagingModel.setPageSize(12);
            }

            if (productSearchModel.category) {
                require('~/cartridge/scripts/meta').update(productSearchModel.category);
            }

            if (productSearchModel.categorySearch && !productSearchModel.refinedCategorySearch && productSearchModel.category.template) {
                // Renders a dynamic template.
                app.getView({
                    ProductSearchResult: productSearchModel,
                    ContentSearchResult: contentSearchModel,
                    ProductPagingModel: productPagingModel
                }).render(productSearchModel.category.template);
            } else {
                app.getView({
                    ProductSearchResult: productSearchModel,
                    ContentSearchResult: contentSearchModel,
                    ProductPagingModel: productPagingModel
                }).render('rendering/category/categoryproducthits');
            }
        } else {
            var targetProduct = productSearchModel.getProducts().next();
            var productID = null;

            // If the target was not a master, simply use the product ID.
            if (targetProduct.isMaster()) {

                // In the case of a variation master, the master is the representative for
                // all its variants. If there is only one variant, return the variant's
                // product ID.
                var iter = productSearchModel.getProductSearchHits();
                if (iter.hasNext()) {
                    var productSearchHit = iter.next();
                    if (productSearchHit.getRepresentedProducts().size() === 1) {
                        productID = productSearchHit.getFirstRepresentedProduct().getID();
                    }
                }
            } else {
                productID = targetProduct.getID();
            }

            ISML.renderTemplate('util/redirect', {
                Location: URLUtils.http('Product-Show', 'pid', productID)
            });
        }
    } else {
        app.getView({
            ProductSearchResult: productSearchModel,
            ContentSearchResult: contentSearchModel
        }).render('search/nohits');
    }

}


/**
 * Renders a full featured content search result page.
 */
function showContent() {

    var params = request.httpParameterMap;

    var Search = app.getModel('Search');
    var productSearchModel = Search.initializeProductSearchModel(params);
    var contentSearchModel = Search.initializeContentSearchModel(params);

    // Executes the product search.
    productSearchModel.search();
    contentSearchModel.search();

    if (productSearchModel.emptyQuery && contentSearchModel.emptyQuery) {
        response.redirect(URLUtils.abs('Home-Show'));
    } else if (contentSearchModel.count > 0) {

        var contentPagingModel = new PagingModel(contentSearchModel.content, contentSearchModel.count);
        contentPagingModel.setPageSize(16);
        if (params.start.submitted) {
            contentPagingModel.setStart(params.start.intValue);
        }

        if (contentSearchModel.folderSearch && !contentSearchModel.refinedFolderSearch && contentSearchModel.folder.template) {
            // Renders a dynamic template
            app.getView({
                ProductSearchResult: productSearchModel,
                ContentSearchResult: contentSearchModel,
                ContentPagingModel: contentPagingModel
            }).render(contentSearchModel.folder.template);
        } else {
            app.getView({
                ProductSearchResult: productSearchModel,
                ContentSearchResult: contentSearchModel,
                ContentPagingModel: contentPagingModel
            }).render('rendering/folder/foldercontenthits');
        }
    } else {
        app.getView({
            ProductSearchResult: productSearchModel,
            ContentSearchResult: contentSearchModel
        }).render('search/nohits');
    }

}

/**
 * Determines search suggestions based on a given input and renders the JSON response for the list of suggestions.
 */
function getSuggestions() {

    /*
     * Switches between legacy and beta versions of the search suggest feature based on the enhancedSearchSuggestions site preference.
     */
    if (!(request.httpParameterMap.legacy && request.httpParameterMap.legacy === 'true')) {
        app.getView().render('search/suggestionsbeta');
    } else {
        // TODO - refactor once search suggestion can be retrieved via the script API.
        var GetSearchSuggestionsResult = new dw.system.Pipelet('GetSearchSuggestions').execute({
            MaxSuggestions: 10,
            SearchPhrase: request.httpParameterMap.q.value
        });

        app.getView({
            Suggestions: GetSearchSuggestionsResult.Suggestions
        }).render('search/suggestions');

    }

}


/**
 * Renders the partial content of the product grid of a search result as rich HTML.
 */
function showProductGrid() {

    var params = request.httpParameterMap;

    // Constructs the search based on the HTTP params and sets the categoryID.
    var Search = app.getModel('Search');
    var productSearchModel = Search.initializeProductSearchModel(params);
    var contentSearchModel = Search.initializeContentSearchModel(params);

    // Executes the product search.
    productSearchModel.search();
    contentSearchModel.search();

    var productPagingModel = new PagingModel(productSearchModel.productSearchHits, productSearchModel.count);
    if (params.start.submitted) {
        productPagingModel.setStart(params.start.intValue);
    }

    if (params.sz.submitted && params.sz.intValue <= 60) {
        productPagingModel.setPageSize(params.sz.intValue);
    } else {
        productPagingModel.setPageSize(12);
    }

    if (dw.system.Site.getCurrent().getCustomPreferenceValue('enableInfiniteScroll') && params.format.stringValue === 'page-element') {
        app.getView({
            ProductSearchResult: productSearchModel,
            ProductPagingModel: productPagingModel
        }).render('search/productgridwrapper');
    } else {
        if (productSearchModel.categorySearch && !productSearchModel.refinedCategorySearch && productSearchModel.category.template) {
            // Renders a dynamic template.
            app.getView({
                ProductSearchResult: productSearchModel,
                ContentSearchResult: contentSearchModel,
                ProductPagingModel: productPagingModel
            }).render(productSearchModel.category.template);
        } else {
            app.getView({
                ProductSearchResult: productSearchModel,
                ContentSearchResult: contentSearchModel,
                ProductPagingModel: productPagingModel
            }).render('rendering/category/categoryproducthits');
        }
    }

}

/*
 * Web exposed methods
 */
/** @see module:controllers/Search~show */
exports.Show            = guard.ensure(['get'], show);
/** @see module:controllers/Search~showContent */
exports.ShowContent     = guard.ensure(['get'], showContent);
/** @see module:controllers/Search~getSuggestions */
exports.GetSuggestions  = guard.ensure(['get'], getSuggestions);

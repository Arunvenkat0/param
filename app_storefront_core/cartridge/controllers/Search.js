var g = require('./dw/guard');

/**
 * Renders a full featured product search result page. 
 * If the http parameter "format" is set to "ajax" only the product grid is rendered instead of the full page.
 */
function Show()
{
	var CurrentHttpParameterMap = request.httpParameterMap;
	
	if (CurrentHttpParameterMap.format.stringValue == 'ajax' || CurrentHttpParameterMap.format.stringValue == 'page-element')
	{
		showProductGrid();
		return;
	}
	
	var SearchRedirectURLResult = new dw.system.Pipelet('SearchRedirectURL').execute({
			SearchPhrase: CurrentHttpParameterMap.q.value
	});
	
	if (SearchRedirectURLResult.result == PIPELET_NEXT)
	{
	    var Location = SearchRedirectURLResult.Location;

		response.renderTemplate('util/redirect', {
			Location: Location,
			CacheTag: true
		});
		return;
	}
	
	var SearchResult = new dw.system.Pipelet('Search', {
		SearchContent: true,
		SearchProduct: true,
		DisallowOfflineCategory: true,
		RecursiveCategorySearch: true,
		RecursiveFolderSearch: true
	}).execute({
		SearchPhrase: 			CurrentHttpParameterMap.q.value,
		SortBy1: 				CurrentHttpParameterMap.psortb1.value,
		SortBy1Direction: 		CurrentHttpParameterMap.psortd1.intValue,
		SortBy2: 				CurrentHttpParameterMap.psortb2.value,
		SortBy2Direction: 		CurrentHttpParameterMap.psortd2.intValue,
		SortBy3: 				CurrentHttpParameterMap.psortb3.value,
		SortBy3Direction: 		CurrentHttpParameterMap.psortd3.intValue,
		PriceMin: 				CurrentHttpParameterMap.pmin.doubleValue,
		PriceMax: 				CurrentHttpParameterMap.pmax.doubleValue,
		RefineBy5Name: 			null,
		RefineBy5Phrase: 		null,
		CategoryID: 			CurrentHttpParameterMap.cgid.value,
		ProductID: 				CurrentHttpParameterMap.pid.value,
		ContentID: 				CurrentHttpParameterMap.cid.value,
		FolderID: 				CurrentHttpParameterMap.fdid.value,
		RefineByNamePrefix: 	'prefn',
		RefineByPhrasePrefix: 	'prefv',
		SortingRuleID: 			CurrentHttpParameterMap.srule.value
	});
	
    var ContentSearchResult = SearchResult.ContentSearchModel;
    var ProductSearchResult = SearchResult.ProductSearchModel;
        
    if (ProductSearchResult.emptyQuery && ContentSearchResult.emptyQuery)
    {
    	response.redirect(dw.web.URLUtils.abs('Home-Show'));
    	return;
    }
    
    if (ProductSearchResult.count <= 0)
    {
    	response.renderTemplate('search/nohits', {
    		ProductSearchResult: ProductSearchResult,
    		ContentSearchResult: ContentSearchResult
    	});
    	return;
   	}
		
	if ((ProductSearchResult.count > 1) || (ProductSearchResult.refinedSearch) || (ContentSearchResult.count > 0))
	{
		var PagingResult = new dw.system.Pipelet('Paging', {
			DefaultPageSize : 12
		}).execute({
			Objects:		ProductSearchResult.productSearchHits,
			ObjectsCount: 	ProductSearchResult.count,
			PageSize: 		CurrentHttpParameterMap.sz.getIntValue(12) <= 60 ? CurrentHttpParameterMap.sz.intValue : null,
			Start: 			CurrentHttpParameterMap.start.intValue
		});
		
		var ProductPagingModel = PagingResult.PagingModel;
				
		var web = require('./dw/web');
		web.updatePageMetaDataForCategory(ProductSearchResult.category);

		
		if (ProductSearchResult.categorySearch && !ProductSearchResult.refinedCategorySearch && !empty(ProductSearchResult.category.template))
		{
			// dynamic template
			response.renderTemplate(ProductSearchResult.category.template, {
				ProductSearchResult : ProductSearchResult,
				ContentSearchResult : ContentSearchResult,
				ProductPagingModel : ProductPagingModel
			});
			
			return;
		}
		else
		{
			response.renderTemplate('rendering/category/categoryproducthits', {
				ProductSearchResult : ProductSearchResult,
				ContentSearchResult : ContentSearchResult,
				ProductPagingModel : ProductPagingModel
			});
			
			return;
		}
	}
	else
	{
		var GetProductIDsResult = new dw.system.Pipelet('Script', {
			OnError: 'PIPELET_ERROR',
			ScriptFile: 'search/GetProductID.ds',
			Transactional: false
		}).execute({
			ProductSearchModel:	ProductSearchResult
		});
		var ProductID = GetProductIDsResult.ProductID;
		
		response.renderTemplate('util/redirect', {
			Location: dw.web.URLUtils.http('Product-Show', 'pid', ProductID)
		});
		
		return;
	}
}


/**
 * Renders a full featured content search result page.
 */
function ShowContent()
{
	var CurrentHttpParameterMap = request.httpParameterMap;

	
	var SearchResult = new dw.system.Pipelet('Search', {
		SearchContent: true,
	    SearchProduct: true,
	    DisallowOfflineCategory: true,
	    RecursiveCategorySearch: true,
	    RecursiveFolderSearch: true
	}).execute({
		SearchPhrase:			CurrentHttpParameterMap.q.value,
		SortBy1:				CurrentHttpParameterMap.psortb1.value,
		SortBy1Direction:		CurrentHttpParameterMap.psortd1.intValue,
		SortBy2:				CurrentHttpParameterMap.psortb2.value,
		SortBy2Direction:		CurrentHttpParameterMap.psortd2.intValue,
		SortBy3:				CurrentHttpParameterMap.psortb3.value,
		SortBy3Direction:		CurrentHttpParameterMap.psortd3.intValue,
		PriceMin:				CurrentHttpParameterMap.pmin.doubleValue,
		PriceMax:				CurrentHttpParameterMap.pmax.doubleValue,
		CategoryID:				CurrentHttpParameterMap.cgid.value,
		ProductID: 				CurrentHttpParameterMap.pid.value,
		ContentID: 				CurrentHttpParameterMap.cid.value,
		FolderID: 				CurrentHttpParameterMap.fdid.value,
		RefineByNamePrefix: 	'prefn',
		RefineByPhrasePrefix: 	'prefv',
		OrderableProductsOnly: 	null
	});
    var ProductSearchResult = SearchResult.ProductSearchModel;
    var ContentSearchResult = SearchResult.ContentSearchModel;
  
  	if (ProductSearchResult.emptyQuery && ContentSearchResult.emptyQuery)
  	{
  		response.redirect(dw.web.URLUtils.abs('Home-Show'));
    	return;
  	}
  	
  	if (ContentSearchResult.count <= 0)
  	{
  		response.renderTemplate('search/nohits', {
  			ProductSearchResult: ProductSearchResult,
  			ContentSearchResult: ContentSearchResult
  		});
  		return;  		
  	}
  	
	var PagingResult = new dw.system.Pipelet('Paging', {
  		DefaultPageSize: 16
  	}).execute({
  		Objects: ContentSearchResult.content,
  		ObjectsCount: ContentSearchResult.count,
  		PageSize: pageSize,
  		Start: CurrentHttpParameterMap.start.intValue
  	});
  	
  	var ContentPagingModel = PagingResult.PagingModel;
  	
  	if (ContentSearchResult.folderSearch && !ContentSearchResult.refinedFolderSearch && !empty(ContentSearchResult.folder.template))
  	{
  		// dynamic template
  		response.renderTemplate(ContentSearchResult.folder.template, {
  			ProductSearchResult: ProductSearchResult,
  			ContentSearchResult: ContentSearchResult,
  			ContentPagingModel: ContentPagingModel
  		});
  		return;
  	}
  	else
  	{
  		response.renderTemplate('rendering/folder/foldercontenthits', {
  			ProductSearchResult: ProductSearchResult,
  			ContentSearchResult: ContentSearchResult,
  			ContentPagingModel: ContentPagingModel
  		});
  		return;
  	}
}

/**
 * Determines search suggestions based on a given input and renders the JSON response for the list of suggestions.
 */
function GetSuggestions()
{
	var CurrentHttpParameterMap = request.httpParameterMap;

	/*
	 * Switches between legacy and beta versions of the search suggest feature based on the site preference (enhancedSearchSuggestions).
	 */
	if (!(CurrentHttpParameterMap.legacy && CurrentHttpParameterMap.legacy == 'true'))
	{
		response.renderTemplate('search/suggestionsbeta');
		return;
	}
	
	var GetSearchSuggestionsResult = new dw.system.Pipelet('GetSearchSuggestions').execute({
		MaxSuggestions: 10, 
		SearchPhrase: CurrentHttpParameterMap.q.value
	});
	
	response.renderTemplate('search/suggestions', {
		Suggestions: GetSearchSuggestionsResult.Suggestions
	});	
}


/**
 * Renders the partial content of the product grid of a search result as rich html.
 */
function showProductGrid()
{
    var CurrentHttpParameterMap = request.httpParameterMap;

    var SearchResult = new dw.system.Pipelet('Search', {
        SearchContent:              true,
        SearchProduct:              true,
        DisallowOfflineCategory:    true,
        RecursiveCategorySearch:    true,
        RecursiveFolderSearch:      true
    }).execute({
        SearchPhrase:           CurrentHttpParameterMap.q.value,
        SortBy1:                CurrentHttpParameterMap.psortb1.value,
        SortBy1Direction:       CurrentHttpParameterMap.psortd1.intValue,
        SortBy2:                CurrentHttpParameterMap.psortb2.value,
        SortBy2Direction:       CurrentHttpParameterMap.psortd2.intValue,
        SortBy3:                CurrentHttpParameterMap.psortb3.value,
        SortBy3Direction:       CurrentHttpParameterMap.psortd3.intValue,
        PriceMin:               CurrentHttpParameterMap.pmin.doubleValue,
        PriceMax:               CurrentHttpParameterMap.pmax.doubleValue,
        RefineBy5Name:          null,
        RefineBy5Phrase:        null,
        CategoryID:             CurrentHttpParameterMap.cgid.value,
        ProductID:              CurrentHttpParameterMap.pid.value,
        ContentID:              CurrentHttpParameterMap.cid.value,
        RefineByNamePrefix:     'prefn',
        RefineByPhrasePrefix:   'prefv',
        OrderableProductsOnly:  null,
        SortingRuleID:          CurrentHttpParameterMap.srule.value,
        FolderID:               CurrentHttpParameterMap.fid.value
    });

    var ProductSearchResult = SearchResult.ProductSearchModel;
    var ContentSearchResult = SearchResult.ContentSearchModel;
    
    var PagingResult = new dw.system.Pipelet('Paging', {
        DefaultPageSize: 12
    }).execute({
        Objects:        ProductSearchResult.productSearchHits,
        PageSize:       CurrentHttpParameterMap.sz.getIntValue(12) <= 60 ? CurrentHttpParameterMap.sz.intValue : null,
        Start:          CurrentHttpParameterMap.start.intValue,
        ObjectsCount:   ProductSearchResult.count
    });
    
    var ProductPagingModel = PagingResult.PagingModel;
    
    if (dw.system.Site.getCurrent().getCustomPreferenceValue('enableInfiniteScroll') && CurrentHttpParameterMap.format.stringValue == 'page-element')
    {
        response.renderTemplate('search/productgridwrapper', {
            ProductSearchResult: ProductSearchResult,
            ProductPagingModel: ProductPagingModel
        });
        return;     
    }
    else
    {
        if (ProductSearchResult.categorySearch && !ProductSearchResult.refinedCategorySearch && !empty(ProductSearchResult.category.template))
        {
            // dynamic template
            response.renderTemplate(ProductSearchResult.category.template, {
                ProductSearchResult: ProductSearchResult,
                ContentSearchResult: ContentSearchResult,
                ProductPagingModel: ProductPagingModel
            });
            return;
        }
        else
        {
            response.renderTemplate('rendering/category/categoryproducthits', {
                ProductSearchResult: ProductSearchResult,
                ContentSearchResult: ContentSearchResult,
                ProductPagingModel: ProductPagingModel
            });
            return;
        }
    }
}

/**
 * Executes a product search and puts the ProductSearchResult into the pipeline dictionary for convenient reuse.
 * This is also used in Product pipeline for product navigation i.e. next/prev.
 */
function GetProductResult()
{
    var CurrentHttpParameterMap = request.httpParameterMap;

    
    var SearchResult = new dw.system.Pipelet('Search', {
        SearchContent: false,
        SearchProduct: true,
        DisallowOfflineCategory: true,
        RecursiveCategorySearch: true
    }).execute({
        SearchPhrase: CurrentHttpParameterMap.q.value,
        SortBy1: CurrentHttpParameterMap.psortb1.value,
        SortBy1Direction: CurrentHttpParameterMap.psortd1.intValue,
        SortBy2: CurrentHttpParameterMap.psortb2.value,
        SortBy2Direction: CurrentHttpParameterMap.psortd2.intValue,
        SortBy3: CurrentHttpParameterMap.psortb3.value,
        SortBy3Direction: CurrentHttpParameterMap.psortd3.intValue,
        PriceMin: CurrentHttpParameterMap.pmin.doubleValue,
        PriceMax: CurrentHttpParameterMap.pmax.doubleValue,
        CategoryID: CurrentHttpParameterMap.cgid.value,
        RefineByNamePrefix: 'prefn',
        RefineByPhrasePrefix: 'prefv',
        SortingRuleID: CurrentHttpParameterMap.srule.value
    });
    var ProductSearchResult = SearchResult.ProductSearchModel;

    return {
        ProductSearchResult: ProductSearchResult
    };
}

/**
 * Executes a content search and puts the ContentSearchResult into the pipeline dictionary for convenient reuse.
 */
function GetContentResult()
{
    var CurrentHttpParameterMap = request.httpParameterMap;

    
    var SearchResult = new dw.system.Pipelet('Search', {
        SearchContent: true,
        SearchProduct: true,
        DisallowOfflineCategory: true,
        RecursiveCategorySearch: true,
        RecursiveFolderSearch: true
    }).execute({
        SearchPhrase: CurrentHttpParameterMap.q.value,
        SortBy1: CurrentHttpParameterMap.psortb1.value,
        SortBy1Direction: CurrentHttpParameterMap.psortd1.intValue,
        SortBy2: CurrentHttpParameterMap.psortb2.value,
        SortBy2Direction: CurrentHttpParameterMap.psortd2.intValue,
        SortBy3: CurrentHttpParameterMap.psortb3.value,
        SortBy3Direction: CurrentHttpParameterMap.psortd3.intValue,
        FolderID: CurrentHttpParameterMap.fdid.value,
        RefineByNamePrefix: 'prefn',
        RefineByPhrasePrefix: 'prefv'
    });
    var ContentSearchResult = SearchResult.ContentSearchModel;

    return {
        ContentSearchResult: ContentSearchResult
    };
}


/*
 * Module exports
 */

/*
 * Web exposed methods
 */
exports.Show            = g.get(Show);
exports.ShowContent     = g.get(ShowContent);
exports.GetSuggestions  = g.get(GetSuggestions);

/*
 * Local methods
 */
exports.GetProductResult = GetProductResult;
exports.GetContentResult = GetContentResult;

var g = require('./dw/guard');

/**
 * Provides a form to locate stores by geographical information.
 */
function Find()
{
    var form = require('./dw/form');			
    form.clearFormElement(session.forms.storelocator);
		
    var web = require('./dw/web');				
    web.updatePageMetaDataForContent(dw.content.ContentMgr.getContent("store-locator"));
		
    response.renderTemplate('storelocator/storelocator');
}

/**
 * The form handler. This form is submitted with GET.
 */
function FindStores()
{
    var storeLocatorForm = session.forms.storelocator;

	var action = request.triggeredFormAction;
	if (action != null)
	{
	    if (action.formId == 'findbycountry')
	    {
	    	if (storeLocatorForm.address.country.value != null && storeLocatorForm.address.country.value != '')
	    	{
	    		var searchSystemObjectResult = new dw.system.Pipelet('SearchSystemObject', {
	    		    ObjectType: 'Store',
	    		    SearchExpression: 'countryCode = {1}'
	    		}).execute({
	    		    Search1Value: storeLocatorForm.address.country.value
	    		});
	    		var stores = searchSystemObjectResult.SearchResult;
    		    var storesCount = searchSystemObjectResult.SearchResultCount;
    		    
	    		if (storesCount > 0)
	    		{
		    		response.renderTemplate('storelocator/storelocatorresults', {
		    			Stores: stores,
		    			StoresCount: storesCount,
		    			SearchString: storeLocatorForm.address.country.value
		    		});
		    		return;
	    		}
	    	}
	    }
	    else if (action.formId == 'findbystate')
	    {
	    	var stateCode = storeLocatorForm.address.states.stateUSCA.htmlValue;
		    if (!empty(stateCode))
		    {
			    var searchSystemObjectResult = new dw.system.Pipelet('SearchSystemObject', {
			        ObjectType: 'Store',
			        SearchExpression: 'stateCode = {1}'
			    }).execute({
	                Search1Value: storeLocatorForm.address.states.stateUSCA.htmlValue
	            });
	            var stores = searchSystemObjectResult.SearchResult;
	            var storesCount = searchSystemObjectResult.SearchResultCount;
	            

	            if (storesCount > 0)
	            {
	                response.renderTemplate('storelocator/storelocatorresults', {
	                    Stores: stores,
	                    StoresCount : storesCount,
	                    SearchString: 'State ' + storeLocatorForm.address.states.stateUSCA.htmlValue
	                });
	                return;
	            }
		    }	
	    }
	    else if (action.formId == 'findbyzip')
	    {
	    	var getNearestStoresResult = new dw.system.Pipelet('GetNearestStores', {
	    	    DistanceUnit: 'mi'
	    	}).execute({
	    	    PostalCode: storeLocatorForm.postalCode.value,
	    	    CountryCode: storeLocatorForm.countryCode.value,
	    	    MaxDistance: storeLocatorForm.maxdistance.value,
	    	    DistanceUnit: storeLocatorForm.distanceUnit.value
	    	});
    	    var nearestStores = getNearestStoresResult.Stores;

	    	
	    	var stores = nearestStores.keySet();
	    	var storesCount = nearestStores.size();

	    	if (storesCount > 0)
	    	{
	    		response.renderTemplate('storelocator/storelocatorresults', {
	    			Stores: stores,
	    			StoresCount : storesCount,
	                SearchString : 'Zip ' + storeLocatorForm.postalCode.value
	    		});
	    		return;
	    	}
	    }
	}

	response.renderTemplate('storelocator/storelocator');
}


/**
 * Renders the details of a store.
 */
function Details()
{
    var storeID = request.httpParameterMap.StoreID.value;

    var store = dw.catalog.StoreMgr.getStore(storeID);
		
	response.renderTemplate('storelocator/storedetails', {
		Store: store
	});
}

/*
 * Module exports
 */

/*
 * Exposed web methods
 */
exports.Find        = g.get(Find);
exports.FindStores  = g.get(FindStores);
exports.Details     = g.get(Details);

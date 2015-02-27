var guard = require('./dw/guard');
var pageMeta = require('~/cartridge/scripts/meta');
var ContentMgr = require('dw/content/ContentMgr');

/**
 * Provides a form to locate stores by geographical information.
 */
function find() {
    var form = require('./dw/form');			

    form.clearFormElement(session.forms.storelocator);	
    pageMeta.update(ContentMgr.getContent("store-locator"));
	
    response.renderTemplate('storelocator/storelocator');
    return response;
}

/**
 * The form handler. This form is submitted with GET.
 */
function findStores() {
    var storeLocatorForm = session.forms.storelocator;
	var action = request.triggeredAction;
	if (action != null) {
	    if (action.formId == 'findbycountry') {
	    	if (storeLocatorForm.address.country.value != null && storeLocatorForm.address.country.value != '') {
	    		//@todo replace pipelet with Script API
	    		var searchSystemObjectResult = new dw.system.Pipelet('SearchSystemObject', {
	    		    ObjectType: 'Store',
	    		    SearchExpression: 'countryCode = {1}'
	    		}).execute({
	    		    Search1Value: storeLocatorForm.address.country.value
	    		});
	    		var stores = searchSystemObjectResult.SearchResult;
    		    var storesCount = searchSystemObjectResult.SearchResultCount;
    		    
	    		if (storesCount > 0) {
		    		var templateParameters = { "Stores": stores, "StoresCount": storesCount, "SearchString": storeLocatorForm.address.country.value }; 
	    			response.renderTemplate('storelocator/storelocatorresults', templateParameters);
		    		return response;
	    		}
	    	}
	    } else if (action.formId == 'findbystate') {
	    	var stateCode = storeLocatorForm.address.states.stateUSCA.htmlValue;
		    if (!empty(stateCode)) {
		    	//@todo replace pipelet with Script API
		    	var searchSystemObjectResult = new dw.system.Pipelet('SearchSystemObject', {
			        ObjectType: 'Store',
			        SearchExpression: 'stateCode = {1}'
			    }).execute({
	                Search1Value: storeLocatorForm.address.states.stateUSCA.htmlValue
	            });
	            var stores = searchSystemObjectResult.SearchResult;
	            var storesCount = searchSystemObjectResult.SearchResultCount;
	            

	            if (storesCount > 0) {	       
		    		var templateParameters = {"Stores": stores, "StoresCount" : storesCount, "SearchString": 'State ' + storeLocatorForm.address.states.stateUSCA.htmlValue}; 
	            	response.renderTemplate('storelocator/storelocatorresults', templateParameters );
	                return response;
	            }
		    }	
	    } else if (action.formId == 'findbyzip') {
	    	//@todo replace pipelet with Script API
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

	    	if (storesCount > 0) {
	    		//@todo replace pipelet with Script API
	    		var templateParameters = { "Stores": stores, "StoresCount" : storesCount, "SearchString" : 'Zip ' + storeLocatorForm.postalCode.value};
	    		response.renderTemplate('storelocator/storelocatorresults', templateParameters);
	    		return response;
	    	}
	    }
	} else {
		response.renderTemplate('storelocator/storelocator');
		return response;
	}
}


/**
 * Renders the details of a store.
 */
function details() {
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
exports.Find        = guard.get(find);
exports.FindStores  = guard.get(findStores);
exports.Details     = guard.get(details);

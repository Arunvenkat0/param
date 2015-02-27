/* API Includes */
/** ContentMgr to fetch metadata from asset */
var ContentMgr = require('dw/content').ContentMgr;
/** Resource for loclization print outs */
var Resource = require('dw/web').Resource;
/** StoreMgr to query stores */
var StoreMgr = require('dw/catalog').StoreMgr;
/** SystemObjectMgr to query stores */
var SystemObjectMgr = require('dw/object').SystemObjectMgr;

/* Script Modules */
/** Guard RequestFilter */
var guard = require('./dw/guard');
/** Form Utils */
var form = require('./dw/form');			
/** Central Page Context Container */
var pageMeta = require('~/cartridge/scripts/meta');

/**
 * Provides a form to locate stores by geographical information.
 */
function find() {
    form.clearFormElement(session.forms.storelocator);	
    pageMeta.update(ContentMgr.getContent("store-locator"));
    response.renderTemplate('storelocator/storelocator');
    return response;
}

/**
 * @class 
 * @constructs StoreLocatorResultsParameters
 * Parameters consumed by template storelocator/storelocatorresults
 * 
 * @param {dw.util.Iterator} storesIterator Search result for stores
 * @param {Number} resultsCount Number of found Stores
 * @param {String} searchType Initial search criteria. Supported values are findbyzip, findbystate and findbycountry
 * @param {String} searchKey The value used to find Stores
 * 
 */
function StoreLocatorResultsParameters (storesIterator, searchType, searchKey) {
    /** Search result for stores */
	this.Stores = storesIterator;
    /**  Number of found Stores */
    this.StoresCount = 0;
    
    // determine number of found stores
	if (!empty(storesIterator)) {
		if ('length' in storesIterator) {
			this.StoresCount = storesIterator.length;	
		} else {
			this.StoresCount = storesIterator.getCount();	
		}
	}
    	
    /**  Initial search criteria. Supported values are findbyzip, findbystate and findbycountry */
    this.Type = searchType;
    var searchTerm = searchKey;
    
    // @TODO also have a mapping with state codes 
    if (searchType == 'findbycountry') {
    	searchTerm = Resource.msg('country.codes.' + searchKey,'forms',null)	
    }
    	
    /**  Print out on what has been searched for */
    this.SearchString = Resource.msg('storelocator.storelocatorresults.' + searchType, 'storelocator', null) + ' ' + searchTerm;
}
/**
 * @Namespace
 * Wraps all form-actions executed from storelocator form
 */
var FormActions  = {
	
	/**
	 * Search by country
	 */
	findbycountry : function(storeLocatorForm) {
		var searchKey = storeLocatorForm.address.country.value;
		var stores = SystemObjectMgr.querySystemObjects('Store', 'countryCode = {0}', 'countryCode desc', searchKey);
		return {'stores' : stores, 'searchKey' : searchKey};
	},
	/**
	 * Search by state
	 */
	findbystate : function(storeLocatorForm) {
		var searchKey = storeLocatorForm.address.states.stateUSCA.htmlValue;
		var stores = null;
	    if (!empty(searchKey)) {
    		stores = SystemObjectMgr.querySystemObjects('Store', 'stateCode = {0}', 'stateCode desc', searchKey);
	    }
		return {'stores' : stores, 'searchKey' : searchKey};
	    
	},
	/**
	 * Search by zip
	 */
	findbyzip : function(storeLocatorForm) {
    	var searchKey = storeLocatorForm.postalCode.value;
    	var storesMgrResult = StoreMgr.searchStoresByPostalCode(storeLocatorForm.countryCode.value, searchKey, storeLocatorForm.distanceUnit.value, storeLocatorForm.maxdistance.value);
    	var stores = storesMgrResult.keySet();
		return {'stores' : stores, 'searchKey' : searchKey};
	}
};
	
	
	
/**
 * The form handler. This form is submitted with GET.
 */
function findStores() {
    pageMeta.update(ContentMgr.getContent("store-locator"));
	
    var storeLocatorForm = session.forms.storelocator;
	var action = request.triggeredFormAction;
	
	var searchKey = null;
	var stores = null;
	
	// Check if search was performed
	if (action != null) {
		// dispatching different form actions
		//@see namespace FormActions for implementation of the individual actions
		var searchResults = FormActions[action.formId].apply(FormActions, [storeLocatorForm]);
		searchKey = searchResults.searchKey;
		stores = searchResults.stores;
	} 
	
	if (!empty(stores)) {
		// generate object, with fields to be used inside the template
		var storeLocatorResultsParameters = new StoreLocatorResultsParameters(stores, action.formId, searchKey); 
		response.renderTemplate('storelocator/storelocatorresults', storeLocatorResultsParameters);
	} else { 
		response.renderTemplate('storelocator/storelocator', {'Stores':''});
	}
	return response;
};

/**
 * Renders the details of a store.
 */
function details() {
    var storeID = request.httpParameterMap.StoreID.value;
    var store = dw.catalog.StoreMgr.getStore(storeID);
    pageMeta.update(store);
	
	response.renderTemplate('storelocator/storedetails', {Store: store});
	return response;
}

/*
 * Module exports
 */

/*
 * Exposed web methods
 */
exports.Find        = guard.filter(['get'],find);
exports.FindStores  = guard.filter(['get'],findStores);
exports.Details     = guard.filter(['get'],details);

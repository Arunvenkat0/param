'use strict';

/* API Includes */
var ContentMgr = require('dw/content/ContentMgr');
var StoreMgr = require('dw/catalog/StoreMgr');
var SystemObjectMgr = require('dw/object/SystemObjectMgr');

/* Script Modules */
var guard = require('./dw/guard');
var storeLocatorForm = require('~/cartridge/scripts/object/Form').get('storelocator');			
var pageMeta = require('~/cartridge/scripts/meta');

/**
 * Provides a form to locate stores by geographical information.
 */
function find() {
	storeLocatorForm.clear();	
    pageMeta.update(ContentMgr.getContent("store-locator"));
    response.renderTemplate('storelocator/storelocator');
    return response;
};

/**
 * The form handler. This form is submitted with GET.
 */
function findStores() {
    pageMeta.update(ContentMgr.getContent("store-locator"));
	/* Option A - jQuery Like 
	storeLocatorForm.on('findbycountry', function(storeLocatorForm) {
		var searchKey = storeLocatorForm.address.country.value;
		var stores = SystemObjectMgr.querySystemObjects('Store', 'countryCode = {0}', 'countryCode desc', searchKey);
		return {'stores' : stores, 'searchKey' : searchKey};
	});	
	
	storeLocatorForm.on('findbystate' : function(storeLocatorForm) {
		var searchKey = storeLocatorForm.address.states.stateUSCA.htmlValue;
		var stores = null;
	    if (!empty(searchKey)) {
    		stores = SystemObjectMgr.querySystemObjects('Store', 'stateCode = {0}', 'stateCode desc', searchKey);
	    }
		return {'stores' : stores, 'searchKey' : searchKey};
	});
	
	storeLocatorForm.on('findbyzip' : function(storeLocatorForm) {
    	var searchKey = storeLocatorForm.postalCode.value;
    	var storesMgrResult = StoreMgr.searchStoresByPostalCode(storeLocatorForm.countryCode.value, searchKey, storeLocatorForm.distanceUnit.value, storeLocatorForm.maxdistance.value);
    	var stores = storesMgrResult.keySet();
		return {'stores' : stores, 'searchKey' : searchKey};
	});
	*/

	/*Option B - EXT Like*/
	var searchResult = storeLocatorForm.handleAction({
		'findbycountry' : function(formgroup) {
			var searchKey = formgroup.address.country.value;
			var stores = SystemObjectMgr.querySystemObjects('Store', 'countryCode = {0}', 'countryCode desc', searchKey);
			if (empty(stores)) {
				return null;
			} else {
				return {'stores' : stores, 'searchKey' : searchKey};
			}
		},	
		'findbystate' : function(formgroup) {
			var searchKey = formgroup.address.states.stateUSCA.htmlValue;
			var stores = null;
			
			if (!empty(searchKey)) {
				stores = SystemObjectMgr.querySystemObjects('Store', 'stateCode = {0}', 'stateCode desc', searchKey);
			}
			
			if (empty(stores)) {
				return null;
			} else {
				return {'stores' : stores, 'searchKey' : searchKey};
			}
		},
		'findbyzip' : function(formgroup) {
	    	var searchKey = formgroup.postalCode.value;
	    	var storesMgrResult = StoreMgr.searchStoresByPostalCode(formgroup.countryCode.value, searchKey, formgroup.distanceUnit.value, formgroup.maxdistance.value);
	    	var stores = storesMgrResult.keySet();
	    	if (empty(stores)) {
				return null;
			} else {
				return {'stores' : stores, 'searchKey' : searchKey};
			}
		}
	});		

	/* Option C - Explicite Magic */
	//Get From GIT
	
	if (searchResult) {
		// generate object, with fields to be used inside the template
		var params = require('~/cartridge/scripts/templatebridge/storelocatorresults').generate(searchResult.stores, storeLocatorForm.action, searchResult.searchKey); 
		response.renderTemplate('storelocator/storelocatorresults', params);
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
};

/*
 * Exposed web methods
 */
exports.Find        = guard.filter(['get'],find);
exports.FindStores  = guard.filter(['get'],findStores);
exports.Details     = guard.filter(['get'],details);

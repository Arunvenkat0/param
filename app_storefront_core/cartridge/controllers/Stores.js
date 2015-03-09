'use strict';

/**
 * Renders store finder and store detail pages.
 *
 * @module controller/Stores
 */

/* API Includes */
var StoreMgr = require('dw/catalog/StoreMgr');
var SystemObjectMgr = require('dw/object/SystemObjectMgr');

/* Script Modules */
var guard = require('~/cartridge/scripts/guard');
var storeLocatorAsset = require('~/cartridge/scripts/model/Content').get('store-locator');
var storeLocatorForm = require('~/cartridge/scripts/model/Form').get('storelocator');
var pageMeta = require('~/cartridge/scripts/meta');
var view = require('~/cartridge/scripts/_view');

/**
 * Provides a form to locate stores by geographical information.
 */
function find() {

    storeLocatorForm.clear();
    pageMeta.update(storeLocatorAsset);

    view.get('view/StoreLocatorView')
        .render('storelocator/storelocator');

}

/**
 * The form handler. This form is submitted with GET.
 */
function findStores() {

    pageMeta.update(storeLocatorAsset);

    var searchResult = storeLocatorForm.handleAction({
        'findbycountry' : function(formgroup) {
            var searchKey = formgroup.address.country.value;
            var stores = SystemObjectMgr.querySystemObjects('Store', 'countryCode = {0}', 'countryCode desc', searchKey);
            if (empty(stores)) {
                return null;
            } else {
                return {'stores' : stores, 'searchKey' : searchKey, 'type': 'findbycountry'};
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
                return {'stores' : stores, 'searchKey' : searchKey, 'type': 'findbystate'};
            }
        },
        'findbyzip' : function(formgroup) {
            var searchKey = formgroup.postalCode.value;
            var storesMgrResult = StoreMgr.searchStoresByPostalCode(formgroup.countryCode.value, searchKey, formgroup.distanceUnit.value, formgroup.maxdistance.value);
            var stores = storesMgrResult.keySet();
            if (empty(stores)) {
                return null;
            } else {
                return {'stores' : stores, 'searchKey' : searchKey, 'type': 'findbyzip'};
            }
        }
    });

    if (searchResult) {
        view.get('view/StoreLocatorView',searchResult)
            .render('storelocator/storelocatorresults');
    } else {
        view.get('view/StoreLocatorView')
            .render('storelocator/storelocator');
    }

}

/**
 * Renders the details of a store.
 */
function details() {

    var storeID = request.httpParameterMap.StoreID.value;
    var store = dw.catalog.StoreMgr.getStore(storeID);
    pageMeta.update(store);

    view.get({Store:store})
        .render('storelocator/storedetails');

}

/*
 * Exposed web methods
 */
/* @see module:controller/Stores~find */
exports.Find        = guard.filter(['get'], find);
/* @see module:controller/Stores~findStores */
exports.FindStores  = guard.filter(['get'], findStores);
/* @see module:controller/Stores~details */
exports.Details     = guard.filter(['get'], details);

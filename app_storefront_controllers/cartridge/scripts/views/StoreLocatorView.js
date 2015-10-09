'use strict';
/** @module views/StoreLocatorView */

var Resource = require('dw/web/Resource');
var View = require('./View');

var StoreLocatorView = View.extend(
/** @lends module:views/StoreLocatorView~StoreLocatorView.prototype */
{
    /**
     * Generates the view consumed by template storelocator/storelocatorresults
     *
     * @param {object} params stores (Search result for stores), type (Supported values are findbyzip, findbystate and findbycountry)
     * searchKey (The value used to find Stores) properties are supported
     *
     * @constructs
     * @extends module:views/View~View
     */
    init: function (params) {
        /** backward compatibility to URLUtils.continueURL() methods in old templates **/
        this.ContinueURL = dw.web.URLUtils.abs('Stores-FindStores');

        /** Search result for stores */
        this.Stores = params.stores || [];
        /**  Number of found Stores */
        this.StoresCount = 0;

        if(params && params.type){
            /** variables consumed by template storelocator/storelocatorresults */

            // determine number of found stores
            if (!empty(params.stores)) {
                if ('length' in params.stores) {
                    this.StoresCount = params.stores.length;
                } else {
                    this.StoresCount = params.stores.getCount();
                }
            }

            /**  Initial search criteria. Supported values are findbyzip, findbystate and findbycountry */
            this.Type = params.type;
            var searchTerm = params.searchKey;

            // @TODO also have a mapping with state codes
            if (params.type === 'findbycountry') {
                searchTerm = Resource.msg('country.codes.' + params.searchKey,'forms',null);
            }

            /**  Print out on what has been searched for */
            this.SearchString = Resource.msgf('storelocator.storelocatorresults.' + params.type, 'storelocator', null, searchTerm);
        }

        return this;
    }
});

module.exports = StoreLocatorView;

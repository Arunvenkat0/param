'use strict';

/** @module views/CustomerServiceView */
var View = require('./View');

/* API Includes */
var ContentMgr = require('dw/content/ContentMgr');
var LinkedHashMap = require('dw/util/LinkedHashMap');

var CustomerServiceView = View.extend(
/** @lends module:views/CustomerServiceView~CustomerServiceView.prototype */
{

    /**
     * Determines the customer navigation from the folder structure in the content library. Returns the list of
     * customer service folders. The root folder for customer service content is the folder having the ID
     * 'customer-service'.
     *
     * @returns {LinkedHashMap} List of customer service folders.
     */
    getCustomerServiceLinks: function () {
        // get the customer service folder
        var content = ContentMgr.getFolder('customer-service');

        if (content) {
            var customerServiceLinks = new LinkedHashMap();

            var customerServiceFolders = content.getOnlineSubFolders();

            for (var i = 0; i < customerServiceFolders.size(); i++) {
                var folder = customerServiceFolders[i];

                // get the content assets for the folder
                var onlineContent = folder.getOnlineContent();
                //TODO : look at logic of this line - original line -> onlineContent && customerServiceLinks.put(folder.getDisplayName(), onlineContent);
                customerServiceLinks.put(folder.getDisplayName(), onlineContent);
            }

            // output the target address
            return customerServiceLinks;
        }
    },

    /**
     * @constructs
     * @extends module:views/View~View
     */
    init: function (params) {
        this._super(params);
        this.CustomerServiceLinks = this.getCustomerServiceLinks();
        this.ContinueURL = dw.web.URLUtils.https('CustomerService-Submit');

        return this;
    }

});

module.exports = CustomerServiceView;

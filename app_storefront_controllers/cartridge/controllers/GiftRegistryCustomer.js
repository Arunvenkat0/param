'use strict';
/**
 * Controller that renders a public gift registry, which can be accessed by people other than the owner.
 *
 * @module controllers/GiftRegistryCustomer
 * @todo  Requires cleanup
 */

/* API Includes */
var URLUtils = require('dw/web/URLUtils');

/* Script Modules */
var app = require('~/cartridge/scripts/app');
var guard = require('~/cartridge/scripts/guard');

/**
 * Updates the giftregistry form and renders the product list template.
 *
 * Clears the giftregistry form and gets the product list using the ProductListID from the httpParameterMap.
 * If the product list is public, it copies item and event information to the gift registry form from the product list.
 * If the product list is private, sets the system status to ERROR.

 * @FIXME Why does this not use a view to render the template.
 */
function Show() {
    var Status = require('dw/system/Status');
    var ProductListMgr = require('dw/customer/ProductListMgr');

    var registryForm = app.getForm('giftregistry');
    var productList;
    var productListID = request.httpParameterMap.ID.stringValue;
    var productListStatus;

    registryForm.clearFormElement();

    if (productListID) {

        productList = ProductListMgr.getProductList(productListID);

        if (!productList) {
            productListStatus = new Status(Status.ERROR, 'notfound');
        } else {

            if (productList.public) {
                registryForm.get('items').copyFrom(productList.publicItems);
                registryForm.get('event').copyFrom(productList);
            }  else {
                productListStatus = new Status(Status.ERROR, 'private');
                productList = null;
            }
        }

    } else {
        productListStatus = new Status(Status.ERROR, 'notfound');
    }

    app.getView({
        Status: productListStatus,
        ProductList: productList,
        ContinueURL: URLUtils.https('GiftRegistry-SubmitForm')
    }).render('account/giftregistry/registrycustomer');

}
/**
 * Gift registry customer event handler. Handles the last triggered action based in the formId.
 *
 * If the formId is:
 * - __purchaseGiftCertificate__ - calls the {@link module:controllers/GiftRegistryCustomer~PurchaseGiftCertificate|PurchaseGiftCertificates} function
 * to add a new gift certificate to the basket.
 * - __search__ - calls the {@link module:controllers/GiftRegistry~search|GiftRegistry controller search function} to render the gift registry search page.
 */
// TODO fix form in template? Use gift cert functionality instead of this?
function ShowInteraction() {
    var TriggeredAction = request.triggeredFormAction;
    if (TriggeredAction !== null) {
        if (TriggeredAction.formId === 'purchaseGiftCertificate') {

            new PurchaseGiftCertificate();
            return;
        } else if (TriggeredAction.formId === 'search') {
            var GiftRegistryController = require('./GiftRegistry');
            GiftRegistryController.Search();
            return;
        }
    }

    // TODO no default action?
}


/**
 * Provides action to add a gift certificate to the basket. As shipping address the address of the gift registry owner is used.
 */
function PurchaseGiftCertificate() {
    var CartController = require('./Cart');
    var GetBasketResult = CartController.GetBasket();


    //TODO : Variable assignment
    var ProductList;
    if (!GetBasketResult.error) {
        var Basket = GetBasketResult.Basket;

        // TODO this can't be right, PLI is not passed if this method is called from the web?
        require('./ProductList');
        ProductList.EnsureShipment({
            Basket: Basket
        });
    }

    var GiftCertController = require('./GiftCert');
    GiftCertController.Purchase();
}


/*
 * Module exports
 */

/*
 * Web exposed methods
 */
exports.Show = guard.ensure(['get', 'https'], Show);
exports.ShowInteraction = guard.ensure(['post', 'https'], ShowInteraction);

/*
 * Local methods
 */
exports.PurchaseGiftCertificate = guard.ensure(['post', 'https'], PurchaseGiftCertificate);

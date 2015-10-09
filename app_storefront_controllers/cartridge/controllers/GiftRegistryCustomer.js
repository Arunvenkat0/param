'use strict';
/**
 * This controller renders a public gift registry, which can be accessed by people other than the owner.
 *
 * @module controllers/GiftRegistryCustomer
 * @todo  Requires cleanup
 */

/* API Includes */
var ISML = require('dw/template/ISML');
var Pipelet = require('dw/system/Pipelet');

/* Script Modules */
var g = require('~/cartridges/scripts/guard');
/**
 * TODO
 */
function Show() {
    var CurrentHttpParameterMap = request.httpParameterMap;
    var CurrentForms = session.forms;

    CurrentForms.giftregistry.clearFormElement();


    var ProductListID = CurrentHttpParameterMap.ID.stringValue;

    var ProductList = null;
    var Status = null;

    if (typeof(ProductListID) !== 'undefined' && ProductListID !== null) {
        var GetProductListResult = new Pipelet('GetProductList', {
            Create: false
        }).execute({
            ProductListID: ProductListID
        });
        if (GetProductListResult.result === PIPELET_ERROR) {
            Status = new dw.system.Status(dw.system.Status.ERROR, 'notfound');
        } else {
            ProductList = GetProductListResult.ProductList;

            if (ProductList.public) {
                CurrentForms.giftregistry.items.copyFrom(ProductList.publicItems);
                CurrentForms.giftregistry.event.copyFrom(ProductList);
            } else {
                Status = new dw.system.Status(dw.system.Status.ERROR, 'private');
                ProductList = null;
            }
        }
    } else {
        Status = new dw.system.Status(dw.system.Status.ERROR, 'notfound');
    }


    ISML.renderTemplate('', {
        ProductList: ProductList,
        Status: Status
    });
}
/**
 * TODO
 */
// TODO fix form in template?
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
    var EnsureShipmentResult;
    var ProductList;
    var ProductListController;
    if (!GetBasketResult.error) {
        var Basket = GetBasketResult.Basket;

        // TODO this can't be right, PLI is not passed if this method is called from the web?
        ProductListController = require('./ProductList');
        EnsureShipmentResult = ProductList.EnsureShipment({
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
exports.Show                    = g.httpsGet(Show);
exports.ShowInteraction         = g.httpsPost(ShowInteraction);

/*
 * Local methods
 */
exports.PurchaseGiftCertificate = PurchaseGiftCertificate;

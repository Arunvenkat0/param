'use strict';

/** @module controllers/SendToFriend */

/* API Includes */
var ISML = require('dw/template/ISML');

/* Script Modules */
var guard = require('~/cartridge/scripts/guard');

/**
 * SendToFriend allows the use of dialog to gather email info to send to a
 * friend. A template that uses this dialog can set some of the values ahead of
 * time. Please look at wishlist.isml or registry.isml
 */
function Start() {
    // TODO when embedded in a product page without https, the feature does not work
    // because the customer is not known and anonymous
    // seems to be cause by JavaScript dialogs which do not sent HTTP cookies correctly

    var CurrentHttpParameterMap = request.httpParameterMap;
    var sendToFriendForm = session.forms.sendtofriend;

    session.forms.sendtofriend.clearFormElement();

    var Product = null;
    var ProductOptionModel = null;

    if (CurrentHttpParameterMap.pid.stringValue) {
        Product = dw.catalog.ProductMgr.getProduct(CurrentHttpParameterMap.pid);

        var UpdateProductOptionSelectionsResult = new dw.system.Pipelet('UpdateProductOptionSelections').execute({
            Product: Product
        });
        ProductOptionModel = UpdateProductOptionSelectionsResult.ProductOptionModel;
    }

    // TODO not needed by template?
    /*
     * var ProductList = null;
     *
     * if (CurrentHttpParameterMap.plid.stringValue) { var GetProductListResult =
     * new dw.system.Pipelet('GetProductList', { Create : false }).execute({
     * ProductListID : CurrentHttpParameterMap.plid.value }); ProductList =
     * GetProductListResult.ProductList; }
     */

    if (customer.authenticated) {
        sendToFriendForm.yourname.htmlValue = customer.profile.firstName + ' ' + customer.profile.lastName;
    }

    ISML.renderTemplate('account/components/sendtofrienddialog', {
        ViewMode: 'Edit',
        Product: Product,
        ProductOptionModel: ProductOptionModel,
        ContinueURL: dw.web.URLUtils.https('SendToFriend-SendToFriendForm')
    });
}

/**
 * The form handler.
 */
function SendToFriendForm() {
    // TODO this should end in some redirect
    // but sometimes this is called with GET and not with POST
    var TriggeredAction = request.triggeredFormAction;
    if (TriggeredAction !== null) {
        if (TriggeredAction.formId === 'edit') {
            ISML.renderTemplate('account/components/sendtofrienddialog', {
                ViewMode: 'Edit',
                ContinueURL: dw.web.URLUtils.https('SendToFriend-SendToFriendForm')
            });
            return;
        } else if (TriggeredAction.formId === 'preview') {
            var pid = request.httpParameterMap.pid;

            var sendToFriendForm = session.forms.sendtofriend;

            if (sendToFriendForm.friendsemail.value !== sendToFriendForm.confirmfriendsemail.value) {
                sendToFriendForm.confirmfriendsemail.invalidateFormElement();
            }

            var Product = null;
            var ProductOptionModel = null;

            if (typeof (pid) !== 'undefined' && pid !== null) {
                var GetProductResult = getProduct(pid);
                Product = GetProductResult.Product;
                ProductOptionModel = GetProductResult.ProductOptionModel;
            }

            ISML.renderTemplate('account/components/sendtofrienddialog', {
                ViewMode: 'preview',
                Product: Product,
                ProductOptionModel: ProductOptionModel,
                ContinueURL: dw.web.URLUtils.https('SendToFriend-SendToFriendForm')
            });
            return;
        } else if (TriggeredAction.formId === 'send') {
            send();
            return;
        }
    }

    // TODO what is this?
    /*
     if (session.forms.sendtofriend.valid)
     {
     send();
     return;
     }
     */

    // TODO view mode?
    ISML.renderTemplate('account/components/sendtofrienddialog', {
        ContinueURL: dw.web.URLUtils.https('SendToFriend-SendToFriendForm')
    });
}

function send() {
    var CurrentHttpParameterMap = request.httpParameterMap;
    var pid = request.httpParameterMap.pid;
    var ProductList;//TODO : variable assignment

    var sendToFriendForm = session.forms.sendtofriend;

    if (sendToFriendForm.friendsemail.value !== sendToFriendForm.confirmfriendsemail.value) {
        sendToFriendForm.confirmfriendsemail.invalidateFormElement();

        // TODO view mode?
        ISML.renderTemplate('account/components/sendtofrienddialog', {
            ContinueURL: dw.web.URLUtils.https('SendToFriend-SendToFriendForm')
        });
        return;
    }

    /*
     * Product List Email
     */
    // TODO where should this come from? plid?
    if (typeof (ProductList) !== 'undefined' && ProductList !== null) {
        require('~/cartridge/scripts/models/EmailModel').get('mail/productlist', sendToFriendForm.friendsemail.value)
            .setSubject(sendToFriendForm.subject.value)
            .setFrom(customer.profile.email).send();


        if (empty(CurrentHttpParameterMap.format.stringValue)) {
            if (empty(ProductList.eventCity)) {
                var WishlistController = require('./Wishlist');
                WishlistController.Show();
                return;
            } else {
                var GiftRegistryController = require('./GiftRegistry');
                GiftRegistryController.ShowRegistry();
                return;
            }
        } else {
            ISML.renderTemplate('account/components/sendtofrienddialogsuccess', {
                ViewMode: 'edit'
            });
            return;
        }
    }

    /*
     * Product Email
     */
    if (typeof (pid) !== 'undefined' && pid !== null) {

        require('~/cartridge/scripts/models/EmailModel').get('mail/product', sendToFriendForm.friendsemail.value)
            .setSubject(sendToFriendForm.subject.value)
            .setFrom(customer.profile.email).send();

        if (empty(CurrentHttpParameterMap.format.stringValue)) {
            var ProductController = require('./Product');
            ProductController.Show();
            return;
        }
    } else {
        /*
         * Default
         */
        require('~/cartridge/scripts/models/EmailModel').get('mail/productlistdefault', sendToFriendForm.friendsemail.value)
            .setSubject(sendToFriendForm.subject.value)
            .setFrom(customer.profile.email).send();

    }

    ISML.renderTemplate('account/components/sendtofrienddialogsuccess', {
        ViewMode: 'edit'
    });
}

/**
 * Get a product and any product options that have been selected.
 */
function getProduct(pid) {
    var GetProductResult = new dw.system.Pipelet('GetProduct').execute({
        ProductID: pid.stringValue
    });
    if (GetProductResult.result === PIPELET_ERROR) {
        return {
            error: true
        };
    }
    var Product = GetProductResult.Product;

    var UpdateProductOptionSelectionsResult = new dw.system.Pipelet('UpdateProductOptionSelections').execute({
        Product: Product
    });
    var ProductOptionModel = UpdateProductOptionSelectionsResult.ProductOptionModel;

    return {
        Product: Product,
        ProductOptionModel: ProductOptionModel
    };
}

/**
 * This pipeline is used to ensure that storefront users using the send to a
 * friend feature are logged in
 */
function Login() {
    var accountController = require('./Account');
    accountController.requireLogin({
        TargetAction: 'SendToFriend-Start',
        TargetParameters: ['pid', request.httpParameterMap.pid.stringValue]
    });
}

/*
 * Module exports
 */

/*
 * Web exposed methods
 */
/** @see module:controllers/SendToFriend~Start */
exports.Start = guard.ensure(['https', 'get'], Start);
/** @see module:controllers/SendToFriend~SendToFriendForm */
exports.SendToFriendForm = guard.ensure(['https'], SendToFriendForm);
/** @see module:controllers/SendToFriend~Login */
exports.Login = guard.ensure(['https'], Login);
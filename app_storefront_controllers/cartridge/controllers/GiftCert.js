'use strict';

/**
 * This controller implements gift certificate purchase business logic.
 *
 * @module controllers/GiftCert
 */

/* API Includes */
var GiftCertificateMgr = require('dw/order/GiftCertificateMgr');
var HashMap = require('dw/util/HashMap');
var Money = require('dw/value/Money');
var Pipelet = require('dw/system/Pipelet');
var Resource = require('dw/web/Resource');
var StringUtils = require('dw/util/StringUtils');
var Transaction = require('dw/system/Transaction');
var URLUtils = require('dw/web/URLUtils');

/* Script Modules */
var app = require('~/cartridge/scripts/app');
var guard = require('~/cartridge/scripts/guard');

var Cart = app.getModel('Cart');
var ProductList = app.getModel('ProductList');

/**
 * Renders the page to purchase a gift certificate.
 */
function purchase() {
    app.getForm('giftcert').clear();

    showPurchase();
}

/**
 * Internal helper which prepares and shows the purchase page without clearing the form
 */
function showPurchase() {
    var parameterMap = request.httpParameterMap;
    var purchaseForm = app.getForm('giftcert.purchase');


    if (parameterMap.from.stringValue || parameterMap.recipient.stringValue) {
        purchaseForm.setValue('from', parameterMap.from.stringValue);
        purchaseForm.setValue('recipient', parameterMap.recipient.stringValue);
    }


    if (customer.registered) {
        purchaseForm.setValue('from', customer.profile.firstName + ' ' + customer.profile.lastName);
    }


    if (!parameterMap.plid.empty) {
        var productList = ProductList.get(parameterMap.plid.value).object;
        if (productList) {
            purchaseForm.setValue('recipient', productList.owner.profile.firstName + ' ' +
                productList.owner.profile.lastName);
            purchaseForm.setValue('recipientEmail', productList.owner.profile.email);
            purchaseForm.setValue('confirmRecipientEmail', productList.owner.profile.email);
            purchaseForm.setValue('lineItemId', parameterMap.itemid.stringValue);
        }
    }

    app.getView({
        bctext1: 'gc',
        bcurl1: null,
        ContinueURL: URLUtils.https('GiftCert-AddToBasket')
    }).render('checkout/giftcert/giftcertpurchase');
}

/**
 * Internal helper to show errors on the purchase page
 * @param  {Object} args
 * @param  {dw.util.Map} args.FormErrors
 * @param  {String} args.GeneralError
 */
function showError(args) {
    if (request.httpParameterMap.format.stringValue === 'ajax') {
        app.getView({
            GeneralError: args.GeneralError,
            FormErrors: args.FormErrors || new HashMap()
        }).render('checkout/giftcert/giftcertaddtobasketjson');
        return;
    }

    showPurchase();
}


/**
 * Assigns values from the gift certificate line item to the giftcert.purchase form
 * and renders an updated version of the giftcertepurchase template.
 * Parameters - GiftCertificateLineItemID: UUID of line item for gift
 * certificate to edit in basket.
 */
function edit() {
    var cart = Cart.get();
    if (!cart) {
        purchase();
        return;
    }
    var giftCertificateLineItem = cart.getGiftCertificateLineItemByUUID(request.httpParameterMap.GiftCertificateLineItemID.value);
    if (!giftCertificateLineItem) {
        purchase();
        return;
    }

    var giftcertForm = app.getForm('giftcert');
    giftcertForm.clear();

    var purchaseForm = app.getForm('giftcert.purchase');
    purchaseForm.setValue('lineItemId', giftCertificateLineItem.UUID);
    purchaseForm.setValue('from', giftCertificateLineItem.senderName);
    purchaseForm.setValue('recipient', giftCertificateLineItem.recipientName);
    purchaseForm.setValue('recipientEmail', giftCertificateLineItem.recipientEmail);
    purchaseForm.setValue('confirmRecipientEmail', giftCertificateLineItem.recipientEmail);
    purchaseForm.setValue('message', giftCertificateLineItem.message);
    purchaseForm.setValue('amount', giftCertificateLineItem.price.value);

    app.getView({
        GiftCertificateLineItem: giftCertificateLineItem,
        ContinueURL: URLUtils.https('GiftCert-Update')
    }).render('checkout/giftcert/giftcertpurchase');
}


/**
 * Returns the details of a gift certificate as JSON in order to check the
 * current balance.
 */
function checkBalance() {
    var params = request.httpParameterMap;


    var giftCertificate = null;

    var giftCertID = params.giftCertID.stringValue || params.dwfrm_giftcert_balance_giftCertID.stringValue;
    if (giftCertID) {
        giftCertificate = GiftCertificateMgr.getGiftCertificateByCode(giftCertID);
    }

    let r = require('~/cartridge/scripts/util/Response');

    if (!empty(giftCertificate) && giftCertificate.enabled) {
        r.renderJSON({
            giftCertificate: {
                ID: giftCertID,
                balance: StringUtils.formatMoney(giftCertificate.balance)
            }
        });
    } else {
        r.renderJSON({
            error: Resource.msg('billing.giftcertinvalid', 'checkout', null)
        });
    }
}


/**
 * Adds a gift certificate to the basket.
 * Parameters - post of giftcert.purchase
 */
function addToBasket() {
    processAddToBasket(createGiftCert);
}

/**
 * Updates the gift certificate in the basket.
 * Parameters - post of giftcert.purchase
 */
function update() {
    processAddToBasket(updateGiftCert);
}

/**
 * Internal helper which creates/updates the GiftCert
 * @param  {function} action The gift certificate action to execute.
 */
function processAddToBasket(action) {
    var purchaseForm = app.getForm('giftcert.purchase');

    // Validates confirmation of email address.
    var recipientEmailForm = purchaseForm.get('recipientEmail');
    var confirmRecipientEmailForm = purchaseForm.get('confirmRecipientEmail');

    // TODO: May be cause of RAP-4222
    var form;

    if (recipientEmailForm.valid() && confirmRecipientEmailForm.valid() && (recipientEmailForm.value() !== confirmRecipientEmailForm.value)) {
        confirmRecipientEmailForm.invalidate('giftcert.confirmrecipientemailvalueerror');
    }

    // Validates amount in range.
    var amountForm = purchaseForm.get('amount');
    if (amountForm.valid() && ((amountForm.value() < 5) || (amountForm.value() > 5000))) {
        amountForm.invalidate('giftcert.amountvalueerror');
    }

    // Extracts any error messages from validation.
    var formErrors = new HashMap();
    for (var i = 0; i < purchaseForm.object.getChildCount(); i++) {
        var field = form[i];
        if (!field.isValid()) {
            formErrors.put(field.getHtmlName(), Resource.msg(field.getError(), 'forms', null));
        }
    }

    if (!formErrors.isEmpty()) {
        showError({
            FormErrors: formErrors
        });
        return;
    }

    var cart = Cart.goc();
    if (!cart) {
        showError({
            GeneralError: Resource.msg('checkout.giftcert.error.internal', 'checkout', null)
        });
        return;
    }

    var giftCertificateLineItem = action(cart);

    if (!giftCertificateLineItem) {
        showError({
            GeneralError: Resource.msg('checkout.giftcert.error.internal', 'checkout', null)
        });
        return;
    }

    Transaction.wrap(function () {
        cart.calculate();
    });

    if (request.httpParameterMap.format.stringValue === 'ajax') {
        app.getView({
            FormErrors: formErrors,
            GiftCertificateLineItem: giftCertificateLineItem
        }).render('checkout/giftcert/giftcertaddtobasketjson');
        return;
    }

    response.redirect(URLUtils.https('Cart-Show'));
}

/**
 * Shows the minicart
 *
 * @param {Object} args
 * @param {String} args.lineItemId The OD of the Gift Certificate lineitem
 * @TODO Check why normal minicart cannot be used
 */
function showMiniCart() {
    var cart = Cart.get();
    if (!cart) {
        return;
    }
    var giftCertificateLineItem = cart.getGiftCertificateLineItemByUUID(request.httpParameterMap.lineItemId.value);
    if (!giftCertificateLineItem) {
        return;
    }
    app.getView({
        Basket: cart.object,
        GiftCertificateLineItem: giftCertificateLineItem
    }).render('checkout/cart/minicart');
}

/**
 * Creates a gift certificate in the customer basket using form input values.
 * The form must be valid before calling this pipeline.
 *
 * @param {module:models/CartModel~CartModel} cart the current cart
 */
function createGiftCert(cart) {
    var purchaseForm = app.getForm('giftcert.purchase');

    var plid = request.httpParameterMap.plid.stringValue;

    var productListItem = null;

    if (plid) {
        var productList = ProductList.get(plid).object;
        if (productList) {
            productListItem = productList.getItem(purchaseForm.get('lineItemId').value());
        }
    }

    // @TODO Replace pipelet once API is available
    // Transaction.wrap(function () {
    //     basket.createGiftCertificateLineItem();
    // });

    var AddGiftCertificateToBasketResult = new Pipelet('AddGiftCertificateToBasket').execute({
        Amount: purchaseForm.get('amount').value(),
        Basket: cart.object,
        RecipientEmail: purchaseForm.get('recipientEmail').value(),
        RecipientName: purchaseForm.get('recipient').value(),
        SenderName: purchaseForm.get('from').value(),
        Message: purchaseForm.get('message').value(),
        ProductListItem: productListItem,
        // TODO originally Shipment : Shipment, but where should this come from?
        Shipment: null
    });
    if (AddGiftCertificateToBasketResult.result === PIPELET_ERROR) {
        return null;
    }
    var giftCertificateLineItem = AddGiftCertificateToBasketResult.GiftCertificateLineItem;

    return giftCertificateLineItem;
}


/**
 * Updates a gift certificate in the customer basket using form input values.
 * The form must be valid before calling this pipeline.
 *
 * @param {module:models/CartModel~CartModel} cart the current cart
 */
function updateGiftCert(cart) {
    var purchaseForm = app.getForm('giftcert.purchase');

    var giftCertificateLineItem = cart.getGiftCertificateLineItemByUUID(purchaseForm.get('lineItemId').value());
    if (!giftCertificateLineItem) {
        return null;
    }

    Transaction.begin();

        giftCertificateLineItem.senderName = purchaseForm.get('from').value();
        giftCertificateLineItem.recipientName = purchaseForm.get('recipient').value();
        giftCertificateLineItem.recipientEmail = purchaseForm.get('recipientEmail').value();
        giftCertificateLineItem.message = purchaseForm.get('message').value();

        var amount = purchaseForm.get('amount').value();
        giftCertificateLineItem.basePrice = new Money(amount, giftCertificateLineItem.basePrice.currencyCode);
        giftCertificateLineItem.grossPrice = new Money(amount, giftCertificateLineItem.grossPrice.currencyCode);
        giftCertificateLineItem.netPrice = new Money(amount, giftCertificateLineItem.netPrice.currencyCode);

    Transaction.commit();

    return giftCertificateLineItem;
}

/*
 * Web exposed methods
 */
/** @see module:controllers/GiftCert~purchase */
exports.Purchase        = guard.ensure(['https','get'],purchase);
/** @see module:controllers/GiftCert~edit */
exports.Edit            = guard.ensure(['https','get'],edit);
/** @see module:controllers/GiftCert~checkBalance */
exports.CheckBalance    = guard.ensure(['https','post'],checkBalance);
/** @see module:controllers/GiftCert~addToBasket */
exports.AddToBasket     = guard.ensure(['https','post'],addToBasket);
/** @see module:controllers/GiftCert~update */
exports.Update          = guard.ensure(['https','post'],update);
/** @see module:controllers/GiftCert~showMiniCart */
exports.ShowMiniCart    = guard.ensure(['https','get'],showMiniCart);

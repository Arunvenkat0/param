'use strict';

/**
 * This controller displays credit card and other payment information and
 * lets the user change it.
 *
 * @module controllers/PaymentInstruments
 */

/* API includes */
var Transaction = require('dw/system/Transaction');
var URLUtils = require('dw/web/URLUtils');

/* Script Modules */
var app = require('~/cartridge/scripts/app');
var guard = require('~/cartridge/scripts/guard');


/**
 * Renders a list of the saved credit card payment instruments of the current
 * customer.
 */
function list() {
    var wallet = customer.getProfile().getWallet();
    var paymentInstruments = wallet.getPaymentInstruments(dw.order.PaymentInstrument.METHOD_CREDIT_CARD);
    var pageMeta = require('~/cartridge/scripts/meta');
    var paymentForm = app.getForm('paymentinstruments');

    paymentForm.clear();
    paymentForm.get('creditcards.storedcards').copyFrom(paymentInstruments);

    pageMeta.update(dw.content.ContentMgr.getContent('myaccount-paymentsettings'));

    app.getView({
        PaymentInstruments: paymentInstruments
    }).render('account/payment/paymentinstrumentlist');
}


/**
 * Provides functionality to add a new credit card payment instrument to the
 * saved payment instruments of the current customer.
 *
 * @param {boolean} clearForm true or missing clears the form before displaying the page, false skips it
 */
function add(clearForm) {
    var paymentForm = app.getForm('paymentinstruments');

    if (clearForm !== false) {
        paymentForm.clear();
    }
    paymentForm.get('creditcards.newcreditcard.type').setOptions(dw.order.PaymentMgr
        .getPaymentMethod(dw.order.PaymentInstrument.METHOD_CREDIT_CARD).activePaymentCards.iterator());

    app.getView({
        ContinueURL: URLUtils.https('PaymentInstruments-PaymentForm')
    }).render('account/payment/paymentinstrumentdetails');
}

/**
 * Handles the submitted form for creating payment instruments.
 */
function handlePaymentForm() {
    var paymentForm = app.getForm('paymentinstruments');
    paymentForm.handleAction({
        create: function () {
            if (!create()) {
                add(false);
                return;
            } else {
                response.redirect(URLUtils.https('PaymentInstruments-List'));
            }
        },
        error: function() {
            add(false);
        }
    });
}

function save(params) {
    var saveCustomerCreditCard = require('app_storefront_core/cartridge/scripts/checkout/SaveCustomerCreditCard');
    var result = saveCustomerCreditCard.save(params);
    if (result === PIPELET_ERROR) {
        throw new Error('Problem saving credit card');
    }
}

/**
 * Creates a new payment instrument
 * @return {boolean} True in case of success, false otherwise
 */
function create() {
    if (!verifyCreditCard()) {
        return false;
    }

    var paymentForm = app.getForm('paymentinstruments');
    var newCreditCardForm = paymentForm.get('creditcards.newcreditcard');
    var ccNumber = newCreditCardForm.get('number').value();

    var wallet = customer.getProfile().getWallet();
    var paymentInstruments = wallet.getPaymentInstruments(dw.order.PaymentInstrument.METHOD_CREDIT_CARD);

    var isDuplicateCard = false;
    var oldCard;

    for (var i = 0; i < paymentInstruments.length; i++) {
        var card = paymentInstruments[i];
        if (card.creditCardNumber === ccNumber) {
            isDuplicateCard = true;
            oldCard = card;
            break;
        }
    }

    Transaction.begin();
        var paymentInstrument = wallet.createPaymentInstrument(dw.order.PaymentInstrument.METHOD_CREDIT_CARD);
        var result;

        try {
            save({
                PaymentInstrument: paymentInstrument,
                CreditCardFormFields: newCreditCardForm.object
            });
        } catch (err) {
            Transaction.rollback();
            return false;
        }

        if (isDuplicateCard) {
            wallet.removePaymentInstrument(oldCard);
        }
    Transaction.commit();

    paymentForm.clear();

    return true;
}


/**
 * Deletes a saved credit card payment instrument.
 *
 * @TODO Should be moved into handlePaymentForm
 */
function Delete() {
    var paymentForm = app.getForm('paymentinstruments');
    paymentForm.handleAction({
        remove: function(formGroup, action){
            Transaction.wrap(function(){
                var wallet = customer.getProfile().getWallet();
                wallet.removePaymentInstrument(action.object);
            });

        },
        error: function(){
            // @TODO When could this happen
        }
    });

    response.redirect(URLUtils.https('PaymentInstruments-List'));
}


/*
 * Private helpers
 */

/**
 * Verifies if the entered credit card details are valid.
 *
 * @returns {boolean} true in case of success, otherwise false.
 */
function verifyCreditCard() {
    var newCreditCardForm = app.getForm('paymentinstruments.creditcards.newcreditcard');
    var VerifyPaymentCardResult = new dw.system.Pipelet('VerifyPaymentCard', {
        VerifySecurityCode: false
    }).execute({
        PaymentCard: dw.order.PaymentMgr.getPaymentCard(newCreditCardForm.get('type').value()),
        CardNumber: newCreditCardForm.get('number').value(),
        ExpirationMonth: newCreditCardForm.get('expiration.month').value(),
        ExpirationYear: newCreditCardForm.get('expiration.year').value(),
        CardSecurityCode: newCreditCardForm.get('cvn').value()
    });
    if (VerifyPaymentCardResult.result === PIPELET_ERROR) {
        var status = VerifyPaymentCardResult.Status;

        // Verify existence of a status object and a valid credit card form.
        if (!status || !newCreditCardForm.valid()) {
            return false;
        }

        //If status is OK, return true.
        if (status.status === dw.system.Status.OK) {
            return true;
        }

        // Invalidate the payment card form elements.
        var items = status.items.iterator();
        while (items.hasNext()) {
            var item = items.next();

            switch( item.code ) {
                case dw.order.PaymentStatusCodes.CREDITCARD_INVALID_CARD_NUMBER:
                    newCreditCardForm.get('number').invalidate();
                    continue;

                case dw.order.PaymentStatusCodes.CREDITCARD_INVALID_EXPIRATION_DATE:
                    newCreditCardForm.get('expiration.month').invalidate();
                    newCreditCardForm.get('expiration.year').invalidate();
                    continue;

                case dw.order.PaymentStatusCodes.CREDITCARD_INVALID_SECURITY_CODE:
                    newCreditCardForm.get('cvn').invalidate();
            }
        }
        return false;
    }

    return true;
}

/*
 * Web exposed methods
 */
/** @see module:controllers/PaymentInstruments~list */
exports.List = guard.ensure(['https', 'get', 'loggedIn'], list);
/** @see module:controllers/PaymentInstruments~add */
exports.Add = guard.ensure(['https', 'get', 'loggedIn'], add);
/** @see module:controllers/PaymentInstruments~handlePaymentForm */
exports.PaymentForm = guard.ensure(['https', 'post', 'loggedIn'], handlePaymentForm);
/** @see module:controllers/PaymentInstruments~Delete */
exports.Delete = guard.ensure(['https', 'loggedIn'], Delete);

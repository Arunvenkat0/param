'use strict';

/* API Includes */
var PaymentMgr = require('dw/order/PaymentMgr');
var Transaction = require('dw/system/Transaction');

/**
 * Verifies a credit card against a valid card number and expiration date and possibly invalidates invalid form fields.
 * If the verification was successful a credit card payment instrument is created.
 */
function Handle(args) {
    var cart = Cart.get(args.Basket);

    var VerifyPaymentCardResult = new dw.system.Pipelet('VerifyPaymentCard', {
        VerifySecurityCode : true
    }).execute({
            PaymentCard      : PaymentMgr.getPaymentCard(session.forms.billing.paymentMethods.creditCard.type.value),
            CardNumber       : session.forms.billing.paymentMethods.creditCard.number.value,
            ExpirationMonth  : session.forms.billing.paymentMethods.creditCard.month.value,
            ExpirationYear   : session.forms.billing.paymentMethods.creditCard.year.value,
            CardSecurityCode : session.forms.billing.paymentMethods.creditCard.cvn.value
        });

    if (VerifyPaymentCardResult.result === PIPELET_ERROR) {
        // TODO is this also return in case of error?
        var CreditCardStatus = VerifyPaymentCardResult.Status;

        new dw.system.Pipelet('Script', {
            Transactional : false,
            OnError       : 'PIPELET_ERROR',
            ScriptFile    : 'checkout/InvalidatePaymentCardFormElements.ds'
        }).execute({
                CreditCardForm : session.forms.billing.paymentMethods.creditCard,
                Status         : CreditCardStatus
            });

        return {
            error : true
        };
    }

    Transaction.wrap(function () {
        cart.removeExistingPaymentInstruments(dw.order.PaymentInstrument.METHOD_CREDIT_CARD);
        var paymentInstrument = cart.createPaymentInstrument(dw.order.PaymentInstrument.METHOD_CREDIT_CARD, cart.getNonGiftCertificateAmount());

        paymentInstrument.creditCardHolder = session.forms.billing.paymentMethods.creditCard.owner.value;
        paymentInstrument.creditCardNumber = session.forms.billing.paymentMethods.creditCard.number.value;
        paymentInstrument.creditCardType = session.forms.billing.paymentMethods.creditCard.type.value;
        paymentInstrument.creditCardExpirationMonth = session.forms.billing.paymentMethods.creditCard.month.value;
        paymentInstrument.creditCardExpirationYear = session.forms.billing.paymentMethods.creditCard.year.value;
    });

    return {
        success : true
    };
}

/**
 * Authorizes a payment using a credit card. The payment is authorized by using the BASIC_CREDIT processor
 * only and setting the order no as the transaction ID. Customizations may use other processors and custom
 * logic to authorize credit card payment.
 */
function Authorize(args) {
    var orderNo = args.OrderNo;
    var paymentInstrument = args.PaymentInstrument;
    var paymentProcessor = PaymentMgr.getPaymentMethod("BASIC_CREDIT").getPaymentProcessor();

    Transaction.wrap(function () {
        paymentInstrument.paymentTransaction.transactionID = orderNo;
        paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
    });

    return {authorized : true};
}

/*
 * Module exports
 */

/*
 * Local methods
 */
exports.Handle = Handle;
exports.Authorize = Authorize;

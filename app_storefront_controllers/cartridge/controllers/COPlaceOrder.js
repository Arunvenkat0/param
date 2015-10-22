'use strict';

/**
 * This controller creates an order from the current basket. It's a pure processing controller and does
 * no page rendering. The controller is used by checkout and is called upon the triggered place order action.
 * It contains the actual logic to authorize the payment and create the order. The controller communicates the result
 * of the order creation process and uses a status object PlaceOrderError to set proper error states.
 * The calling controller is must handle the results of the order creation and evaluate any errors returned by it.
 *
 * @module controllers/COPlaceOrder
 */

/* API Includes */
var OrderMgr = require('dw/order/OrderMgr');
var PaymentMgr = require('dw/order/PaymentMgr');
var Resource = require('dw/web/Resource');
var Status = require('dw/system/Status');
var Transaction = require('dw/system/Transaction');

/* Script Modules */
var app = require('~/cartridge/scripts/app');
var guard = require('~/cartridge/scripts/guard');

var Cart = app.getModel('Cart');
var Email = app.getModel('Email');
var Order = app.getModel('Order');
var PaymentProcessor = app.getModel('PaymentProcessor');

/**
 * Responsible for payment handling. This pipeline calls the specific
 * authorization pipelines for each individual payment type. It ends on an named
 * "error" end node if either any of the authorizations failed or a payment
 * instrument is of an unknown payment method. If a payment method has no
 * payment processor assigned, the payment is deemed as authorized.
 */
function handlePayments(order) {

    if (order.getTotalNetPrice() !== 0.00) {

        var paymentInstruments = order.getPaymentInstruments();

        if (paymentInstruments.length === 0) {
            return {
                missingPaymentInfo: true
            };
        }

        var handlePaymentTransaction = function () {
            paymentInstrument.getPaymentTransaction().setTransactionID(order.getOrderNo());
        };

        for (var i = 0; i < paymentInstruments.length; i++) {
            var paymentInstrument = paymentInstruments[i];

            if (PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod()).getPaymentProcessor() === null) {

                Transaction.wrap(handlePaymentTransaction);

            } else {
                /*
                 * An Authorization Pipeline is being dynamically called based on a
                 * concatenation of the current Payment-Processor and a constant
                 * suffix (-Authorize). For example: Credit Cards processor ID =
                 * BASIC_CREDIT Authorization Pipeline = BASIC_CREDIT-Authorize
                 *
                 * The authorization pipeline must end in a named "error" end node
                 * to communicate any authorization error back to this pipeline.
                 * Additionally the authorization pipeline may put a
                 * dw.system.Status object into the pipeline dictionary under key
                 * PlaceOrderError, which contains provider specific error messages.
                 */
                var authorizationResult = PaymentProcessor.authorize(order, paymentInstrument);

                if (authorizationResult.not_supported || authorizationResult.error) {
                    return {
                        error: true
                    };
                }
            }
        }
    }

    return {};
}

/**
 * The entry point for the order creation. The start node needs to be private
 * since it is supposed to be called by pipelines only.
 */
function start() {
    var cart = Cart.get();

    if (cart) {

        var COShipping = app.getController('COShipping');

        // Clean shipments.
        COShipping.PrepareShipments(cart);

        // Make sure there are valid shipping address, accounting for gift certificate that would not have one.
        if (cart.getProductLineItems().size() > 0 && cart.getDefaultShipment().getShippingAddress() === null) {
            COShipping.Start();
            return {};
        }

        // Make sure, the billing step has been fulfilled, otherwise restart checkout.
        if (!session.forms.billing.fulfilled.value) {
            app.getController('COCustomer').Start();
            return {};
        }

        Transaction.wrap(function () {
            cart.calculate();
        });

        var COBilling = app.getController('COBilling');

        if (!COBilling.ValidatePayment(cart)) {
            COBilling.Start();
            return {};
        }

        var validationResult = cart.validateForCheckout();

        // TODO - what are those used for - do they need to be returned/passed to a template ?
        var BasketStatus = validationResult.BasketStatus;

        // Recalculate the payments. If there is only gift certificates, make sure it covers the order total, if not
        // back to billing page.
        if (!cart.calculatePaymentTransactionTotal()) {
            COBilling.Start();
            return {};
        }

        // Handle used addresses and credit cards.
        var saveCCResult = COBilling.SaveCreditCard();

        if (!saveCCResult) {
            return {
                error: true,
                PlaceOrderError: new Status(Status.ERROR, 'confirm.error.technical')
            };
        }

        // Creates a new order. This will internally ReserveInventoryForOrder and will create a new Order with status
        // 'Created'.
        var order = cart.createOrder();

        if (!order) {
            // TODO - need to pass BasketStatus to Cart-Show ?
            BasketStatus = new Status(Status.ERROR);
            app.getController('Cart').Show();

            return {};
        } else {
            var handlePaymentsResult = handlePayments(order);
            if (handlePaymentsResult.error) {
                OrderMgr.failOrder(order);
                return {error: true};
            } else if (handlePaymentsResult.missingPaymentInfo) {
                OrderMgr.failOrder(order);
                return {error: true};
            }

            return submitImpl(order);
        }
    } else {
        app.getController('Cart').Show();
        return {};
    }
}

/**
 * Submit order implementation.
 *
 * @param order
 * @returns {*}
 */
function submitImpl(order) {

    var orderPlacementStatus = Transaction.wrap(function () {
        if (OrderMgr.placeOrder(order) === Status.ERROR) {
            OrderMgr.failOrder(order);
            return false;
        }

        order.setConfirmationStatus(order.CONFIRMATION_STATUS_CONFIRMED);

        return true;
    });

    if (orderPlacementStatus === Status.ERROR) {
        return {error: true};
    }

    // Creates purchased gift certificates with this order.
    if (!createGiftCertificates(order)) {
        OrderMgr.failOrder(order);
        return {error: true};
    }

    // Send order confirmation and clear used forms within the checkout process.
    Email.get('mail/orderconfirmation', order.getCustomerEmail())
        .setSubject((Resource.msg('order.orderconfirmation-email.001', 'order', null) + ' ' + order.getOrderNo()).toString())
        .send({
            Order: order
        });

    // Mark order as EXPORT_STATUS_READY.
    Transaction.wrap(function () {
        order.setExportStatus(dw.order.Order.EXPORT_STATUS_READY);
        order.setConfirmationStatus(dw.order.Order.CONFIRMATION_STATUS_CONFIRMED);
    });

    // Clears all forms used in the checkout process.
    session.forms.singleshipping.clearFormElement();
    session.forms.multishipping.clearFormElement();
    session.forms.billing.clearFormElement();

    return {
        Order: order,
        order_created: true
    };
}

/**
 * Creates a gift certificate for each gift certificate line item in the order
 * and sends an email to the gift certificate receiver.
 */
function createGiftCertificates(order) {

    var giftCertificates = Order.get(order).createGiftCertificates();

    if (giftCertificates) {

        for (var i = 0; i < giftCertificates.length; i++) {
            var giftCertificate = giftCertificates[i];

            // Send order confirmation and clear used forms within the checkout process.
            Email.get('mail/giftcert', giftCertificate.recipientEmail)
                .setSubject(Resource.msg('email.ordergcemsg', 'email', null) + ' ' + giftCertificate.senderName)
                .send({
                    GiftCertificate: giftCertificate
                });
        }

        return true;
    } else {
        return false;
    }
}

/**
 * Asynchronous Callbacks for OCAPI. These functions result in a JSON response.
 */
function submitPaymentJSON() {

    var order = Order.get(request.httpParameterMap.order_id.stringValue);
    if (order.object && (request.httpParameterMap.order_token.stringValue === order.getOrderToken())) {

        session.forms.billing.paymentMethods.clearFormElement();

        var requestObject = JSON.parse(request.httpParameterMap.requestBodyAsString);
        var form = session.forms.billing.paymentMethods;

        for (var requestObjectItem in requestObject) {
            var asyncPaymentMethodResponse = requestObject[requestObjectItem];

            var terms = requestObjectItem.split('_');
            if (terms[0] === 'creditCard' && terms[1] === 'number') {
                form.creditCard.number.setValue(asyncPaymentMethodResponse);
            } else if (terms[0] === 'creditCard' && terms[1] === 'cvn') {
                form.creditCard.cvn.setValue(asyncPaymentMethodResponse);
            } else if (terms[0] === 'creditCard' && terms[1] === 'month') {
                form.creditCard.month.setValue(Number(asyncPaymentMethodResponse));
            } else if (terms[0] === 'creditCard' && terms[1] === 'year') {
                form.creditCard.year.setValue(Number(asyncPaymentMethodResponse));
            } else if (terms[0] === 'creditCard' && terms[1] === 'owner') {
                form.creditCard.owner.setValue(asyncPaymentMethodResponse);
            } else if (terms[0] === 'creditCard' && terms[1] === 'type') {
                form.creditCard.type.setValue(asyncPaymentMethodResponse);
            } else if (terms[0] === 'selectedPaymentMethodID') {
                form.selectedPaymentMethodID.setValue(asyncPaymentMethodResponse);
            }
        }

        if (app.getController('COBilling').HandlePaymentSelection('cart').error || handlePayments().error) {
            app.getView().render('checkout/components/faults');
            return;
        } else {
            app.getView().render('checkout/components/payment_methods_success');
            return;
        }
    } else {
        app.getView().render('checkout/components/faults');
        return;
    }
}

/*
 * Asynchronous Callbacks for SiteGenesis
 */
function submit() {

    var order = Order.get(request.httpParameterMap.order_id.stringValue);
    if (!order.object || (request.httpParameterMap.order_token.stringValue !== order.getOrderToken())) {
        app.getController('COSummary').Start();
        return;
    } else if (submitImpl().error) {
        app.getController('COSummary').Start();
        return;
    }

    app.getController('COSummary').ShowConfirmation();
}

/*
 * Module exports
 */

/*
 * Web exposed methods
 */
/** @see module:controllers/COPlaceOrder~submitPaymentJSON */
exports.SubmitPaymentJSON = guard.ensure(['https'], submitPaymentJSON);
/** @see module:controllers/COPlaceOrder~submitPaymentJSON */
exports.Submit = guard.ensure(['https'], submit);

/*
 * Local methods
 */
exports.Start = start;

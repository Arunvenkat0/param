'use strict';

/**
 * This controller provies the billing logic. It is used by both the single shipping and the multishipping
 * functionality and is responsible for payment method selection and entering a billing address.
 *
 * @module controllers/COBilling
 */

/* API Includes */
var ArrayList = require('dw/util/ArrayList');
var GiftCertificate = require('dw/order/GiftCertificate');
var GiftCertificateMgr = require('dw/order/GiftCertificateMgr');
var GiftCertificateStatusCodes = require('dw/order/GiftCertificateStatusCodes');
var PaymentInstrument = require('dw/order/PaymentInstrument');
var PaymentMgr = require('dw/order/PaymentMgr');
var Pipelet = require('dw/system/Pipelet');
var ProductListMgr = require('dw/customer/ProductListMgr');
var Resource = require('dw/web/Resource');
var Status = require('dw/system/Status');
var StringUtils = require('dw/util/StringUtils');
var Transaction = require('dw/system/Transaction');
var URLUtils = require('dw/web/URLUtils');
var Countries = require('app_storefront_core/cartridge/scripts/util/Countries');

/* Script Modules */
var app = require('~/cartridge/scripts/app');
var guard = require('~/cartridge/scripts/guard');

/**
 * Initializes the address form: if customer chose option "use as billing
 * address" on single shipping page the form is prepopulated with the shipping
 * address, otherwise it prepopulates with the billing address that was already set.
 * If neither address is availble, it prepopulates with the default address of the authenticated customer.
 */
function initAddressForm(cart) {

    if (app.getForm('singleshipping').object.shippingAddress.useAsBillingAddress.value === true) {
        app.getForm('billing').object.billingAddress.addressFields.firstName.value = app.getForm('singleshipping').object.shippingAddress.addressFields.firstName.value;
        app.getForm('billing').object.billingAddress.addressFields.lastName.value = app.getForm('singleshipping').object.shippingAddress.addressFields.lastName.value;
        app.getForm('billing').object.billingAddress.addressFields.address1.value = app.getForm('singleshipping').object.shippingAddress.addressFields.address1.value;
        app.getForm('billing').object.billingAddress.addressFields.address2.value = app.getForm('singleshipping').object.shippingAddress.addressFields.address2.value;
        app.getForm('billing').object.billingAddress.addressFields.city.value = app.getForm('singleshipping').object.shippingAddress.addressFields.city.value;
        app.getForm('billing').object.billingAddress.addressFields.postal.value = app.getForm('singleshipping').object.shippingAddress.addressFields.postal.value;
        app.getForm('billing').object.billingAddress.addressFields.phone.value = app.getForm('singleshipping').object.shippingAddress.addressFields.phone.value;
        app.getForm('billing').object.billingAddress.addressFields.states.state.value = app.getForm('singleshipping').object.shippingAddress.addressFields.states.state.value;
        app.getForm('billing').object.billingAddress.addressFields.country.value = app.getForm('singleshipping').object.shippingAddress.addressFields.country.value;
        app.getForm('billing').object.billingAddress.addressFields.phone.value = app.getForm('singleshipping').object.shippingAddress.addressFields.phone.value;
    } else if (cart.getBillingAddress() !== null) {
        app.getForm('billing.billingAddress.addressFields').copyFrom(cart.getBillingAddress());
        app.getForm('billing.billingAddress.addressFields.states').copyFrom(cart.getBillingAddress());
    } else if (customer.authenticated && customer.profile.addressBook.preferredAddress !== null) {

        app.getForm('billing.billingAddress.addressFields').copyFrom(customer.profile.addressBook.preferredAddress);
        app.getForm('billing.billingAddress.addressFields.states').copyFrom(customer.profile.addressBook.preferredAddress);
    }
}

/**
 * Initializes the email address form field: if there is already a customer
 * email set at the basket, that email address is used. If the
 * current customer is authenticated the email address of the customer's profile
 * is used.
 */
function initEmailAddress(cart) {
    if (cart.getCustomerEmail() !== null) {
        app.getForm('billing').object.billingAddress.email.emailAddress.value = cart.getCustomerEmail();
    } else if (customer.authenticated && customer.profile.email !== null) {
        app.getForm('billing').object.billingAddress.email.emailAddress.value = customer.profile.email;
    }
}

/**
 * TODO
 * @param cart
 * @param params
 */
function returnToForm(cart, params) {
    var pageMeta = require('~/cartridge/scripts/meta');

    // if the payment method is set to gift certificate get the gift certificate code from the form
    if (!empty(cart.getPaymentInstrument()) && cart.getPaymentInstrument().getPaymentMethod() === PaymentInstrument.METHOD_GIFT_CERTIFICATE) {
        app.getForm('billing').copyFrom({
            giftCertCode : cart.getPaymentInstrument().getGiftCertificateCode()
        });
    }

    pageMeta.update({
        pageTitle : Resource.msg('billing.meta.pagetitle', 'checkout', 'SiteGenesis Checkout')
    });

    if (params) {
        app.getView(require('~/cartridge/scripts/object').extend(params, {
            Basket : cart.object,
            ContinueURL : URLUtils.https('COBilling-Billing')
        })).render('checkout/billing/billing');
    } else {
        app.getView({
            Basket : cart.object,
            ContinueURL : URLUtils.https('COBilling-Billing')
        }).render('checkout/billing/billing');
    }
}

/**
 * TODO
 * @param cart
 */
function start(cart, params) {

    app.getController('COShipping').PrepareShipments();

    Transaction.wrap(function() {
        cart.calculate();
    });

    var pageMeta = require('~/cartridge/scripts/meta');
    pageMeta.update({
        pageTitle : Resource.msg('billing.meta.pagetitle', 'checkout', 'SiteGenesis Checkout')
    });
    returnToForm(cart, params);
}

/**
 * Initializes the credit card list by determining the saved customer payment
 * instruments of type credit card.
 */
function initCreditCardList(cart) {
    var paymentAmount = cart.getNonGiftCertificateAmount();
    var countryCode;
    var applicablePaymentMethods;
    var applicablePaymentCards;
    var applicableCreditCards;

    countryCode = Countries.getCurrent({
        CurrentRequest: {
            locale: request.locale
        }
    }).countryCode;

    applicablePaymentMethods = PaymentMgr.getApplicablePaymentMethods(customer, countryCode, paymentAmount.value);
    applicablePaymentCards = PaymentMgr.getPaymentMethod(PaymentInstrument.METHOD_CREDIT_CARD).getApplicablePaymentCards(customer, countryCode, paymentAmount.value);

    app.getForm('billing').object.paymentMethods.creditCard.type.setOptions(applicablePaymentCards.iterator());

    applicableCreditCards = null;

    if (customer.authenticated) {
        var profile = app.getModel('Profile').get();
        if (profile) {
            applicableCreditCards = profile.validateWalletPaymentInstruments(countryCode, paymentAmount.getValue()).ValidPaymentInstruments;
        }
    }

    return {
        ApplicablePaymentMethods : applicablePaymentMethods,
        ApplicableCreditCards : applicableCreditCards
    };
}

/**
 * Starting point for billing. After a successful shipping setup both COShipping
 * and COShippingMultiple jump to this node.
 */
function publicStart() {
    var cart = app.getModel('Cart').get();
    if (cart) {

        // Initializes all forms of the billing page including: - address form - email address - coupon form
        initAddressForm(cart);
        initEmailAddress(cart);

        var creditCardList = initCreditCardList(cart);
        var applicablePaymentMethods = creditCardList.ApplicablePaymentMethods;

        var billingForm = app.getForm('billing').object;
        var paymentMethods = billingForm.paymentMethods;
        if (paymentMethods.valid) {
            paymentMethods.selectedPaymentMethodID.setOptions(applicablePaymentMethods.iterator());
        } else {
            paymentMethods.clearFormElement();
        }

        app.getForm('billing.couponCode').clear();
        app.getForm('billing.giftCertCode').clear();

        start(cart, {ApplicableCreditCards: creditCardList.ApplicableCreditCards});
    } else {
        app.getController('Cart').Show();
    }
}

/**
 * Adjust gift certificate redemptions as after applying coupon(s), order total
 * is changed. AdjustGiftCertificate pipeline removes and then adds currently
 * added gift certificates to reflect order total changes.
 */
function adjustGiftCertificates() {
    var i, j, cart, gcIdList, gcID, gc;
    cart = app.getModel('Cart').get();

    if (cart) {
        gcIdList = cart.getGiftCertIdList();

        Transaction.wrap(function() {
            for ( i = 0; i < gcIdList.length; i += 1) {
                cart.removeGiftCertificatePaymentInstrument(gcIdList[i]);
            }

            gcID = null;

            for ( j = 0; j < gcIdList.length; j += 1) {
                gcID = gcIdList[j];

                gc = GiftCertificateMgr.getGiftCertificateByCode(gcID);

                if ((gc) && // make sure exists
                (gc.isEnabled()) && // make sure it is enabled
                (gc.getStatus() !== GiftCertificate.STATUS_PENDING) && // make sure it is available for use
                (gc.getStatus() !== GiftCertificate.STATUS_REDEEMED) && // make sure it has not been fully redeemed
                (gc.balance.currencyCode === cart.getCurrencyCode())) {// make sure the GC is in the right currency
                    cart.createGiftCertificatePaymentInstrument(gc);
                }
            }
        });
    }
}

/**
 * TODO
 */
function handleCoupon() {
    var CouponError;
    // @FIXME what is that used for?
    if (empty(CouponError)) {
        /*
         * Adjust gift certificate redemptions as after applying coupon(s),
         * order total is changed. AdjustGiftCertificate pipeline removes and
         * then adds currently added gift certificates to reflect order total
         * changes.
         */
        adjustGiftCertificates();
    }

    returnToForm(app.getModel('Cart').get());
}

/**
 * Attempts to redeem a gift certificate. If the gift certificate wasn't
 * redeemed, the form field is invalidated with the appropriate error message.
 * If the gift certificate was redeemed, the form gets cleared. This start node
 * is called by an Ajax request and generates a JSON response.
 */
function redeemGiftCertificate(giftCertCode) {
    var cart, gc, newGCPaymentInstrument, gcPaymentInstrument, status, result;
    cart = app.getModel('Cart').get();

    if (cart) {
        // fetch the gift certificate
        gc = GiftCertificateMgr.getGiftCertificateByCode(giftCertCode);

        if (!gc) {// make sure exists
            result = new Status(Status.ERROR, GiftCertificateStatusCodes.GIFTCERTIFICATE_NOT_FOUND);
        } else if (!gc.isEnabled()) {// make sure it is enabled
            result = new Status(Status.ERROR, GiftCertificateStatusCodes.GIFTCERTIFICATE_DISABLED);
        } else if (gc.getStatus() === GiftCertificate.STATUS_PENDING) {// make sure it is available for use
            result = new Status(Status.ERROR, GiftCertificateStatusCodes.GIFTCERTIFICATE_PENDING);
        } else if (gc.getStatus() === GiftCertificate.STATUS_REDEEMED) {// make sure it has not been fully redeemed
            result = new Status(Status.ERROR, GiftCertificateStatusCodes.GIFTCERTIFICATE_INSUFFICIENT_BALANCE);
        } else if (gc.balance.currencyCode !== cart.getCurrencyCode()) {// make sure the GC is in the right currency
            result = new Status(Status.ERROR, GiftCertificateStatusCodes.GIFTCERTIFICATE_CURRENCY_MISMATCH);
        } else {
            newGCPaymentInstrument = Transaction.wrap(function() {
                gcPaymentInstrument = cart.createGiftCertificatePaymentInstrument(gc);
                cart.calculate();
                return gcPaymentInstrument;
            });

            status = new Status(Status.OK);
            status.addDetail("NewGCPaymentInstrument", newGCPaymentInstrument);
            result = status;
        }
    } else {
        result = new Status(Status.ERROR, 'BASKET_NOT_FOUND');
    }
    return result;
}

/**
 * TODO
 */
function updateCreditCardSelection() {
    var cart, applicableCreditCards, UUID, selectedCreditCard, instrumentsIter, creditCardInstrument;
    cart = app.getModel('Cart').get();

    applicableCreditCards = initCreditCardList(cart).ApplicableCreditCards;

    UUID = request.httpParameterMap.creditCardUUID.value || request.httpParameterMap.dwfrm_billing_paymentMethods_creditCardList.stringValue;

    selectedCreditCard = null;
    if (UUID && applicableCreditCards && !applicableCreditCards.empty) {

        // find credit card in payment instruments
        instrumentsIter = applicableCreditCards.iterator();
        while (instrumentsIter.hasNext()) {
            creditCardInstrument = instrumentsIter.next();
            if (UUID.equals(creditCardInstrument.UUID)) {
                selectedCreditCard = creditCardInstrument;
            }
        }

        if (selectedCreditCard) {
            app.getForm('billing').object.paymentMethods.creditCard.number.value = selectedCreditCard.creditCardNumber;
        } else {
            publicStart();
        }
    } else {
        publicStart();
    }

    app.getForm('billing.paymentMethods.creditCard').copyFrom(selectedCreditCard);

    initCreditCardList(cart);
    start(cart);
}

/**
 * Reset the forms of all payment methods, except the one of the current
 * selected payment method.
 */
function resetPaymentForms() {

    var cart = app.getModel('Cart').get();

    if (app.getForm('billing').object.paymentMethods.selectedPaymentMethodID.value.equals("PayPal")) {
        app.getForm('billing').object.paymentMethods.creditCard.clearFormElement();
        app.getForm('billing').object.paymentMethods.bml.clearFormElement();

        cart.removePaymentInstruments(cart.getPaymentInstruments(PaymentInstrument.METHOD_CREDIT_CARD));
        cart.removePaymentInstruments(cart.getPaymentInstruments(PaymentInstrument.METHOD_BML));
    } else if (app.getForm('billing').object.paymentMethods.selectedPaymentMethodID.value.equals(PaymentInstrument.METHOD_CREDIT_CARD)) {
        app.getForm('billing').object.paymentMethods.bml.clearFormElement();

        cart.removePaymentInstruments(cart.getPaymentInstruments(PaymentInstrument.METHOD_BML));
        cart.removePaymentInstruments(cart.getPaymentInstruments("PayPal"));
    } else if (app.getForm('billing').object.paymentMethods.selectedPaymentMethodID.value.equals(PaymentInstrument.METHOD_BML)) {
        app.getForm('billing').object.paymentMethods.creditCard.clearFormElement();

        if (!app.getForm('billing').object.paymentMethods.bml.ssn.valid) {
            return false;
        }

        cart.removePaymentInstruments(cart.getPaymentInstruments(PaymentInstrument.METHOD_CREDIT_CARD));
        cart.removePaymentInstruments(cart.getPaymentInstruments("PayPal"));
    }

    return true;
}

/**
 * TODO
 * @returns {boolean}
 */
function validateBilling() {
    if (!app.getForm('billing').object.billingAddress.valid) {
        return false;
    }

    if (!empty(request.httpParameterMap.noPaymentNeeded.value)) {
        return true;
    }

    if (!empty(app.getForm('billing').object.paymentMethods.selectedPaymentMethodID.value) && app.getForm('billing').object.paymentMethods.selectedPaymentMethodID.value.equals(PaymentInstrument.METHOD_CREDIT_CARD)) {
        if (!app.getForm('billing').object.valid) {
            return false;
        }
    }

    return true;
}

/**
 * Handles the selection of the payment method and performs payment method
 * specific validation and verification upon the entered form fields. If the
 * order total is 0 (in case user has product promotions etc.) then we do not
 * need a valid payment method.
 */
function handlePaymentSelection(cart) {
    var result;
    if (empty(app.getForm('billing').object.paymentMethods.selectedPaymentMethodID.value)) {
        if (cart.getTotalGrossPrice() > 0) {
            result = {
                error : true
            };
        } else {
            result = {
                ok : true
            };
        }
    }

    // skip the payment handling if the whole payment was made using gift cert
    if (app.getForm('billing').object.paymentMethods.selectedPaymentMethodID.value.equals(PaymentInstrument.METHOD_GIFT_CERTIFICATE)) {
        result = {
            ok : true
        };
    }

    if (empty(PaymentMgr.getPaymentMethod(app.getForm('billing').object.paymentMethods.selectedPaymentMethodID.value).paymentProcessor)) {
        result = {
            error : true,
            MissingPaymentProcessor : true
        };
    }
    if (!result) {
        result = app.getModel('PaymentProcessor').handle(cart.object, app.getForm('billing').object.paymentMethods.selectedPaymentMethodID.value);
    }
    return result;
}

/**
 * TODO
 *
 * @param cart
 * @returns {boolean}
 */
function handleBillingAddress(cart) {

    var billingAddress = cart.getBillingAddress();
    Transaction.wrap(function() {

        if (!billingAddress) {
            billingAddress = cart.createBillingAddress();
        }

        app.getForm('billing.billingAddress.addressFields').copyTo(billingAddress);

        cart.setCustomerEmail(app.getForm('billing').object.billingAddress.email.emailAddress.value);
    });

    return true;
}

/**
 * TODO
 */
function updateAddressDetails() {
    var cart, address, billingAddress;
    cart = app.getModel('Cart').get();

    if (cart) {

        address = customer.getAddressBook().getAddress(empty(request.httpParameterMap.addressID.value) ? request.httpParameterMap.dwfrm_billing_addressList.value : request.httpParameterMap.addressID.value);

        app.getForm('billing.billingAddress.addressFields').copyFrom(address);
        app.getForm('billing.billingAddress.addressFields.states').copyFrom(address);

        billingAddress = cart.getBillingAddress();

        app.getForm('billing.billingAddress.addressFields').copyTo(billingAddress);

        initCreditCardList(cart);
        start(cart);
    } else {
        //@FIXME redirect
        app.getController('Cart').Show();
    }
}

/**
 * TODO
 */
function billing() {

    app.getForm('billing').handleAction({
        'applyCoupon' : function(formgroup) {
            var couponCode = request.httpParameterMap.couponCode.stringValue || request.httpParameterMap.dwfrm_billing_couponCode.stringValue;

            // TODO what happened to this start node?
            app.getController('Cart').AddCoupon(couponCode);

            handleCoupon();
            return;
        },
        'creditCardSelect' : function(formgroup) {
            updateCreditCardSelection();
            return;
        },
        'paymentSelect' : function(formgroup) {
            var selectedPaymentID = request.httpParameterMap.dwfrm_billing_paymentMethods_selectedPaymentMethodID.stringValue;
            // ToDo - pass parameter ?
            publicStart();
            return;
        },
        'redeemGiftCert' : function(formgroup) {
            var status = redeemGiftCertificate(app.getForm('billing').object.giftCertCode.htmlValue);
            if (!status.isError()) {
                returnToForm(app.getModel('Cart').get(), {
                    NewGCPaymentInstrument : status.getDetail("NewGCPaymentInstrument")
                });
            } else {
                returnToForm(app.getModel('Cart').get());
            }

            return;
        },
        'save' : function(formgroup) {
            var cart = app.getModel('Cart').get();

            if (!resetPaymentForms() || !validateBilling() || !handleBillingAddress(cart) || // Performs validation steps, based upon the entered billing address
            // and address options.
            handlePaymentSelection(cart).error) {// Performs payment method specific checks, such as credit card verification.
                returnToForm(cart);
            } else {

                if (customer.authenticated && app.getForm('billing').object.billingAddress.addToAddressBook.value) {
                    app.getModel('Profile').get(customer.profile).addAddressToAddressBook(cart.getBillingAddress());
                }

                // Mark step as fulfilled
                app.getForm('billing').object.fulfilled.value = true;

                // A successful billing page will jump to the next checkout step.
                app.getController('COSummary').Start();
                return;
            }
        },
        'selectAddress' : function(formgroup) {
            updateAddressDetails();
            return;
        }
    });
}

/**
 * TODO
 */
function redeemGiftCertificateJson() {
    var giftCertCode, giftCertStatus;

    giftCertCode = request.httpParameterMap.giftCertCode.stringValue;
    giftCertStatus = redeemGiftCertificate(giftCertCode);

    let responseUtils = require('~/cartridge/scripts/util/Response');

    if (request.httpParameterMap.format.stringValue !== 'ajax') {
        // @FIXME we could also build an ajax guard?
        responseUtils.renderJSON({});
    } else {
        responseUtils.renderJSON({
            status : giftCertStatus.code,
            success : !giftCertStatus.error,
            message : Resource.msgf('billing.' + giftCertStatus.code, 'checkout', null, giftCertCode),
            code : giftCertCode
        });
    }
}

/**
 * Attempts to remove a gift certificate from the basket payment instruments and
 * generates a JSON response with a status. This start node is called by an Ajax
 * request.
 */
function removeGiftCertificate() {
    if (!empty(request.httpParameterMap.giftCertificateID.stringValue)) {
        var cart = app.getModel('Cart').get();

        Transaction.wrap(function() {
            cart.removeGiftCertificatePaymentInstrument(request.httpParameterMap.giftCertificateID.stringValue);
            cart.calculate();
        });
    }

    publicStart();
}

/**
 * Renders the order summary including mini cart order totals and shipment
 * summary. This is used to update the order totals in the UI based on the
 * recalculated basket after a coupon code has been applied.
 */
function updateSummary() {

    var cart = app.getModel('Cart').get();

    Transaction.wrap(function() {
        cart.calculate();
    });

    app.getView({
        checkoutstep : 4,
        Basket : cart.object
    }).render('checkout/minisummary');
}

/**
 * Renders a form dialog to edit an address. The dialog is supposed to be opened
 * by an Ajax request and ends in templates, which just trigger a certain JS
 * event. The calling page of this dialog is responsible for handling these
 * events.
 */
function editAddress() {

    app.getForm('billing').objectaddress.clearFormElement();

    var address = customer.getAddressBook().getAddress(request.httpParameterMap.addressID.stringValue);

    if (address) {
        app.getForm('billinaddress').copyFrom(address);
        app.getForm('billingaggdress.states').copyFrom(address);
    }

    app.getView({
        ContinueURL : URLUtils.https('COBilling-EditBillingAddress')
    }).render('checkout/billing/billingaddressdetails');
}

/**
 * TODO
 */
function editBillingAddress() {

    app.getForm('returnToForm').handleAction({
        'apply' : function(formgroup) {
            if (!app.getForm('billingaddress').copyTo(app.getForm('billingaddress').object)) {
                app.getView({
                    ContinueURL : URLUtils.https('COBilling-EditBillingAddress')
                }).render('checkout/billing/billingaddressdetails');
            } else {
                app.getView().render('components/dialog/dialogapply');
            }
        },
        'remove' : function(formgroup) {
            if (ProductListMgr.getProductLists(app.getForm('billing').objectaddress.object).isEmpty()) {
                customer.getAddressBook().removeAddress(app.getForm('billing').objectaddress.object);
                app.getView().render('components/dialog/dialogdelete');
            } else {
                app.getView({
                    ContinueURL : URLUtils.https('COBilling-EditBillingAddress')
                }).render('checkout/billing/billingaddressdetails');
            }
        }
    });
}

/**
 * Returns information of a gift certificate including its balance as JSON
 * response. Required to check the remaining balance.
 */
function getGiftCertificateBalance() {
    var giftCertificate = GiftCertificateMgr.getGiftCertificateByCode(request.httpParameterMap.giftCertificateID.value);
    var responseUtils = require('~/cartridge/scripts/util/Response');

    if (giftCertificate && giftCertificate.isEnabled()) {
        responseUtils.renderJSON({
            ID : giftCertificate.getGiftCertificateCode(),
            balance : StringUtils.formatMoney(giftCertificate.getBalance())
        });
    } else {
        responseUtils.renderJSON({
            error : Resource.msg('billing.giftcertinvalid', 'checkout', null)
        });
    }
}

/**
 * Selects a customer credit card and returns the details of the credit card as
 * JSON response. Required to fill credit card form with details of selected
 * credit card.
 */
function selectCreditCard() {
    var cart, applicableCreditCards, selectedCreditCard, instrumentsIter, creditCardInstrument;
    cart = app.getModel('Cart').get();

    applicableCreditCards = initCreditCardList(cart).ApplicableCreditCards;
    selectedCreditCard = null;

    // ensure mandatory parameter 'CreditCardUUID' and 'CustomerPaymentInstruments'
    // in pipeline dictionary and collection is not empty
    if (request.httpParameterMap.creditCardUUID.value && applicableCreditCards && !applicableCreditCards.empty) {

        // find credit card in payment instruments
        instrumentsIter = applicableCreditCards.iterator();
        while (instrumentsIter.hasNext()) {
            creditCardInstrument = instrumentsIter.next();
            if (request.httpParameterMap.creditCardUUID.value.equals(creditCardInstrument.UUID)) {
                selectedCreditCard = creditCardInstrument;
            }
        }

        if (selectedCreditCard) {
            app.getForm('billing').object.paymentMethods.creditCard.number.value = selectedCreditCard.getCreditCardNumber();
        }
    }

    app.getView({
        SelectedCreditCard : selectedCreditCard
    }).render('checkout/billing/creditcardjson');
}

/**
 * This branch is used to revalidate existing payment instruments in later
 * checkout steps.
 */
function validatePayment(cart) {
    var paymentAmount, countryCode, invalidPaymentInstruments, result;
    if (app.getForm('billing').object.fulfilled.value) {
        paymentAmount = cart.getNonGiftCertificateAmount();
        countryCode = app.getForm('billing').object.billingAddress.addressFields.country.value;

        invalidPaymentInstruments = cart.validatePaymentInstruments(customer, countryCode, paymentAmount.value).InvalidPaymentInstruments;

        if (!invalidPaymentInstruments && cart.calculatePaymentTransactionTotal()) {
            result = true;
        } else {
            app.getForm('billing').object.fulfilled.value = false;
            result = false;
        }
    } else {
        result = false;
    }
    return result;
}

/**
 * Attempts to save the used credit card in the customer payment instruments.
 * The logic replaces an old saved credit card with the same masked credit card
 * number of the same card type with the new credit card. This ensures creating
 * only unique cards as well as replacing expired cards.
 */
function saveCreditCard() {
    var i, creditCards, GetCustomerPaymentInstrumentsResult, newCreditCard, creditcard;

    if (customer.authenticated && app.getForm('billing').object.paymentMethods.creditCard.saveCard.value) {
        // TODO - remove pipelet code once APP-30656 is fixed
        // var creditCards = customer.getProfile().getWallet().getPaymentInstruments(PaymentInstrument.METHOD_CREDIT_CARD);
        creditCards = new ArrayList();

        GetCustomerPaymentInstrumentsResult = new Pipelet('GetCustomerPaymentInstruments').execute({
            Customer : customer,
            PaymentMethod : PaymentInstrument.METHOD_CREDIT_CARD
        });

        if (GetCustomerPaymentInstrumentsResult.result !== PIPELET_ERROR) {
            creditCards = GetCustomerPaymentInstrumentsResult.PaymentInstruments;
        }

        Transaction.wrap(function() {
            newCreditCard = customer.getProfile().getWallet().createPaymentInstrument(PaymentInstrument.METHOD_CREDIT_CARD);

            // coy the credit card details to the payment instrument
            newCreditCard.setCreditCardHolder(app.getForm('billing').object.paymentMethods.creditCard.owner.value);
            newCreditCard.setCreditCardNumber(app.getForm('billing').object.paymentMethods.creditCard.number.value);
            newCreditCard.setCreditCardExpirationMonth(app.getForm('billing').object.paymentMethods.creditCard.expiration.month.value);
            newCreditCard.setCreditCardExpirationYear(app.getForm('billing').object.paymentMethods.creditCard.expiration.year.value);
            newCreditCard.setCreditCardType(app.getForm('billing').object.paymentMethods.creditCard.type.value);

            for (i = 0; i < creditCards.length; i++) {
                var creditcard = creditCards[i];

                if (creditcard.maskedCreditCardNumber === newCreditCard.maskedCreditCardNumber && creditcard.creditCardType === newCreditCard.creditCardType) {
                    customer.getProfile().getWallet().removePaymentInstrument(creditcard);
                }
            }
        });

    }
    return true;
}

/*
* Module exports
*/

/*
* Web exposed methods
*/
/** @see module:controllers/COBilling~Start */
exports.Start = guard.ensure(['https'], publicStart);
/** @see module:controllers/COBilling~redeemGiftCertificateJson */
exports.RedeemGiftCertificateJson = guard.ensure(['https', 'get'], redeemGiftCertificateJson);
/** @see module:controllers/COBilling~removeGiftCertificate */
exports.RemoveGiftCertificate = guard.ensure(['https', 'get'], removeGiftCertificate);
/** @see module:controllers/COBilling~updateSummary */
exports.UpdateSummary = guard.ensure(['https', 'get'], updateSummary);
/** @see module:controllers/COBilling~updateAddressDetails */
exports.UpdateAddressDetails = guard.ensure(['https', 'get'], updateAddressDetails);
/** @see module:controllers/COBilling~editAddress */
exports.EditAddress = guard.ensure(['https', 'get'], editAddress);
/** @see module:controllers/COBilling~getGiftCertificateBalance */
exports.GetGiftCertificateBalance = guard.ensure(['https', 'get'], getGiftCertificateBalance);
/** @see module:controllers/COBilling~selectCreditCard */
exports.SelectCreditCard = guard.ensure(['https', 'get'], selectCreditCard);
/** @see module:controllers/COBilling~updateCreditCardSelection */
exports.UpdateCreditCardSelection = guard.ensure(['https', 'get'], updateCreditCardSelection);
/** @see module:controllers/COBilling~billing */
exports.Billing = guard.ensure(['https'], billing);
/** @see module:controllers/COBilling~editBillingAddress */
exports.EditBillingAddress = guard.ensure(['https', 'post'], editBillingAddress);

/*
 * Local methods
 */
exports.SaveCreditCard = saveCreditCard;
exports.ValidatePayment = validatePayment;
exports.HandlePaymentSelection = handlePaymentSelection;

'use strict';

import _ from 'lodash';
import {assert} from 'chai';

import * as cartPage from '../pageObjects/cart';
import * as checkoutPage from '../pageObjects/checkout';
import * as homePage from '../pageObjects/home';
import * as orderConfPage from '../pageObjects/orderConfirmation';
import * as productDetailPage from '../pageObjects/productDetail';
import * as testData from '../pageObjects/testData/main';
import * as formLogin from '../pageObjects/helpers/forms/login';
import * as formHelpers from '../pageObjects/helpers/forms/common';
import * as helpers from '../pageObjects/helpers/common';
import * as navHeader from '../pageObjects/navHeader';
import * as giftCertPage from '../pageObjects/giftCertPurchase';

describe('Checkout', () => {
    let login = 'testuser1@demandware.com';
    let shippingData = {};
    let billingFormData = {};
    let successfulCheckoutTitle = 'Thank you for your order.';

    before(() =>
        testData.getCustomerByLogin(login)
            .then(customer => {
                let address = customer.getPreferredAddress();

                shippingData = {
                    firstName: customer.firstName,
                    lastName: customer.lastName,
                    address1: address.address1,
                    country: address.countryCode,
                    states_state: address.stateCode,
                    city: address.city,
                    postal: address.postalCode,
                    phone: address.phone,
                    addressList: address.addressId
                };

                billingFormData = {
                    emailAddress: customer.email,
                    creditCard_type: testData.creditCard1.cardType,
                    creditCard_owner: customer.firstName + ' ' + customer.lastName,
                    creditCard_number: testData.creditCard1.number,
                    creditCard_expiration_year: testData.creditCard1.yearIndex,
                    creditCard_cvn: testData.creditCard1.cvn
                };
            })
            .then(() => Promise.resolve())
    );

    function addProductVariationMasterToCart () {
        return testData.getProductVariationMaster()
            .then(productVariationMaster => {
                let product = new Map();
                product.set('resourcePath', productVariationMaster.getUrlResourcePath());
                product.set('colorIndex', 1);
                product.set('sizeIndex', 2);
                product.set('widthIndex', 1);
                return product;
            })
            .then(product => productDetailPage.addProductVariationToCart(product));
    }

    describe('Checkout as Guest', () => {
        let shippingFormData;

        before(() => addProductVariationMasterToCart()
            .then(() => {
                // Set form data without preferred address, since manually
                // entering form fields as Guest
                shippingFormData = _.cloneDeep(shippingData);
                delete shippingFormData.addressList;
            })
            .then(() => checkoutPage.navigateTo())
        );

        it('should allow checkout as guest', () =>
            checkoutPage.pressBtnCheckoutAsGuest()
                .then(() => checkoutPage.getActiveBreadCrumb())
                .then(activeBreadCrumb => assert.equal(activeBreadCrumb, 'STEP 1: Shipping'))
        );

        // Fill in Shipping Form
        it('should allow saving of Shipping form when required fields filled', () =>
            checkoutPage.fillOutShippingForm(shippingFormData)
                .then(() => checkoutPage.checkUseAsBillingAddress())
                .then(() => browser.isEnabled(checkoutPage.BTN_CONTINUE_SHIPPING_SAVE))
                .then(savable => assert.ok(savable))
        );

        it('should redirect to the Billing page after Shipping saved', () =>
            browser.click(checkoutPage.BTN_CONTINUE_SHIPPING_SAVE)
                .then(() => checkoutPage.getActiveBreadCrumb())
                .then(activeBreadCrumb => assert.equal(activeBreadCrumb, 'STEP 2: Billing'))
        );

        // Fill in Billing Form
        it('should allow saving of Billing Form when required fields filled', () =>
            checkoutPage.fillOutBillingForm(billingFormData)
                .then(() => browser.waitForExist(checkoutPage.BTN_CONTINUE_BILLING_SAVE))
                .then(() => browser.waitForEnabled(checkoutPage.BTN_CONTINUE_BILLING_SAVE))
                .then(() => browser.isEnabled(checkoutPage.BTN_CONTINUE_BILLING_SAVE))
                .then(enabled => assert.ok(enabled))
        );

        it('should redirect to the Place Order page after Billing saved', () =>
            browser.click(checkoutPage.BTN_CONTINUE_BILLING_SAVE)
                .then(() => checkoutPage.getActiveBreadCrumb())
                .then(activeBreadCrumb => assert.equal(activeBreadCrumb, 'STEP 3: Place Order'))
        );

        it('should enable the Place Order button when Place Order page reached', () =>
            browser.isEnabled(checkoutPage.BTN_PLACE_ORDER)
                .then(enabled => assert.ok(enabled))
        );

        it('should redirect to Order Confirmation page after a successful order submission', () =>
            browser.click(checkoutPage.BTN_PLACE_ORDER)
                .waitForVisible(orderConfPage.ORDER_CONF_DETAILS)
                .then(() => checkoutPage.getLabelOrderConfirmation())
                .then(title => assert.equal(title, successfulCheckoutTitle))
        );
    });

    describe('Checkout as Returning Customer', () => {

        before(() => addProductVariationMasterToCart()
            .then(() => checkoutPage.navigateTo())
            .then(() => formLogin.loginAsDefaultCustomer())
        );

        after(() => navHeader.logout());

        it('should allow check out as a returning customer', () => {
            let shippingFormData = {addressList: shippingData.addressList};
            return browser.waitForVisible(checkoutPage.BREADCRUMB_SHIPPING)
                .then(() => checkoutPage.fillOutShippingForm(shippingFormData))
                .then(() => checkoutPage.checkUseAsBillingAddress())
                .then(() => browser.waitForEnabled(checkoutPage.BTN_CONTINUE_SHIPPING_SAVE))
                .then(() => helpers.clickAndWait(checkoutPage.BTN_CONTINUE_SHIPPING_SAVE, checkoutPage.BREADCRUMB_BILLING))
                .then(() => checkoutPage.fillOutBillingForm(billingFormData))
                .then(() => browser.waitForEnabled(checkoutPage.BTN_CONTINUE_BILLING_SAVE))
                .then(() => helpers.clickAndWait(checkoutPage.BTN_CONTINUE_BILLING_SAVE, checkoutPage.BREADCRUMB_PLACE_ORDER))
                .then(() => helpers.clickAndWait(checkoutPage.BTN_PLACE_ORDER, orderConfPage.ORDER_CONF_DETAILS))
                .then(() => checkoutPage.getLabelOrderConfirmation())
                .then(title => assert.equal(title, successfulCheckoutTitle));
        });
    });

    describe('Checkout Gift Certificate as Returning Customer', () => {
        let giftCertFieldMap = {
            recipient: 'Joe Smith',
            recipientEmail: 'jsmith@someBogusEmailDomain.tv',
            confirmRecipientEmail: 'jsmith@someBogusEmailDomain.tv',
            message: 'Congratulations!',
            amount: '250'
        };
        before(() => homePage.navigateTo()
            .then(() => navHeader.login())
            .then(() => cartPage.emptyCart())
            .then(() => giftCertPage.navigateTo())
            .then(() => giftCertPage.fillOutGiftCertPurchaseForm(giftCertFieldMap))
            .then(() => giftCertPage.pressBtnAddToCart())
            .then(() => checkoutPage.navigateTo())
        );

        after(() => navHeader.logout());

        it('should allow check out as a returning customer', () => {
            return browser.waitForVisible(checkoutPage.BREADCRUMB_BILLING)
                .then(() => checkoutPage.fillOutBillingForm(billingFormData))
                .then(() => browser.waitForEnabled(checkoutPage.BTN_CONTINUE_BILLING_SAVE))
                .then(() => helpers.clickAndWait(checkoutPage.BTN_CONTINUE_BILLING_SAVE, checkoutPage.BREADCRUMB_PLACE_ORDER))
                .then(() => helpers.clickAndWait(checkoutPage.BTN_PLACE_ORDER, orderConfPage.ORDER_CONF_DETAILS))
                .then(() => checkoutPage.getLabelOrderConfirmation())
                .then(title => assert.equal(title, successfulCheckoutTitle));
        });

    });

    describe('Form Editing', () => {
        before(() => homePage.navigateTo()
            .then(() => navHeader.login())
            .then(() => cartPage.emptyCart())
            .then(() => addProductVariationMasterToCart())
            .then(() => checkoutPage.navigateTo())
            .then(() => {
                return {addressList: shippingData.addressList};
            })
            .then(shippingFormData => checkoutPage.fillOutShippingForm(shippingFormData))
            .then(() => browser.waitForValue(checkoutPage.SAVED_ADDRESSES_SELECT_MENU))
            .then(() => checkoutPage.checkUseAsBillingAddress())
            .then(() => browser.waitForEnabled(checkoutPage.BTN_CONTINUE_SHIPPING_SAVE))
            .then(() => helpers.clickAndWait(checkoutPage.BTN_CONTINUE_SHIPPING_SAVE, checkoutPage.BREADCRUMB_BILLING))
            .then(() => checkoutPage.fillOutBillingForm(billingFormData))
            .then(() => browser.waitForEnabled(checkoutPage.BTN_CONTINUE_BILLING_SAVE))
            .then(() => helpers.clickAndWait(checkoutPage.BTN_CONTINUE_BILLING_SAVE, checkoutPage.BREADCRUMB_PLACE_ORDER))
        );

        after(() => navHeader.logout());

        it('should allow editing of the Order Summary form', () => {
            return browser.click(checkoutPage.LINK_EDIT_ORDER_SUMMARY)
                .then(() => cartPage.updateQuantityByRow(1, 3))
                .then(() => helpers.clickAndWait(cartPage.BTN_CHECKOUT, checkoutPage.BREADCRUMB_SHIPPING))
                .then(() => helpers.clickAndWait(checkoutPage.BTN_CONTINUE_SHIPPING_SAVE, checkoutPage.BREADCRUMB_BILLING))
                .then(() => checkoutPage.fillOutBillingForm(billingFormData))
                .then(() => browser.waitForEnabled(checkoutPage.BTN_CONTINUE_BILLING_SAVE))
                .then(() => helpers.clickAndWait(checkoutPage.BTN_CONTINUE_BILLING_SAVE, checkoutPage.BREADCRUMB_PLACE_ORDER))
                .then(() => cartPage.getQuantityByRow(1))
                .then(updatedQuantity => assert.equal(updatedQuantity, '3'));
        });

        it('should show Shipping Address edits', () => {
            let address2 = 'Suite 100';
            return browser.waitForVisible(checkoutPage.BREADCRUMB_PLACE_ORDER)
                .then(() => helpers.clickAndWait(checkoutPage.LINK_EDIT_SHIPPING_ADDR, checkoutPage.BREADCRUMB_SHIPPING))
                .then(() => formHelpers.populateField('input[id*=address2]', address2, 'input'))
                .then(() => helpers.clickAndWait(checkoutPage.BTN_CONTINUE_SHIPPING_SAVE, checkoutPage.BREADCRUMB_BILLING))
                .then(() => checkoutPage.fillOutBillingForm(billingFormData))
                .then(() => browser.waitForEnabled(checkoutPage.BTN_CONTINUE_BILLING_SAVE))
                .then(() => helpers.clickAndWait(checkoutPage.BTN_CONTINUE_BILLING_SAVE, checkoutPage.BREADCRUMB_PLACE_ORDER))
                .then(() => browser.getText(checkoutPage.MINI_SHIPPING_ADDR_DETAILS))
                .then(shippingAddr => assert.isAbove(shippingAddr.indexOf(address2), -1));
        });

        it('should show Billing Address edits', () => {
            let address2 = 'Apt. 1234';
            return helpers.clickAndWait(checkoutPage.LINK_EDIT_BILLING_ADDR, checkoutPage.BREADCRUMB_BILLING)
                .then(() => formHelpers.populateField('input[id*=address2]', address2, 'input'))
                .then(() => browser.waitForValue('[id*=address2]', 5000))
                .then(() => browser.waitForEnabled(checkoutPage.BTN_CONTINUE_BILLING_SAVE))
                .then(() => helpers.clickAndWait(checkoutPage.BTN_CONTINUE_BILLING_SAVE, checkoutPage.BREADCRUMB_PLACE_ORDER))
                .then(() => browser.getText(checkoutPage.MINI_BILLING_ADDR_DETAILS))
                .then(billingAddr => assert.isAbove(billingAddr.indexOf(address2), -1));
        });

        it('should show Payment Method edits', () => {
            let paymentMethodLabel = 'Pay Pal';
            return browser.waitForVisible(checkoutPage.BREADCRUMB_PLACE_ORDER)
                .then(() => helpers.clickAndWait(checkoutPage.LINK_EDIT_PMT_METHOD, checkoutPage.BREADCRUMB_BILLING))
                .then(() => browser.click(checkoutPage.RADIO_BTN_PAYPAL))
                .then(() => browser.waitForEnabled(checkoutPage.BTN_CONTINUE_BILLING_SAVE))
                .then(() => helpers.clickAndWait(checkoutPage.BTN_CONTINUE_BILLING_SAVE, checkoutPage.BREADCRUMB_PLACE_ORDER))
                .then(() => browser.getText(checkoutPage.MINI_PMT_METHOD_DETAILS))
                .then(paymentMethod => assert.isAbove(paymentMethod.indexOf(paymentMethodLabel), -1));
        });
    });
});

'use strict';

import _ from 'lodash';
import {assert} from 'chai';

import * as checkoutPage from '../pageObjects/checkout';
import * as orderConfPage from '../pageObjects/orderConfirmation';
import * as productDetailPage from '../pageObjects/productDetail';
import * as testData from '../pageObjects/testData/main';

describe('Checkout with Discover Card', () => {
    let login = 'testuser1@demandware.com';
    let shippingData = {};
    let billingFormData = {};
    let successfulCheckoutTitle = 'Thank you for your order.';

    before(() =>
        testData.load()
            .then(() => testData.getCustomerByLogin(login))
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
                    creditCard_owner: customer.firstName + ' ' + customer.lastName,
                    creditCard_type: testData.creditCard2.cardType,
                    creditCard_number: testData.creditCard2.number,
                    creditCard_expiration_year: testData.creditCard2.yearIndex,
                    creditCard_cvn: testData.creditCard2.cvn
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

    it('should verify that Discover is available as a credit card option', () =>
        checkoutPage.pressBtnCheckoutAsGuest()
            .then(() => checkoutPage.fillOutShippingForm(shippingFormData))
            .then(() => checkoutPage.checkUseAsBillingAddress())
        .then(() => browser.click(checkoutPage.BTN_CONTINUE_SHIPPING_SAVE))
        .then(() => browser.isExisting(checkoutPage.DISCOVER_CARD))
            .then(doesExist => assert.isTrue(doesExist))
    );

    // Fill in Billing Form
    it('should allow checking out with the Discover card', () =>
        checkoutPage.fillOutBillingForm(billingFormData)
        .then(() => browser.waitForExist(checkoutPage.BTN_CONTINUE_BILLING_SAVE))
        .then(() => browser.waitForEnabled(checkoutPage.BTN_CONTINUE_BILLING_SAVE))
        .then(() => browser.click(checkoutPage.BTN_CONTINUE_BILLING_SAVE))
        .then(() => browser.click(checkoutPage.BTN_PLACE_ORDER)
                .waitForVisible(orderConfPage.ORDER_CONF_DETAILS)
                .then(() => checkoutPage.getLabelOrderConfirmation())
                .then(title => assert.equal(title, successfulCheckoutTitle)))
    );

});

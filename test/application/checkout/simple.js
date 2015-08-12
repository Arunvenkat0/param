'use strict';

import _ from 'lodash';
import {assert} from 'chai';

import client from '../webdriver/client';
import * as cartPage from '../webdriver/pageObjects/cart';
import * as checkoutPage from '../webdriver/pageObjects/checkout';
import * as homePage from '../webdriver/pageObjects/home';
import * as orderConfPage from '../webdriver/pageObjects/orderConfirmation';
import * as productDetailPage from '../webdriver/pageObjects/productDetail';
import * as testData from '../webdriver/pageObjects/testData/main';
import * as formLogin from '../webdriver/pageObjects/helpers/forms/login';
import * as formHelpers from '../webdriver/pageObjects/helpers/forms/common';
import * as navHeader from '../webdriver/pageObjects/navHeader';

describe('Checkout', () => {
	let login = 'testuser1@demandware.com';
	let shippingData = {};
	let billingFormData = {};
	let successfulCheckoutTitle = 'Thank you for your order.';

	before(() =>
		client.init()
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
					creditCard_number: testData.creditCard1.number,
					creditCard_expiration_year: testData.creditCard1.yearIndex,
					creditCard_cvn: testData.creditCard1.cvn
				};
			})
			.then(() => Promise.resolve())
	);

	after(() => client.end());

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
				.then(() => client.isEnabled(checkoutPage.BTN_CONTINUE_SHIPPING_SAVE))
				.then(savable => assert.ok(savable))
		);

		it('should redirect to the Billing page after Shipping saved', () =>
			client.click(checkoutPage.BTN_CONTINUE_SHIPPING_SAVE)
				.then(() => checkoutPage.getActiveBreadCrumb())
				.then(activeBreadCrumb => assert.equal(activeBreadCrumb, 'STEP 2: Billing'))
		);

		// Fill in Billing Form
		it('should allow saving of Billing Form when required fields filled', () =>
			checkoutPage.fillOutBillingForm(billingFormData)
				.then(() => client.waitForExist(checkoutPage.BTN_CONTINUE_BILLING_SAVE))
				.then(() => client.waitForEnabled(checkoutPage.BTN_CONTINUE_BILLING_SAVE))
				.then(() => client.isEnabled(checkoutPage.BTN_CONTINUE_BILLING_SAVE))
				.then(enabled => assert.ok(enabled))
		);

		it('should redirect to the Place Order page after Billing saved', () =>
			client.click(checkoutPage.BTN_CONTINUE_BILLING_SAVE)
				.then(() => checkoutPage.getActiveBreadCrumb())
				.then(activeBreadCrumb => assert.equal(activeBreadCrumb, 'STEP 3: Place Order'))
		);

		it('should enable the Place Order button when Place Order page reached', () =>
			client.isEnabled(checkoutPage.BTN_PLACE_ORDER)
				.then(enabled => assert.ok(enabled))
		);

		it('should redirect to Order Confirmation page after a successful order submission', () =>
			client.click(checkoutPage.BTN_PLACE_ORDER)
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
			return client.waitForVisible(checkoutPage.BREADCRUMB_SHIPPING)
				.then(() => checkoutPage.fillOutShippingForm(shippingFormData))
				.then(() => checkoutPage.checkUseAsBillingAddress())
				.then(() => client.waitForEnabled(checkoutPage.BTN_CONTINUE_SHIPPING_SAVE))
				.then(() => client.click(checkoutPage.BTN_CONTINUE_SHIPPING_SAVE))
				.then(() => client.waitForVisible(checkoutPage.BREADCRUMB_BILLING))
				.then(() => checkoutPage.fillOutBillingForm(billingFormData))
				.then(() => client.waitForEnabled(checkoutPage.BTN_CONTINUE_BILLING_SAVE))
				.then(() => client.click(checkoutPage.BTN_CONTINUE_BILLING_SAVE))
				.then(() => client.waitForVisible(checkoutPage.BREADCRUMB_PLACE_ORDER))
				.then(() => client.click(checkoutPage.BTN_PLACE_ORDER))
				.then(() => client.waitForVisible(orderConfPage.ORDER_CONF_DETAILS))
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
			.then(() => client.waitForValue(checkoutPage.SAVED_ADDRESSES_SELECT_MENU))
			.then(() => checkoutPage.checkUseAsBillingAddress())
			.then(() => client.waitForEnabled(checkoutPage.BTN_CONTINUE_SHIPPING_SAVE))
			.then(() => client.click(checkoutPage.BTN_CONTINUE_SHIPPING_SAVE))
			.then(() => client.waitForVisible(checkoutPage.BREADCRUMB_BILLING))
			.then(() => checkoutPage.fillOutBillingForm(billingFormData))
			.then(() => client.click(checkoutPage.BTN_CONTINUE_BILLING_SAVE))
			.then(() => client.waitForVisible(checkoutPage.BREADCRUMB_PLACE_ORDER))
		);

		after(() => navHeader.logout());

		it('should allow editing of the Order Summary form', () => {
			let updatedSubtotal;
			return client.click(checkoutPage.LINK_EDIT_ORDER_SUMMARY)
				.then(() => cartPage.updateQuantityByRow(1, 3))
				.then(() => cartPage.getOrderSubTotal())
				.then(subtotal => updatedSubtotal = subtotal)
				.then(() => client.click(cartPage.BTN_CHECKOUT))
				.then(() => client.waitForVisible(checkoutPage.BREADCRUMB_SHIPPING))
				.then(() => checkoutPage.checkUseAsBillingAddress())
				.then(() => client.click(checkoutPage.BTN_CONTINUE_SHIPPING_SAVE))
				.then(() => client.waitForVisible(checkoutPage.BREADCRUMB_BILLING))
				.then(() => checkoutPage.fillOutBillingForm(billingFormData))
				.then(() => client.click(checkoutPage.BTN_CONTINUE_BILLING_SAVE))
				.then(() => client.waitForVisible(checkoutPage.BREADCRUMB_PLACE_ORDER))
				.then(() => checkoutPage.getOrderSubTotal())
				.then(subtotal => assert.equal(subtotal, updatedSubtotal));
		});

		it('should show Shipping Address edits', () => {
			let address2 = 'Suite 100';
			return client.waitForVisible(checkoutPage.BREADCRUMB_PLACE_ORDER)
				.then(() => client.click(checkoutPage.LINK_EDIT_SHIPPING_ADDR))
				.then(() => client.waitForVisible(checkoutPage.BREADCRUMB_SHIPPING))
				.then(() => formHelpers.populateField('input[id*=address2]', address2, 'input'))
				.then(() => client.click(checkoutPage.BTN_CONTINUE_SHIPPING_SAVE))
				.then(() => client.waitForVisible(checkoutPage.BREADCRUMB_BILLING))
				.then(() => checkoutPage.fillOutBillingForm(billingFormData))
				.then(() => client.click(checkoutPage.BTN_CONTINUE_BILLING_SAVE))
				.then(() => client.waitForVisible(checkoutPage.BREADCRUMB_PLACE_ORDER))
				.then(() => client.getText(checkoutPage.MINI_SHIPPING_ADDR_DETAILS))
				.then(shippingAddr => assert.isAbove(shippingAddr.indexOf(address2), -1));
		});

		it('should show Billing Address edits', () => {
			let address2 = 'Apt. 1234';
			return client.click(checkoutPage.LINK_EDIT_BILLING_ADDR)
				.waitForVisible(checkoutPage.BREADCRUMB_BILLING)
				.then(() => checkoutPage.fillOutBillingForm(billingFormData))
				.then(() => formHelpers.populateField('input[id*=address2]', address2, 'input'))
				.then(() => client.waitForValue('[id*=address2]', 5000))
				.then(() => client.click(checkoutPage.BTN_CONTINUE_BILLING_SAVE))
				.then(() => client.waitForVisible(checkoutPage.BREADCRUMB_PLACE_ORDER))
				.then(() => client.getText(checkoutPage.MINI_BILLING_ADDR_DETAILS))
				.then(billingAddr => assert.isAbove(billingAddr.indexOf(address2), -1));
		});

		it('should show Payment Method edits', () => {
			let paymentMethodLabel = 'Pay Pal';
			return client.waitForVisible(checkoutPage.BREADCRUMB_PLACE_ORDER)
				.click(checkoutPage.LINK_EDIT_PMT_METHOD)
				.waitForVisible(checkoutPage.BREADCRUMB_BILLING)
				.then(() => client.click(checkoutPage.RADIO_BTN_PAYPAL))
				.then(() => client.click(checkoutPage.BTN_CONTINUE_BILLING_SAVE))
				.then(() => client.waitForVisible(checkoutPage.BREADCRUMB_PLACE_ORDER))
				.then(() => client.getText(checkoutPage.MINI_PMT_METHOD_DETAILS))
				.then(pmtMethod => assert.isAbove(pmtMethod.indexOf(paymentMethodLabel), -1));
		});
	});
});

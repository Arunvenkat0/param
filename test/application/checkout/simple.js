'use strict';

import {assert} from 'chai';

import client from '../webdriver/client';
import * as checkoutPage from '../webdriver/pageObjects/checkout';
import * as cartPage from '../webdriver/pageObjects/cart';
import * as homePage from '../webdriver/pageObjects/home';
import * as productDetailPage from '../webdriver/pageObjects/productDetail';
import * as testData from '../webdriver/pageObjects/testData/main';
import * as formLogin from '../webdriver/pageObjects/forms/login';
import * as formHelpers from '../webdriver/pageObjects/forms/helpers';
import * as navHeader from '../webdriver/pageObjects/navHeader';

describe('Checkout', () => {
	let resourcePath;
	let customer;
	let login = 'testuser1@demandware.com';
	let address;
	let productVariationMaster;
	let shippingFormData = new Map();
	let billingFormData = new Map();
	let successfulCheckoutTitle = 'Thank you for your order.';

	before(() => client.init());

	after(() => client.end());

	before(() => {
		return testData.getCustomerByLogin(login)
			.then(cust => {
				customer = cust;

				address = customer.getPreferredAddress();

				shippingFormData.set('firstName', customer.firstName);
				shippingFormData.set('lastName', customer.lastName);
				shippingFormData.set('address1', address.address1);
				shippingFormData.set('country', address.countryCode);
				shippingFormData.set('states_state', address.stateCode);
				shippingFormData.set('city', address.city);
				shippingFormData.set('postal', address.postalCode);
				shippingFormData.set('phone', address.phone);

				billingFormData.set('emailAddress', customer.email);
				billingFormData.set('creditCard_owner', customer.firstName + ' ' + customer.lastName);
				billingFormData.set('creditCard_number', testData.creditCard1.number);
				billingFormData.set('creditCard_year', testData.creditCard1.yearIndex);
				billingFormData.set('creditCard_cvn', testData.creditCard1.cvn);
			});
	});

	function addProductVariationMasterToCart () {
		return testData.getProductVariationMaster()
			.then(variationMaster => productVariationMaster = variationMaster)
			.then(() => resourcePath = productVariationMaster.getUrlResourcePath())
			.then(() => {
				let product = new Map();
				product.set('resourcePath', resourcePath);
				product.set('colorIndex', 1);
				product.set('sizeIndex', 2);
				product.set('widthIndex', 1);
				return product;
			})
			.then(product => productDetailPage.addProductVariationToCart(product));
	}

	describe('Checkout as Guest', () => {
		before(() => addProductVariationMasterToCart());
		before(() => checkoutPage.navigateTo());

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
				.then(() => checkoutPage.getLabelOrderConfirmation())
				.then(title => assert.equal(title, successfulCheckoutTitle))
		);
	});

	describe('Checkout as Returning Customer', () => {
		before(() => addProductVariationMasterToCart());
		before(() => checkoutPage.navigateTo());
		before(() => formLogin.loginAsDefaultCustomer());

		after(() => navHeader.logout());

		it('should allow check out as a returning customer', () => {
			return checkoutPage.fillOutShippingForm(shippingFormData)
				.then(() => checkoutPage.checkUseAsBillingAddress())
				.then(() => client.click(checkoutPage.BTN_CONTINUE_SHIPPING_SAVE))
				.then(() => checkoutPage.fillOutBillingForm(billingFormData))
				.then(() => client.click(checkoutPage.BTN_CONTINUE_BILLING_SAVE))
				.then(() => client.click(checkoutPage.BTN_PLACE_ORDER))
				.then(() => checkoutPage.getLabelOrderConfirmation())
				.then(title => assert.equal(title, successfulCheckoutTitle));
		});
	});

	describe('Form Editing', () => {
		before(() => homePage.navigateTo());
		before(() => navHeader.login());
		before(() => cartPage.emptyCart());
		before(() => addProductVariationMasterToCart());
		before(() => checkoutPage.navigateTo());
		before(() => checkoutPage.fillOutShippingForm(shippingFormData));
		before(() => client.click(checkoutPage.BTN_CONTINUE_SHIPPING_SAVE));
		before(() => checkoutPage.fillOutBillingForm(billingFormData));
		before(() => client.click(checkoutPage.BTN_CONTINUE_BILLING_SAVE));

		after(() => navHeader.logout());

		it('should allow editing of the Order Summary form', () => {
			let updatedSubtotal;

			return client.click(checkoutPage.LINK_EDIT_ORDER_SUMMARY)
				.then(() => cartPage.updateQuantityByRow(1, 3))
				.then(() => client.click(cartPage.BTN_UPDATE_CART))
				.then(() => cartPage.getOrderSubTotal())
				.then(subtotal => updatedSubtotal = subtotal)
				.then(() => client.click(cartPage.BTN_CHECKOUT))
				.then(() => checkoutPage.getOrderSubTotal())
				.then(subtotal => assert.equal(subtotal, updatedSubtotal));
		});

		it('should show Shipping Address edits', () => {
			let address2 = 'Suite 100';
			return client.click(checkoutPage.LINK_EDIT_SHIPPING_ADDR)
				.then(() => formHelpers.populateField('input[id$="address2"]', address2, 'input'))
				.then(() => client.click(checkoutPage.BTN_CONTINUE_SHIPPING_SAVE))
				.then(() => checkoutPage.fillOutBillingForm(billingFormData))
				.then(() => client.click(checkoutPage.BTN_CONTINUE_BILLING_SAVE))
				.then(() => client.getText(checkoutPage.MINI_SHIPPING_ADDR_DETAILS))
				.then(shippingAddr => assert.isAbove(shippingAddr.indexOf(address2), -1));
		});

		it('should show Billing Address edits', () => {
			let address2 = 'Apt. 1234';
			return client.click(checkoutPage.LINK_EDIT_BILLING_ADDR)
				.then(() => formHelpers.populateField('input[id$="address2"]', address2, 'input'))
				.then(() => checkoutPage.fillOutBillingForm(billingFormData))
				.then(() => client.click(checkoutPage.BTN_CONTINUE_BILLING_SAVE))
				.then(() => client.getText(checkoutPage.MINI_BILLING_ADDR_DETAILS))
				.then(billingAddr => assert.isAbove(billingAddr.indexOf(address2), -1));
		});

		it('should show Payment Method edits', () => {
			let paymentMethodLabel = 'Pay Pal';
			return client.click(checkoutPage.LINK_EDIT_PMT_METHOD)
				.then(client.click(checkoutPage.RADIO_BTN_PAYPAL))
				.then(() => client.click(checkoutPage.BTN_CONTINUE_BILLING_SAVE))
				.then(() => client.getText(checkoutPage.MINI_PMT_METHOD_DETAILS))
				.then(pmtMethod => assert.isAbove(pmtMethod.indexOf(paymentMethodLabel), -1));
		});
	});
});

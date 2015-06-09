'use strict';

import {assert} from 'chai';

import client from '../webdriver/client';
import * as checkoutPage from '../webdriver/pageObjects/checkout';
import * as productDetailPage from '../webdriver/pageObjects/productDetail';
import * as testData from '../webdriver/pageObjects/testData/main';

describe('Checkout', () => {
	let resourcePath;
	let customer;
	let login = 'testuser1@demandware.com';
	let address;
	let productVariationMaster;
	let shippingFormData = new Map();
	let billingFormData = new Map();

	before(() => client.init());

	after(() => client.end());

	before(() => {
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
			.then(product =>
				productDetailPage.addProductVariationToCart(product)
					.then(() => checkoutPage.navigateTo())
			);
	});

	before(() => {
		return testData.getCustomerByLoginPromise(login)
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

	describe('Checkout as Guest', () => {
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
				.then(title => assert.equal(title, 'Thank you for your order.'))
		);
	});

});

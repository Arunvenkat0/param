'use strict';

import {assert} from 'chai';

import client from '../webdriver/client';
import * as coModule from '../webdriver/pageObjects/checkout';
import * as pdpModule from '../webdriver/pageObjects/productDetail';

var checkoutPage = new coModule.CheckoutPage(client);
var productDetailPage = new pdpModule.ProductDetailPage(client);


describe('Checkout Simple Product', () => {
	var shippingFormData = new Map();
	shippingFormData.set('firstName', 'John');
	shippingFormData.set('lastName', 'Smith');
	shippingFormData.set('address1', '5 Wall St');
	shippingFormData.set('country', 'US');
	shippingFormData.set('states_state', 'MA');
	shippingFormData.set('city', 'Burlington');
	shippingFormData.set('postal', '01803');
	shippingFormData.set('phone', '7814251267');

	var billingFormData = new Map();
	billingFormData.set('emailAddress', 'jsmith@demandware.com');
	billingFormData.set('creditCard_owner', 'John Smith');
	billingFormData.set('creditCard_number', '4111111111111111');
	billingFormData.set('creditCard_year', 2);
	billingFormData.set('creditCard_cvn', '987');

	before(() => {
		var resourcePath = '/mens/clothing/pants/82916781.html?dwvar_82916781_color=BDA';
		var sizeIndex = 2;

		var standardProduct = new Map();
		standardProduct.set('resourcePath', resourcePath);
		standardProduct.set('sizeIndex', sizeIndex);

		return client.init()
			.then(() => productDetailPage.addProductVariationToCart(standardProduct))
			.then(() => checkoutPage.navigateTo());
	});

	after(() => client.end());

	it('should allow checkout as guest', () =>
		checkoutPage.pressBtnCheckoutAsGuest()
			/**
			 * attribute may come back as "step-1 active" or
			 * "step-1 inactive".  If the latter,
			 * assert.include(attribute, 'active') still
			 * resolves as true.  Splitting the string into an array
			 * correctly evaluates the condition.
			 */
			.then(() => checkoutPage.getActiveBreadCrumb())
			.then(activeBreadCrumb => assert.equal(activeBreadCrumb, 'STEP 1: Shipping'))
	);

	// Fill in Shipping Form
	it('should allow saving of Shipping form when required fields filled', () =>
		checkoutPage.fillOutShippingForm(shippingFormData)
			.then(() => checkoutPage.checkUseAsBillingAddress())
			.then(() => client.isEnabled(coModule.BTN_CONTINUE_SHIPPING_SAVE))
			.then(savable => assert.ok(savable))
	);

	it('should redirect to the Billing page after Shipping saved', () =>
		client.click(coModule.BTN_CONTINUE_SHIPPING_SAVE)
			.then(() => checkoutPage.getActiveBreadCrumb())
			.then(activeBreadCrumb => assert.equal(activeBreadCrumb, 'STEP 2: Billing'))
	);

	// Fill in Billing Form
	it('should allow saving of Billing Form when required fields filled', () =>
		checkoutPage.fillOutBillingForm(billingFormData)
			.then(() => client.isEnabled(coModule.BTN_CONTINUE_BILLING_SAVE))
			.then(enabled => assert.ok(enabled))
	);

	it('should redirect to the Place Order page after Billing saved', () =>
		client.click(coModule.BTN_CONTINUE_BILLING_SAVE)
			.then(() => checkoutPage.getActiveBreadCrumb())
			.then(activeBreadCrumb => assert.equal(activeBreadCrumb, 'STEP 3: Place Order'))
	);

	it('should enable the Place Order button when Place Order page reached', () =>
		client.isEnabled(coModule.BTN_PLACE_ORDER)
			.then(enabled => assert.ok(enabled))
	);

	it('should redirect to Order Confirmation page after a successful order submission', () =>
		client.click(coModule.BTN_PLACE_ORDER)
			.then(() => checkoutPage.getLabelOrderConfirmation())
			.then(title => assert.equal(title, 'Thank you for your order.'))
	);
});

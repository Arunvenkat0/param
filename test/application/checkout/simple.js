'use strict';

var assert = require('chai').assert;
var client = require('../webdriver/client');
var config = require('../webdriver/config');
var CheckoutPage = require('../webdriver/pageObjects/checkout');
var checkoutPage = new CheckoutPage(client);
var ProductDetailPage = require('../webdriver/pageObjects/productDetail');
var productDetailPage = new ProductDetailPage(client);


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
			.then(() => client.isEnabled(checkoutPage.btnContinueShippingSave))
			.then(savable => assert.ok(savable))
	);

	it('should redirect to the Billing page after Shipping saved', () =>
		client.click(checkoutPage.btnContinueShippingSave)
			.then(() => checkoutPage.getActiveBreadCrumb())
			.then(activeBreadCrumb => assert.equal(activeBreadCrumb, 'STEP 2: Billing'))
	);

	// Fill in Billing Form
	it('should allow saving of Billing Form when required fields filled', () =>
		checkoutPage.fillOutBillingForm(billingFormData)
			// click outside to enable continue button
			.then(() => client.isEnabled(checkoutPage.btnContinueBillingSave))
			.then(enabled => assert.ok(enabled))
	);

	it('should redirect to the Place Order page after Billing saved', () =>
		client.click(checkoutPage.btnContinueBillingSave)
			.then(() => checkoutPage.getActiveBreadCrumb())
			.then(activeBreadCrumb => assert.equal(activeBreadCrumb, 'STEP 3: Place Order'))
	);

	it('should enable the Place Order button when Place Order page reached', () =>
		client.isEnabled(checkoutPage.btnPlaceOrder)
			.then(enabled => assert.ok(enabled))
	);

	it('should redirect to Order Confirmation page after a successful order submission', () =>
		client.click(checkoutPage.btnPlaceOrder)
			.then(() => checkoutPage.getLabelOrderConfirmation())
			//.then(() => client.getText(checkoutPage.labelOrderThankYou))
			.then(title => assert.equal(title, 'Thank you for your order.'))
	);
});

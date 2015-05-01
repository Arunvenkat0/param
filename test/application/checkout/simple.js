'use strict';

var assert = require('chai').assert;
var client = require('../webdriver/client');
var config = require('../webdriver/config');
var loggingLevel = 'info';
var CheckoutPage = require('../webdriver/pageObjects/checkoutPage');
var checkoutPage = new CheckoutPage(client, loggingLevel);
var ProductDetailPage = require('../webdriver/pageObjects/productDetailPage');
var productDetailPage = new ProductDetailPage(client, loggingLevel);


describe.only('Checkout Simple Product', function () {
	var shippingFields = new Map();
	shippingFields.set('firstName', 'John');
	shippingFields.set('lastName', 'Smith');
	shippingFields.set('address1', '5 Wall St');
	shippingFields.set('country', 'US');
	shippingFields.set('states_state', 'MA');
	shippingFields.set('city', 'Burlington');
	shippingFields.set('postal', '01803');
	shippingFields.set('phone', '7814251267');

	var billingFields = new Map();
	billingFields.set('emailAddress', 'jsmith@demandware.com');
	billingFields.set('creditCard_owner', 'John Smith');
	billingFields.set('creditCard_number', '4111111111111111');
	billingFields.set('creditCard_year', 2);
	billingFields.set('creditCard_cvn', '987');

	before(() => {
		var resourcePath = '/mens/clothing/pants/82916781.html?dwvar_82916781_color=BDA';
		var sizeIndex = 2;

		var standardProduct = new Map();
		standardProduct.set('resourcePath', resourcePath);
		standardProduct.set('sizeIndex', sizeIndex);

		return client.init()
			// Performs tasks to add to car through one combined call:
			.then(() => productDetailPage.addProductVariationToCart(standardProduct))

			// OR, through granular calls:
			//.then(() => productDetailPage.navigateTo(resourcePath))
			//.then(() => productDetailPage.selectSizeByIndex(sizeIndex))
			//.then(() => productDetailPage.isAddToCartEnabled())
			//.then(() => productDetailPage.pressBtnAddToCart())

			.then(() => checkoutPage.navigateTo());
	});

	after(() => client.end());

	it('should allow checkout as guest', () =>
		checkoutPage.checkoutAsGuest()
			/**
			 * attribute may come back as "step-1 active" or
			 * "step-1 inactive".  If the latter,
			 * assert.include(attribute, 'active') still
			 * resolves as true.  Splitting the string into an array
			 * correctly evaluates the condition.
			 */
			.then(attribute => assert.include(attribute.split(' '), 'active'))
	);

	// Fill in Shipping Form
	it('should allow saving of Shipping form when required fields filled', () =>
		checkoutPage.fillOutShippingForm(shippingFields)
			.then(() => checkoutPage.checkUseAsBillingAddress())
			.then(() => checkoutPage.canSaveShippingAddress())
			.then(savable => assert.ok(savable))
	);

	it('should redirect to the Billing page after Shipping saved', () =>
		checkoutPage.saveShippingAddress()
			.then(() => checkoutPage.hasShippingAddressBeenSaved())
			.then(billingStepActive => assert.include(billingStepActive.split(' '), 'active'))
	);

	// Fill in Billing Form
	it('should allow saving of Billing Form when required fields filled', () =>
		checkoutPage.fillOutBillingForm(billingFields)
			// click outside to enable continue button
			.then(() => checkoutPage.isBillingContinueButtonEnabled())
			.then(enabled => assert.ok(enabled))
	);

	it('should redirect to the Place Order page after Billing saved', () =>
		checkoutPage.pressBillingContinueBtn()
			.then(() => checkoutPage.isBillingInfoSaved())
			.then(attribute =>assert.include(attribute.split(' '), 'active'))
	);

	it('should enable the Place Order when Place Order page reached', () =>
		checkoutPage.isPlaceOrderButtonEnabled()
			.then(enabled => assert.ok(enabled))
	);

	it('should redirect to Order Confirmation page after a successful order submission', () =>
		checkoutPage.clickSubmitButtion()
			.then(() => checkoutPage.isOrderSubmitted())
			.then(title => assert.equal(title, 'Thank you for your order.'))
	);

	describe('another test suite', () => {});
});

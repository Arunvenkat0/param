'use strict';

import {assert} from 'chai';
import client from '../webdriver/client';

import * as formLogin from '../pageObjects/helpers/forms/login';
import * as multiShipPage from '../pageObjects/multiship';
import * as testData from '../pageObjects/testData/main';
import Resource from '../../mocks/dw/web/Resource';

describe('Multi Shipping', () => {
	let login = 'testuser1@demandware.com';
	let billingFormData = {};

	let shipmentText1 = Resource.msgf('multishippingshipments.shipment','checkout',null, 1);
	let shipmentText2 = Resource.msgf('multishippingshipments.shipment','checkout',null, 2);

	before(() => client.init()
		.then(() => testData.load())
		.then(() => testData.getCustomerByLogin(login))
		.then(customer => {

			billingFormData = {
				creditCard_owner: customer.firstName + ' ' + customer.lastName,
				creditCard_number: testData.creditCard1.number,
				creditCard_expiration_year: testData.creditCard1.yearIndex,
				creditCard_cvn: testData.creditCard1.cvn
			};

		})
		.then(() => multiShipPage.addProductVariationMasterToCart(1, 2, 1))
		.then(() => multiShipPage.addProductVariationMasterToCart(1, 5, 1))
		.then(() => multiShipPage.navigateTo())
		.then(() => formLogin.loginAsDefaultCustomer())
	);

	after(() => client.end());

	it('Should be on the checkout page', () =>
		client.waitForVisible(multiShipPage.CHECKOUT_MULTI_SHIP)
		.then(() => client.isVisible(multiShipPage.CHECKOUT_MULTI_SHIP))
		.then(visible => assert.isTrue(visible))
	);

	it('Should go to multi shipping page then select addresses', () =>
		client.click(multiShipPage.BTN_CHECKOUT_MULTI_SHIP)
			.then(() => client.waitForVisible(multiShipPage.CHECKOUT_ADDRESS_DROPDOWN))
			.then(() => client.selectByIndex(multiShipPage.SELECT_ADDRESS_LIST_1, 1))
			.then(() => client.selectByIndex(multiShipPage.SELECT_ADDRESS_LIST_2, 2))
			.then(() => client.isEnabled(multiShipPage.BTN_CHECKOUT_CONTINUE))
			.then(enabled => assert.isTrue(enabled))
	);

	it('Should go to shipping methods then make sure shipment one exists', () =>
		client.click(multiShipPage.BTN_CHECKOUT_CONTINUE)
			.then(() => client.waitForVisible(multiShipPage.CHECKOUT_STEP_TWO))
			.then(() => client.getText(multiShipPage.SHIPPMENT_HEADER_1))
			.then(headerText => assert.equal(headerText, shipmentText1.toUpperCase()))
	);

	it('Should check that shipment two exists', () =>
		client.getText(multiShipPage.SHIPPMENT_HEADER_2)
			.then(headerText => assert.equal(headerText, shipmentText2.toUpperCase()))
	);

	it('Should select shipping methods for shipments then go to billing page', () =>
		client.selectByValue(multiShipPage.SHIPPMENT_METHOD_1, '002')
			.then(() => client.selectByValue(multiShipPage.SHIPPMENT_METHOD_2, '003'))
			.then(() => client.click(multiShipPage.BTN_CHECKOUT_CONTINUE))
			.then(() => client.waitForVisible(multiShipPage.CHECKOUT_STEP_THREE))
			.then(() => client.isVisible(multiShipPage.CHECKOUT_STEP_THREE))
			.then(doesExist => assert.isTrue(doesExist))
	);

	it('Should fill out the billing form', () =>
		multiShipPage.fillBillingForm(billingFormData)
			.then(() => client.waitUntil(() =>
				client.isEnabled(multiShipPage.BTN_CHECKOUT_CONTINUE)
					.then(enabled => enabled === true)
			))
			.then(() => client.isEnabled(multiShipPage.BTN_CHECKOUT_CONTINUE))
			.then(enabled => assert.isTrue(enabled))
	);

	it('Should place order', () =>
		client.click(multiShipPage.BTN_CHECKOUT_CONTINUE)
			.then(() => client.waitForVisible(multiShipPage.CHECKOUT_STEP_FOUR))
			.then(() => client.click(multiShipPage.BTN_CHECKOUT_PLACE_ORDER))
			.then(() => client.isVisible(multiShipPage.CHECKOUT_CONFIRMATION))
			.then(doesExist => assert.isTrue(doesExist))
	);
});

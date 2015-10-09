'use strict';

import {assert} from 'chai';
import client from '../webdriver/client';
import * as paymentSettingsPage from '../pageObjects/paymentSettings';
import * as testData from '../pageObjects/testData/main';
import * as loginForm from '../pageObjects/helpers/forms/login';
import Resource from '../../mocks/dw/web/Resource';


describe('Payment Settings', () => {
	let login = 'testuser1@demandware.com';
	let amexCardData = {};
	let customer;

	before(() => client.init()
		.then(() => testData.load())
		.then(() => testData.getCustomerByLogin(login))
		.then(cust => {
			customer = cust;
			amexCardData = {
				owner: customer.firstName + ' ' + customer.lastName,
				type: 'Amex',
				number: '371449635398431',
				expiration_year: testData.creditCard1.yearIndex
			};
			return Promise.resolve(amexCardData);
		})
		.then(() => paymentSettingsPage.navigateTo())
		.then(() => loginForm.loginAsDefaultCustomer())
		.then(() => client.waitForVisible(paymentSettingsPage.LINK_ADD_CREDIT_CARD))
	);

	after(() => client.end());

	it('should bring up the new credit card form', () =>
		client.click(paymentSettingsPage.LINK_ADD_CREDIT_CARD)
			.then(() => client.waitForVisible(paymentSettingsPage.FORM_CREDIT_CARD))
			.then(() => client.isVisible(paymentSettingsPage.FORM_CREDIT_CARD))
			.then(visible => assert.isTrue(visible))
	);

	it('should fill out form to add an Amex Card', () => {
		let deleteCard = Resource.msg('account.paymentinstrumentlist.deletecard', 'account', null);
		return paymentSettingsPage.fillOutCreditCardForm(amexCardData)
			.then(() => client.click(paymentSettingsPage.BTN_CREATE_CARD))
			.then(() => client.waitForVisible(paymentSettingsPage.AMEX_CREDIT_CARD))
			.then(() => client.getText(paymentSettingsPage.AMEX_CREDIT_CARD))
			.then(displayText => assert.equal(displayText, `${customer.firstName} ${customer.lastName}\nAmex\n***********8431\nExp. 01.2016\n` + deleteCard));
	});

	it('should delete all of the credit Cards', () =>
		paymentSettingsPage.deleteAllCreditCards()
			.then(() => client.waitUntil(() =>
				client.isExisting(paymentSettingsPage.CREDIT_CARD_SELECTOR)
					.then(doesExist => doesExist === false)
			))
			.then(() => client.isExisting(paymentSettingsPage.CREDIT_CARD_SELECTOR))
			.then(doesExist => assert.isFalse(doesExist))
	);
});

'use strict';

import {assert} from 'chai';
import config from '../webdriver/config';
import client from '../webdriver/client';
import * as paymentSettingsPage from '../webdriver/pageObjects/paymentSettings';
import * as testData from '../webdriver/pageObjects/testData/main';
import * as loginForm from '../webdriver/pageObjects/helpers/forms/login';



describe('Payment Settings', () => {
	let login = 'testuser1@demandware.com';

	let visaCardData = {};
	let amexCardData = {};
	let masterCardData = {};
	let discoverCardData = {};

	before(() => client.init()
		.then(() => testData.getCustomerByLogin(login))
		.then(customer => {
			let address = customer.getPreferredAddress();

			visaCardData = {
				owner: customer.firstName + ' ' + customer.lastName,
				number: testData.creditCard1.number,
				expiration_year: testData.creditCard1.yearIndex
			};

			amexCardData = {
				owner: customer.firstName + ' ' + customer.lastName,
				type: 'Amex',
				number: '371449635398431',
				expiration_year: testData.creditCard1.yearIndex
			};

			masterCardData = {
				owner: customer.firstName + ' ' + customer.lastName,
				type: 'MasterCard',
				number: '5555555555554444',
				expiration_year: testData.creditCard1.yearIndex
			};

			discoverCardData = {
				owner: customer.firstName + ' ' + customer.lastName,
				type: 'Discover',
				number: '6011111111111117',
				expiration_year: testData.creditCard1.yearIndex
			};

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

	it('should fill out form to add a Visa Card', () =>
		paymentSettingsPage.fillOutCreditCardForm(visaCardData)
			.then(() => client.click(paymentSettingsPage.BTN_CREATE_CARD))
			.then(() => client.waitForVisible(paymentSettingsPage.VISA_CREDIT_CARD))
			.then(() => client.getText(paymentSettingsPage.VISA_CREDIT_CARD))
			.then(displayText => assert.equal(displayText, 'Test1 User1\nVisa\n************1111\nExp. 01.2016\nDelete Card'))
	);

	it('should fill out form to add an Amex Card', () =>
		client.click(paymentSettingsPage.LINK_ADD_CREDIT_CARD)
			.then(() => client.waitForVisible(paymentSettingsPage.FORM_CREDIT_CARD))
			.then(() => paymentSettingsPage.fillOutCreditCardForm(amexCardData))
			.then(() => client.click(paymentSettingsPage.BTN_CREATE_CARD))
			.then(() => client.waitForVisible(paymentSettingsPage.AMEX_CREDIT_CARD))
			.then(() => client.getText(paymentSettingsPage.AMEX_CREDIT_CARD))
			.then(displayText => assert.equal(displayText, 'Test1 User1\nAmex\n***********8431\nExp. 01.2016\nDelete Card'))
	);

	it('should fill out form to add a Master Card', () =>
		client.click(paymentSettingsPage.LINK_ADD_CREDIT_CARD)
			.then(() => client.waitForVisible(paymentSettingsPage.FORM_CREDIT_CARD))
			.then(() => paymentSettingsPage.fillOutCreditCardForm(masterCardData))
			.then(() => client.click(paymentSettingsPage.BTN_CREATE_CARD))
			.then(() => client.waitForVisible(paymentSettingsPage.MASTER_CREDIT_CARD))
			.then(() => client.getText(paymentSettingsPage.MASTER_CREDIT_CARD))
			.then(displayText => assert.equal(displayText, 'Test1 User1\nMasterCard\n************4444\nExp. 01.2016\nDelete Card'))
	);

	it('should fill out form to add a Discover Card', () =>
		client.click(paymentSettingsPage.LINK_ADD_CREDIT_CARD)
			.then(() => client.waitForVisible(paymentSettingsPage.FORM_CREDIT_CARD))
			.then(() => paymentSettingsPage.fillOutCreditCardForm(discoverCardData))
			.then(() => client.click(paymentSettingsPage.BTN_CREATE_CARD))
			.then(() => client.waitForVisible(paymentSettingsPage.DISCOVER_CREDIT_CARD))
			.then(() => client.getText(paymentSettingsPage.DISCOVER_CREDIT_CARD))
			.then(displayText => assert.equal(displayText, 'Test1 User1\nDiscover\n************1117\nExp. 01.2016\nDelete Card'))
	);

	it('Should delete the Visa Card', () =>
		client.click(paymentSettingsPage.BTN_DELETE_VISA_CARD)
			.then(() => client.waitUntil(() =>
				client.alertText()
					.then(
						text => text === 'Do you want to remove this credit card?',
						err => err.message !== 'no alert open'
					)
			))
			.then(() => client.alertAccept())
			//.then(() => client.waitForVisible(paymentSettingsPage.VISA_CREDIT_CARD, 500, true))
			.then(() => client.refresh())
			.then(() => client.isExisting(paymentSettingsPage.VISA_CREDIT_CARD))
			.then(doesExist => assert.isFalse(doesExist))
	);

	it('Should delete the Amex Card', () =>
		client.click(paymentSettingsPage.BTN_DELETE_AMEX_CARD)
			.then(() => client.waitUntil(() =>
				client.alertText()
					.then(
						text => text === 'Do you want to remove this credit card?',
						err => err.message !== 'no alert open'
					)
			))
			.then(() => client.alertAccept())
			// .then(() => client.waitForVisible(paymentSettingsPage.AMEX_CREDIT_CARD, 500, true))
			.then(() => client.refresh())
			.then(() => client.isExisting(paymentSettingsPage.AMEX_CREDIT_CARD))
			.then(doesExist => assert.isFalse(doesExist))
	);

	it('Should delete the Master Card', () =>
		client.click(paymentSettingsPage.BTN_DELETE_MASTER_CARD)
			.then(() => client.waitUntil(() =>
				client.alertText()
					.then(
						text => text === 'Do you want to remove this credit card?',
						err => err.message !== 'no alert open'
					)
			))
			.then(() => client.alertAccept())
			// .then(() => client.waitForVisible(paymentSettingsPage.MASTER_CREDIT_CARD, 500, true))
			.then(() => client.refresh())
			.then(() => client.isExisting(paymentSettingsPage.MASTER_CREDIT_CARD))
			.then(doesExist => assert.isFalse(doesExist))
	);

	it('Should delete the Discover Card', () =>
		client.click(paymentSettingsPage.BTN_DELETE_DISCOVER_CARD)
			.then(() => client.waitUntil(() =>
				client.alertText()
					.then(
						text => text === 'Do you want to remove this credit card?',
						err => err.message !== 'no alert open'
					)
			))
			.then(() => client.alertAccept())
			// .then(() => client.waitForVisible(paymentSettingsPage.DISCOVER_CREDIT_CARD, 500, true))
			.then(() => client.refresh())
			.then(() => client.isExisting(paymentSettingsPage.DISCOVER_CREDIT_CARD))
			.then(doesExist => assert.isFalse(doesExist))
	);
});


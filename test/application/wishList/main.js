'use strict'

import {assert} from 'chai';

import client from '../webdriver/client';
import * as wishListPage from '../webdriver/pageObjects/wishlist';
import * as testData from '../webdriver/pageObjects/testData/main';

describe('Wishlist', () => {
	let customer;
	let login = 'testuser1@demandware.com';
	let loginFields = new Map();

	before(() => client.init());

	after(() => client.end());

	before(() => {
		return testData.getCustomerByLogin(login)
			.then(() => wishListPage.navigateTo())
	});
	
	//it('test', () => client.getTitle().then(title => console.log(title)));

	before(() => {
		return testData.getCustomerByLogin(login)
			.then(cust => {
				customer = cust;

				loginFields.set('d0elmywhectd', customer.email);
				loginFields.set('password', 'Test123!');

			})
	});

	describe('Login to account', () => {
		it('should allow login', () =>
			wishListPage.pressBtnLogin()
				.then(() => wishListPage.))
	})
	it('test', () => client.getTitle().then(title => console.log(title)));
});


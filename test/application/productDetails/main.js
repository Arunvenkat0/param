'use strict';

import {assert} from 'chai';
import client from '../webdriver/client';
import * as homePage from '../webdriver/pageObjects/home';
import * as productDetailPage from '../webdriver/pageObjects/productDetail';

// TODO:  Refactor these tests to use testData module instead of this search
// pattern.  Also, break up these singular tests to individual it() calls.

describe('Product Details Page', () => {

	before(() => client.init());

	after(() => client.end());

	describe('Bundle', () => {
		before(() => homePage.navigateTo());

		it('should contain expected elements', () =>
			client.waitForExist('form[role="search"]')
				.setValue('#q', 'bundle')
				.submitForm('form[role="search"]')
				.waitForExist('#search-result-items')
				.click('[title*="Playstation 3 Bundle"]')
				.waitForVisible(productDetailPage.PDP_MAIN)

				.getText('#pdpMain > h1.product-name')
				.then(title => assert.equal(title, 'Playstation 3 Bundle'))

				.then(() => client.isExisting('.primary-image'))
				.then(exists => assert.isTrue(exists))

				.then(() => client.isExisting('#item-sony-ps3-console'))
				.then(exists => assert.isTrue(exists))

				.then(() => client.isExisting('#item-easports-nascar-09-ps3'))
				.then(exists => assert.isTrue(exists))

				.then(() => client.isExisting('#item-easports-monopoly-ps3'))
				.then(exists => assert.isTrue(exists))

				.then(() => client.isExisting('#item-namco-eternal-sonata-ps3'))
				.then(exists => assert.isTrue(exists))

				.then(() => client.isExisting('#item-sony-warhawk-ps3'))
				.then(exists => assert.isTrue(exists))

				.then(() => client.isExisting('span.price-sales'))
				.then(exists => assert.isTrue(exists))

				.then(() => client.getText('.product-col-2.product-set > .product-price .price-sales'))
				.then(price => assert.equal(price, '$449.00'))

				.then(() => client.isExisting('#dwopt_sony-ps3-bundle_consoleWarranty'))
				.then(exists => assert.isTrue(exists))

				.then(() => client.isEnabled('#add-to-cart'))
				.then(enabled => assert.isTrue(enabled))
		);
	});

	describe('Set', () => {
		before(() => homePage.navigateTo());

		it('should contain expected elements', () =>
			client
				.waitForExist('form[role="search"]')
				.setValue('#q', 'look')
				.submitForm('form[role="search"]')
				.waitForExist('#search-result-items')
				.then(() => client.click('[title*="Fall Look"]'))
				.then(() => client.waitForVisible(productDetailPage.PDP_MAIN))

				.then(() => client.getText('#pdpMain > h1.product-name'))
				.then(title => assert.equal(title, 'Fall Look'))

				.then(() => client.isExisting('.primary-image'))
				.then(exists => assert.isTrue(exists))

				.then(() => client.getText('#item-013742003314 .item-name'))
				.then(title => assert.equal(title, 'Pink and Gold Necklace'))

				.then(() => client.getText('#item-701644033668 .item-name'))
				.then(title => assert.equal(title, 'Floral Tunic'))

				.then(() => client.getText('#item-701644607197 .item-name'))
				.then(title => assert.equal(title, 'Straight Leg Pant.'))

				.then(() => client.getText('.product-col-2.product-set > .product-price .salesprice'))
				.then(price => assert.equal(price, '$204.00'))

				.then(() => client.isEnabled('.add-all-to-cart'))
				.then(enabled => assert.ok(enabled, 'Add All to Cart button is enabled'))
		);
	});

	describe('Single item', () => {

		before(() => homePage.navigateTo());

		it('should contain expected elements', () =>
			client
				.waitForExist('form[role="search"]')
				.setValue('#q', 'modern')
				.submitForm('form[role="search"]')
				.waitForExist('#search-result-items')
				.then(() => client.click('[title*="Modern Blazer"]'))
				.then(() => client.waitForVisible(productDetailPage.PDP_MAIN))

				.then(() => client.getText('h1.product-name'))
				.then(title => assert.equal(title, 'Modern Blazer'))

				.then(() => client.isExisting('.primary-image'))
				.then(exists => assert.isTrue(exists))

				.then(() => client.isExisting('span.price-sales'))
				.then(exists => assert.isTrue(exists))

				.then(() => client.getText('#product-content > .product-price .price-sales'))
				.then(price => assert.equal(price, '$495.00'))

				.then(() => client.isExisting('#Quantity'))
				.then(exists => assert.isTrue(exists))

				.then(() => client.getAttribute('#Quantity', 'size'))
				.then(size => assert.equal(size, '2'))

				.then(() => client.isEnabled('#add-to-cart'))
				.then(enabled => assert.notOk(enabled, 'Add to Cart button is disabled'))
		);
	});

});

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
		before(() => homePage.navigateTo()
			.then(() => client.waitForExist('form[role="search"]')
				.setValue('#q', 'bundle')
				.submitForm('form[role="search"]')
				.waitForExist('#search-result-items')
				.click('[title*="Playstation 3 Bundle"]')
				.waitForVisible(productDetailPage.PDP_MAIN))
		);

		it('should have the right name', () =>
			client.getText('.product-detail > .product-name')
				.then(title => assert.equal(title, 'Playstation 3 Bundle'))
		);
		it('should have product image', () =>
			client.isExisting('.primary-image')
				.then(exists => assert.isTrue(exists))
		);

		it('should have all bundled products', () =>
			client.isExisting('#item-sony-ps3-console')
				.then(exists => assert.isTrue(exists))

				.then(() => client.isExisting('#item-easports-nascar-09-ps3'))
				.then(exists => assert.isTrue(exists))

				.then(() => client.isExisting('#item-easports-monopoly-ps3'))
				.then(exists => assert.isTrue(exists))

				.then(() => client.isExisting('#item-namco-eternal-sonata-ps3'))
				.then(exists => assert.isTrue(exists))

				.then(() => client.isExisting('#item-sony-warhawk-ps3'))
				.then(exists => assert.isTrue(exists))
		);

		it('should have the right price', () =>
			client.isExisting('span.price-sales')
				.then(exists => assert.isTrue(exists))
				.then(() => client.getText('.product-detail .product-add-to-cart .price-sales'))
				.then(price => assert.equal(price, '$449.00'))
		);

		it('should have warranty', () =>
			client.isExisting('#dwopt_sony-ps3-bundle_consoleWarranty')
				.then(exists => assert.isTrue(exists))
		);

		it('should have add to cart button enabled', () =>
			client.isEnabled('#add-to-cart')
				.then(enabled => assert.isTrue(enabled))
		);
	});

	describe('Set', () => {
		before(() => homePage.navigateTo()
			.then(() => client.waitForExist('form[role="search"]')
				.setValue('#q', 'look')
				.submitForm('form[role="search"]')
				.waitForExist('#search-result-items')
				.click('[title*="Fall Look"]')
				.waitForVisible(productDetailPage.PDP_MAIN))
		);

		it('should have the right name', () =>
			client.getText('.product-detail > .product-name')
				.then(title => assert.equal(title, 'Fall Look'))
		);

		it('should have product image', () =>
			client.isExisting('.primary-image')
				.then(exists => assert.isTrue(exists))
		);

		it('should have all products in the set', () =>
			client.getText('#item-013742003314 .item-name')
				.then(title => assert.equal(title, 'Pink and Gold Necklace'))

				.then(() => client.getText('#item-701644033668 .item-name'))
				.then(title => assert.equal(title, 'Floral Tunic'))

				.then(() => client.getText('#item-701644607197 .item-name'))
				.then(title => assert.equal(title, 'Straight Leg Pant.'))
		);

		it('should have the right price', () =>
			client.getText('.product-detail .product-add-to-cart .salesprice')
				.then(price => assert.equal(price, '$204.00'))
		);

		it('should have add to cart button enabled', () =>
			client.isEnabled('.add-all-to-cart')
				.then(enabled => assert.ok(enabled, 'Add All to Cart button is enabled'))
		);
	});

	describe('Single item', () => {

		before(() => homePage.navigateTo()
			.then(() => client.waitForExist('form[role="search"]')
				.setValue('#q', 'modern')
				.submitForm('form[role="search"]')
				.waitForExist('#search-result-items')
				.click('[title*="Modern Blazer"]')
				.waitForVisible(productDetailPage.PDP_MAIN))
		);

		it('should have the right name', () =>
			client.getText('.product-detail .product-name')
				.then(title => assert.equal(title, 'Modern Blazer'))
		);

		it('should have product image', () =>
			client.isExisting('.primary-image')
				.then(exists => assert.isTrue(exists))
		);

		it('should have the right price', () =>
			client.isExisting('span.price-sales')
				.then(exists => assert.isTrue(exists))

				.then(() => client.getText('#product-content > .product-price .price-sales'))
				.then(price => assert.equal(price, '$495.00'))
		);

		it('should have quantity field with size attribute 2', () =>
			client.isExisting('#Quantity')
				.then(exists => assert.isTrue(exists))

				.then(() => client.getAttribute('#Quantity', 'size'))
				.then(size => assert.equal(size, '2'))
		);

		it('should have add to cart button enabled', () =>
			client.isEnabled('#add-to-cart')
				.then(enabled => assert.notOk(enabled, 'Add to Cart button is disabled'))
		);
	});

});

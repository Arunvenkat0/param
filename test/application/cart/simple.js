'use strict';

import {assert} from 'chai';
import client from '../webdriver/client';
import * as cartPage from '../webdriver/pageObjects/cart';
import * as productDetailPage from '../webdriver/pageObjects/productDetail';


describe('Cart - Simple', () => {

	before(() => {
		var resourcePath = '/mens/clothing/pants/82916781.html?dwvar_82916781_color=BDA';
		var sizeIndex = 2;

		var standardProduct = new Map();
		standardProduct.set('resourcePath', resourcePath);
		standardProduct.set('sizeIndex', sizeIndex);

		return client.init()
			.then(() => productDetailPage.addProductVariationToCart(standardProduct))
			.then(() => cartPage.navigateTo());
	});

	after(() => client.end());

	it('should display the correct number of rows', () =>
		cartPage
			.getItemList()
			.then(rows => assert.equal(1, rows.value.length))
	);

	it('should display the correct name', () =>
		cartPage
			.getItemNameByRow(1)
			.then(name => assert.equal('Straight Leg Trousers', name))
	);

	it('should display the correct color', () =>
		cartPage
			.getItemAttrByRow(1, 'color')
			.then(color => assert.equal(color, 'Black'))
	);

	it('should display the correct size', () =>
		cartPage
			.getItemAttrByRow(1, 'size')
			.then(size => assert.equal(size, '30'))
	);

	it('should update quantity in cart', () =>
		cartPage
			.updateQuantityByRow(1, 3)
			.then(quantity => assert.equal(quantity, 3))
	);

	it('should update price in cart when quantity updated', () =>
		cartPage
			.getPriceByRow(1)
			.then(price => assert.equal(price, '$675.00'))
	);

	it('should change size', () =>
		cartPage
			.updateSizeByRow(1, 5)
			.then(size => assert.equal(size, '33'))
	);

	it('should remove product from cart', () =>
		cartPage
			.removeItemByRow(1)
			.then(() => cartPage.verifyCartEmpty())
			.then(empty => assert.ok(empty))
	);

});

'use strict';

import {assert} from 'chai';
import client from '../webdriver/client';
import * as cartPage from '../pageObjects/cart';
import * as productDetailPage from '../pageObjects/productDetail';
import * as testData from '../pageObjects/testData/main';

describe('Cart - Simple', () => {

	let resourcePath;
	let productVariationMaster;

	before(() => client.init());

	before(() => {
		return testData.getProductVariationMaster()
			.then(variationMaster => productVariationMaster = variationMaster)
			.then(() => resourcePath = productVariationMaster.getUrlResourcePath())
			.then(() => {
				let product = new Map();
				product.set('resourcePath', resourcePath);
				product.set('colorIndex', 1);
				product.set('sizeIndex', 2);
				product.set('widthIndex', 1);
				return product;
			})
			.then(product =>
				productDetailPage.addProductVariationToCart(product)
					.then(() => cartPage.navigateTo())
			);
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
			.then(name => assert.equal('Navy Single Pleat Wool Suit', name))
	);

	it('should display the correct color', () =>
		cartPage
			.getItemAttrByRow(1, 'color')
			.then(color => assert.equal(color, 'Navy'))
	);

	it('should display the correct size', () =>
		cartPage
			.getItemAttrByRow(1, 'size')
			.then(size => assert.equal(size, '38'))
	);

	it('should display the correct width', () =>
			cartPage
				.getItemAttrByRow(1, 'width')
				.then(size => assert.equal(size, 'Short'))
	);

	it('should update quantity in cart', () =>
		cartPage
			.updateQuantityByRow(1, 3)
			.then(quantity => assert.equal(quantity, 3))
	);

	it('should update price in cart when quantity updated', () =>
		cartPage
			.getPriceByRow(1)
			.then(updatedItemSubTotal => assert.equal(updatedItemSubTotal, '$899.97'))
	);

	it('should change size', () =>
		cartPage
			.updateSizeByRow(1, 5)
			.then(size => assert.equal(size, '42'))
	);

	it('should remove product from cart', () =>
		cartPage
			.removeItemByRow(1)
			.then(() => cartPage.verifyCartEmpty())
			.then(empty => assert.ok(empty))
	);

});

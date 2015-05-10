'use strict';

var assert = require('chai').assert;
var client = require('../webdriver/client');
var config = require('../webdriver/config');

var CartPage = require('../webdriver/pageObjects/cart');
var cartPage = new CartPage(client);

var ProductDetailPage = require('../webdriver/pageObjects/productDetail');
var productDetailPage = new ProductDetailPage(client);

var PAGE_URL_PATH = '/mens/clothing/pants/82916781.html?dwvar_82916781_color=BDA';


describe('Cart - Simple', () => {

	before(() =>
		client.init()
			.then(() => productDetailPage.addToCart(PAGE_URL_PATH))
			.then(() => cartPage.navigateTo())
	);

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

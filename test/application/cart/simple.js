'use strict';

var assert = require('chai').assert;
var client = require('../webdriver/client');
var config = require('../webdriver/config');

var CartPage = require('../webdriver/pageObjects/cartPage');
var cartPage = new CartPage(client);

var ProductDetailPage = require('../webdriver/pageObjects/productDetailPage');
var productDetailPage = new ProductDetailPage(client);

var PAGE_URL_PATH = '/mens/clothing/pants/82916781.html?dwvar_82916781_color=BDA';


describe('Cart - Simple', function () {

	before(function () {
		return client.init().then(function () {
			return productDetailPage.addToCart(PAGE_URL_PATH).then(function() {
				return cartPage.navigateTo();
			});
		});
	});

	after(function () {
		return client.end();
	});

	it('should display the correct number of rows', function () {
		return cartPage.getItemList().then(function (rows) {
			assert.equal(1, rows.value.length);
		});
	});

	it('should display the correct name', function () {
		return cartPage.getItemNameByRow(1).then(function (name) {
			assert.equal('Straight Leg Trousers', name);
		});
	});

	it('should display the correct color', function () {
		return cartPage.getItemAttrByRow(1, 'color').then(function (color) {
			assert.equal(color, 'Black');
		});
	});

	it('should display the correct size', function () {
		return cartPage.getItemAttrByRow(1, 'size').then(function (size) {
			assert.equal(size, '29');
		});
	});

	it('should update quantity in cart', function () {
		return cartPage.updateQuantityByRow(1, 3).then(function (quantity) {
			assert.equal(quantity, 3);
		});
	});

	it('should update price in cart when quantity updated', function () {
		return cartPage.getPriceByRow(1).then(function (price) {
			assert.equal(price, '$675.00');
		});
	});

	it('should change size', function () {
		return cartPage.updateSizeByRow(1, 5).then(function (size) {
			assert.equal(size, '32');
		});
	});

	it('should remove product from cart', function () {
		return cartPage.removeLineItemByRow(1).then(function () {
			return cartPage.isCartEmpty().then(function (exists) {
				assert.ok(exists);
			});
		});
	});

});

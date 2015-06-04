'use strict';

import _ from 'lodash';
import fs from 'fs';
import xml2js from 'xml2js';

import * as customers from './customers.js';
import * as inventory from './inventory.js';
import * as products from './products.js';
import * as prices from './prices.js';

export let defaultPassword = 'Test123!';

let demoDataDir = 'demo_data_no_hires_images';
let coreTestDataDir = 'app_storefront_core/cartridge/testdata';
let filePaths = {
	catalogElectronics: coreTestDataDir + '/catalog/electronics.xml',
	catalogApparel: coreTestDataDir + '/catalog/apparel.xml',
	inventory: coreTestDataDir + '/inventory-list/inventory.xml',
	pricebooks: coreTestDataDir + '/pricebook/pricebooks.xml',
	customers: demoDataDir + '/sites/SiteGenesis/customers.xml'
};

let standardProductId = 'samsung-ln55a950';
let productSetId = 'spring-look';
let productBundleId = 'microsoft-xbox360-bundle';


/**
 * Returns a Promise that returns a JSON object of a specific product's test data
 *
 * @param {string} productId - product ID
 * @returns {Promise} - JSON object of product
 */
export function getProductByIdPromise (productId) {
	return new Promise((resolve) => {
		if (_.size(products.getCatalog())) {
			products.getProductFromCatalog(productId, resolve);
		} else {
			products.getProductsPromise().then(() =>
				products.getProductFromCatalog(productId, resolve)
			)
		}
	});
}

/**
 * Returns a Promise that returns a JSON object of a specific customer's test data
 *
 * @param {string} login - test customer's login value
 * @returns {Promise} - JSON object with customer's test data
 */
export function getCustomerByLoginPromise (login) {
	return new Promise(resolve => {
		if (customers.get()) {
			resolve(customers.pickCustomer(login));
		} else {
			customers.getCustomersPromise().then(() =>
				resolve(customers.pickCustomer(login))
			);
		}
	});
}

/**
 * Returns a Promise that returns a JSON object with a specific product's prices
 *     test data
 *
 * @param {string} productId - product ID
 * @param {string} currencyCode - currency code for price book selection
 * @returns {Promise} - JSON object of product
 */
export function getPricesByProductIdPromise (productId, currencyCode = 'usd') {
	return new Promise(resolve => {
		if (prices.getPriceBooks()) {
			resolve(prices.getPricesForProduct(productId, currencyCode));
		} else {
			prices.getPriceBooksPromise().then(() =>
				resolve(prices.getPricesForProduct(productId, currencyCode))
			);
		}
	});
}

/**
 * Returns a Promise that returns a JSON object with a specific product's
 *     inventory test data
 *
 * @param {string} productId - product ID
 * @returns {Promise} - JSON object of product's inventory values
 */
export function getInventoryByProductIdPromise (productId) {
	return new Promise(resolve => {
		var inv = inventory.get();
		if (inv) {
			resolve(_.findWhere(inv, {productId: productId}));
		} else {
			inventory.getInventoryPromise().then(inv =>
				resolve(_.findWhere(inv, {productId: productId}))
			);
		}
	});
}

/**
 * Reads and parses test data XML file(s) for a particular subject
 *
 * @param {string} subject - Test data subject to be retrieved
 * @returns {Promise} - JSON object with the subject test data
 */
export function getSubjectTestDataPromise (subject) {
	return new Promise(resolve =>
		fs.readFile(filePaths[subject], (err, data) => {
			let parser = xml2js.Parser();
			parser.parseString(data, (err, result) => resolve(result));
		})
	);
}

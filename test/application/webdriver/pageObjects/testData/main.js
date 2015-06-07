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

let catalog = products.getCatalog();

let standardProductId = '750518548296';
let variationMasterProductId = '25686514';
let setProductId = 'spring-look';
let bundleProductId = 'microsoft-xbox360-bundle';


/* COMMON FUNCTIONS */

/**
 * Reads and parses test data XML file(s) for a particular subject
 *
 * @param {string} subject - Test data subject to be retrieved
 * @returns {Promise} - JSON object with the subject test data
 */
export function getSubjectTestDataPromise (subject) {
	return new Promise(resolve =>
			fs.readFile(filePaths[subject], (err, data) => {
				console.log('[getSubjectTestDataPromise] fs.readFile called. subject:', subject);
				let parser = xml2js.Parser();
				parser.parseString(data, (err, result) => resolve(result));
			})
	);
}

// Adapted from http://stackoverflow.com/questions/10425287/convert-dash-separated-string-to-camelcase#answer-10425344
export function convertToCamelCase (str) {
	return str.toLowerCase().replace(/-(.)/g, (match, group1)  =>
		group1.toUpperCase()
	);
}

/* PRODUCTS */

/**
 * Returns a Promise that returns a JSON object of a specific product's test data
 *
 * @param {string} productId - product ID
 * @returns {Promise} - JSON object of product
 */
export function getProductByIdPromise (productId) {
	return new Promise(resolve => {
		if (_.size(products.getCatalog())) {
			console.log('[getProductByIdPromise] if');
			products.getProductFromCatalog(productId, resolve);
		} else {
			console.log('[getProductByIdPromise] else');
			products.getProductsPromise().then(() => {
				catalog = products.getCatalog();
				return products.getProductFromCatalog(productId, resolve);
			})
		}
	});
}

/**
 * Returns a Promise that returns a Product Standard instance
 *
 * @returns {Promise.Object} - ProductStandard instance
 */
export function getProductStandard () {
	return Promise.resolve(getProductByIdPromise(standardProductId));
}

/**
 * Returns a Promise that returns a ProductVariationMaster instance
 *
 * @returns {Promise.Object} - ProductVariationMaster instance
 */
export function getProductVariationMaster () {
	return Promise.resolve(getProductByIdPromise(variationMasterProductId));
}

/**
 * Returns a Promise that returns a ProductSet instance
 *
 * @returns {Promise.Object} - ProductSet instance
 */
export function getProductSet () {
	return Promise.resolve(getProductByIdPromise(setProductId));
}

/**
 * Returns a Promise that returns a ProductBundle instance
 *
 * @returns {Promise.Object} - ProductBundle instance
 */
export function getProductBundle () {
	return Promise.resolve(getProductByIdPromise(bundleProductId));
}

/* CUSTOMERS */

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

/* PRICES */

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

/* INVENTORY */

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

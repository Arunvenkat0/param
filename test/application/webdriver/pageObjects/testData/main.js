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
let subjectMeta = {
	catalogElectronics: {
		filePath: coreTestDataDir + '/catalog/electronics.xml',
		parser: products.parseCatalog
	},
	catalogApparel: {
		filePath: coreTestDataDir + '/catalog/apparel.xml',
		parser: products.parseCatalog
	},
	inventory: {
		filePath: coreTestDataDir + '/inventory-list/inventory.xml',
		parser: inventory.parseInventoryItems
	},
	pricebooks: {
		filePath: coreTestDataDir + '/pricebook/pricebooks.xml',
		parser: prices.parsePriceBooks
	},
	customers: {
		filePath: demoDataDir + '/sites/SiteGenesis/customers.xml',
		parser: customers.parseCustomers
	}
};

let standardProductId = '750518548296';
let variationMasterProductId = '25686514';
let setProductId = 'spring-look';
let bundleProductId = 'microsoft-xbox360-bundle';

// Load and parse XML data to JSON
export let parsedData = {};
_.each(_.keys(subjectMeta), _loadAndJsonifyXmlData);

function _loadAndJsonifyXmlData (subject) {
	fs.readFile(subjectMeta[subject].filePath, (err, data) => {
		let parser = xml2js.Parser();
		parser.parseString(data, (err, result) => {
		parsedData[subject] = subjectMeta[subject].parser(result);
		});
	});
}

/* PRODUCTS */

/**
 * Returns a Promise that returns a JSON object of a specific product's test data
 *
 * @param {string} productId - product ID
 * @returns {Promise.Object} - JSON object of product
 */
export function getProductByIdPromise (productId) {
	return Promise.resolve(products.getProductFromCatalog(parsedData, productId));
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
 * @returns {Promise.Object} - JSON object with Customer's test data
 */
export function getCustomerByLoginPromise (login) {
	return Promise.resolve(customers.getCustomer(parsedData.customers, login));
}

/* PRICES */

/**
 * Returns a Promise that returns a JSON object with a specific product's prices
 *     test data
 *
 * @param {string} productId - product ID
 * @param {string} currencyCode - currency code for price book selection
 * @returns {Promise.Object} - Product* instance
 */
export function getPricesByProductIdPromise (productId, currencyCode = 'usd') {
	return Promise.resolve(prices.getPricesForProduct(parsedData.pricebooks, productId, currencyCode));
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
	return Promise.resolve(_.findWhere(parsedData.inventory, {productId: productId}));
}

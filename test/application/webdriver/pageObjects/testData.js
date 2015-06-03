'use strict';

import fs from 'fs';
import xml2js from 'xml2js';
import _ from 'lodash';

// Test data will be lazy loaded into these variables through Promise resolutions
let catalogElectronics = null;
let catalogApparel = null;
let catalogs = null;
let customers = null;
let inventory = null;
let pricebooks = null;

let demoDataDir = 'demo_data_no_hires_images';
let coreTestDataDir = 'app_storefront_core/cartridge/testdata';
let filePaths = {
	catalogElectronics: coreTestDataDir + '/catalog/electronics.xml',
	catalogApparel: coreTestDataDir + '/catalog/apparel.xml',
	inventory: coreTestDataDir + '/inventory-list/inventory.xml',
	pricebooks: coreTestDataDir + '/pricebook/pricebooks.xml',
	customers: demoDataDir + '/sites/SiteGenesis/customers.xml'
};

let defaultPassword = 'Test123!';
let priceTypes = ['list', 'sale'];

let standardProductId = 'samsung-ln55a950';

/**
 * Reads and parses test data for a particular subject
 *
 * @param {string} subject - Test data subject to be retrieved
 * @returns {Promise} - JSON object with the subject test data
 */
function _getSubjectTestDataPromise (subject) {
	return new Promise(resolve => {
		fs.readFile(filePaths[subject], (err, data) => {
			let parser = xml2js.Parser();
			parser.parseString(data, (err, result) => resolve(result));
		});
	});
}

/**
 * Loads Price Books test data
 *
 * @returns {Promise} - JSON object with pricebooks test data
 */
export function getProductsPromise () {
	return Promise.all([apparelPromise, electronicsPromise])
		.then(data => {
			//console.log('allPromise resolved');
			//console.log('data =', data);
			return data;
		});
}

var apparelPromise = new Promise(resolve =>  {
	if(catalogApparel) {
		//console.log('[apparelPromise] if');
		resolve(catalogApparel);
	} else {
		//console.log('[apparelPromise] else');
		_getSubjectTestDataPromise('catalogApparel').then(results => {
			//pricebooks = _parsePriceBooks(results.pricebooks.pricebook);
			catalogApparel = _parseApparelCatalog(results.catalog);
			console.log('[apparelPromise] catalogApparel =', JSON.stringify(catalogApparel));
			resolve(catalogApparel);
			//resolve(catalogApparel);
		});
	}
});
var electronicsPromise = new Promise(resolve =>  {
	if(catalogElectronics) {
		resolve(catalogElectronics);
	} else {
		_getSubjectTestDataPromise('catalogElectronics').then(results => {
			//console.log('[electronicsPromise] results =', results);
			//pricebooks = _parsePriceBooks(results.pricebooks.pricebook);
			resolve(results);
			//resolve(catalogApparel);
		});
	}
});

function _parseApparelCatalog (fileData) {
	//console.log('[_parseApparelCatalog] called. fileData =', JSON.stringify(fileData));
	let products = {};
	for (let product of fileData.product) {
		let id = product['$']['product-id'];

		if (_isProductSet(product)) {
			console.log('Product Set found!');
		} else if (_isProductVariationMaster(product)) {
			console.log('Product Variation Master found!');
		} else if (_isSimpleProduct(product)) {
			console.log('Simple Product found!');
		}
		products[id] = {
			ean: product['ean'][0],
			upc: product['upc'][0],
			unit: product['unit'][0],
			minOrderQuantity: +product['min-order-quantity'][0],
			stepQuantity: +product['step-quantity'][0],
			onlineFlag: !!product['online-flag'][0],
			availableFlag: !!product['available-flag'][0],
			searchableFlag: !!product['searchable-flag'][0],
			taxClassId: product['tax-class-id'] ? product['tax-class-id'][0] : null
		};

		products[id].pageAttributes = !product['page-attributes'][0] ? {} :
			{
				pageTitle: product['page-attributes'][0]['page-title'][0]['_'],
				pageDescription: product['page-attributes'][0]['page-description'][0]['_']
			};

		products[id].customAttributes = {};
		if (product.hasOwnProperty('custom-attributes')) {
			let customAttrs = product['custom-attributes'][0]['custom-attribute'];
			for (let attr of customAttrs) {
				let key = attr['$']['attribute-id'];
				let value = attr['_'];
				products[id].customAttributes[key] = value;
			}
		}

	}

	//for (let ca of fileData['category-assignment']) {
	//	console.log('[_parseApparelCatalog] category-assignment =', ca);
	//}
	console.log('[_parseApparelCatalog] products =', products);

	return products;
}

function _isProductSet (product) {
	return product.hasOwnProperty('product-set-products');
}

function _isProductVariationMaster (product) {
	return product.hasOwnProperty('variations');
}

function _isSimpleProduct (product) {
	return !_isProductSet(product) && !_isProductVariationMaster(product);
}

function _parseElectronicsCatalog (fileData) {
	console.log('[_parseElectronicsCatalog] fileData =', JSON.stringify(fileData));
}

/**
 * Loads Price Books test data
 *
 * @returns {Promise} - JSON object with pricebooks test data
 */
function _getPriceBooksPromise () {
	let promise = new Promise(resolve => {
		if (pricebooks) {
			resolve(pricebooks);
		} else {
			_getSubjectTestDataPromise('pricebooks').then(results => {
				pricebooks = _parsePriceBooks(results.pricebooks.pricebook);
				resolve(pricebooks);
			});
		}
	});

	return promise;
}

function _parsePriceBooks (priceBooks) {
	let priceBookList = {};

	priceBooks.forEach(element => {
		let header = element.header[0];
		let priceBookId = header['$']['pricebook-id'];
		let priceTables = element['price-tables'][0]['price-table'];
		let priceTableList = [];

		priceBookList[priceBookId] = {};
		priceBookList[priceBookId]['header'] = {
			currency: header.currency[0],
			onlineFlag: header['online-flag'][0] === 'true'
		};

		priceTables.forEach(element => {
			let proxy = {
				productId: element['$']['product-id'],
				amount: element['amount'][0]['_'],
				amountQty: element['amount'][0]['$']['quantity']
			};

			priceTableList.push(proxy);
		});
		priceBookList[priceBookId]['products'] = priceTableList;
	});

	return priceBookList;
}

export function getPricesByProductIdPromise (productId, currencyCode = 'usd') {
	let promise = new Promise(resolve => {
		if (pricebooks) {
			resolve(_getPricesForProduct(productId, priceTypes, currencyCode));
		} else {
			_getPriceBooksPromise().then(() =>
				resolve(_getPricesForProduct(productId, priceTypes, currencyCode))
			);
		}
	});
	return promise;
}

function _getPricesForProduct (productId, priceTypes, currencyCode = 'usd') {
	let prices = {};

	for (let type of priceTypes) {
		let products = pricebooks[_getPriceBookName(type, currencyCode)].products;
		let price = _.findWhere(products, {productId: productId});
		prices[type] = price ? _.result(price, 'amount') : null;
	}
	return prices;
}

function _getPriceBookName (priceType, currencyCode = 'usd') {
	return [currencyCode, priceType, 'prices'].join('-');
}

/**
 * Loads Inventory Test data
 *
 * @returns {Promise} - JSON object with inventory test data
 */
function _getInventoryPromise () {
	let promise = new Promise(resolve => {
		if (inventory) {
			resolve(inventory);
		} else {
			_getSubjectTestDataPromise('inventory').then(results => {
				inventory = _parseInventoryItems(
					results['inventory']['inventory-list'][0]['records'][0]['record']
				);
				resolve(inventory);
			});
		}
	});

	return promise;
}

function _parseInventoryItems (inventoryItems) {
	let inventoryList = [];

	for (let item of inventoryItems) {
		let proxy = {
			productId: item['$']['product-id'],
			allocation: +item['allocation'][0],
			perpetual: item['perpetual'][0],
			preorderBackorderHandling: item['preorder-backorder-handling'][0],
			ats: +item['ats'][0],
			onOrder: +item['on-order'][0],
			turnover: +item['turnover'][0]
		};

		inventoryList.push(proxy);
	}

	return inventoryList;
}

export function getInventoryByProductIdPromise (id) {
	let promise = new Promise(resolve => {
		if (inventory) {
			resolve(_.findWhere(inventory, {productId: id}));
		} else {
			_getInventoryPromise().then(() =>
				resolve(_.findWhere(inventory, {productId: id}))
			);
		}
	});
	return promise;
}

/**
 * Loads Customers test data
 *
 * @returns {Promise} - JSON object with customers test data
 */
function _getCustomersPromise () {
	let promise = new Promise(resolve => {
		if (customers) {
			resolve(customers);
		} else {
			_getSubjectTestDataPromise('customers').then(results => {
				customers = _parseCustomers(results.customers.customer);
				resolve(customers);
			});
		}
	});

	return promise;
}

function _parseCustomers (rawCustomers) {
	let parsedCustomers = [];

	for (let customer of rawCustomers) {
		let profile = customer.profile[0];

		let proxy = {
			login: customer.credentials[0].login[0],
			salutation: profile.salutation[0],
			title: profile['title'][0],
			firstName: profile['first-name'][0],
			lastName: profile['last-name'][0],
			suffix: profile['suffix'][0],
			company: profile['company-name'][0],
			jobTitle: profile['job-title'][0],
			email: profile['email'][0],
			phoneHome: profile['phone-home'][0],
			phoneWork: profile['phone-business'][0],
			phoneMobile: profile['phone-mobile'][0],
			fax: profile['fax'][0],
			gender: profile['gender'][0] === '1' ? 'M' : 'F'
		};

		if (customer.hasOwnProperty('addresses')) {
			proxy.addresses = _parseAddresses(customer.addresses[0].address);
		}

		parsedCustomers.push(proxy);
	}

	return parsedCustomers;
}

function _parseAddresses (rawAddresses) {
	let addresses = [];

	for (let address of rawAddresses) {
		let proxy = {
			addressId: address['$']['address-id'],
			preferred: (address['$']['preferred'] === 'true'),
			salutation: address['salutation'][0],
			title: address['title'][0],
			firstName: address['first-name'][0],
			secondName: address['second-name'][0],
			lastName: address['last-name'][0],
			suffix: address['suffix'][0],
			companyName: address['company-name'][0],
			jobTitle: address['job-title'][0],
			address1: address['address1'][0],
			address2: address['address2'][0],
			suite: address['suite'][0],
			postbox: address['postbox'][0],
			city: address['city'][0],
			postalCode: address['postal-code'][0],
			stateCode: address['state-code'][0],
			countryCode: address['country-code'][0],
			phone: address['phone'][0]
		};

		addresses.push(proxy);
	}

	return addresses;
}

/**
 * Returns a Promise that, when resolved, will return a JSON object of a
 *   specific customer's test data
 *
 * @param {string} login - test customer's login value
 * @returns {Promise} - JSON object with customer's test data
 */
export function getCustomerByLoginPromise (login) {
	let promise = new Promise(resolve => {
		if (customers) {
			resolve(_pickCustomer(login));
		} else {
			_getCustomersPromise().then(() => resolve(_pickCustomer(login)));
		}
	});

	return promise;
}

function _pickCustomer (login) {
	return _.findWhere(customers, {'login': login});
}

export function getProductStandard () {
	return;
}

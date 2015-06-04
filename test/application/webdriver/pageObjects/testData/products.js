'use strict';

import _ from 'lodash';
import * as main from './main.js';

let catalog = {};

/**
 * Gets the product catalog
 *
 * @returns {Object} - Product catalog
 */
export function getCatalog () {
	return catalog;
}

/**
 * Loads Products Catalog test data
 *
 * @returns {Promise} - JSON object with products test data
 */
export function getProductsPromise () {
	return new Promise(resolve => {
		if (_.size(catalog)) {
			resolve();
		} else {
			main.getSubjectTestDataPromise('catalogApparel')
				.then(results => _parseCatalog(results.catalog))
				.then(() => main.getSubjectTestDataPromise('catalogElectronics'))
				.then(results => _parseCatalog(results.catalog))
				.then(() => resolve());
		}
	});
}

/**
 * Retrieves Product from Catalog and executes provide Promise resolve function
 *    with this Product
 *
 * @param {string} productId - Product ID
 * @param {function} resolve - A Promise's resolve function
 * @returns {Promise.resolve} - Promise resolution with retrieved Product object
 *     or null if not found
 */
export function getProductFromCatalog (productId, resolve) {
	let product = catalog[productId];
	return product ? resolve(product) : resolve(null);
}

function _parseCatalog (fileData) {
	for (let product of fileData.product) {
		let id = product['$']['product-id'];
		let productType = _getProductType(product);

		switch (productType) {
			case 'simple':
				catalog[id] = new ProductSimple(product);
				break;
			case 'variationMaster':
				catalog[id] = new ProductVariationMaster(product);
				break;
			case 'set':
				catalog[id] = new ProductSet(product);
				break;
			////case 'bundle':
			//	catalog['id'] = new ProductBundle(product);
			//	break;
		}
	}

	// TODO: Process category-assignment field
	//for (let ca of fileData['category-assignment']) {
	//	console.log('[_parseCatalog] category-assignment =', ca);
	//}

	return;
}

function _getProductType (product) {
	if (_isProductSet(product)) {
		return 'set';
	} else if (_isProductVariationMaster(product)) {
		return 'variationMaster';
	} else if (_isProductSimple(product)) {
		return 'simple';
	} else if (_isProductBundle(product)) {
		return 'bundle';
	} else {
		return 'unknown';
	}
}

function _isProductSet (product) {
	return product.hasOwnProperty('product-set-products');
}

function _isProductVariationMaster (product) {
	return product.hasOwnProperty('variations');
}

function _isProductBundle (product) {
	return product.hasOwnProperty('bundled-products');
}

function _isProductSimple (product) {
	return !_isProductSet(product)
		&& !_isProductVariationMaster(product)
		&& !_isProductBundle(product);
}

class ProductBase {
	constructor (product) {
		this.id = product['$']['product-id'];
		this.ean = product['ean'][0];
		this.upc = product['upc'][0];
		this.unit = product['unit'][0];
		this.minOrderQuantity = +product['min-order-quantity'][0];
		this.stepQuantity = +product['step-quantity'][0];
		this.onlineFlag = !!product['online-flag'][0];
		this.availableFlag = !!product['available-flag'][0];
		this.searchableFlag = !!product['searchable-flag'][0];
		this.taxClassId = product['tax-class-id'] ? product['tax-class-id'][0] : null
	}
}

class VariationMasterAndSimple extends ProductBase {
	constructor (product) {
		super(product);
		this.taxClassId = product['tax-class-id'];
		this.customAttributes = {};

		if (product.hasOwnProperty('custom-attributes')) {
			let customAttrs = product['custom-attributes'][0]['custom-attribute'];
			for (let attr of customAttrs) {
				let key = attr['$']['attribute-id'];
				let value = attr['_'];
				this.customAttributes[key] = value;
			}
		}

	}
}

class ProductSimple extends VariationMasterAndSimple {
	constructor (product) {
		super(product);
		this.type = 'simple';
	}
}

class VariationMasterAndSet extends ProductBase {
	constructor (product) {
		super(product);
		this.displayName = product['display-name'][0]['_'];
		this.shortDescription = product['short-description'][0]['_'];
		this.longDescription = product['long-description'][0]['_'];

		// TODO: Process images
	}
}

class ProductSet extends VariationMasterAndSet {
	constructor (product) {
		super(product);
		this.type = 'set';
		this.productSetProducts = [];

		var productSet = product['product-set-products'][0]['product-set-product'];
		for (let product of productSet) {
			this.productSetProducts.push(product['$']['product-id']);
		}
	}

}

class ProductVariationMaster extends VariationMasterAndSet {
	constructor (product) {
		super(product);
		this.type = 'variationMaster';
	}
}

class ProductBundle extends ProductBase {
	constructor (product) {
		super(product);
		this.type = 'bundle';
	}
}

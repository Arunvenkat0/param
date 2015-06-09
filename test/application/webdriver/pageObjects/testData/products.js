'use strict';

import _ from 'lodash';

let categoryAssignments = {};
/**
 * Retrieves Product from Catalog
 *
 * @param {Object} parsedData - Subject data parsed from XML files
 * @param {string} productId - Product ID
 * @returns {Object} - Product* instance
 */
export function getProductFromCatalog (parsedData, productId) {
	return _getCatalogData(parsedData)[productId];
}

function _getCatalogData (parsedData) {
	return _.merge(parsedData.catalogApparel, parsedData.catalogElectronics);
}

/**
 * Processes parsed JSONified file data and sends back a map of Product
 *   instances
 *
 * @param {Object} fileData - Parsed data from XML files
 * @returns {Object} - Map of Product* instances grouped by Product IDs
 */
export function parseCatalog (fileData) {
	var proxy = {};
	for (let category of fileData.catalog['category-assignment']) {
		var productId = category.$['product-id'];
		categoryAssignments[productId] = category.$['category-id'];
	}

	for (let product of fileData.catalog.product) {
		let id = product.$['product-id'];
		let productType = _getProductType(product);

		switch (productType) {
			case 'standard':
				proxy[id] = new ProductStandard(product);
				break;
			case 'variationMaster':
				proxy[id] = new ProductVariationMaster(product);
				break;
			case 'set':
				proxy[id] = new ProductSet(product);
				break;
			case 'bundle':
				proxy[id] = new ProductBundle(product);
				break;
		}
	}

	return proxy;
}

function _getProductType (product) {
	if (_isProductSet(product)) {
		return 'set';
	} else if (_isProductVariationMaster(product)) {
		return 'variationMaster';
	} else if (_isProductStandard(product)) {
		return 'standard';
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

function _isProductStandard (product) {
	return !_isProductSet(product) &&
		!_isProductVariationMaster(product) &&
		!_isProductBundle(product);
}

class AbstractProductBase {
	constructor (product) {
		this.id = product.$['product-id'];
		this.type = _getProductType(product);
		this.ean = product.ean[0];
		this.upc = product.upc[0];
		this.unit = product.unit[0];
		this.minOrderQuantity = +product['min-order-quantity'][0];
		this.stepQuantity = +product['step-quantity'][0];
		this.onlineFlag = !!product['online-flag'][0];
		this.availableFlag = !!product['available-flag'][0];
		this.searchableFlag = !!product['searchable-flag'][0];
		this.taxClassId = product['tax-class-id'] ? product['tax-class-id'][0] : null;

		if (_.size(product['online-from'])) {
			this.onlineFrom = new Date(product['online-from'][0]);
		}
		if (_.size(product.brand)) {
			this.brand = product.brand[0];
		}
		if (_.size(product['page-attributes'])) {
			this.pageAttributes = _parsePageAttrs(product['page-attributes'][0]);
		}
		if (_.size(product['custom-attributes'])) {
			this.customAttributes = _parseCustomAttrs(product['custom-attributes'][0]['custom-attribute']);
		}
		if (_.size(product.images)) {
			this.images = _parseImages(product.images[0]);
		}

		if (product.hasOwnProperty('display-name')) {
			this.displayName = product['display-name'][0]._;
		}
		if (product.hasOwnProperty('short-description')) {
			this.shortDescription = product['short-description'][0]._;
		}
		if (product.hasOwnProperty('long-description')) {
			this.longDescription = product['long-description'][0]._;
		}
		if (product.hasOwnProperty('classification-category')) {
			//var category = product['classification-category'] || categoryAssignments[this.id];
			var category = product['classification-category'];
			this.classificationCategory = category;
		}
		if (product.hasOwnProperty('options')) {
			this.options = _parseOptions(product.options);
		}
	}

	toString () {
		return JSON.stringify(this);
	}
}

class ProductStandard extends AbstractProductBase {
	constructor (product) {
		super(product);
	}
}

class ProductSet extends AbstractProductBase {
	constructor (product) {
		super(product);
		this.productSetProducts = [];

		var productSet = product['product-set-products'][0]['product-set-product'];
		this.productSetProducts = _.pluck(productSet, '$.product-id');
	}

	getProductIds () {
		return this.productSetProducts;
	}
}

class ProductVariationMaster extends AbstractProductBase {
	constructor (product) {
		super(product);

		let self = this;
		this.variationAttributes = [];
		let variationAttrs = product.variations[0].attributes[0]['variation-attribute'];

		_.each(variationAttrs, function (value) {
			let proxy = {};

			_.each(value.$, function (val, key) {
				proxy[_.camelCase(key)] = val;
			});

			_.each(value['variation-attribute-values'][0]['variation-attribute-value'], function (val) {
				proxy.values = {
					value: val.$.value,
					displayValue: val['display-value'][0]._
				};
			});

			self.variationAttributes.push(proxy);
		});

		this.classificationCategory = categoryAssignments[this.id];
		this.variants = _.pluck(product.variations[0].variants[0].variant, '$.product-id');

	}

	getUrlResourcePath () {
		let path = this.classificationCategory.replace(/-/g, '/');
		let productId = this.id;
		return `/${path}/${productId}.html`;
	}

	getVariantProductIds () {
		return this.variants;
	}
}

class ProductBundle extends AbstractProductBase {
	constructor (product) {
		super(product);

		let bundleProducts = product['bundled-products'][0]['bundled-product'];
		this.bundleProducts = _.pluck(bundleProducts, '$.product-id');
	}

	getProductIds () {
		return this.bundleProducts;
	}

	getOptions () {
		return this.options || [];
	}
}

function _parseImages (images) {
	var imageList = images['image-group'];
	var parsed = [];

	for (let image of imageList) {
		/**
		 * It's possible for a raw XML catalog file to contain two separate
		 * entries for the same viewType:  One with a variant-value and one
		 * without.  We wish to avoid creating a duplicate.
		 */
		if (_.any(parsed, 'viewType', image.$['view-type']) &&
			image.$.hasOwnProperty('variation-value')) {
			let proxy = _.findWhere(parsed, {viewType: image.$['view-type']});
				proxy.variationValue = image.$['variation-value'];
		} else {
			let proxy = {
				viewType: image.$['view-type'],
				paths: []
			};

			for (let path of image.image) {
				proxy.paths.push(path.$.path);
			}

			parsed.push(proxy);
		}
	}

	return parsed;
}

function _parsePageAttrs(attrs) {
	let proxy = {};

	_.each(attrs, function (value, key) {
		proxy[_.camelCase(key)] = value[0]._;
	});

	return proxy;
}

function _parseCustomAttrs(attrs) {
	let proxy = {};

	for (let attr of attrs) {
		let key = attr.$['attribute-id'];
		let value = attr._;
		proxy[key] = value;
	}

	return proxy;
}

function _parseOptions (options) {
	return _.pluck(options, 'shared-option[0].$.option-id');
}

'use strict';

import _ from 'lodash';
import * as common from '../helpers/common';
import * as pricingHelpers from '../helpers/pricing';

export let priceTypes = ['list', 'sale'];

let categoryAssignments = {};
let defaultLocale = common.defaultLocale;

/**
 * Processes parsed JSONified file data and sends back a map of Product
 *   instances
 *
 * @param {Object} fileData - Parsed data from XML files
 * @returns {Object} - Map of Product* instances grouped by Product IDs
 */
export function parseCatalog (fileData) {
    let proxy = {};
    for (let category of fileData.catalog['category-assignment']) {
        let productId = category.$['product-id'];
        categoryAssignments[productId] = category.$['category-id'];
    }

    for (let product of fileData.catalog.product) {
        let id = product.$['product-id'];
        let productType = getProductType(product);

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

export function getProductType (product) {
    if (isProductSet(product)) {
        return 'set';
    } else if (isProductVariationMaster(product)) {
        return 'variationMaster';
    } else if (isProductStandard(product)) {
        return 'standard';
    } else if (isProductBundle(product)) {
        return 'bundle';
    } else {
        return 'unknown';
    }
}

export function isProductSet (product) {
    return product.hasOwnProperty('product-set-products');
}

export function isProductVariationMaster (product) {
    return product.hasOwnProperty('variations');
}

export function isProductBundle (product) {
    return product.hasOwnProperty('bundled-products');
}

export function isProductStandard (product) {
    return !isProductSet(product) &&
        !isProductVariationMaster(product) &&
        !isProductBundle(product);
}

/**
 * Gets a Product* instance by checking whether product is already an instance.  If yes, just return product.
 * If not, creates new instance from product properties.  New instance then has access to Class methods.
 *
 * @param {Object} catalog - JSON object of catalog data
 * @param {String} productId - Product ID
 * @returns {ProductStandard|ProductVariationMaster|ProductSet|ProductBundle} - product instance
 */
export function getProduct (catalog, productId) {
    let product = catalog[productId];
    if (product instanceof AbstractProductBase) {
        return product;
    }
    return getInstance(product);
}

/**
 * Creates instance of Product*
 *
 * @param {Object} product - JSON object comprised of product properties but no class convenience methods
 * @returns {ProductStandard|ProductVariationMaster|ProductSet|ProductBundle} - product instance
 */
export function getInstance (product) {
    switch (product.type) {
        case 'set':
            return new ProductSet(product);
        case 'variationMaster':
            return new ProductVariationMaster(product);
        case 'standard':
            return new ProductStandard(product);
        case 'bundle':
            return new ProductBundle(product);
    }
}

export function getVariationMasterInstances (catalog) {
    return _.filter(catalog, product =>
        product.type === 'variationMaster'
    );
}

export function getVariantParent (catalog, variant) {
    let variationMasters = getVariationMasterInstances(catalog);
    return _.find(variationMasters, master =>
        master.hasOwnProperty('variants') ? master.variants.indexOf(variant) > -1 : undefined
    );
}

export class AbstractProductBase {
    constructor (product) {
        if (product.hasOwnProperty('id')) {
            _.extend(this, product);
            // Indicate to downstream inheriting class whether processing from loaded data or XML processed data
            this.isLoaded = true;
        } else {
            this.id = product.$['product-id'];
            this.type = getProductType(product);
            this.isLoaded = false;
            this.ean = product.ean[0];
            this.upc = product.upc[0];
            this.unit = product.unit[0];
            this.minOrderQuantity = +product['min-order-quantity'][0];
            this.stepQuantity = +product['step-quantity'][0];
            this.onlineFlag = !!product['online-flag'][0];
            this.availableFlag = !!product['available-flag'][0];
            this.searchableFlag = !!product['searchable-flag'][0];
            this.taxClassId = product['tax-export class-id'] ? product['tax-export class-id'][0] : null;

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
                this.displayName = _getLocalizedValues(product['display-name']);
            }
            if (product.hasOwnProperty('short-description')) {
                this.shortDescription = _getLocalizedValues(product['short-description']);
            }
            if (product.hasOwnProperty('long-description')) {
                this.longDescription = _getLocalizedValues(product['long-description']);
            }
            if (product.hasOwnProperty('classification-category')) {
                this.classificationCategory = product['classification-category'];
            }
            if (product.hasOwnProperty('options')) {
                this.options = _parseOptions(product.options);
            }
        }
    }

    toString () {
        return JSON.stringify(this);
    }
}

export class ProductStandard extends AbstractProductBase {
    constructor (product) {
        super(product);
    }

    getPrices (pricebooks, locale) {
        let prices = {};

        priceTypes.forEach(type => {
            let entry = _.find(pricebooks[type].products, {productId: this.id});
            if (entry) {
                prices[type] = pricingHelpers.getFormattedPrice(entry.amount, locale);
            }
        });

        return prices;
    }
}

export class ProductSet extends AbstractProductBase {
    constructor (product) {
        super(product);

        if (!this.isLoaded) {
            this.productSetProducts = [];

            let productSet = product['product-set-products'][0]['product-set-product'];
            this.productSetProducts = _.pluck(productSet, '$.product-id');
        }
    }

    getProductIds () {
        return this.productSetProducts;
    }

    getProducts (catalog) {
        return this.getProductIds().map(id => getProduct(catalog, id));
    }

    getPrices (pricebooks, locale, catalog) {
        let price = 0.00;

        this.getProducts(catalog).forEach(product => {
            let values = Object.values(product.getPrices(pricebooks, locale, catalog));
            let minValue;

            values = values.map(value => value.replace(/\$|£|€|¥|,/g, ''));
            minValue = _.min(values);

            price += parseFloat(minValue);
        });

        return pricingHelpers.getFormattedPrice(price.toString(), locale);
    }
}

export class ProductVariationMaster extends AbstractProductBase {
    constructor (product) {
        super(product);

        if (!this.isLoaded) {
            this.variationAttributes = {};
            let self = this;
            let mainKey;

            let variationAttrs = product.variations[0].attributes[0]['variation-attribute'];

            _.each(variationAttrs, value => {
                let proxy = {};
                proxy.values = [];

                _.each(value.$, (val, key) => {
                    proxy[_.camelCase(key)] = val;
                    if (key === 'attribute-id') {
                        mainKey = val;
                    }
                });

                _.each(value['variation-attribute-values'][0]['variation-attribute-value'], val => {
                    proxy.values.push({
                        value: val.$.value,
                        displayValues: _getLocalizedValues(val['display-value'])
                    });
                });

                self.variationAttributes[mainKey] = proxy;
            });

            this.classificationCategory = categoryAssignments[this.id];
            if (product.variations[0].hasOwnProperty('variants')) {
                this.variants = _.pluck(product.variations[0].variants[0].variant, '$.product-id');
            }
        }

    }

    getUrlResourcePath () {
        let path = this.classificationCategory.replace(/-/g, '/');
        let productId = this.id;
        return `/${path}/${productId}.html`;
    }

    getVariantProductIds () {
        return this.variants;
    }

    /**
     * Gets a Product Variation Master's Variant instances
     *
     * @param {Object} catalog - testData.parsedData.catalog
     * @returns {Array.<ProductStandard>} - Variants of VariationMaster
     */
    getVariants (catalog) {
        return this.getVariantProductIds().map(id => getProduct(catalog, id));
    }

    getAttrTypeValueIndex (type, value) {
        return _.findIndex(this.variationAttributes[type].values, {value: value});
    }

    getAttrDisplayValue (type, codedValue, locale = defaultLocale) {
        let attrValues = _.find(this.variationAttributes[type].values, {value: codedValue});
        locale = _validateLocale(attrValues.displayValues, locale);
        return attrValues ? attrValues.displayValues[locale] : undefined;
    }

    getPrices (pricebooks, locale, catalog) {
        let prices = {};

        this.getVariants(catalog).forEach(variant => {
            let variantPrices = variant.getPrices(pricebooks, locale);
            priceTypes.forEach(type => {
                if (variantPrices[type]) {
                    prices[type] = !prices[type] || variantPrices[type] < prices[type] ?
                        pricingHelpers.getFormattedPrice(variantPrices[type], locale) :
                        pricingHelpers.getFormattedPrice(prices[type], locale);
                }
            });
        });

        return prices;
    }
}

export class ProductBundle extends AbstractProductBase {
    constructor (product) {
        super(product);

        if (!this.isLoaded) {
            let bundleProducts = product['bundled-products'][0]['bundled-product'];
            this.bundleProducts = _.pluck(bundleProducts, '$.product-id');
        }
    }

    getProductIds () {
        return this.bundleProducts;
    }

    getProducts (catalog) {
        return this.getProductIds().map(id => getProduct(catalog, id));
    }

    getOptions () {
        return this.options || [];
    }

    getPrices (pricebooks, locale) {
        let entry = _.find(pricebooks.list.products, {productId: this.id});
        return pricingHelpers.getFormattedPrice(entry.amount, locale);
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
    return _.object(_.map(attrs, (attr, key) => [_.camelCase(key), _getLocalizedValues(attr)]));
}

function _parseCustomAttrs(attrs) {
    return _.object(_.map(attrs, attr => [attr.$['attribute-id'], attr._]));
}

function _parseOptions (options) {
    return _.pluck(options, 'shared-option[0].$.option-id');
}

function _getLocalizedValues (values) {
    return _.object(_.map(values, value => {
        // Format key to match country code values in countries.json
        let key = value.$['xml:lang'].replace('-', '_');
        return [key, value._];
    }));
}

function _validateLocale(values, locale) {
    return _.keys(values).indexOf(locale) > -1 ? locale : defaultLocale;
}

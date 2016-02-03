'use strict';

import _ from 'lodash';
import * as common from '../helpers/common';
import * as pricingHelpers from '../helpers/pricing';
import {AbstractDwModelMock} from './common';

export let priceTypes = ['list', 'sale'];

let defaultLocale = common.defaultLocale;

/**
 * Processes parsed JSONified file data and sends back a map of Product
 *   instances
 *
 * @param {Object} fileData - Parsed data from XML files
 * @param {Object} [currentCatalog] - parsedData.catalog processed-to-date
 * @returns {Object} - Map of Product* instances grouped by Product IDs
 */
export function parseCatalog (fileData, currentCatalog) {
    let proxy = currentCatalog || {};
    proxy.categories = currentCatalog.categories || {};
    proxy.categoryAssignments = currentCatalog.categoryAssignments || {};
    proxy.products = currentCatalog.products || {};

    if (fileData.catalog.hasOwnProperty('category')) {
        for (let category of fileData.catalog.category) {
            let id = category.$['category-id'];
            proxy.categories[id] = category;
        }
    }

    if (fileData.catalog.hasOwnProperty('category-assignment')) {
        for (let categoryAssignment of fileData.catalog['category-assignment']) {
            let productId = categoryAssignment.$['product-id'];
            proxy.categoryAssignments[productId] = categoryAssignment;
        }
    }

    if (fileData.catalog.hasOwnProperty('product')) {
        for (let product of fileData.catalog.product) {
            let id = product.$['product-id'];
            proxy.products[id] = proxy.products.hasOwnProperty(id) ? _.merge(proxy.products[id], product) : product;
        }
    }

    return proxy;
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
    let product = catalog.products[productId];
    let type = getProductType(product);

    switch (type) {
        case 'set':
            return new ProductSet(product, catalog);
        case 'variationMaster':
            return new ProductVariationMaster(product, catalog);
        case 'standard':
            return new ProductStandard(product, catalog);
        case 'bundle':
            return new ProductBundle(product, catalog);
    }
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

export function getVariationMasterInstances (catalog) {
    return _.filter(catalog, product =>
        product.type === 'variationMaster'
    );
}

export function getVariantParent (catalog, variant) {
    let variationMasters = getVariationMasterInstances(catalog);
    return _.find(variationMasters, master => {
        return master.hasOwnProperty('variants') ? master.variants.indexOf(variant) > -1 : undefined;
    });
}

export class Category {
    constructor (category) {
        this.parent = category.hasOwnProperty('parent') ? category.parent[0] : undefined;
        this.displayName = _getLocalizedValues(category['display-name']);
        this.position = category.hasOwnProperty('position') ? category.position[0] : undefined;
        this.image = category.hasOwnProperty('image') ? category.image[0] : undefined;
        this.template = category.hasOwnProperty('template') ? category.template[0] : undefined;
        this.pageAttributes = _parsePageAttrs(category['page-attributes'][0]);
    }

    getDisplayName (locale = defaultLocale) {
        if (locale === 'en_GB') { locale = defaultLocale; }
        return this.displayName[locale];
    }

    getPageTitle (locale = defaultLocale) {
        return this.pageAttributes.pageTitle[locale];
    }

    getPageDescription (locale = defaultLocale) {
        return this.pageAttributes.pageDescription[locale];
    }
}

export class CategoryAssignment {
    constructor (assignment) {
        this.productId = assignment.$['product-id'];
        this.categoryId = assignment.$['category-id'];
    }
}

export class AbstractProductBase extends AbstractDwModelMock {
    constructor (product) {
        super(product);

        this.id = product.$['product-id'];
        this.type = getProductType(product);
        this.ean = product.ean[0];
        this.upc = product.upc[0];
        this.unit = product.unit[0];
        this.minOrderQuantity = Number(product['min-order-quantity'][0]);
        this.stepQuantity = Number(product['step-quantity'][0]);
        this.onlineFlag = Boolean(product['online-flag'][0]);
        this.availableFlag = Boolean(product['available-flag'][0]);
        this.searchableFlag = Boolean(product['searchable-flag'][0]);
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

    toString () {
        return JSON.stringify(this);
    }

    /**
     * Retrieve first image matching size and attribute value
     *
     * @param {String} viewType - image size, typically 'large' for primary images and 'small' for thumbnails
     * @param {String} attrValue - attribute value
     * @returns {String} Image path value, i.e., 'large/PG.15J0037EJ.WHITEFB.PZ.jpg'
     */
    getImage (viewType, attrValue) {
        return this.getImages(viewType, attrValue)[0];
    }

    /**
     * Retrieve images matching size and attribute value
     *
     * @param {String} viewType - image size, typically 'large' for primary images and 'small' for thumbnails
     * @param {String} attrValue - attribute value
     * @returns {Array.<String>} Image path values, i.e., ['small/PG.15J0037EJ.SLABLFB.PZ.jpg', small/PG.15J0037EJ.SLABLFB.BZ.jpg]
     */
    getImages (viewType, attrValue) {
        return _.find(this.images, {viewType: viewType, variationValue: attrValue}).paths;
    }
}

export class ProductStandard extends AbstractProductBase {
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
    constructor (product, catalog) {
        super(product);

        let productSet = product['product-set-products'][0]['product-set-product'];
        this.productSetProducts = _.pluck(productSet, '$.product-id') || [];

        let categoryAssignmentJSON = catalog.categoryAssignments[this.id];
        let categoryAssignment = new CategoryAssignment(categoryAssignmentJSON);
        let categoryJSON = catalog.categories[categoryAssignment.categoryId];
        this.resource = `/${ this.id}.html`;

        // Keys are locale codes
        this.urlResourcePaths = {};

        let category = new Category(categoryJSON);
        let categoryParent = category.parent;
        var self = this;
        function addUrlResourcePath (locale) {
            if (locale === 'en_GB') { locale = defaultLocale; }
            let currentPath = self.urlResourcePaths[locale] || '';
            self.urlResourcePaths[locale] = `/${category.getDisplayName(locale).toLowerCase()}${currentPath}`;
        }
        do {
            common.supportedLocales.forEach(addUrlResourcePath);
            category = new Category(catalog.categories[categoryParent]);
            categoryParent = category.parent;
        } while (categoryParent);

    }

    getUrlResourcePath (locale = defaultLocale) {
        if (locale === 'en_GB') { locale = defaultLocale; }
        return this.urlResourcePaths[locale] + this.resource;
    }

    getDisplayName (locale = defaultLocale) {
        return this.displayName[locale];
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
            let values = _.values(product.getPrices(pricebooks, locale, catalog));
            let minValue;

            values = values.map(value => value.replace(/\$|£|€|¥|,/g, ''));
            minValue = _.min(values);

            price += parseFloat(minValue);
        });

        return pricingHelpers.getFormattedPrice(price.toString(), locale);
    }
}

export class ProductVariationMaster extends AbstractProductBase {
    constructor (product, catalog) {
        super(product);

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

        let categoryAssignmentJSON = catalog.categoryAssignments[this.id];
        let categoryAssignment = new CategoryAssignment(categoryAssignmentJSON);
        this.classificationCategory = categoryAssignment.categoryId;

        if (product.variations[0].hasOwnProperty('variants')) {
            this.variantIds = _.pluck(product.variations[0].variants[0].variant, '$.product-id');
            this.variants = this.getVariantProductIds().map(id => getProduct(catalog, id));
        }

    }

    getUrlResourcePath () {
        let path = this.classificationCategory.replace(/-/g, '/');
        let productId = this.id;
        return `/${path}/${productId}.html`;
    }

    getVariantProductIds () {
        return this.variantIds;
    }

    /**
     * Gets a Product Variation Master's Variant instances
     *
     * @param {Object} catalog - testData.parsedData.catalog
     * @returns {Array.<ProductStandard>} - Variants of VariationMaster
     */
    getVariants () {
        return this.variants;
    }

    getAttrTypeValueIndex (type, value) {
        return _.findIndex(this.variationAttributes[type].values, {value: value});
    }

    getAttrDisplayValue (type, codedValue, locale = defaultLocale) {
        let attrValues = _.find(this.variationAttributes[type].values, {value: codedValue});
        locale = _validateLocale(attrValues.displayValues, locale);
        return attrValues ? attrValues.displayValues[locale] : undefined;
    }

    getAttrTypes () {
        return Object.keys(this.variationAttributes);
    }

    getAttrValuesByType (type) {
        let definedValues = _.pluck(this.variationAttributes[type].values, 'value');
        let implementedValues = this.variants.map(variant => {
            if (variant.onlineFlag && variant.availableFlag) {
                return variant.customAttributes[type];
            }
        });

        return _.intersection(definedValues, _.unique(implementedValues));
    }

    getPrices (pricebooks, locale) {
        let prices = {};

        this.getVariants().forEach(variant => {
            let variantPrices = variant.getPrices(pricebooks, locale);
            priceTypes.forEach(type => {
                if (variantPrices[type]) {
                    prices[type] = !prices[type] || variantPrices[type] < prices[type]
                        ? pricingHelpers.getFormattedPrice(variantPrices[type], locale)
                        : pricingHelpers.getFormattedPrice(prices[type], locale);
                }
            });
        });

        return prices;
    }
}

export class ProductBundle extends AbstractProductBase {
    constructor (product) {
        super(product);

        let bundleProducts = product['bundled-products'][0]['bundled-product'];
        this.bundleProducts = _.pluck(bundleProducts, '$.product-id');
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
    let imageList = images['image-group'];
    let parsed = [];

    imageList.forEach(image => {
        let proxy = {
            viewType: image.$['view-type'],
            variationValue: image.$['variation-value'] || undefined,
            paths: []
        };

        image.image.forEach (path => {
            proxy.paths.push(path.$.path);
        });

        parsed.push(proxy);
    });

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

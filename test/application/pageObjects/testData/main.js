'use strict';

import fs from 'fs';
import moment from 'moment-timezone';
import xml2js from 'xml2js';

import * as customers from './customers.js';
import * as products from './products.js';
import * as prices from './prices.js';
import * as pricingHelpers from '../helpers/pricing';
import * as promotions from './promotions.js';

export const defaultPassword = 'Test123!';
export const creditCard1 = {
    cardType: 'Visa',
    number: '4111111111111111',
    yearIndex: _getCurrentYear() + 1,
    cvn: 987
};
export const creditCard2 = {
    cardType: 'Discover',
    number: '6011111111111117',
    yearIndex: _getCurrentYear() + 1,
    cvn: 987
};

let demoDataDir = 'demo_data_no_hires_images';
let subjectMeta = {
    customers: {
        files: [demoDataDir + '/sites/SiteGenesis/customers.xml'],
        processor: customers.parseCustomers
    },
    catalog: {
        files: [
            demoDataDir + '/catalogs/electronics-catalog/catalog.xml',
            demoDataDir + '/catalogs/apparel-catalog/catalog.xml',
            demoDataDir + '/catalogs/storefront-catalog-en/catalog.xml',
            demoDataDir + '/catalogs/storefront-catalog-non-en/catalog.xml'
        ],
        processor: products.parseCatalog
    },
    pricebooks: {
        files: [
            demoDataDir + '/pricebooks/cny-list-prices.xml',
            demoDataDir + '/pricebooks/cny-sale-prices.xml',
            demoDataDir + '/pricebooks/eur-list-prices.xml',
            demoDataDir + '/pricebooks/eur-sale-prices.xml',
            demoDataDir + '/pricebooks/gbp-list-prices.xml',
            demoDataDir + '/pricebooks/gbp-sale-prices.xml',
            demoDataDir + '/pricebooks/jpy-list-prices.xml',
            demoDataDir + '/pricebooks/jpy-sale-prices.xml',
            demoDataDir + '/pricebooks/usd-list-prices.xml',
            demoDataDir + '/pricebooks/usd-sale-prices.xml'
        ],
        processor: prices.parsePriceBooks
    },
    promotions: {
        files: [
            demoDataDir + '/sites/SiteGenesis/promotions.xml',
            demoDataDir + '/sites/SiteGenesisGlobal/promotions.xml'
        ],
        processor: promotions.parsePromotions
    }
};

const standardProductId = '750518548296';
const variationMasterProductId = '25604455';
const setProductId = 'spring-look';
const bundleProductId = 'microsoft-xbox360-bundle';

// Used to determine whether parsedData should be regenerated.  Please modify this any time a change to the structure of
// parsedData is made.  In an OS X Terminal, please use 'date -u' to generate this value.
const version = 'Sun Feb  7 01:54:41 UTC 2016';

export let parsedData = {};
export let parsedDataFile = './test/application/pageObjects/testData/parsedData.txt';
/**
 * Load and parse XML demo data to JSON.  If parsedDataFile file exists, just read and parse data, then assign to
 * parsedData module object.  If not exists, process demo data XML files then write to parsedDataFile.
 *
 * @returns {Promise} - Indicates when data has been loaded and processed
 */
export function load () {
    return new Promise (resolve => {
        fs.exists(parsedDataFile, exists => {
            if (exists) {
                fs.readFile(parsedDataFile, (err, data) => {
                    parsedData = JSON.parse(data);
                    if (parsedData.hasOwnProperty('version') && parsedData.version === version) {
                        resolve(parsedData);
                    } else {
                        _generateParsedDataFile(resolve);
                    }
                });
            } else {
                _generateParsedDataFile(resolve);
            }
        });
    });
}

function _generateParsedDataFile (resolve) {
    let promises = [];

    parsedData = {};

    Object.keys(subjectMeta).forEach(subject => {
        promises.push(_loadAndJsonifyXmlData(subject));
    });

    return Promise.all(promises).then(() => {
        parsedData.version = version;
        fs.writeFile(parsedDataFile, JSON.stringify(parsedData));
        resolve();
    });
}

function _loadAndJsonifyXmlData (subject) {
    return new Promise((resolve) => {
        let localPromises = [];
        parsedData[subject] = parsedData.hasOwnProperty(subject) ? parsedData[subject] : {};
        subjectMeta[subject].files.forEach(file => {
            localPromises.push(new Promise(resolve =>
                fs.readFile(file, (err, data) => {
                    let parser = xml2js.Parser();
                    parser.parseString(data, (err, result) => {
                        // file is an optional processor parameter
                        parsedData[subject] = subjectMeta[subject].processor(result, parsedData[subject], file);
                        resolve(parsedData[subject]);
                    });
                })
            ));
        });
        resolve(Promise.all(localPromises));
    });
}

/* PRODUCTS */

/**
 * Returns a Promise that returns a JSON object of a specific product's test data
 *
 * @param {String} productId - product ID
 * @returns {Object} - JSON object of product
 */
export function getProductById (productId) {
    return products.getProduct(parsedData.catalog, productId);
}

/**
 * Returns a Promise that returns a Product Standard instance
 *
 * @returns {Object} - ProductStandard instance
 */
export function getProductStandard () {
    return getProductById(standardProductId);
}

/**
 * Returns a Promise that returns a ProductVariationMaster instance
 *
 * @returns {Object} - ProductVariationMaster instance
 */
export function getProductVariationMaster () {
    return getProductById(variationMasterProductId);
}

/**
 * Returns a Promise that returns a ProductSet instance
 *
 * @returns {Object} - ProductSet instance
 */
export function getProductSet () {
    return getProductById(setProductId);
}

/**
 * Returns a Promise that returns a ProductBundle instance
 *
 * @returns {Object} - ProductBundle instance
 */
export function getProductBundle () {
    return getProductById(bundleProductId);
}

/* CUSTOMERS */

/**
 * Returns a Promise that returns a JSON object of a specific customer's test data
 *
 * @param {String} login - test customer's login value
 * @returns {Promise.Object} - JSON object with Customer's test data
 */
export function getCustomerByLogin (login) {
    return customers.getCustomer(parsedData.customers, login);
}

/* PRICES */

/**
 * Returns a JSON object with a specific product's prices test data
 *
 * @param {String} productId - product ID
 * @param {String} [locale=x_default] - page locale
 * @returns {Object} - Product* instance
 */
export function getPricesByProductId (productId, locale = 'x_default') {
    const normalizedLocale = locale.replace(/_/g, '-');
    const currencyCode = pricingHelpers.localeCurrency[normalizedLocale].currencyCode;
    const product = getProductById(productId);
    let applicablePricebooks = {};

    products.priceTypes.forEach(type => {
        const pricebookName = [currencyCode, type, 'prices'].join('-');
        applicablePricebooks[type] = parsedData.pricebooks[pricebookName];
    });

    return product.getPrices(applicablePricebooks, locale, parsedData.catalog);
}

export function getVariationMasterInstances () {
    return products.getVariationMasters(parsedData.catalog.products);
}

/* PROMOTIONS */

/**
 * Promotions are Site-specific, so we need to specify the Site when calling functions that retrieve them.  If not
 * specified, we default to "SiteGenesis".  There is a getCurrentSiteName() helper function in helpers/common.js.
 *
 */
const defaultSite = 'SiteGenesis';

export function getPromotionById(id, site = defaultSite) {
    return promotions.getPromotion(parsedData.promotions[site].promotions, id);
}

export function getPromotionCampaignById(id, site = defaultSite) {
    return promotions.getCampaign(parsedData.promotions[site].campaigns, id);
}

export function getPromotionCampaignAssignmentById(promotionId, campaignId, site = defaultSite) {
    return promotions.getPromotionCampaignAssignment(parsedData.promotions[site].promotionCampaignAssignments, promotionId, campaignId);
}

/* Helper Methods for this module only */
function _getCurrentYear() {
    return moment(new Date()).year();
}

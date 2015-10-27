'use strict';

import {assert} from 'chai';
import {config} from '../webdriver/wdio.conf';
import * as searchResultsPage from '../pageObjects/searchResults';
import * as testData from '../pageObjects/testData/main';

describe('Search Results - Product Tile', () => {
    let categoryPath = '/mens/clothing/dress%20shirts/';

    // Mens Clothing > Dress Shirts > Modern Dress Shirt
    let productIdSinglePrice = '74974310';

    // Mens Clothing > Dress Shirts > Modern Striped Dress Shirt
    let productIdPriceRange = '69309284';

    // Mens Clothing > Dress Shirts > No-Iron Textured Dress Shirt
    let productIdListAndSalePrice = '25604455';

    let displayPrice;
    let locale = config.locale;

    before(() => testData.load()
        .then(() => browser.url(categoryPath)
            .waitForVisible(searchResultsPage.PRODUCTGRID_CONTAINER)
        )
    );

    it('should display a single list price if a product has no sales prices and all variants prices are the same', () => {
        return searchResultsPage.getProductTilePricingByPid(productIdSinglePrice)
            .then(price => displayPrice = price)
            .then(() => testData.getPricesByProductId(productIdSinglePrice, locale))
            .then(expectedPrice => assert.equal(displayPrice, expectedPrice.list));
    });

    it('should display a price range if a product has no sales prices and variants prices span a range', () => {
        return searchResultsPage.getProductTilePricingByPid(productIdPriceRange)
            .then(price => displayPrice = price)
            .then(() => testData.getPricesByProductId(productIdPriceRange, locale))
            .then(expectedPrice => assert.equal(displayPrice, `${expectedPrice.sale} - ${expectedPrice.list}`));
    });

    it('should display a normal sale price with the list price struck out when a product has both', () => {
        let productTile = 'div[data-itemid="' + productIdListAndSalePrice + '"]';
        let expectedListPrice;
        let expectedSalePrice;

        return testData.getPricesByProductId(productIdListAndSalePrice, locale)
            .then(expectedPrice => {
                expectedListPrice = expectedPrice.list;
                expectedSalePrice = expectedPrice.sale;
            })
            .then(() => browser.getText(productTile + ' ' + searchResultsPage.PRICE_LIST))
            .then(displayedListPrice => {
                assert.equal(displayedListPrice, expectedListPrice);
            })
            .then(() => browser.getText(productTile + ' ' + searchResultsPage.PRICE_SALE))
            .then(displayedSalePrice => {
                assert.equal(displayedSalePrice, expectedSalePrice);
            });
    });
});

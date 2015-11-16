'use strict';

import {assert} from 'chai';
import client from '../webdriver/client';
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

    before(() => client.init()
        .then(() => testData.load())
        .then(() => client.url(categoryPath))
        .waitForVisible(searchResultsPage.PRODUCTGRID_CONTAINER)
    );

    after(() => client.end());

    it('should display a single list price if a product has no sales prices and all variants prices are the same', () => {
        return searchResultsPage.getProductTilePricingByPid(productIdSinglePrice)
            .then(price => displayPrice = price)
            .then(() => testData.getPricesByProductId(productIdSinglePrice))
            .then(expectedPrice => assert.equal(displayPrice, expectedPrice.list));
    });

    it('should display a price range if a product has no sales prices and variants prices span a range', () => {
        return searchResultsPage.getProductTilePricingByPid(productIdPriceRange)
            .then(price => displayPrice = price)
            .then(() => testData.getPricesByProductId(productIdPriceRange))
            .then(expectedPrice => assert.equal(displayPrice, `${expectedPrice.sale} - ${expectedPrice.list}`));
    });

    it('should display a normal sale price with the list price struck out when a product has both', () => {
        let productTile = 'div[data-itemid="' + productIdListAndSalePrice + '"]';
        let expectedListPrice;
        let expectedSalePrice;

        return testData.getPricesByProductId(productIdListAndSalePrice)
            .then(expectedPrice => {
                expectedListPrice = expectedPrice.list;
                expectedSalePrice = expectedPrice.sale;
            })
            .then(() => client.getText(productTile + ' ' + searchResultsPage.PRICE_LIST))
            .then(displayedListPrice => {
                assert.equal(displayedListPrice, expectedListPrice);
            })
            .then(() => client.getText(productTile + ' ' + searchResultsPage.PRICE_SALE))
            .then(displayedSalePrice => {
                assert.equal(displayedSalePrice, expectedSalePrice);
            });
    });
});

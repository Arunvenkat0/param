'use strict';

import {assert} from 'chai';
import * as cartPage from '../pageObjects/cart';
import * as productDetailPage from '../pageObjects/productDetail';
import * as testData from '../pageObjects/testData/main';

/*
 Verify RAP-4876:
 - Add a product to Cart
 - navigate to any PDP
 - go back to the Cart
 - verify the lastVisitedList contains the product just visited

 Notes:
 - This test assumes the Site Preferences->Enable Storefront URLs is enabled
 which is true with the current Preferences.xml
 */

describe('Cart - LastVisitedList', () => {
    const productVariantId1 = '061492273693';

    before(() => {
        return testData.load()
            .then(() => {
                const productVariant1 = testData.getProductById(productVariantId1);
                return browser.url(productVariant1.getUrlResourcePath());
            })
            .then(() => productDetailPage.clickAddToCartButton())
    });

    after(() =>
        cartPage.emptyCart()
    );

    it('should see the product variant in the LastVisitedList', () => {
        let expectedProduct = 'Floral V-Neck Dress';
        const productVariantId2 = '701643843732';
        const productVariant2 = testData.getProductById(productVariantId2);

        return browser.url(productVariant2.getUrlResourcePath())
            .then(() => cartPage.navigateTo())
            .then(() => browser.getText(cartPage.LAST_VISITED_ITEM_NAMES))
            .then(lastVisitLists => assert.isTrue(lastVisitLists.indexOf(expectedProduct) > -1, 'LastVisitedList should contain the product variant ' + expectedProduct));
    })

    it('should see the product bundle in the LastVisitedList', () => {
        let expectedProduct = 'Turquoise Jewelry Bundle';
        const productBundleId = 'womens-jewelry-bundle';
        const productBundle = testData.getProductById(productBundleId);

        return browser.url(productBundle.getUrlResourcePath())
            .then(() => cartPage.navigateTo())
            .then(() => browser.getText(cartPage.LAST_VISITED_ITEM_NAMES))
            .then(lastVisitLists => assert.isTrue(lastVisitLists.indexOf(expectedProduct) > -1, 'LastVisitedList should contain product bundle ' + expectedProduct));
    })

    it('should see the product Set in the lastVisitedList', () => {
        let expectedProduct = 'Winter Look';
        const productSetId = 'winter-look';
        const productSet = testData.getProductById(productSetId);

        return browser.url(productSet.getUrlResourcePath())
            .then(() => cartPage.navigateTo())
            .then(() => browser.getText(cartPage.LAST_VISITED_ITEM_NAMES))
            .then(lastVisitedLists => assert.isTrue(lastVisitedLists.indexOf(expectedProduct) > -1, 'LastVisitedList should contain product Set ' + expectedProduct));
    })

    it('should see the single product in the lastVisitedList', () => {
        let expectedProduct = 'Striped Silk Tie';
        const productSingleId = '793775064963';
        const productSingle = testData.getProductById(productSingleId);

        return browser.url(productSingle.getUrlResourcePath())
            .then(() => cartPage.navigateTo())
            .then(() => browser.getText(cartPage.LAST_VISITED_ITEM_NAMES))
            .then(lastVisitedLists => assert.isTrue(lastVisitedLists.indexOf(expectedProduct) > -1, 'LastVisitedList should contain product Set ' + expectedProduct));
    })
})



'use strict';

import {assert} from 'chai';

import * as homePage from '../pageObjects/home';
import * as common from '../pageObjects/helpers/common';
import * as searchResultsPage from '../pageObjects/searchResults';
import * as testData from '../pageObjects/testData/main';

describe('Homepage General #C84584', () => {
    before(() => testData.load());

    describe('Main carousel links', () => {
        let categoryBanner = searchResultsPage.CATEGORY_BANNER;

        beforeEach(() => homePage.navigateTo());

        it('#1 should go to Mens Suits', () =>
            browser.waitForVisible(homePage.MAIN_CAROUSEL)
                .then(() => homePage.mainCarouselSlide(1))
                .then(() => browser.click(homePage.MAIN_CAROUSEL))
                .then(() => browser.waitForVisible(categoryBanner))
                .then(() => common.getPageTitle())
                .then(title => assert.equal(title, 'Mens Suits for Business and Casual'))
        );

        it('#2 should go to Women\'s Accessories', () =>
                browser.waitForVisible(homePage.MAIN_CAROUSEL)
                    .then(() => homePage.mainCarouselSlide(2))
                .then(() => browser.click(homePage.MAIN_CAROUSEL))
                .then(() => browser.waitForVisible(categoryBanner))
                .then(() => common.getPageTitle())
                .then(title => assert.equal(title, 'Women\'s Accessories Belts, Wallets. Gloves, Hats, Watches, Luggage & More'))
        );

        it('#3 should go to Women\'s Shoes', () =>
            browser.waitForVisible(homePage.MAIN_CAROUSEL)
                .then(() => homePage.mainCarouselSlide(3))
                .then(() => browser.click(homePage.MAIN_CAROUSEL))
                .then(() => browser.waitForVisible(categoryBanner))
                .then(() => common.getPageTitle())
                .then(title => assert.equal(title, 'Womens Shoes Including Casual, Flat, Mid Heels & High Heels'))
        );

        it('#4 should go to Women\'s Dresses', () =>
            browser.waitForVisible(homePage.MAIN_CAROUSEL)
                .then(() => homePage.mainCarouselSlide(4))
                .then(() => browser.click(homePage.MAIN_CAROUSEL))
                .then(() => browser.waitForVisible(categoryBanner))
                .then(() => common.getPageTitle())
                .then(title => assert.equal(title, 'Women\'s Dresses for all Occasions'))
        );

        it('#5 should go to New Arrivals for Womens', () =>
            browser.waitForVisible(homePage.MAIN_CAROUSEL)
                .then(() => homePage.mainCarouselSlide(5))
                .then(() => browser.click(homePage.MAIN_CAROUSEL))
                .then(() => browser.waitForVisible(categoryBanner))
                .then(() => common.getPageTitle())
                .then(title => assert.equal(title, 'New Arrivals in Women\'s Footwear, Outerwear, Clothing & Accessories'))
        );
    });

    describe('Vertical carousel', () => {
        before(() => homePage.navigateTo());

        it('#1 should be Sleeveless Cowl Neck Top', () =>
            homePage.verticalCarouselSlide(1)
                .then(() => homePage.isVerticalCarouselSlideVisible(1))
                .then(visible => assert.ok(visible))
                .then(() => homePage.getVerticalCarouselProductName(1))
                .then(name => assert.equal(name, 'Sleeveless Cowl Neck Top'))
        );

        it('#2 should be Charcoal Flat Front Athletic Fit Shadow Striped Wool Suit', () =>
            homePage.verticalCarouselSlide(2)
                .then(() => homePage.isVerticalCarouselSlideVisible(2))
                .then(visible => assert.ok(visible))
                .then(() => homePage.getVerticalCarouselProductName(2))
                .then(name => assert.equal(name, 'Charcoal Flat Front Athletic Fit Shadow Striped Wool Suit'))
        );

        it('#3 should be Straight Fit Shorts', () =>
            homePage.verticalCarouselSlide(3)
                .then(() => homePage.isVerticalCarouselSlideVisible(3))
                .then(visible => assert.ok(visible))
                .then(() => homePage.getVerticalCarouselProductName(3))
                .then(name => assert.equal(name, 'Straight Fit Shorts'))
        );

        it('#4 should be Button Front Skirt', () =>
            homePage.verticalCarouselSlide(4)
                .then(() => homePage.isVerticalCarouselSlideVisible(4))
                .then(visible => assert.ok(visible))
                .then(() => homePage.getVerticalCarouselProductName(4))
                .then(name => assert.equal(name, 'Button Front Skirt'))
        );

        it('should display prices in the product tile', () => {
            // Button Front Skirt (4th vertical carousel tile)
            var productId = '25590891';
            var priceLabelPrefix = `.product-tile[data-itemid="${productId}"] .product-pricing `;
            var displayedStandardPrice = `${priceLabelPrefix} .product-standard-price`;
            var displayedSalePrice = `${priceLabelPrefix} .product-sales-price`;
            var prices;

            return testData.getPricesByProductId(productId)
                .then(productPrices => prices = productPrices)

                // Test Standard Price
                .then(() => browser.getText(displayedStandardPrice))
                .then(standardPrice => assert.equal(standardPrice, prices.list))

                // Test Sale Price
                .then(() => browser.getText(displayedSalePrice))
                .then(salePrice => assert.equal(salePrice, prices.sale));
        });
    });
});

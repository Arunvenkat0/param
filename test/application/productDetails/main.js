'use strict';

import {assert} from 'chai';
import client from '../webdriver/client';
import * as common from '../pageObjects/helpers/common';
import * as homePage from '../pageObjects/home';
import * as pricingHelpers from '../pageObjects/helpers/pricing';
import * as productDetailPage from '../pageObjects/productDetail';
import * as testData from '../pageObjects/testData/main';

// TODO:  Refactor these tests to use testData module instead of this search
// pattern.

describe('Product Details Page', () => {

    before(() => client.init()
        .then(() => testData.load())
    );

    after(() => client.end());

    describe('Bundle', () => {
        before(() => homePage.navigateTo()
            .then(() => client.waitForExist('form[role="search"]')
                .setValue('#q', 'bundle')
                .submitForm('form[role="search"]')
                .waitForExist('#search-result-items')
                .click('[title*="Playstation 3 Bundle"]')
                .waitForVisible(productDetailPage.PDP_MAIN))
        );

        it('should have the right name', () =>
            client.getText('.product-detail > .product-name')
                .then(title => assert.equal(title, 'Playstation 3 Bundle'))
        );
        it('should have product image', () =>
            client.isExisting('.primary-image')
                .then(exists => assert.isTrue(exists))
        );

        it('should have all bundled products', () =>
            client.isExisting('#item-sony-ps3-console')
                .then(exists => assert.isTrue(exists))

                .then(() => client.isExisting('#item-easports-nascar-09-ps3'))
                .then(exists => assert.isTrue(exists))

                .then(() => client.isExisting('#item-easports-monopoly-ps3'))
                .then(exists => assert.isTrue(exists))

                .then(() => client.isExisting('#item-namco-eternal-sonata-ps3'))
                .then(exists => assert.isTrue(exists))

                .then(() => client.isExisting('#item-sony-warhawk-ps3'))
                .then(exists => assert.isTrue(exists))
        );

        it('should have the right price', () =>
            client.isExisting('span.price-sales')
                .then(exists => assert.isTrue(exists))
                .then(() => client.getText('.product-detail .product-add-to-cart .price-sales'))
                .then(price => assert.equal(price, '$449.00'))
        );

        it('should have warranty', () =>
            client.isExisting('#dwopt_sony-ps3-bundle_consoleWarranty')
                .then(exists => assert.isTrue(exists))
        );

        it('should have add to cart button enabled', () =>
            client.isEnabled('#add-to-cart')
                .then(enabled => assert.isTrue(enabled))
        );
    });

    describe('Set', () => {
        before(() => homePage.navigateTo()
            .then(() => client.waitForExist('form[role="search"]')
                .setValue('#q', 'look')
                .submitForm('form[role="search"]')
                .waitForExist('#search-result-items')
                .click('[title*="Fall Look"]')
                .waitForVisible(productDetailPage.PDP_MAIN))
        );

        it('should have the right name', () =>
            client.getText('.product-detail > .product-name')
                .then(title => assert.equal(title, 'Fall Look'))
        );

        it('should have product image', () =>
            client.isExisting('.primary-image')
                .then(exists => assert.isTrue(exists))
        );

        it('should have all products in the set', () =>
            client.getText('#item-013742003314 .item-name')
                .then(title => assert.equal(title, 'Pink and Gold Necklace'))

                .then(() => client.getText('#item-701644033668 .item-name'))
                .then(title => assert.equal(title, 'Floral Tunic'))

                .then(() => client.getText('#item-701644607197 .item-name'))
                .then(title => assert.equal(title, 'Straight Leg Pant.'))
        );

        it('should have the right price', () =>
            client.getText('.product-detail .product-add-to-cart .salesprice')
                .then(price => assert.equal(price, '$204.00'))
        );

        it('should have add to cart button enabled', () =>
            client.isEnabled('.add-all-to-cart')
                .then(enabled => assert.ok(enabled, 'Add All to Cart button is enabled'))
        );
    });

    describe('Variation Master', () => {
        let defaultVariant;
        let expectedListPrice;
        let expectedSalePrice;
        let firstAttributeID;
        let firstAttributeValues;
        let locale;
        let variationMaster;

        before(() => {
            return testData.getProductVariationMaster()
                .then(master => {
                    variationMaster = master;
                    firstAttributeID = Object.keys(variationMaster.variationAttributes)[0];
                    firstAttributeValues = variationMaster.getAttrValuesByType(firstAttributeID);
                    return testData.getProductById(variationMaster.variants[0]);
                })
                .then(product => defaultVariant = product)
                .then(() => client.url(variationMaster.getUrlResourcePath()))
                .then(() => common.getLocale())
                .then(code => locale = code);
        });

        it('should display a product name', () =>
            client.getText(productDetailPage.PRODUCT_NAME)
                .then(name => assert.equal(name, variationMaster.pageAttributes.pageTitle[locale]))
        );

        it('should display a product image', () =>
            client.isExisting('.primary-image')
                .then(exists => assert.isTrue(exists))
        );

        it('should display the default Variant primary image', () => {
            return client.element(productDetailPage.PRIMARY_IMAGE)
                .then(el => client.elementIdAttribute(el.value.ELEMENT, 'src'))
                .then(src => {
                    let primaryImagePath = variationMaster.getImage('large', defaultVariant.customAttributes[firstAttributeID]);
                    assert.isTrue(src.value.endsWith(primaryImagePath));
                });
        });

        it('should display the default Variant thumbnail images', () => {
            let displayedThumbnailPaths;
            let defaultThumbnailPaths = variationMaster.getImages('small', defaultVariant.customAttributes[firstAttributeID]);
            return client.waitUntil(
                    () => productDetailPage.getDisplayedThumbnailPaths()
                        .then(paths => paths.length === defaultThumbnailPaths.length)
                )
                .then(() => productDetailPage.getDisplayedThumbnailPaths())
                .then(paths => displayedThumbnailPaths = paths)

                // Retrieve default thumbnail paths to test whether they are currently displayed
                .then(() => defaultThumbnailPaths.reduce(
                    (promise, defaultPath) => assert.isTrue(displayedThumbnailPaths.indexOf(defaultPath) > -1),
                    Promise.resolve()
                ));
        });

        it('should display the primary image of the first Variant matching selected attributes', () => {
            let expectedPrimaryImage = variationMaster.getImage('large', firstAttributeValues[0]);

            // Click first color swatch and test displayed images against what is expected
            return client.element(productDetailPage.SWATCH_COLOR_ANCHORS)
                .then(el => client.elementIdClick(el.value.ELEMENT))
                .element(productDetailPage.PRIMARY_IMAGE)
                .then(el => client.elementIdAttribute(el.value.ELEMENT, 'src'))
                .then(displayedImgSrc =>
                    assert.equal(productDetailPage.getImagePath(displayedImgSrc.value), expectedPrimaryImage)
                );
        });

        it('should display the thumbnail images of the first Variant matching selected attributes', () => {
            let attrValue = firstAttributeValues[0];
            let displayedThumbnailPaths;
            // This waitUntil is necessary to ensure that the thumbnail images have been replaced with the images that
            // match the newly selected value before assertions are made.  This only checks the first thumbnail.
            return client.waitUntil(() =>
                client.element(productDetailPage.PRODUCT_THUMBNAILS_IMAGES)
                    .then(el => client.elementIdAttribute(el.value.ELEMENT, 'src'))
                    .then(src => src.value.indexOf(attrValue) > -1)
                )
                .then(() => productDetailPage.getDisplayedThumbnailPaths())
                .then(paths => displayedThumbnailPaths = paths)

                // Retrieve default thumbnail paths to test whether they are currently displayed
                .then(() => variationMaster.getImages('small', attrValue))
                .then(expectedThumbnailPaths =>
                    expectedThumbnailPaths.reduce(
                        (promise, defaultPath) =>
                        assert.isTrue(displayedThumbnailPaths.indexOf(defaultPath) > -1),
                        Promise.resolve()
                    )
                );
        });

        it('should display a struck out list price when applicable', () =>
            testData.getPricesByProductId(variationMaster.id)
                .then(prices => {
                    expectedListPrice = pricingHelpers.getFormattedPrice(prices.list);
                    expectedSalePrice = pricingHelpers.getFormattedPrice(prices.sale);
                    return client.getText(productDetailPage.PRICE_SALE);
                })
                .then(price => assert.equal(price, expectedSalePrice))
        );

        it('should display a sale price when applicable', () =>
            client.getText(productDetailPage.PRICE_LIST)
                .then(price => assert.equal(price, expectedListPrice))
        );

        it('should not enable the "Add to Cart" button if required attributes are not selected', () =>
            client.isEnabled('#add-to-cart')
                .then(enabled => assert.isFalse(enabled))
        );

        // TODO: Write tests to select all required attributes and check for Add to Cart button enablement
    });

});

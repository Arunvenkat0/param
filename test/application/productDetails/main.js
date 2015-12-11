'use strict';

import {assert} from 'chai';
import client from '../webdriver/client';
import * as common from '../pageObjects/helpers/common';
import * as homePage from '../pageObjects/home';
import * as pricingHelpers from '../pageObjects/helpers/pricing';
import * as productDetailPage from '../pageObjects/productDetail';
import * as testData from '../pageObjects/testData/main';

describe('Product Detail Page', () => {

    before(() => client.init()
        .then(() => testData.load())
    );

    after(() => client.end());

    // TODO:  Refactor these tests to use testData module instead of the search pattern.
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
        let expectedProductSetPrice;
        let productSet;
        let productSetProducts = [];
        let productSetId = 'spring-look';

        before(() =>
            testData.getPricesByProductId(productSetId)
                .then(price => expectedProductSetPrice = price)
                .then(() => testData.getProductById(productSetId))
                .then(set => {
                    productSet = set;
                    return productSet.getProductIds();
                })
                // Get Product Set Products
                .then(productIds => productIds.reduce((getProduct, productId) => {
                    return testData.getProductById(productId)
                        .then(product => productSetProducts.push(product));
                }, Promise.resolve()))
                .then(() => client.url(productSet.getUrlResourcePath()))
        );

        /**
         * Extracts the product item number (the last text token) from the provided string
         *
         * @param {String} label - Localized string of the displayed item number, i.e. "Item No. 12345"
         * @returns {String} - Last string token, i.e. 12345
         */
        function getItemNumber(label) {
            let tokens = label.split(' ');
            return tokens[tokens.length - 1];
        }

        it('should display its product name', () =>
            client.getText(productDetailPage.PRODUCT_NAME)
                .then(title => assert.equal(title, productSet.getDisplayName()))
        );

        it('should display a primary image', () =>
            client.getAttribute(productDetailPage.PRIMARY_IMAGE, 'src')
                .then(imgSrc => assert.isTrue(imgSrc.endsWith(productSet.getImage('large'))))
        );

        it('should display its associated products with their first variants selected', () =>
            client.elements(productDetailPage.PRODUCT_SET_LIST)
                .then(elements => elements.value.reduce((testValues, element, idx) => {
                    return testValues.then(() =>
                        client.elementIdText(element.ELEMENT)
                            .then(itemNumberLabel =>
                                assert.equal(getItemNumber(itemNumberLabel.value), productSetProducts[idx].getVariantProductIds()[0])
                            )
                    );
                }, Promise.resolve()))
        );

        it('should display the sum of its products as its price', () =>
            client.getText(productDetailPage.PRODUCT_SET_TOTAL_PRICE)
                .then(price => assert.equal(price, expectedProductSetPrice))
        );

        it('should display the "Add to Cart" button as enabled', () =>
            client.isEnabled(productDetailPage.BTN_ADD_ALL_TO_CART)
                .then(enabled => assert.ok(enabled))
        );

        describe('Product Item', () => {
            let productItem;
            let firstVariant;

            before(() => {
                productItem = productSetProducts[0];
                firstVariant = productItem.getVariants()[0];
            });

            /**
             * Generate attribute selector string for an attribute type (color, size) for a specific product
             *
             * @param {String} pid - product ID
             * @param {String} attrType - attribute type, such as color, size, or width
             * @returns {String} - CSS selector to retrieve attribute choices
             */
            function generateAttrSelector (pid, attrType) {
                return `#item-${pid} .swatches.${attrType.toLowerCase()} li`;
            }

            it('should display its product ID', () =>
                client.getText(`#item-${firstVariant.id} .product-number`)
                    .then(itemNumber => assert.isTrue(itemNumber.indexOf(firstVariant.id) > -1))
            );

            it('should display its attribute choices', () =>
                productItem.getAttrTypes().reduce((getAttr, attrType) => {
                    // Get the attribute element wrapper
                    return client.element(`${productDetailPage.PRODUCT_SET_ITEM_VARIATIONS} ul.swatches.${attrType.toLowerCase()}`)
                        // Find all <a> tags for this element.  Number of tags should equal number of attribute values.
                        .then(attrSwatch => client.elementIdElements(attrSwatch.value.ELEMENT, 'a'))
                        .then(anchorTags => assert.equal(anchorTags.value.length, productItem.variationAttributes[attrType].values.length));
                }, Promise.resolve())
            );

            it('should display the first variant\'s selected attribute values as selected', () =>
                productItem.getAttrTypes().reduce((getAttr, attrType) => {
                    let attrValues = productItem.getAttrValuesByType(attrType);
                    let variantAttrValue = firstVariant.customAttributes[attrType];
                    let expectedSelectedIndex = attrValues.indexOf(variantAttrValue);

                    return client.elements(generateAttrSelector(firstVariant.id, attrType))
                        .then(attrChoices => client.elementIdAttribute(attrChoices.value[expectedSelectedIndex].ELEMENT, 'class'))
                        .then(expectedSelected => assert.isTrue(expectedSelected.value.indexOf('selected') > -1));
                }, Promise.resolve())
            );

            it('should display the first variant\'s selected attribute value labels', () =>
                productItem.getAttrTypes().reduce((getAttr, attrType) => {
                    return client.getText(generateAttrSelector(firstVariant.id, attrType) + '.selected-value')
                        .then(selectedValue => {
                            let expectedValue = productItem.getAttrDisplayValue(attrType, firstVariant.customAttributes[attrType]).toUpperCase();
                            return assert.equal(selectedValue, expectedValue);
                        });
                }, Promise.resolve())
            );
        });
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
                    firstAttributeID = variationMaster.getAttrTypes()[0];
                    firstAttributeValues = variationMaster.getAttrValuesByType(firstAttributeID);
                    return testData.getProductById(variationMaster.getVariantProductIds()[0]);
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

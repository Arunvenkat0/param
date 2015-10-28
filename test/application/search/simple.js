'use strict';

import {assert} from 'chai';
import client from '../webdriver/client';
import * as homePage from '../pageObjects/home';
import * as searchResultsPage from '../pageObjects/searchResults';
import * as testData from '../pageObjects/testData/main';

describe('Search', () => {
    let singleResultKeyword = 'pack and go';
    let catalog;
    let productVariationMaster;
    let variantIds;

    before(() => client.init()
        .then(() => testData.load())
        .then(() => catalog = testData.parsedData.catalog)
        .then(() => testData.getProductVariationMaster())
        .then(variationMaster => {
            productVariationMaster = variationMaster;
            variantIds = productVariationMaster.getVariantProductIds();
            return;
        })
    );

    beforeEach(() => homePage.navigateTo()
        .then(() => client.waitForExist(searchResultsPage.SEARCH_FORM))
    );

    after(() => client.end());

    // We are using a known test case here. In controllers prior to a fix when
    // searching for "pack and go" it would result in an error page.
    it('should return a PDP when searching for keywords that return only one result', () =>
        client.setValue('#q', singleResultKeyword)
            .then(() => client.submitForm(searchResultsPage.SEARCH_FORM))
            .then(() => client.waitForExist(searchResultsPage.PDP_MAIN))
            .then(() => client.isExisting(searchResultsPage.PDP_MAIN))
            .then(doesExist => assert.isTrue(doesExist))
    );

    it('should search using a master product ID', () =>
        client.setValue('#q', productVariationMaster.id)
            .then(() => client.submitForm(searchResultsPage.SEARCH_FORM))
            .then(() => client.waitForExist(searchResultsPage.PDP_MAIN))
            .then(() => client.getText(searchResultsPage.PRODUCTID_TEXT))
            .then(displayText => assert.equal(displayText, productVariationMaster.id))
    );

    it('should search using a variation product ID', () =>
        client.setValue('#q', variantIds[1])
            .then(() => client.submitForm(searchResultsPage.SEARCH_FORM))
            .then(() => client.waitForExist(searchResultsPage.PDP_MAIN))
            .then(() => client.getText(searchResultsPage.PRODUCTID_TEXT))
            .then(displayText => assert.equal(displayText, variantIds[1]))
    );

    it('should return a product grid page when searching for a keyword that returns greater than one result', () =>
        client.setValue('#q', 'shirt')
            .then(() => client.submitForm(searchResultsPage.SEARCH_FORM))
            .then(() => client.waitForExist(searchResultsPage.BREADCRUMB_RESULT_TEXT))
            .then(() => client.elements('.grid-tile'))
            .then(productTiles => assert(productTiles.value.length > 1, 'there is one or fewer results'))
    );

    it('should display the no hits banner with term suggest when no items are found and searched term has close spelling to possible products', () =>
        client.setValue('#q', 'lake')
            .then(() => client.submitForm(searchResultsPage.SEARCH_FORM))
            .then(() => client.waitForExist(searchResultsPage.NO_HITS))
            .then(() => client.isExisting(searchResultsPage.NO_HITS_TERM_SUGGEST))
            .then(doesExist => assert.isTrue(doesExist))
    );

    it('should display the no hits banner when no items found', () =>
        client.setValue('#q', 'TheMuffinMan')
            .then(() => client.submitForm(searchResultsPage.SEARCH_FORM))
            .then(() => client.waitForExist(searchResultsPage.NO_HITS))
            .then(() => client.isExisting(searchResultsPage.NO_HITS_TERM_SUGGEST))
            .then(doesExist => assert.isFalse(doesExist))
    );

});

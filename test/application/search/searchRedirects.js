'use strict';

import {assert} from 'chai';
import * as homePage from '../pageObjects/home';
import * as search from '../pageObjects/search';
import * as common from '../pageObjects/helpers/common';
import url from 'url';

describe('Search Redirects', () => {
    let simpleRedirect = 'about';
    let contactUsRedirect = 'contact us';
    let accountRedirect = 'account';
    let aboutUsString = 'About Us'

    beforeEach(() => homePage.navigateTo()
        .then(() => browser.waitForExist(search.SEARCH_FORM))
    );

    it('should redirect to a simple HTTP content asset page (About Us)', () =>
        browser.setValue('#q', simpleRedirect)
            .then(() => browser.submitForm(search.SEARCH_FORM))
            .waitForVisible(common.BREADCRUMB_A)
            .getText(common.BREADCRUMB_A)
            .then(text => assert.equal(text, aboutUsString))
    );

    it('should redirect from HTTP to an HTTPS page, Contact Us', () =>
        browser.setValue('#q', contactUsRedirect)
            .then(() => browser.submitForm(search.SEARCH_FORM))
            .waitForVisible(search.CONTACT_US_FORM)
            .url()
            .then(currentUrl => {
                let parsedUrl = url.parse(currentUrl.value);
                return assert.isTrue(parsedUrl.pathname.endsWith('contactus'));
            })
    );

    it('should redirect from HTTP to an HTTPS page, Account', () =>
        browser.setValue('#q', accountRedirect)
            .then(() => browser.submitForm(search.SEARCH_FORM))
            .waitForVisible(search.LOGIN_FORM)
            .url()
            .then(currentUrl => {
                let parsedUrl = url.parse(currentUrl.value);
                return assert.isTrue(parsedUrl.pathname.endsWith('account'));
            })
    );

});

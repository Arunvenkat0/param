'use strict';

import {assert} from 'chai';

import * as loginPage from '../pageObjects/loginPage';
import * as testData from '../pageObjects/testData/main';
import * as loginForm from '../pageObjects/helpers/forms/login';
import * as navHeader from '../pageObjects/navHeader';
import * as Resource from '../../mocks/dw/web/Resource';

describe('Login Page', () => {
    let oauthLoginErrorMsg = Resource.msg('account.login.logininclude.oauthloginerror', 'account', null);

    before(() => testData.load());

    beforeEach(() => loginPage.navigateTo()
        .then(() => browser.waitForVisible(loginPage.LOGIN_BOX))
    );

    after(() => navHeader.logout());

    it('should get error message for incorrect login credentials', () => {
        let errorMessage = Resource.msg('account.login.logininclude.loginerror', 'account', null);
        return browser.setValue(loginForm.INPUT_EMAIL, 'incorrectEmail@demandware.com')
            .setValue(loginForm.INPUT_PASSWORD, 'badPassword')
            .click(loginForm.BTN_LOGIN)
            .waitForExist(loginPage.ERROR_MSG)
            .getText(loginPage.ERROR_MSG)
            .then(displayText => assert.equal(displayText, errorMessage));
    });

    it('should get an error message when clicking on googlePlus oauthLogin', () =>
        browser.click('#GooglePlus')
            .waitForExist(loginPage.ERROR_MSG)
            .getText(loginPage.ERROR_MSG)
            .then(displayText => assert.equal(displayText, oauthLoginErrorMsg))
    );

    it('should login using login form', () =>
        loginForm.loginAsDefaultCustomer()
            .then(() => browser.waitForExist('.account-options'))
            .then(() => browser.isExisting('.account-options'))
            .then(doesExist => assert.isTrue(doesExist))
    );
});

'use strict';

import {assert} from 'chai';
import client from '../webdriver/client';
import * as accountPage from '../pageObjects/account';
import * as testData from '../pageObjects/testData/main';
import * as accountForm from '../pageObjects/helpers/forms/account';
import * as loginForm from '../pageObjects/helpers/forms/login';
import * as Resource from '../../mocks/dw/web/Resource';

describe('Profile', () => {
    let customer;
    let customerEmail = 'testuser1@demandware.com';
    let newFirstName = 'Diamonique';
    let newLastName = 'Kerfluffle';

    before(() => {
        return client.init()
            .then(() => testData.load())
            .then(() => testData.getCustomerByLogin(customerEmail))
            .then(user => customer = user)
            .then(() => accountPage.navigateTo())
            .then(() => loginForm.loginAsDefaultCustomer());
    });

    after(() => client.end());

    describe('Editing', () => {
        before(() => {
            return client.click(accountPage.PERSONAL_DATA)
                .waitForValue(accountForm.FIELD_EMAIL);
        });

        it('should pre-populate the first name field', () => {
            return client.getValue(accountForm.FIELD_FIRST_NAME)
                .then(firstName => assert(firstName, customer.firstName));
        });

        it('should pre-populate the last name field', () => {
            return client.getValue(accountForm.FIELD_LAST_NAME)
                .then(lastName => assert(lastName, customer.lastName));
        });

        it('should pre-populate the email field', () => {
            return client.getValue(accountForm.FIELD_EMAIL)
            .then(lastName => assert(lastName, customer.email));
        });

        it('should allow editing of the name fields', () => {
            let newValues = {};
            newValues[accountForm.FIELD_FIRST_NAME] = newFirstName;
            newValues[accountForm.FIELD_LAST_NAME] = newLastName;
            // Required fields
            newValues[accountForm.FIELD_EMAIL] = customer.email;
            newValues[accountForm.FIELD_EMAIL_CONFIRM] = customer.email;
            newValues[accountForm.FIELD_PASSWORD] = testData.defaultPassword;
            newValues[accountForm.FIELD_PASSWORD_CONFIRM] = testData.defaultPassword;

            let oldValues = {};
            oldValues[accountForm.FIELD_FIRST_NAME] = customer.firstName;
            oldValues[accountForm.FIELD_LAST_NAME] = customer.lastName;
            // Required fields
            oldValues[accountForm.FIELD_EMAIL] = customer.email;
            oldValues[accountForm.FIELD_EMAIL_CONFIRM] = customer.email;
            oldValues[accountForm.FIELD_PASSWORD] = testData.defaultPassword;
            oldValues[accountForm.FIELD_PASSWORD_CONFIRM] = testData.defaultPassword;

            return accountForm.editAccount(newValues)
                .then(() => client.waitForVisible('.account-options'))
                .then(() => client.getText(accountForm.ACCOUNT_HEADER))
                // Test
                .then(accountHeader => assert.isTrue(accountHeader.indexOf(`${newFirstName} ${newLastName}`) > -1))
                // Reset values
                .then(() => client.click(accountPage.PERSONAL_DATA))
                .then(() => accountForm.editAccount(oldValues));
        });

        it('should prevent updating an email address to one taken by another user', () => {
            // Acceptable values for locale are fr_FR, it_IT, ja_JP, and zh_CN
            let locale = '';
            let bundleName = locale ? `forms_${locale}` : 'forms';
            let expectedError = Resource.msgf('profile.usernametaken', bundleName, null, 1);
            let newEmail = 'testuser2@demandware.com';

            let newValues = {};
            newValues[accountForm.FIELD_EMAIL] = newEmail;
            newValues[accountForm.FIELD_EMAIL_CONFIRM] = newEmail;
            newValues[accountForm.FIELD_PASSWORD] = testData.defaultPassword;
            newValues[accountForm.FIELD_PASSWORD_CONFIRM] = testData.defaultPassword;

            return client.click(accountPage.PERSONAL_DATA)
                .waitForValue(accountForm.FIELD_EMAIL)
                .then(() => accountForm.editAccount(newValues))
                .then(() => client.getText(accountForm.ERROR_EMAIL_ALREADY_TAKEN))
                .then(error => assert.equal(error, expectedError));
        });
    });
});

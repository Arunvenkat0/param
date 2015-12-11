'use strict';

import client from '../../../webdriver/client';

export const ACCOUNT_HEADER = '.primary-content > h1';
export const BTN_APPLY = '[name*=dwfrm_profile_confirm]';
export const PREFIX_CUSTOMER_FIELDS = '[id=dwfrm_profile_customer';
export const PREFIX_LOGIN_FIELDS = '[id*=dwfrm_profile_login';

export const FIELD_FIRST_NAME = `${PREFIX_CUSTOMER_FIELDS}_firstname]`;
export const FIELD_LAST_NAME = `${PREFIX_CUSTOMER_FIELDS}_lastname]`;
export const FIELD_EMAIL = `${PREFIX_CUSTOMER_FIELDS}_email]`;
export const FIELD_EMAIL_CONFIRM = `${PREFIX_CUSTOMER_FIELDS}_emailconfirm]`;
export const FIELD_PASSWORD = `${PREFIX_LOGIN_FIELDS}_password_]`;
export const FIELD_PASSWORD_CONFIRM = `${PREFIX_LOGIN_FIELDS}_passwordconfirm]`;
export const ERROR_EMAIL_ALREADY_TAKEN = '#RegistrationForm div.form-caption.error-message';

/**
 * Fills in Edit Account form and applies changes
 *
 * Note:  The fields for first name, last name, and email are pre-populated with the customer's info.
 *
 * @param {Object} profileFields - profile fields to update
 * @param {String} [profileFields.firstName] - Customer's first name
 * @param {String} [profileFields.lastName] - Customer's last name
 * @param {String} profileFields.email - Customer's email address
 * @param {String} profileFields.password - Customer's password
 * @returns {undefined}
 */
export function editAccount (profileFields) {
    return Object.keys(profileFields).reduce((setField, field) => {
            return setField.then(() => client.setValue(field, profileFields[field]));
        }, Promise.resolve())
        .then(() => client.getValue(FIELD_EMAIL))
        .then(email => client.setValue(FIELD_EMAIL_CONFIRM, email))
        .then(() => client.click(BTN_APPLY));
}

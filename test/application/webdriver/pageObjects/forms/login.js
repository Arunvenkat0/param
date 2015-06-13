import client from '../../../webdriver/client';
import * as testData from '../testData/main';

export const FORM_LOGIN = '#dwfrm_login';
export const BTN_LOGIN = 'button[name$="frm_login_login"]';
export const INPUT_EMAIL = 'input.email-input';
export const INPUT_PASSWORD = 'input.password-input';

const DEFAULT_RETURNING_CUSTOMER = 'testuser1@demandware.com';

/**
 * Fill in login form
 */
export function loginAs (login, password) {
	return client
		.setValue(INPUT_EMAIL, DEFAULT_RETURNING_CUSTOMER)
		.setValue(INPUT_PASSWORD, testData.defaultPassword)
		.click(BTN_LOGIN);
}

/**
 * Fill in login form as default customer
 */
export function loginAsDefaultCustomer () {
	return loginAs(DEFAULT_RETURNING_CUSTOMER, testData.defaultPassword);
}

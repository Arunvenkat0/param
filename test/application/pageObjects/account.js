'use strict';

import client from '../webdriver/client';

export const LOGOUT = '.account-logout';
export const BTN_LOGIN = 'button[name*=login_login]';

export const PASSWORD_DIALOG_CLOSE = 'span.ui-icon-closethick';
export const PASSWORD_DIALOG_SELECTOR = '.ui-dialog';          // TODO: This can probably be a more specific selector
export const PASSWORD_EMAIL_INPUT = '#dwfrm_requestpassword_email';
export const PASSWORD_ERROR = '.error-form';
export const PASSWORD_RESET_LINK = '#password-reset';
export const PASSWORD_SEND_BUTTON = 'button[name*=send]';
export const PERSONAL_DATA = 'ul.account-options > li > a:nth-child(1)';
export const VALID_PASSWORD_SELECTOR = '#dialog-container a';  // TODO: We need a better selector for determining success

const basePath = '/account';

export function navigateTo (locale = 'en_US') {
	return client.url(basePath + `?lang=${locale}`);
}

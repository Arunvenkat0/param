'use strict';

import client from '../client';
import * as accountPage from './account';
import * as formLogin from './helpers/forms/login';

export const USER_INFO_ICON = '.user-info i';
export const LINK_LOGIN = '.user-links a[href*="account"]';
export const BTN_LOGOUT = 'a.user-logout';
const userPanel = '.user-panel';

export function login () {
	return client.waitForVisible(USER_INFO_ICON)
		.click(USER_INFO_ICON)
		.waitForVisible(LINK_LOGIN)
		.click(LINK_LOGIN)
		.then(() => formLogin.loginAsDefaultCustomer())
		.then(() => client.waitForVisible(accountPage.LOGOUT));
}

export function logout () {
	return client.click(USER_INFO_ICON)
		.waitForVisible(userPanel)
		.click(BTN_LOGOUT)
		.waitForVisible(accountPage.BTN_LOGIN);
}

'use strict';

import client from '../client';
import * as formLogin from './forms/login';

export const userInfoIcon = '.user-info';
export const linkLogin = '.user-links a[href$="account"]';
export const btnLogout = 'a.user-logout';
const userPanel = '.user-panel';

export function login () {
	return client.click(userInfoIcon)
		.waitForVisible(userPanel)
		.click(linkLogin)
		.then(() => formLogin.loginAsDefaultCustomer());
}

export function logout () {
	return client.click(userInfoIcon)
		.waitForVisible(userPanel)
		.click(btnLogout);
}

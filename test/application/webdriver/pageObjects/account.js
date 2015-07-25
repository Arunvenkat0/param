'use strict';

import client from '../client';

export const LOGOUT = '.account-logout';
export const BTN_LOGIN = 'button[name*=login_login]';

const basePath = '/account';

export function navigateTo () {
	return client.url(basePath);
}

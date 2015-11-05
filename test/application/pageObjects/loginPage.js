'use strict';

import client from '../webdriver/client';

export const LOGIN_BOX = '.login-box';
export const ERROR_MSG = '.error-form';

const basePath = '/account';

export function navigateTo () {
    return client.url(basePath);
}

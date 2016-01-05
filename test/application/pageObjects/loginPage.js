'use strict';

export const LOGIN_BOX = '.login-box';
export const ERROR_MSG = '.error-form';

const basePath = '/account';

export function navigateTo () {
    return browser.url(basePath);
}

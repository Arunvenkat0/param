'use strict'

import client from '../client';
import config from '../config';

export const CSS_WISHLIST_SHARE = '#dwfrm_wishlist_share';
export const CSS_SHARE_OPTIONS = '.share-options';
export const CSS_SHARE_ICON = '.share-icon';

const basePath = '/wishlist';

export function navigateTo (path = basePath) {
	return client.url(config.url + path);
}

export function pressBtnLogin () {
	return client.click('[name$="login_login"]');
}

function _populateField (fieldType, selector, value) {
	client.setValue(selector, value);
}

export function login (loginFields) {
	var fieldMap = new Map();
	fieldMap.set('d0elmywhectd', {
		type: 'input',
		fieldPrefix: 'login_username'
	});
	fieldMap.set('password', {
		type: 'input',
		fieldPrefix: 'login'
	});

	for (var [key, value] of loginFields) {
		var fieldType = fieldMap.get(key).type;
		var selector = '[name$="' + fieldMap.get(key).fieldPrefix + key + '"]';
		_populateField(fieldType, selector, value);
	};
	return client.pause(200);
}

'use strict';

import client from '../client';
import config from '../config';
import * as formHelpers from './helpers/forms/common';

export const BTN_ADD_TO_CART = '#AddToBasketButton';
export const INPUT_FROM_FIELD = 'input[id$="giftcert_purchase_from"]';

const basePath = '/giftcertpurchase';

export function navigateTo () {
	return client.url(config.url + basePath);
}

export function pressBtnAddToCart () {
	return client.click(BTN_ADD_TO_CART);
}

export function fillOutGiftCertPurchaseForm (giftCertPurchaseFields) {
	var fieldMap = new Map();
	let fieldsPromise = [];

	fieldMap.set('from', {
		type: 'input',
		fieldSuffix: 'giftcert_purchase_from'
	});
	fieldMap.set('recipient', {
		type: 'input',
		fieldSuffix: 'giftcert_purchase_recipient'
	});
	fieldMap.set('recipientEmail', {
		type: 'input',
		fieldSuffix: 'giftcert_purchase_recipientEmail'
	});
	fieldMap.set('confirmRecipientEmail', {
		type: 'input',
		fieldSuffix: 'giftcert_purchase_confirmRecipientEmail'
	});
	fieldMap.set('message', {
		type: 'input',
		fieldSuffix: 'purchase_message'
	});

	fieldMap.set('amount', {
		type: 'input',
		fieldSuffix: 'purchase_amount'
	});

	for (var [key, value] of giftCertPurchaseFields) {
		var selector = '[id$="' + fieldMap.get(key).fieldSuffix + '"]';
		fieldsPromise.push(formHelpers.populateField(selector, value.toString()));
	}
	return Promise.all(fieldsPromise);
}

'use strict';

import client from '../client';
import config from '../config';
import * as formTasks from './forms/tasks';

export const BTN_ADD_TO_CART = '#AddToBasketButton';

const basePath = '/giftcertpurchase';

export function navigateTo (path = basePath) {
	return client.url(config.url + path);
}

export function pressBtnAddToCart () {
	return client.click(BTN_ADD_TO_CART);
}

export function fillOutGiftCertPurchaseForm (giftCertPurchaseFields) {
	var fieldMap = new Map();

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
	fieldMap.set('message',{
		type: 'input',
		fieldSuffix: 'purchase_message'
	});

	fieldMap.set('amount',{
		type: 'input',
		fieldSuffix: 'purchase_amount'
	});
	for (var [key, value] of giftCertPurchaseFields) {
		var fieldType = fieldMap.get(key).type;
		var selector = '[id$="' + fieldMap.get(key).fieldSuffix + '"]';
		//console.log(key, 'fieldType =', fieldType);
		formTasks.populateField(selector, value.toString());
	}
	return client.pause(200);


}

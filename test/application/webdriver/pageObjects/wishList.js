'use strict';

import client from '../client';
import * as common from './helpers/common';

export const CSS_SHARE_LINK = '.share-link';
export const BTN_ADD_GIFT_CERT = 'button[name*=wishlist_addGiftCertificate]';
export const BTN_TOGGLE_PRIVACY = '[name*=wishlist_setList]';
export const LINK_REMOVE = 'button.delete-item';
export const WISHLIST_ITEMS = '.item-list tbody tr:not(.headings)';

const basePath = '/wishlist';

export function navigateTo () {
	return client.url(basePath);
}

export function clickAddGiftCertButton () {
	return client.click(BTN_ADD_GIFT_CERT)
		.waitForVisible('table.item-list');
}

export function emptyWishList () {
	return navigateTo()
		.waitForVisible(BTN_TOGGLE_PRIVACY)
		// Must click the Remove link on each product in the Wishlist.
		.then(() => common.removeItems(LINK_REMOVE))
		.then(() => client.waitForExist('table.item-list', 5000, true));
}

export function getItemNameByRow (rowNum) {
	return client.getText(`${WISHLIST_ITEMS}:nth-child(${rowNum}) .name`);
}

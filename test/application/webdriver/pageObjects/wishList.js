'use strict';

import client from '../client';

export const CSS_WISHLIST_SHARE = '#dwfrm_wishlist_share';
export const CSS_SHARE_OPTIONS = '.share-options';
export const CSS_SHARE_ICON = '.share-icon';
export const CSS_SHARE_LINK = '.share-link';
export const BTN_ADD_GIFT_CERT = 'button[name$="frm_wishlist_addGiftCertificate"]';

const basePath = '/wishlist';

export function navigateTo () {
	return client.url(basePath);
}

export function clickAddGiftCertButton () {
	return client.click(BTN_ADD_GIFT_CERT);
}

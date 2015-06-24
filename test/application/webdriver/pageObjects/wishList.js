'use strict'

import client from '../client';
import config from '../config';

export const CSS_WISHLIST_SHARE = '#dwfrm_wishlist_share';
export const CSS_SHARE_OPTIONS = '.share-options';
export const CSS_SHARE_ICON = '.share-icon';
export const CSS_SHARE_LINK = '.share-link';

const basePath = '/wishlist';

export const configUrl = config.url;

export function navigateTo () {
	return client.url(config.url + basePath);
}

'use strict';

import client from '../client';
import * as common from './helpers/common';
import * as wishListPage from './wishList';

export const PDP_MAIN = '.pdp-main';
export const BTN_ADD_TO_WISHLIST = 'a[data-action="wishlist"]';
const BTN_ADD_TO_CART = '#add-to-cart';
const MINI_CART = '.mini-cart-content';

export function navigateTo (path = '/') {
	return client.url(path);
}

function _addProduct (product, btnAdd) {
	return common.addProductVariationToBasket(product, btnAdd);
}

export function addProductVariationToCart (product) {
	return _addProduct(product, BTN_ADD_TO_CART, MINI_CART)
		// To ensure that the product has been added to the cart before proceeding,
		// we need to wait for the Mini-cart to display
		.then(() => client.waitForVisible(MINI_CART));
}

export function addProductVariationToWishList (product) {
	return common.addProductVariationToBasket(product, BTN_ADD_TO_WISHLIST)
		// To ensure that the product has been added to the wishlist before proceeding,
		// we need to wait for a selector in the resulting page to display
		.then(() => client.waitForVisible(wishListPage.BTN_TOGGLE_PRIVACY));
}

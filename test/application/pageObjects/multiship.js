'use strict';

import * as testData from './testData/main';
import * as productDetailPage from './productDetail';

export const BTN_CHECKOUT_CONTINUE = 'button[name*=save]';
export const BTN_CHECKOUT_MULTI_SHIP = '.shiptomultiplebutton';
export const BTN_CHECKOUT_PLACE_ORDER = 'button[name*=submit]';
export const CHECKOUT_ADDRESS_DROPDOWN = '.select-address';
export const CHECKOUT_ADDRESS_LIST_HELPER = '.shippingaddress select[name*=multishipping_addressSelection]';
export const CHECKOUT_CONFIRMATION = '.confirmation-message';
export const CHECKOUT_SHIPPING_METHOD_HELPER = 'select[name*=shippingOptions_shipments]';
export const CHECKOUT_MULTI_SHIP = '.ship-to-multiple';
export const CHECKOUT_STEP_ONE = '.step-1.active';
export const CHECKOUT_STEP_TWO = '.step-2.active';
export const CHECKOUT_STEP_THREE = '.step-3.active';
export const CHECKOUT_STEP_FOUR = '.step-4.active';
export const SELECT_ADDRESS_LIST = 'select[name*=multishipping_addressSelection]';
export const SELECT_ADDRESS_LIST_1 = '.item-list tr:nth-of-type(1) ' + CHECKOUT_ADDRESS_LIST_HELPER;
export const SELECT_ADDRESS_LIST_2 = '.item-list tr:nth-of-type(2) ' + CHECKOUT_ADDRESS_LIST_HELPER;
export const SHIPPMENT_HEADER_1 = '.checkoutmultishipping table:nth-of-type(1) .section-header';
export const SHIPPMENT_HEADER_2 = '.checkoutmultishipping table:nth-of-type(2) .section-header';
export const SHIPPMENT_METHOD_1 = '.checkoutmultishipping table:nth-of-type(1) ' + CHECKOUT_SHIPPING_METHOD_HELPER;
export const SHIPPMENT_METHOD_2 = '.checkoutmultishipping table:nth-of-type(2) ' + CHECKOUT_SHIPPING_METHOD_HELPER;

const basePath = '/checkout';

testData.load();

export function navigateTo () {
	return browser.url(basePath);
}

export function addProductVariationMasterToCart (num1, num2, num3) {
	return testData.getProductVariationMaster()
		.then(productVariationMaster => {
			let product = new Map();
			product.set('resourcePath', productVariationMaster.getUrlResourcePath());
			product.set('colorIndex', num1);
			product.set('sizeIndex', num2);
			product.set('widthIndex', num3);
			return product;
		})
		.then(product => productDetailPage.addProductVariationToCart(product));
}

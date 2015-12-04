'use strict';

import client from '../webdriver/client';
import * as common from './helpers/common';
import * as wishListPage from './wishList';

export const BTN_ADD_ALL_TO_CART = '#add-all-to-cart';
export const BTN_ADD_TO_WISHLIST = 'a[data-action="wishlist"]';
export const PDP_MAIN = '.pdp-main';
export const PRICE_LIST = '#product-content .product-price .price-standard';
export const PRICE_SALE = '#product-content .product-price .price-sales';
export const PRODUCT_SET_LIST = '.product-set-list .product-number';
export const PRODUCT_SET_TOTAL_PRICE = '.product-detail .product-add-to-cart .salesprice';
export const PRODUCT_SET_ITEM_VARIATIONS = '.product-set-item .product-variations';
export const PRIMARY_IMAGE = '.primary-image';
export const PRODUCT_NAME = '.product-detail > .product-name';
export const PRODUCT_THUMBNAILS_IMAGES = '.product-thumbnails img';
export const SWATCH_COLOR_ANCHORS = '.swatches.color .swatchanchor';
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

/**
 * Retrieves the img src values of the thumbnail images
 *
 * @returns {Array.<String>}
 */
export function getDisplayedThumbnailPaths () {
    return client.elements(PRODUCT_THUMBNAILS_IMAGES)
        .then(elements => {
            let thumbnailPaths = [];
            return elements.value.reduce(
                (getPathTask, value) => getPathTask.then(() =>
                    client.elementIdAttribute(value.ELEMENT, 'src').then(src => {
                        thumbnailPaths.push(getImagePath(src.value));
                        return thumbnailPaths;
                    })
                ),
                Promise.resolve());
        });
}

/**
 * Returns image path given a URL
 *
 * @param {String} url - i.e., https://hostname/[...]/dw8f141f96/images/large/PG.15J0037EJ.WHITEFB.PZ.jpg
 * @returns {String} image path of URL (i.e., large/PG.15J0037EJ.WHITEFB.PZ.jpg)
 */
export function getImagePath (url) {
    return url.split('/images/')[1];
}

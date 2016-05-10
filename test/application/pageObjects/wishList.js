'use strict';

import * as common from './helpers/common';

export const CSS_SHARE_LINK = '.share-link';
export const BTN_ADD_GIFT_CERT = 'button[name*=wishlist_addGiftCertificate]';
export const BTN_TOGGLE_PRIVACY = '[name*=wishlist_setList]';
export const LINK_REMOVE = 'button.delete-item';
export const WISHLIST_ITEMS = '.item-list tbody tr:not(.headings)';

const basePath = '/wishlist';

export function navigateTo () {
    return browser.url(basePath);
}

export function clickAddGiftCertButton () {
    return browser.click(BTN_ADD_GIFT_CERT)
        .waitForVisible('table.item-list');
}

export function emptyWishList () {
    return navigateTo()
        .waitForVisible(BTN_TOGGLE_PRIVACY)
        // Must click the Remove link on each product in the Wishlist.
        .then(() => common.removeItems(LINK_REMOVE))
        .then(() => browser.waitForExist('table.item-list', 5000, true));
}

export function getItemNameByRow (rowNum) {
    return browser.elements(`${WISHLIST_ITEMS} .product-list-item .name`)
        .then(elements => browser.elementIdText(elements.value[rowNum - 1].ELEMENT))
        .then(element => element.value);
}

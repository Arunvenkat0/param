'use strict';

import client from '../webdriver/client';
import * as common from '../pageObjects/helpers/common';

export const BTN_CLOSE = 'button[title=Close]';
export const CONTAINER = '.ui-dialog';
export const SWATCHES_SIZE = '.swatches.size';
export const VARIATION_CONTAINER = '.product-variations';

function getCssSizeByIdx (idx) {
    return [
        CONTAINER,
        VARIATION_CONTAINER,
        SWATCHES_SIZE,
        'li:nth-child(' + idx + ')'
    ].join(' ');
}

export function getCssSizeLinkByIdx (idx) {
    return getCssSizeByIdx(idx) + ' a';
}

export function getSizeTextByIdx(sizeIndex) {
    return client.getText(getCssSizeByIdx(sizeIndex))
        .then(text => text.trim());
}

export function selectAttributesByVariant (variant) {
    return common.addProductVariationToBasket(variant, common.BTN_ADD_TO_CART)
        .then(() => client.waitForVisible(CONTAINER, 5000, true));
}

export function deselectAllAttributes() {
    return client.elements('.swatches .selected')
        .then(attrsToDeselect => {
            return attrsToDeselect.value.reduce((deselect) => {
                return deselect.then(() => {
                    return client.element('.swatches .selected')
                        .click()
                        .waitForVisible('.loader-bg', 500, true);
                });
            }, Promise.resolve());
        });
}

export function getMasterId () {
    return client.getAttribute('[itemprop=productID]', 'data-masterid');
}

export function isAttrValueSelected (attrType, idx) {
    return client.getAttribute('.swatches.' + attrType + ' li:nth-child(' + idx + ')', 'class')
        .then(cls => cls.indexOf('selected') > -1);
}

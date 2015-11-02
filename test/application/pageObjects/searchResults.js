'use strict';

import client from '../webdriver/client';

export const BREADCRUMB_RESULT_TEXT = '.breadcrumb-element.breadcrumb-result-text';
export const CATEGORY_BANNER = '.content-slot.slot-grid-header';
export const NO_HITS = '.no-hits-banner';
export const NO_HITS_TERM_SUGGEST = '.no-hits-search-term-suggest';
export const PDP_MAIN = '.pdp-main';
export const PRICE_LIST = '.product-price .price-standard';
export const PRICE_SALE = '.product-price .price-sales';
export const PRODUCTID_TEXT = 'span[itemprop*=productID]';
export const PRODUCTGRID_CONTAINER = '#search-result-items';
export const SEARCH_FORM = 'form[role*=search]';

export function getProductTilePricingByPid (pid) {
    return client.getText('[data-itemid="' + pid + '"] .product-price')
        .then(pricing => pricing.trim());
}

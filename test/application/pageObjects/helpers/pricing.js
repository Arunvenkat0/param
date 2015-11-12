'use strict';

export const localeCurrency = {
    'x-default': {
        currencyCode: 'usd',
        fractionDigits: 2
    },
    'en-US':  {
        currencyCode: 'usd',
        fractionDigits: 2
    },
    'en-GB': {
        currencyCode: 'gbp',
        fractionDigits: 2
    },
    'fr-FR': {
        currencyCode: 'eur',
        fractionDigits: 2
    },
    'it-IT': {
        currencyCode: 'eur',
        fractionDigits: 2
    },
    'ja-JP': {
        currencyCode: 'jpy',
        fractionDigits: 0
    },
    'zh-CN': {
        currencyCode: 'cny',
        fractionDigits: 0
    }
};

/**
 * Returns a locale-formatted price
 *
 * @param {String} price
 * @param {String} locale
 * @returns {String} - Formatted price
 */
export function getFormattedPrice(price, locale = 'en-US') {
    let normalizedLocale = locale.replace('_', '-');
    let formatOptions = {minimumFractionDigits: localeCurrency[normalizedLocale].fractionDigits};
    let normalizedPrice = price.replace(/\$|£|€|¥|,/g, '');
    let formattedAmount;

    normalizedPrice = parseFloat(normalizedPrice);
    formattedAmount = normalizedPrice.toLocaleString(normalizedLocale, formatOptions);

    switch (normalizedLocale) {
        case 'en-GB':
            return `£${formattedAmount}`;
        case 'fr-FR':
            return `${formattedAmount} €`;
        case 'it-IT':
            return `€ ${formattedAmount}`;
        case 'ja-JP':
            return `¥ ${formattedAmount}`;
        case 'zh-CN':
            return `¥${formattedAmount}`;
        default:
            return `$${formattedAmount}`;
    }
}

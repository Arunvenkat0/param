'use strict';

import _ from 'lodash';
import * as main from './main.js';

let priceBooks = null;
let priceTypes = ['list', 'sale'];

export function getPriceBooks () {
	return priceBooks;
}

/**
 * Loads Price Books test data
 *
 * @returns {Promise} - JSON object with Price Books test data
 */
export function getPriceBooksPromise () {
	return new Promise(resolve => {
		if (priceBooks) {
			resolve(priceBooks);
		} else {
			main.getSubjectTestDataPromise('pricebooks').then(results => {
				priceBooks = _parsePriceBooks(results.pricebooks.pricebook);
				resolve(priceBooks);
			});
		}
	});
}

/**
 * Loads Price Books test data
 *
 * @param {string} productId - Product ID
 * @param {string} currencyCode - three-letter currency code
 * @returns {Object} - JSON object with Price Books test data
 */
export function getPricesForProduct (productId, currencyCode = 'usd') {
	let prices = {};

	for (let type of priceTypes) {
		let products = priceBooks[_getPriceBookName(type, currencyCode)].products;
		let price = _.findWhere(products, {productId: productId});
		prices[type] = price ? _.result(price, 'amount') : null;
	}
	return prices;
}

function _parsePriceBooks (priceBooks) {
	let priceBookList = {};

	priceBooks.forEach(element => {
		let header = element.header[0];
		let priceBookId = header['$']['pricebook-id'];
		let priceTables = element['price-tables'][0]['price-table'];
		let priceTableList = [];

		priceBookList[priceBookId] = {};
		priceBookList[priceBookId]['header'] = {
			currency: header.currency[0],
			onlineFlag: header['online-flag'][0] === 'true'
		};

		priceTables.forEach(element => {
			let proxy = {
				productId: element['$']['product-id'],
				amount: element['amount'][0]['_'],
				amountQty: element['amount'][0]['$']['quantity']
			};

			priceTableList.push(proxy);
		});
		priceBookList[priceBookId]['products'] = priceTableList;
	});

	return priceBookList;
}

function _getPriceBookName (priceType, currencyCode = 'usd') {
	currencyCode = currencyCode.toLowerCase();
	return [currencyCode, priceType, 'prices'].join('-');
}


'use strict';

import * as main from './main.js';

let inventory = null;

/**
 * Loads Inventory test data
 *
 * @returns {Promise} - JSON object with inventory test data
 */
export function getInventoryPromise () {
	return new Promise(resolve => {
		if (inventory) {
			resolve(inventory);
		} else {
			main.getSubjectTestDataPromise('inventory').then(results => {
				inventory = set(_parseInventoryItems(
					results['inventory']['inventory-list'][0]['records'][0]['record']
				));
				resolve(inventory);
			});
		}
	});
}

export function get () {
	return inventory;
}

function set (quantity) {
	return inventory = quantity;
}

function _parseInventoryItems (inventoryItems) {
	let inventoryList = [];

	for (let item of inventoryItems) {
		let proxy = {
			productId: item['$']['product-id'],
			allocation: +item['allocation'][0],
			perpetual: item['perpetual'][0] === 'true'
		};

		inventoryList.push(proxy);
	}

	return inventoryList;
}

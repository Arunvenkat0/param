'use strict';

import client from '../../client';

/**
 * Fills in a form field
 *
 * @param {string} fieldType - The input field type
 * @param {string} selector - CSS selector of the DOM element
 * @param {string} value - Value to set the field to
 */
export function populateField (selector, value, fieldType = 'input') {
	switch (fieldType) {
		case 'input':
			client.setValue(selector, value);
			break;
		case 'selectByValue':
			client.selectByValue(selector, value);
			break;
		case 'selectByIndex':
			client.selectByIndex(selector, value);
			break;
	}
}


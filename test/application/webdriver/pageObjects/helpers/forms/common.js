'use strict';

import client from '../../../client';

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
			return client.setValue(selector, value);
		case 'selectByValue':
			return client.selectByValue(selector, value);
		case 'selectByIndex':
			return client.selectByIndex(selector, value);
	}
}


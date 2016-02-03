'use strict';

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
            return browser.setValue(selector, value);
        case 'selectByValue':
            return browser.selectByValue(selector, value);
        case 'selectByIndex':
            return browser.selectByIndex(selector, value);
        // Sets HTML5 input date field
        case 'date':
            return browser.element(selector)
                .then(el => browser.elementIdValue(el.value.ELEMENT, value));
    }
}

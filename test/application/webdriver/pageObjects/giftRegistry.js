'use strict';

import client from '../client';
import * as formHelpers from './helpers/forms/common';

export const SHARE_LINK = '.share-link';
export const USE_PRE_EVENT = '.usepreevent';
export const BTN_EVENT_CONTINUE = '[name*="giftregistry_event_confirm"]';
export const BTN_EVENT_ADDRESS_CONTINUE = '[name*="giftregistry_eventaddress_confirm"]';
export const BTN_SET_PUBLIC = '[name*="giftregistry_setPublic"]';
export const SHARE_OPTIONS = '[class*="share-options"]';
export const BTN_CREATE_REGISTRY = '[name*="giftregistry_create"]';
export const REGISTRY_HEADING = '.page-content-tab-wrapper h2';
export const FORM_REGISTRY = 'form[name*=giftregistry_event]';
export const LINK_REMOVE = '[class*=delete-registry]';
const basePath = '/giftregistry';

export function navigateTo () {
	return client.url(basePath);
}

export function fillOutEventForm (eventData) {
	let fieldTypes = new Map();
	let fieldsPromise = [];

	fieldTypes.set('type', 'selectByValue');
	fieldTypes.set('name', 'input');
	fieldTypes.set('date', 'date');
	fieldTypes.set('eventaddress_country', 'selectByValue');
	fieldTypes.set('eventaddress_states_state', 'selectByValue');
	fieldTypes.set('town', 'input');
	fieldTypes.set('participant_role', 'selectByValue');
	fieldTypes.set('participant_firstName', 'input');
	fieldTypes.set('participant_lastName', 'input');
	fieldTypes.set('participant_email', 'input');

	for (let [key, value] of eventData) {
		let selector = '[name*="event_' + key + '"]';
		fieldsPromise.push(formHelpers.populateField(selector, value, fieldTypes.get(key)));
	}

	return Promise.all(fieldsPromise);
}

export function fillOutEventShippingForm (eventShippingData) {
	let fieldTypes = new Map();
	let fieldsPromise = [];

	fieldTypes.set('addressBeforeList', 'selectByValue');
	fieldTypes.set('addressBeforeEvent_addressid', 'input');
	fieldTypes.set('addressBeforeEvent_firstname', 'input');
	fieldTypes.set('addressBeforeEvent_lastname', 'input');
	fieldTypes.set('addressBeforeEvent_address1', 'input');
	fieldTypes.set('addressBeforeEvent_city', 'input');
	fieldTypes.set('addressBeforeEvent_states_state', 'selectByValue');
	fieldTypes.set('addressBeforeEvent_postal', 'input');
	fieldTypes.set('addressBeforeEvent_country', 'selectByValue');
	fieldTypes.set('addressBeforeEvent_phone', 'input');

	for (let [key, value] of eventShippingData) {
		let selector = '[name*=eventaddress_' + key + ']';
		fieldsPromise.push(formHelpers.populateField(selector, value, fieldTypes.get(key)));
	}

	return Promise.all(fieldsPromise);
}

/**
 * Redirects the browser to the GiftRegistry page, and
 * delete all the Gift Registry events.
 */
export function emptyAllGiftRegistries() {
	return navigateTo()
		.then(() => client.waitForVisible(BTN_CREATE_REGISTRY))
		.then(() => client.elements(LINK_REMOVE))
		.then(removeLinks => {
			// click on all the remove links, one by one, sequentially
			return removeLinks.value.reduce(removeRegistry => {
				return removeRegistry.then(() => client.click(LINK_REMOVE)
					.then(() => client.waitUntil(() =>
						client.alertText()
							.then(
								text =>  text === 'Do you want to remove this gift registry?',
								err => err.message !== 'no alert open'
							)
					))
					.then(() => client.alertAccept()));
			}, Promise.resolve());
		});
}

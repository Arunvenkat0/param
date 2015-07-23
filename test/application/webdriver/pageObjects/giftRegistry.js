'use strict';

import client from '../client';
import * as formHelpers from './helpers/forms/common';

export const SHARE_LINK = '.share-link';
export const USE_PRE_EVENT = '.usepreevent';
export const BTN_EVENT_CONTINUE = '[name$="giftregistry_event_confirm"]';
export const BTN_EVENT_ADDRESS_CONTINUE = '[name$="giftregistry_eventaddress_confirm"]';
export const BTN_SET_PUBLIC = '[name$="giftregistry_setPublic"]';
export const SHARE_OPTIONS = '[class$="share-options"]';
export const BTN_CREATE_REGISTRY = '[name$="giftregistry_create"]';
export const REGISTRY_HEADING = '.page-content-tab-wrapper h2';

const basePath = '/giftregistry';

export function navigateTo () {
	return client.url(basePath);
}

export function fillOutEventForm (eventData) {
	let fieldTypes = new Map();
	let fieldsPromise = [];

	fieldTypes.set('type', 'selectByValue');
	fieldTypes.set('name', 'input');
	fieldTypes.set('date', 'input');
	fieldTypes.set('eventaddress_country', 'selectByValue');
	fieldTypes.set('eventaddress_states_state', 'selectByValue');
	fieldTypes.set('town', 'input');
	fieldTypes.set('participant_role', 'selectByValue');
	fieldTypes.set('participant_firstName', 'input');
	fieldTypes.set('participant_lastName', 'input');
	fieldTypes.set('participant_email', 'input');

	for (let [key, value] of eventData) {
		let selector = '[name$="event_' + key + '"]';
		fieldsPromise.push(formHelpers.populateField(selector, value, fieldTypes.get(key)));
	}

	return Promise.all(fieldsPromise);
}

export function fillOutEventShippingForm (eventShippingData) {
	let fieldTypes = new Map();
	let fieldsPromise = [];

	fieldTypes.set('addressid', 'input');
	fieldTypes.set('firstname', 'input');
	fieldTypes.set('lastname', 'input');
	fieldTypes.set('address1', 'input');
	fieldTypes.set('city', 'input');
	fieldTypes.set('states_state', 'selectByValue');
	fieldTypes.set('postal', 'input');
	fieldTypes.set('country', 'selectByValue');
	fieldTypes.set('phone', 'input');

	for (let [key, value] of eventShippingData) {
		let selector = '[name$="addressBeforeEvent_' + key + '"]';
		fieldsPromise.push(formHelpers.populateField(selector, value, fieldTypes.get(key)));
	}

	return Promise.all(fieldsPromise);
}


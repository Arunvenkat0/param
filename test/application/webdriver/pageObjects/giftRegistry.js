'use strict'

import client from '../client';
import config from '../config';
import * as formHelpers from './forms/helpers';

export const CSS_SHARE_LINK = '.share-link';
export const USE_PRE_EVENT = '.usepreevent';

const basePath = '/giftregistry';

export const configUrl = config.url;

export function navigateTo () {
	return client.url(config.url + basePath);
}

export function pressBtnNewRegistry () {
	return client.click('[name$="giftregistry_create"]');
}

export function pressBtnContinueEventForm () {
	return client.click('[name$="giftregistry_event_confirm"]');
}

export function pressBtnContinueEventAddressForm () {
	return client.click('[name$="giftregistry_eventaddress_confirm"]');
}

export function pressBtnMakeRegistryPublic () {
	return client.click('[name$="giftregistry_setPublic"]');
}

export function pressBtnUsePreEventShippingAddress () {
	return client.click(USE_PRE_EVENT);
}

export function fillOutEventForm (eventData) {
	var fieldTypeMap = new Map();

	fieldTypeMap.set('type', 'selectByValue');
	fieldTypeMap.set('name', 'input');
	fieldTypeMap.set('date', 'input');
	fieldTypeMap.set('eventaddress_country', 'selectByValue');
	fieldTypeMap.set('eventaddress_states_state', 'selectByValue');
	fieldTypeMap.set('town', 'input');
	fieldTypeMap.set('participant_role', 'selectByValue');
	fieldTypeMap.set('participant_firstName', 'input');
	fieldTypeMap.set('participant_lastName', 'input');
	fieldTypeMap.set('participant_email', 'input');

	for (var [key, value] of eventData) {
		var selector = '[name$="event_' + key + '"]';
		formHelpers.populateField(selector, value, fieldTypeMap.get(key));
	}

	return client;
}

export function fillOutEventShippingForm (eventShippingData) {
	var fieldMapType = new Map();

	fieldMapType.set('addressid', 'input');
	fieldMapType.set('firstname', 'input');
	fieldMapType.set('lastname', 'input');
	fieldMapType.set('address1', 'input');
	fieldMapType.set('city', 'input');
	fieldMapType.set('states_state', 'selectByValue');
	fieldMapType.set('postal', 'input');
	fieldMapType.set('country', 'selectByValue');
	fieldMapType.set('phone', 'input');

	for (var [key, value] of eventShippingData) {
		var selector = '[name$="addressBeforeEvent_' + key + '"]';
		formHelpers.populateField(selector, value, fieldMapType.get(key));
	}

	return client;
}


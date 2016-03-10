'use strict';

import * as formHelpers from './helpers/forms/common';

export const SHARE_LINK = '.share-link';
export const USE_PRE_EVENT = '.usepreevent';
export const BTN_ADD_GIFT_CERT = '[name*=addGiftCertificate]';
export const BTN_EVENT_SET_PARTICIPANTS = '[name*="giftregistry_event_setParticipants"]';
export const BTN_EVENT_ADDRESS_CONTINUE = '[name*="giftregistry_eventaddress_setBeforeAfterAddresses"]';
export const BTN_EVENT_CONFIRM = '[name*="giftregistry_event_confirm"]';
export const BTN_SET_PUBLIC = '[name*="giftregistry_setPublic"]';
export const SHARE_OPTIONS = '[class*="share-options"]';
export const BTN_CREATE_REGISTRY = '[name*="giftregistry_create"]';
export const REGISTRY_HEADING = '.page-content-tab-wrapper h2';
export const FORM_REGISTRY = 'form[name*="giftregistry_event"]';
export const LINK_REMOVE = '[class*="delete-registry"]';
export const SEARCH_GIFTREGISTRY = 'button[name$="giftregistry_search_search"]';
export const INPUT_LASTTNAME = 'input[name$="registrantLastName"]';
export const INPUT_FIRSTNAME = 'input[name$="registrantFirstName"]';
export const INPUT_EVENTTYPE = 'select[id*="giftregistry_search_simple_eventType"]';
export const ITEM_LIST = '.item-list';
export const ITEM_NAME = '.name';
export const BUTTON_FIND = 'button[value=Find]';
export const LINK_VIEW_GIFTREGISTRY = 'a[href*="giftregistryshow"]';
export const TABLE_GR_ITEMS = 'table[class*="item-list"] tr';
export const firstName = 'Test1';
export const lastName = 'User1';
export const eventType = 'wedding';
export const eventTitle = '.list-title';
export const eventName = 'WEDDING OF THE CENTURY - 3/28/08';
export const buttonPrint = 'button[class=print-page]';


const basePath = '/giftregistry';

export function navigateTo () {
    return browser.url(basePath);
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

export function fillOutEventShippingForm (eventShippingData, locale) {
    let fieldTypes = new Map();
    let fieldsPromise = [];

    fieldTypes.set('addressid', 'input');
    fieldTypes.set('firstname', 'input');
    fieldTypes.set('lastname', 'input');
    fieldTypes.set('address1', 'input');
    fieldTypes.set('city', 'input');
    if (locale && locale === 'x_default') {
        fieldTypes.set('states_state', 'selectByValue');
    }
    fieldTypes.set('postal', 'input');
    fieldTypes.set('country', 'selectByValue');
    fieldTypes.set('phone', 'input');

    for (let [key, value] of eventShippingData) {
        let selector = '[name*=eventaddress_addressBeforeEvent_' + key + ']';
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
        .then(() => browser.waitForVisible(BTN_CREATE_REGISTRY))
        .then(() => browser.elements(LINK_REMOVE))
        .then(removeLinks => {
            // click on all the remove links, one by one, sequentially
            return removeLinks.value.reduce(removeRegistry => {
                return removeRegistry.then(() => browser.click(LINK_REMOVE)
                    .then(() => browser.waitUntil(() =>
                            browser.alertText()
                                .then(
                                    text =>  text === 'Do you want to remove this gift registry?',
                                    err => err.message !== 'no alert open'
                            )
                    ))
                    .then(() => browser.alertAccept()));
            }, Promise.resolve());
        });
}
 /* open the first giftRegistry
 *
 */
export function openGiftRegistry () {
    browser.click(LINK_VIEW_GIFTREGISTRY);
}

export function searchGiftRegistry(lastName, firstName, eventType) {
    //caller should be responsible navigate to the Gift Registry page before calling this function
    return browser.waitForVisible(SEARCH_GIFTREGISTRY)
        .setValue(INPUT_LASTTNAME, lastName)
        .setValue(INPUT_FIRSTNAME, firstName)
        .selectByValue(INPUT_EVENTTYPE, eventType)
        .click(BUTTON_FIND);
}

export function getGiftRegistryCount () {
    return browser.elements(TABLE_GR_ITEMS)
        .then(eventRows => eventRows.value.length - 1);
}

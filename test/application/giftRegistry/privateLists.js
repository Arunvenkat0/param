'use strict';

import {assert} from 'chai';
import {config} from '../webdriver/wdio.conf';
import * as giftRegistryPage from '../pageObjects/giftRegistry';
import * as testData from '../pageObjects/testData/main';
import * as loginForm from '../pageObjects/helpers/forms/login';
import * as navHeader from '../pageObjects/navHeader';
import * as footerPage from '../pageObjects/footer';
import * as customers from '../pageObjects/testData/customers';

let locale = config.locale;

describe('Private Gift Registries', () => {
    const login = 'testuser1@demandware.com';
    let publicEventFormData = {};
    let privateEventFormData = {};
    let eventFormShippingData = {};
    let firstName;
    let lastName;

    before(() => testData.load()
        .then(() => {
            const customer = testData.getCustomerByLogin(login);
            const address = customer.getPreferredAddress();
 
            firstName = customer.firstName;
            lastName = customer.lastName;

            customer.addresses[0].postalCode = customers.globalPostalCode[locale];
            customer.addresses[0].countryCode = customers.globalCountryCode[locale];
            customer.addresses[0].phone = customers.globalPhone[locale];

            publicEventFormData = {
                type: 'wedding',
                name: 'Public Registry',
                date: '03/28/2008',
                eventaddress_country: address.countryCode,
                town: address.city,
                participant_role: 'Groom',
                participant_firstName: customer.firstName,
                participant_lastName: customer.lastName,
                participant_email: customer.email
            };  
 
            privateEventFormData = {
                type: 'wedding',
                name: 'Private Registry',
                date: '03/28/2008',
                eventaddress_country: address.countryCode,
                town: address.city,
                participant_role: 'Groom',
                participant_firstName: customer.firstName,
                participant_lastName: customer.lastName,
                participant_email: customer.email
            };  

            eventFormShippingData = {
                addressid: 'summerHome',
                firstname: customer.firstName,
                lastname: customer.lastName,
                address1: address.address1,
                city: address.city,
                postal: address.postalCode,
                country: address.countryCode,
                phone: address.phone
            };

            if (locale && (locale === 'x_default' || locale === 'en_US')) {
                publicEventFormData.eventaddress_states_state = address.stateCode;
                privateEventFormData.eventaddress_states_state = address.stateCode;
                eventFormShippingData.states_state = address.stateCode;
            }
        })
        .then(() => giftRegistryPage.navigateTo())
        .then(() => loginForm.loginAsDefaultCustomer(locale))
        .then(() => browser.waitForVisible(giftRegistryPage.BTN_CREATE_REGISTRY))
        .then(() => giftRegistryPage.emptyAllGiftRegistries())
        .then(() => browser.click(giftRegistryPage.BTN_CREATE_REGISTRY))
        .then(() => browser.waitForVisible(giftRegistryPage.FORM_REGISTRY))
    );

    after(() =>
        navHeader.logout()
    );

    it('should create a public registry', () =>
        giftRegistryPage.fillOutEventForm(publicEventFormData, locale)
            // FIXME: This button is always enabled, even if form is not filled
            // out.  Would be better to check on some other attribute RAP-4690
            .then(() => browser.isEnabled(giftRegistryPage.BTN_EVENT_SET_PARTICIPANTS))
            .then(enabled => assert.ok(enabled))
            .then(() => browser.click(giftRegistryPage.BTN_EVENT_SET_PARTICIPANTS)
            .waitForVisible(giftRegistryPage.USE_PRE_EVENT)
            .then(() => giftRegistryPage.fillOutEventShippingForm(eventFormShippingData, locale))
            // This wait is necessary, since without it, the .click() will fire
            // even if the required fields have not been filled in
            .then(() => browser.waitForValue('[name*=addressBeforeEvent_phone]')
                .click(giftRegistryPage.USE_PRE_EVENT)
                .waitForVisible(giftRegistryPage.BTN_EVENT_ADDRESS_CONTINUE)
                .isEnabled(giftRegistryPage.BTN_EVENT_ADDRESS_CONTINUE)
            )
            .then(enabled => assert.ok(enabled))
            .click(giftRegistryPage.BTN_EVENT_ADDRESS_CONTINUE)
            .waitForVisible(giftRegistryPage.BTN_EVENT_CONFIRM)
            .click(giftRegistryPage.BTN_EVENT_CONFIRM)
            // make the event public
            .click(giftRegistryPage.BTN_SET_PUBLIC)
            .waitForVisible(giftRegistryPage.SHARE_OPTIONS)
            .isVisible(giftRegistryPage.SHARE_OPTIONS)
            .then(visible => assert.isTrue(visible))
            // navigate back to main gift registry page
            .then(() => giftRegistryPage.navigateTo())
            .click(giftRegistryPage.BTN_CREATE_REGISTRY)
            .waitForVisible(giftRegistryPage.FORM_REGISTRY))
    );

    it('should create a private registry', () =>
        giftRegistryPage.fillOutEventForm(privateEventFormData, locale)
            // FIXME: This button is always enabled, even if form is not filled
            // out.  Would be better to check on some other attribute RAP-4690
            .then(() => browser.isEnabled(giftRegistryPage.BTN_EVENT_SET_PARTICIPANTS))
            .then(enabled => assert.ok(enabled))
            .then(() => browser.click(giftRegistryPage.BTN_EVENT_SET_PARTICIPANTS)
            .waitForVisible(giftRegistryPage.USE_PRE_EVENT)
            .then(() => giftRegistryPage.fillOutEventShippingForm(eventFormShippingData, locale))
            // This wait is necessary, since without it, the .click() will fire
            // even if the required fields have not been filled in
            .then(() => browser.waitForValue('[name*=addressBeforeEvent_phone]')
                .click(giftRegistryPage.USE_PRE_EVENT)
                .waitForVisible(giftRegistryPage.BTN_EVENT_ADDRESS_CONTINUE)
                .isEnabled(giftRegistryPage.BTN_EVENT_ADDRESS_CONTINUE)
            )
            .then(enabled => assert.ok(enabled))
            .click(giftRegistryPage.BTN_EVENT_ADDRESS_CONTINUE)
            .waitForVisible(giftRegistryPage.BTN_EVENT_CONFIRM)
            .click(giftRegistryPage.BTN_EVENT_CONFIRM))
    );

    it('should search for the user and only find 1 public registry', () => {
        return navHeader.logout()
            .then(() => browser.click(footerPage.GIFT_REGISTRY))
            .waitForVisible(footerPage.GIFT_REGISTRY)
            .then(() => giftRegistryPage.searchGiftRegistry(
                lastName,
                firstName,
                giftRegistryPage.eventType))
            .then(() => giftRegistryPage.getGiftRegistryCount())
            .then(rows => assert.equal(1, rows))
            .then(() => giftRegistryPage.openGiftRegistry())
            .then(() => browser.waitForVisible(giftRegistryPage.BUTTON_FIND));
    });

    it('should login and see both the public and private registries', () => {
        return giftRegistryPage.navigateTo()
            .then(() => loginForm.loginAsDefaultCustomer(locale))
            .then(() => browser.waitForVisible(giftRegistryPage.BTN_CREATE_REGISTRY))
            .then(() => giftRegistryPage.getGiftRegistryCount())
            .then(rows => assert.equal(2, rows));            
    });

    it('should delete all the gift registry events', () => {
        return giftRegistryPage.emptyAllGiftRegistries()
            .then(() => browser.isExisting(giftRegistryPage.LINK_REMOVE))
            .then(doesExist => assert.isFalse(doesExist));
    });
});

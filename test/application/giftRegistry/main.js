'use strict';

import {assert} from 'chai';
import {config} from '../webdriver/wdio.conf';
import * as giftRegistryPage from '../pageObjects/giftRegistry';
import * as testData from '../pageObjects/testData/main';
import * as loginForm from '../pageObjects/helpers/forms/login';
import * as navHeader from '../pageObjects/navHeader';
import * as footerPage from '../pageObjects/footer';
import * as gCustomer from '../pageObjects/testData/customers';

let locale = config.locale;

describe('Gift Registry', () => {
    let login = 'testuser1@demandware.com';
    let eventFormData = new Map();
    let eventFormShippingData = new Map();
    let firstName;
    let lastName;

    let socialLinks = {
        facebook: {
            selector: 'a[data-share=facebook]',
            baseUrl: 'https://www.facebook.com/sharer/sharer.php',
            regex: /.*\?.*u=.+/
        },
        twitter: {
            selector: 'a[data-share=twitter]',
            baseUrl: 'https://twitter.com/intent/tweet/',
            regex: /.*\?.*url=.+/
        },
        googlePlus: {
            selector: 'a[data-share=googleplus]',
            baseUrl: 'https://plus.google.com/share',
            regex: /.*\?.*url=.+/
        },
        pinterest: {
            selector: 'a[data-share=pinterest]',
            baseUrl: 'https://www.pinterest.com/pin/create/button/',
            regex: /.*\?.*url=.+/
        },
        emailLink: {
            selector: 'a[data-share=email]',
            baseUrl: 'mailto:name@email.com',
            regex: /.*\&.*body=.+/
        },
        shareLinkIcon: {
            selector: giftRegistryPage.SHARE_LINK
        },
        shareLinkUrl: {
            selector: '.share-link-content a',
            baseUrl: config.baseUrl,
            regex: /.*\?.*ID=.+/
        }
    };


    let giftRegistryTitle = {
        'x_default': 'WEDDING OF THE CENTURY - 3/28/08',
        'en_GB': 'WEDDING OF THE CENTURY - 28/03/2008',
        'fr-FR': 'mariage du siècle - 3/28/08',
        'it-IT': 'matrimonio del secolo - 3/28/08',
        'ja-JP': '世紀の結婚式 -2008年3月28日',
        'zh-CN': '世纪婚礼 - 2008年3月28号'
    };

    before(() => testData.load()
        .then(() => testData.getCustomerByLogin(login))
        .then(customer => {
            customer.addresses[0].postalCode = gCustomer.globalPostalCode[locale];
            customer.addresses[0].countryCode = gCustomer.globalCountryCode[locale];
            customer.addresses[0].phone = gCustomer.globalPhone[locale];

            let address = customer.getPreferredAddress();

            firstName = customer.firstName;
            lastName = customer.lastName;

            eventFormData.set('type', 'wedding');
            eventFormData.set('name', 'Wedding of the Century');
            eventFormData.set('date', '03-28-2008');
            eventFormData.set('eventaddress_country', address.countryCode);
            if (locale && locale === 'x_default') {
                eventFormData.set('eventaddress_states_state', address.stateCode);
            }
            eventFormData.set('town', address.city);
            eventFormData.set('participant_role', 'Groom');
            eventFormData.set('participant_firstName', customer.firstName);
            eventFormData.set('participant_lastName', customer.lastName);
            eventFormData.set('participant_email', customer.email);
            //addressid field cannot have the same value as an existing Address name, ex. Home or Work
            eventFormShippingData.set('addressid', 'summerHome');
            eventFormShippingData.set('firstname', customer.firstName);
            eventFormShippingData.set('lastname', customer.lastName);
            eventFormShippingData.set('address1', address.address1);
            eventFormShippingData.set('city', address.city);
            if (locale && locale === 'x_default') {
                eventFormShippingData.set('states_state', address.stateCode);
            }
            eventFormShippingData.set('postal', address.postalCode);
            eventFormShippingData.set('country', address.countryCode);
            eventFormShippingData.set('phone',address.phone);
        })
        .then(() => giftRegistryPage.navigateTo())
        .then(() => loginForm.loginAsDefaultCustomer(locale))
        .then(() => browser.waitForVisible(giftRegistryPage.BTN_CREATE_REGISTRY))
        .then(() => giftRegistryPage.emptyAllGiftRegistries())
        .then(() => browser.click(giftRegistryPage.BTN_CREATE_REGISTRY))
        .then(() => browser.waitForVisible(giftRegistryPage.FORM_REGISTRY))
    );

    after(() => navHeader.logout());

    it('should fill out the event form', () =>
        giftRegistryPage.fillOutEventForm(eventFormData, locale)
            // FIXME: This button is always enabled, even if form is not filled
            // out.  Would be better to check on some other attribute
            .then(() => browser.isEnabled(giftRegistryPage.BTN_EVENT_CONTINUE))
            .then(enabled => assert.ok(enabled))
    );

    it('should fill out the event shipping form', () =>
        browser.click(giftRegistryPage.BTN_EVENT_CONTINUE)
            .waitForVisible(giftRegistryPage.USE_PRE_EVENT)
            .then(() => giftRegistryPage.fillOutEventShippingForm(eventFormShippingData, locale))
            // This wait is necessary, since without it, the .click() will fire
            // even if the required fields have not been filled in
            .then(() => browser.waitForValue('[name*=addressBeforeEvent_phone]'))
            .then(() => browser.click(giftRegistryPage.USE_PRE_EVENT))
            .then(() => browser.waitForVisible(giftRegistryPage.BTN_EVENT_ADDRESS_CONTINUE))
            .then(() => browser.isEnabled(giftRegistryPage.BTN_EVENT_ADDRESS_CONTINUE))
            .then(enabled => assert.ok(enabled))
    );

    it('should submit the event', () =>
        browser.click(giftRegistryPage.BTN_EVENT_ADDRESS_CONTINUE)
            .then(() => browser.waitForVisible(giftRegistryPage.BTN_EVENT_CONTINUE))
            .then(() => browser.click(giftRegistryPage.BTN_EVENT_CONTINUE))
            .then(() => browser.waitForVisible(giftRegistryPage.REGISTRY_HEADING))
            .then(() => browser.getText(giftRegistryPage.REGISTRY_HEADING))
            .then(eventTitle => assert.equal(eventTitle, giftRegistryTitle[locale]))
    );

    it('should make the gift registry public', () =>
        browser.click(giftRegistryPage.BTN_SET_PUBLIC)
            .waitForVisible(giftRegistryPage.SHARE_OPTIONS)
            .then(() => browser.isVisible(giftRegistryPage.SHARE_OPTIONS))
            .then(visible => assert.isTrue(visible))
    );

    it('should display a Facebook icon and link', () =>
        browser.isExisting(socialLinks.facebook.selector)
            .then(doesExist => assert.isTrue(doesExist))
            .then(() => browser.getAttribute(socialLinks.facebook.selector, 'href'))
            .then(href => {
                assert.isTrue(href.startsWith(socialLinks.facebook.baseUrl));
                assert.ok(href.match(socialLinks.facebook.regex));
            })
    );

    it('should display a Twitter icon and link', () =>
        browser.isExisting(socialLinks.twitter.selector)
            .then(doesExist => assert.isTrue(doesExist))
            .then(() => browser.getAttribute(socialLinks.twitter.selector, 'href'))
            .then(href => {
                assert.isTrue(href.startsWith(socialLinks.twitter.baseUrl));
                assert.ok(href.match(socialLinks.twitter.regex));
            })
    );

    it('should display a Google Plus icon and link', () =>
        browser.isExisting(socialLinks.googlePlus.selector)
            .then(doesExist => assert.isTrue(doesExist))
            .then(() => browser.getAttribute(socialLinks.googlePlus.selector, 'href'))
            .then(href => {
                assert.isTrue(href.startsWith(socialLinks.googlePlus.baseUrl));
                assert.ok(href.match(socialLinks.googlePlus.regex));
            })
    );

    it('should display a Pinterest icon and link', () =>
        browser.isExisting(socialLinks.pinterest.selector)
            .then(doesExist => assert.isTrue(doesExist))
            .then(() => browser.getAttribute(socialLinks.pinterest.selector, 'href'))
            .then(href => {
                assert.isTrue(href.startsWith(socialLinks.pinterest.baseUrl));
                assert.ok(href.match(socialLinks.pinterest.regex));
            })
    );

    it('should display a Mail icon and link', () =>
        browser.isExisting(socialLinks.emailLink.selector)
            .then(doesExist => assert.isTrue(doesExist))
            .then(() => browser.getAttribute(socialLinks.emailLink.selector, 'href'))
            .then(href => {
                assert.isTrue(href.startsWith(socialLinks.emailLink.baseUrl));
                assert.ok(href.match(socialLinks.emailLink.regex));
            })
    );

    it('should display a link icon', () =>
        browser.isExisting(socialLinks.shareLinkIcon.selector)
            .then(doesExist => assert.isTrue(doesExist))
    );

    it('should display a URL when chain icon clicked', () =>
        browser.click(giftRegistryPage.SHARE_LINK)
            .then(() => browser.waitForVisible(socialLinks.shareLinkUrl.selector))
            .then(() => browser.isVisible(socialLinks.shareLinkUrl.selector))
            .then(visible => assert.isTrue(visible))
            .then(() => browser.getAttribute(socialLinks.shareLinkUrl.selector, 'href'))
            .then(href => {
                assert.isTrue(href.startsWith(socialLinks.shareLinkUrl.baseUrl));
                assert.ok(href.match(socialLinks.shareLinkUrl.regex));
            })
    );

    it('should return the event at Gift Registry search', () => {
        return navHeader.logout()
            .then(() => browser.click(footerPage.GIFT_REGISTRY))
            .then(() => browser.waitForVisible(footerPage.GIFT_REGISTRY))
            .then(() => giftRegistryPage.searchGiftRegistry(
                lastName,
                firstName,
                giftRegistryPage.eventType))
            .then(() => giftRegistryPage.getGiftRegistryCount())
            .then(rows => assert.equal(1, rows))
            .then(() => giftRegistryPage.openGiftRegistry())
            .then(() => browser.waitForVisible(giftRegistryPage.BUTTON_FIND))
            .then(() => browser.getText(giftRegistryPage.eventTitle))
            .then(str => assert.equal(str, giftRegistryTitle[locale]));
    });

    it('should delete all the gift registry events', () => {
        return giftRegistryPage.navigateTo()
            .then(() => loginForm.loginAsDefaultCustomer(locale))
            .then(() => browser.waitForVisible(giftRegistryPage.BTN_CREATE_REGISTRY))
            .then(() => giftRegistryPage.emptyAllGiftRegistries())
            .then(() => browser.isExisting(giftRegistryPage.LINK_REMOVE))
            .then(doesExist => assert.isFalse(doesExist));
    });

});

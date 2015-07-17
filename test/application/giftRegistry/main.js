'use strict';

import {assert} from 'chai';
import config from '../webdriver/config';
import client from '../webdriver/client';
import * as giftRegistryPage from '../webdriver/pageObjects/giftRegistry';
import * as testData from '../webdriver/pageObjects/testData/main';
import * as loginForm from '../webdriver/pageObjects/helpers/forms/login';


describe('Gift Registry', () => {
	let login = 'testuser1@demandware.com';
	let eventFormData = new Map();
	let eventFormShippingData = new Map();

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
			baseUrl: config.url,
			regex: /.*\?.*ID=.+/
		}
	};

	before(() => client.init()
		.then(() => giftRegistryPage.navigateTo())
		.then(() => loginForm.loginAsDefaultCustomer())
		.then(() => client.click(giftRegistryPage.BTN_CREATE_REGISTRY))
		.then(() => testData.getCustomerByLogin(login))
		.then(customer => {
			let address = customer.getPreferredAddress();

			eventFormData.set('type', 'Wedding');
			eventFormData.set('name', 'blah');
			eventFormData.set('date', '03/28/08');
			eventFormData.set('eventaddress_country', address.countryCode);
			eventFormData.set('eventaddress_states_state', address.stateCode);
			eventFormData.set('town', address.city);
			eventFormData.set('participant_role', 'Groom');
			eventFormData.set('participant_firstName', customer.firstName);
			eventFormData.set('participant_lastName', customer.lastName);
			eventFormData.set('participant_email', customer.email);

			eventFormShippingData.set('addressid', 'test address');
			eventFormShippingData.set('firstname', customer.firstName);
			eventFormShippingData.set('lastname', customer.lastName);
			eventFormShippingData.set('address1', address.address1);
			eventFormShippingData.set('city', address.city);
			eventFormShippingData.set('states_state', address.stateCode);
			eventFormShippingData.set('postal', address.postalCode);
			eventFormShippingData.set('country', address.countryCode);
			eventFormShippingData.set('phone', address.phone);
		})
	);

	after(() => client.end());

	it('should fill out the event form', () =>
		giftRegistryPage.fillOutEventForm(eventFormData)
			.then(() => client.isEnabled(giftRegistryPage.BTN_EVENT_CONTINUE))
			.then(enabled => assert.ok(enabled))
	);

	it('should fill out the event shipping form', () =>
		client.click(giftRegistryPage.BTN_EVENT_CONTINUE)
			.then(() => giftRegistryPage.fillOutEventShippingForm(eventFormShippingData))
			.then(() => client.click(giftRegistryPage.USE_PRE_EVENT))
			.then(() => client.isEnabled(giftRegistryPage.BTN_EVENT_ADDRESS_CONTINUE))
			.then(enabled => assert.ok(enabled))
	);

	it('should submit the event', () =>
		client.click(giftRegistryPage.BTN_EVENT_ADDRESS_CONTINUE)
			.then(() => client.click(giftRegistryPage.BTN_EVENT_CONTINUE))
			.then(() => client.getText(giftRegistryPage.REGISTRY_HEADING))
			.then(eventTitle => assert.equal(eventTitle, 'BLAH - 3/28/08'))
	);
	it('should make the gift registry public', () =>
			client.click(giftRegistryPage.BTN_SET_PUBLIC)
			.then(() => client.isVisible(giftRegistryPage.SHARE_OPTIONS))
			.then(visible => assert.isTrue(visible))
	);

	it('should display a Facebook icon and link', () =>
		client.isExisting(socialLinks.facebook.selector)
			.then(doesExist => assert.isTrue(doesExist))
			.then(() => client.getAttribute(socialLinks.facebook.selector, 'href'))
			.then(href => {
				assert.isTrue(href.startsWith(socialLinks.facebook.baseUrl));
				assert.ok(href.match(socialLinks.facebook.regex));
			})
	);

	it('should display a Twitter icon and link', () =>
		client.isExisting(socialLinks.twitter.selector)
			.then(doesExist => assert.isTrue(doesExist))
			.then(() => client.getAttribute(socialLinks.twitter.selector, 'href'))
			.then(href => {
				assert.isTrue(href.startsWith(socialLinks.twitter.baseUrl));
				assert.ok(href.match(socialLinks.twitter.regex));
			})
	);

	it('should display a Google Plus icon and link', () =>
		client.isExisting(socialLinks.googlePlus.selector)
			.then(doesExist => assert.isTrue(doesExist))
			.then(() => client.getAttribute(socialLinks.googlePlus.selector, 'href'))
			.then(href => {
				assert.isTrue(href.startsWith(socialLinks.googlePlus.baseUrl));
				assert.ok(href.match(socialLinks.googlePlus.regex));
			})
	);

	it('should display a Pinterest icon and link', () =>
		client.isExisting(socialLinks.pinterest.selector)
			.then(doesExist => assert.isTrue(doesExist))
			.then(() => client.getAttribute(socialLinks.pinterest.selector, 'href'))
			.then(href => {
				assert.isTrue(href.startsWith(socialLinks.pinterest.baseUrl));
				assert.ok(href.match(socialLinks.pinterest.regex));
			})
	);

	it('should display a Mail icon and link', () =>
		client.isExisting(socialLinks.emailLink.selector)
			.then(doesExist => assert.isTrue(doesExist))
			.then(() => client.getAttribute(socialLinks.emailLink.selector, 'href'))
			.then(href => {
				assert.isTrue(href.startsWith(socialLinks.emailLink.baseUrl));
				assert.ok(href.match(socialLinks.emailLink.regex));
			})
	);

	it('should display a link icon', () =>
		client.isExisting(socialLinks.shareLinkIcon.selector)
			.then(doesExist => assert.isTrue(doesExist))
	);

	it('should display a URL when chain icon clicked', () =>
		client.click(giftRegistryPage.SHARE_LINK)
			.then(() => client.waitForVisible(socialLinks.shareLinkUrl.selector))
			.then(() => client.isVisible(socialLinks.shareLinkUrl.selector))
			.then(visible => assert.isTrue(visible))
			.then(() => client.getAttribute(socialLinks.shareLinkUrl.selector, 'href'))
			.then(href => {
				assert.isTrue(href.startsWith(socialLinks.shareLinkUrl.baseUrl));
				assert.ok(href.match(socialLinks.shareLinkUrl.regex));
			})
	);

});

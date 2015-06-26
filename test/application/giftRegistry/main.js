'use strict'

import {assert} from 'chai';

import client from '../webdriver/client';
import * as giftRegistryPage from '../webdriver/pageObjects/giftRegistry';
import * as testData from '../webdriver/pageObjects/testData/main';
import * as loginForm from '../webdriver/pageObjects/forms/login';


describe('Gift Registry', () => {
	let customer;
	let login = 'testuser1@demandware.com';
	let eventFormData = new Map();
	let eventFormShippingData = new Map();
	let address;

	let socialLinksMap = {
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
		 	selector: giftRegistryPage.CSS_SHARE_LINK,
		},
		shareLinkUrl: {
			selector: '.share-link-content a',
			baseUrl: giftRegistryPage.configUrl,
			regex: /.*\?.*ID=.+/
		}
	};

	before(() => client.init()
		.then(() => giftRegistryPage.navigateTo())
		.then(() => loginForm.loginAsDefaultCustomer())
		.then(() => giftRegistryPage.pressBtnNewRegistry())
	);

	before(() => {
		return testData.getCustomerByLogin(login)
			.then(cust => {
				customer = cust;

				address = customer.getPreferredAddress();

				eventFormData.set('type', 'Wedding');
				eventFormData.set('name', 'balh');
				eventFormData.set('date', '03/28/08');
				eventFormData.set('eventaddress_country', address.countryCode);
				eventFormData.set('eventaddress_states_state', address.stateCode);
				eventFormData.set('town', address.city);
				eventFormData.set('participant_role', 'Groom');
				eventFormData.set('participant_firstName', customer.firstName);
				eventFormData.set('participant_lastName', customer.lastName);
				eventFormData.set('participant_email', customer.email);

				eventFormShippingData.set('firstname', customer.firstName);
				eventFormShippingData.set('lastname', customer.lastName);
				eventFormShippingData.set('address1', address.address1);
				eventFormShippingData.set('country', address.countryCode);
				eventFormShippingData.set('states_state', address.stateCode);
				eventFormShippingData.set('city', address.city);
				eventFormShippingData.set('postal', address.postalCode);
				eventFormShippingData.set('phone', address.phone);
			});
	});

	after(() => client.end());

	it('should fill out the event form', () =>
		giftRegistryPage.fillOutEventForm(eventFormData)
			.then(() => client.isEnabled('[name$="giftregistry_event_confirm"]'))
			.then(enabled => assert.ok(enabled))
	);

	it('should fill out the event shipping form', () =>
		giftRegistryPage.pressBtnContinueEventForm()
			.then(() => giftRegistryPage.fillOutEventShippingForm(eventFormShippingData))
			.then(() => giftRegistryPage.pressBtnUsePreEventShippingAddress())
			.then(() => client.isEnabled('[name$="giftregistry_eventaddress_confirm"]'))
			.then(enabled => assert.ok(enabled))
	);

	it('should display the event information', () =>
		giftRegistryPage.pressBtnContinueEventAddressForm()
			.then(() => client.waitForExist('form[name$="giftregistry_enevt_confirm"]'))
			.then(() => giftRegistryPage.pressBtnContinueEventForm())
			.then(() => giftRegistryPage.pressBtnMakeRegistryPublic())
			.then(() => client.isVisible('[class$="share-options"]'))
			.then(visible => assert.isTrue(visible))
	);
	
	it('should display a Facebook icon and link', () => 
		client.isExisting(socialLinksMap.facebook.selector)
			.then(doesExist => assert.isTrue(doesExist))
			.then(() => client.getAttribute(socialLinksMap.facebook.selector, 'href'))
			.then(href => {
				assert.isTrue(href.startsWith(socialLinksMap.facebook.baseUrl))
				assert.ok(href.match(socialLinksMap.facebook.regex))
			})
	);

	it('should display a Twitter icon and link', () => 
		client.isExisting(socialLinksMap.twitter.selector)
			.then(doesExist => assert.isTrue(doesExist))
			.then(() => client.getAttribute(socialLinksMap.twitter.selector, 'href'))
			.then(href => {
				assert.isTrue(href.startsWith(socialLinksMap.twitter.baseUrl))
				assert.ok(href.match(socialLinksMap.twitter.regex))
			})
	);

	it('should display a Google Plus icon and link', () => 
		client.isExisting(socialLinksMap.googlePlus.selector)
			.then(doesExist => assert.isTrue(doesExist))
			.then(() => client.getAttribute(socialLinksMap.googlePlus.selector, 'href'))
			.then(href => {
				assert.isTrue(href.startsWith(socialLinksMap.googlePlus.baseUrl))
				assert.ok(href.match(socialLinksMap.googlePlus.regex))
			})
	);

	it('should display a Pinterest icon and link', () => 
		client.isExisting(socialLinksMap.pinterest.selector)
			.then(doesExist => assert.isTrue(doesExist))
			.then(() => client.getAttribute(socialLinksMap.pinterest.selector, 'href'))
			.then(href => {
				assert.isTrue(href.startsWith(socialLinksMap.pinterest.baseUrl))
				assert.ok(href.match(socialLinksMap.pinterest.regex))
			})
	);

	it('should display a Mail icon and link', () => 
		client.isExisting(socialLinksMap.emailLink.selector)
			.then(doesExist => assert.isTrue(doesExist))
			.then(() => client.getAttribute(socialLinksMap.emailLink.selector, 'href'))
			.then(href => {
				assert.isTrue(href.startsWith(socialLinksMap.emailLink.baseUrl))
				assert.ok(href.match(socialLinksMap.emailLink.regex))
			})
	);

	it('should display a link icon', () => 
		client.isExisting(socialLinksMap.shareLinkIcon.selector)
			.then(doesExist => assert.isTrue(doesExist))
	);

	it('should display a URL when chain icon clicked', () => 
		client.click(giftRegistryPage.CSS_SHARE_LINK)
			.then(() => client.waitForVisible(socialLinksMap.shareLinkUrl.selector))
			.then(() => client.isVisible(socialLinksMap.shareLinkUrl.selector))
			.then(visible => assert.isTrue(visible))
			.then(() => client.getAttribute(socialLinksMap.shareLinkUrl.selector, 'href'))
			.then(href => {
				assert.isTrue(href.startsWith(socialLinksMap.shareLinkUrl.baseUrl))
				assert.ok(href.match(socialLinksMap.shareLinkUrl.regex))
			})
	);

});

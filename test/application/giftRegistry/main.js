'use strict'

import {assert} from 'chai';

import client from '../webdriver/client';
import * as giftRegistryPage from '../webdriver/pageObjects/giftRegistry';
import * as testData from '../webdriver/pageObjects/testData/main';
import * as loginForm from '../webdriver/pageObjects/forms/login';


describe('giftRegistry', () => {
	let customer;
	let login = 'testuser1@demandware.com';
	let eventFormData = new Map();
	let eventFormShippingData = new Map();
	let address;

	let socialLinksMap = {
		facebook: {
			selector: 'a[data-share=facebook]',
			baseUrl: 'https://www.facebook.com/sharer/sharer.php'
		},
		twitter: {
			selector: 'a[data-share=twitter]',
			baseUrl: 'https://twitter.com/intent/tweet/'
		},
		googlePlus: {
			selector: 'a[data-share=googleplus]',
			baseUrl: 'https://plus.google.com/share'
		},
		pinterest: {
			selector: 'a[data-share=pinterest]',
			baseUrl: 'https://www.pinterest.com/pin/create/button/'
		},
		emailLink: {
			selector: 'a[data-share=emaillink]',
			baseUrl: 'mailto:name@email.com'
		},
		shareLinkIcon: {
		 	selector: giftRegistryPage.CSS_SHARE_LINK,
		},
		shareLinkUrl: {
			selector: '.share-link-content.active',
			baseUrl: giftRegistryPage.configUrl
		}
	};

	before(() => client.init());

	after(() => client.end());

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

	before(() => giftRegistryPage.navigateTo());

	before(() => loginForm.loginAsDefaultCustomer());

	before(() => giftRegistryPage.pressBtnNewRegistry());
	
	it('should fill out the event form', () =>
		giftRegistryPage.fillOutEventForm(eventFormData)
			.then(() => client.isEnabled('[name$="giftregistry_event_confirm"]'))
			.then(enabled => assert.ok(enabled))
	);

	it('should fill out the event before shipping form', () =>
		giftRegistryPage.pressBtnContinueEventForm()
		.then(() => client.waitForExist('form[name$="giftregistry"]'))
		.then(() => giftRegistryPage.fillOutEventShippingForm(eventFormShippingData))
	);

	it('should fill out the event after shipping form', () =>
		giftRegistryPage.pressBtnUsePreEventShippingAddress()
		.then(() => client.isEnabled('[name$="giftregistry_eventaddress_confirm"]'))
		.then(enabled => assert.ok(enabled))
	);

	it('should submit the form', () =>
		giftRegistryPage.pressBtnContinueEventAddressForm()
		.then(() => client.waitForExist('form[name$="giftregistry_enevt_confirm"]'))
		.then(() => giftRegistryPage.pressBtnContinueEventForm)
		//.then(() => client.pause(5000))
	);

	it('should make the registry public', () =>
		giftRegistryPage.pressBtnMakeRegistryPublic()
	);


	
	// it('should display a Facebook icon and link', () => {
	// 	var isLinkExists = false;
	// 	return client.isExisting(socialLinksMap.facebook.selector)
	// 		.then(doesExist => assert.isTrue(doesExist))
	// 		.then(() => client.getAttribute(socialLinksMap.facebook.selector, 'href'))
	// 		.then(href => assert.isTrue(href.startsWith(socialLinksMap.facebook.baseUrl)));
	// });

	// it('should display a Twitter icon and link', () => {
	// 	var isLinkExists = false;
	// 	return client.isExisting(socialLinksMap.twitter.selector)
	// 		.then(doesExist => assert.isTrue(doesExist))
	// 		.then(() => client.getAttribute(socialLinksMap.twitter.selector, 'href'))
	// 		.then(href => assert.isTrue(href.startsWith(socialLinksMap.twitter.baseUrl)));
	// });

	// it('should display a Google Plus icon and link', () => {
	// 	var isLinkExists = false;
	// 	return client.isExisting(socialLinksMap.googlePlus.selector)
	// 		.then(doesExist => assert.isTrue(doesExist))
	// 		.then(() => client.getAttribute(socialLinksMap.googlePlus.selector, 'href'))
	// 		.then(href => assert.isTrue(href.startsWith(socialLinksMap.googlePlus.baseUrl)));
	// });

	// it('should display a Pinterest icon and link', () => {
	// 	var isLinkExists = false;
	// 	return client.isExisting(socialLinksMap.pinterest.selector)
	// 		.then(doesExist => assert.isTrue(doesExist))
	// 		.then(() => client.getAttribute(socialLinksMap.pinterest.selector, 'href'))
	// 		.then(href => assert.isTrue(href.startsWith(socialLinksMap.pinterest.baseUrl)));
	// });

	// it('should display a Mail icon and link', () => {
	// 	var isLinkExists = false;
	// 	return client.isExisting(socialLinksMap.emailLink.selector)
	// 		.then(doesExist => assert.isTrue(doesExist))
	// 		.then(() => client.getAttribute(socialLinksMap.emailLink.selector, 'href'))
	// 		.then(href => assert.isTrue(href.startsWith(socialLinksMap.emailLink.baseUrl)));
	// });

	// it('should display a link icon', () => {
	// 	var isLinkExists = false;
	// 	return client.isExisting(socialLinksMap.shareLinkIcon.selector)
	// 		.then(doesExist => assert.isTrue(doesExist));
	// });

	// it('should display a link', () => {
	// 	var isLinkExists = false;
	// 	return wishListPage.clickLinkIcon()
	// 		return client.isExisting(socialLinksMap.shareLinkUrl.selector)
	// 			.then(doesExist => assert.isTrue(doesExist))
	// 			.then(() => client.getAttribute(socialLinksMap.shareLinkUrl.selector, 'href'))
	// 			.then(href => assert.isTrue(href.startsWith(socialLinksMap.shareLinkUrl.baseUrl)));
	// });
});
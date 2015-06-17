'use strict'

import {assert} from 'chai';

import client from '../webdriver/client';
import * as wishListPage from '../webdriver/pageObjects/wishlist';
import * as testData from '../webdriver/pageObjects/testData/main';
import * as loginForm from '../webdriver/pageObjects/forms/login';

describe('Wishlist', () => {
	let customer;
	let login = 'testuser1@demandware.com';
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
			selector: 'a[data-share=email]',
			baseUrl: 'mailto:name@email.com'
		},
		shareLinkIcon: {
		 	selector: wishListPage.CSS_SHARE_LINK,
		},
		shareLinkUrl: {
			selector: '.share-link-content.active a',
			baseUrl: wishListPage.configUrl
		}

	};

	before(() => client.init());

	after(() => client.end());

	describe('Send to Friend Links', () => {

		before(() => wishListPage.navigateTo());

		before(() => loginForm.loginAsDefaultCustomer());

		it('should display a Facebook icon and link', () => 
			client.isExisting(socialLinksMap.facebook.selector)
				.then(doesExist => assert.isTrue(doesExist))
				.then(() => client.getAttribute(socialLinksMap.facebook.selector, 'href'))
				.then(href => assert.isTrue(href.startsWith(socialLinksMap.facebook.baseUrl)))
		);

		it('should display a Twitter icon and link', () => 
			client.isExisting(socialLinksMap.twitter.selector)
				.then(doesExist => assert.isTrue(doesExist))
				.then(() => client.getAttribute(socialLinksMap.twitter.selector, 'href'))
				.then(href => assert.isTrue(href.startsWith(socialLinksMap.twitter.baseUrl)))
		);

		it('should display a Google Plus icon and link', () => 
			client.isExisting(socialLinksMap.googlePlus.selector)
				.then(doesExist => assert.isTrue(doesExist))
				.then(() => client.getAttribute(socialLinksMap.googlePlus.selector, 'href'))
				.then(href => assert.isTrue(href.startsWith(socialLinksMap.googlePlus.baseUrl)))
		);

		it('should display a Pinterest icon and link', () => 
			client.isExisting(socialLinksMap.pinterest.selector)
				.then(doesExist => assert.isTrue(doesExist))
				.then(() => client.getAttribute(socialLinksMap.pinterest.selector, 'href'))
				.then(href => assert.isTrue(href.startsWith(socialLinksMap.pinterest.baseUrl)))
		);

		it('should display a Mail icon and link', () => 
			client.isExisting(socialLinksMap.emailLink.selector)
				.then(doesExist => assert.isTrue(doesExist))
				.then(() => client.getAttribute(socialLinksMap.emailLink.selector, 'href'))
				.then(href => assert.isTrue(href.startsWith(socialLinksMap.emailLink.baseUrl)))
		);

		it('should display a link icon', () => 
			client.isExisting(socialLinksMap.shareLinkIcon.selector)
				.then(doesExist => assert.isTrue(doesExist))
		);

		it('should display a link', () => 
			wishListPage.clickLinkIcon()
				.then(() => client.isExisting(socialLinksMap.shareLinkUrl.selector))
				.then(doesExist => assert.isTrue(doesExist))
				.then(() => client.getAttribute(socialLinksMap.shareLinkUrl.selector, 'href'))
				.then(href => assert.isTrue(href.startsWith(socialLinksMap.shareLinkUrl.baseUrl)))
		);
	});

});


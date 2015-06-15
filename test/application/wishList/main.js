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
			selector: 'a[data-share=emaillink]',
			baseUrl: 'mailto:name@email.com'
		},
		shareLinkIcon: {
		 	selector: wishListPage.CSS_SHARE_LINK,
		},
		shareLinkUrl: {
			selector: '.share-link-content.active'
		}

	};

	before(() => client.init());

	after(() => client.end());

	before(() => wishListPage.navigateTo());

	before(() => loginForm.loginAsDefaultCustomer());

	// function matchesUrl () {}

	it('should display a Facebook icon and link', () => {
		assert.ok(client.isExisting(socialLinksMap.facebook.selector));
		return client.getAttribute(socialLinksMap.facebook.selector, 'href')
			.then(href => assert.isTrue(href.startsWith(socialLinksMap.facebook.baseUrl)));
	});

	it('should display a Twitter icon and link', () => {
		assert.ok(client.isExisting(socialLinksMap.twitter.selector));
		return client.getAttribute(socialLinksMap.twitter.selector, 'href')
			.then(href => assert.isTrue(href.startsWith(socialLinksMap.twitter.baseUrl)));
	});

	it('should display a Google Plus icon and link', () => {
		assert.ok(client.isExisting(socialLinksMap.googlePlus.selector));
		return client.getAttribute(socialLinksMap.googlePlus.selector, 'href')
			.then(href => assert.isTrue(href.startsWith(socialLinksMap.googlePlus.baseUrl)));
	});

	it('should display a Pinterest icon and link', () => {
		assert.ok(client.isExisting(socialLinksMap.pinterest.selector));
		return client.getAttribute(socialLinksMap.pinterest.selector, 'href')
			.then(href => assert.isTrue(href.startsWith(socialLinksMap.pinterest.baseUrl)));
	});

	it('should display a Mail icon and link', () => {
		assert.ok(client.isExisting(socialLinksMap.emailLink.selector));
		return client.getAttribute(socialLinksMap.emailLink.selector, 'href')
			.then(href => assert.isTrue(href.startsWith(socialLinksMap.emailLink.baseUrl)));
	});

	it('should display a link icon then link', () => {
		// make sure that icon is there
		assert.ok(client.isExisting(socialLinksMap.shareLinkIcon.selector));
		return wishListPage.linkActive()
			.then( () => {
				assert.ok(client.isExisting(socialLinksMap.shareLinkUrl.selector))
			});
	});

});


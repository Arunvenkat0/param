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
		 	selector: wishListPage.CSS_SHARE_LINK,
		},
		shareLinkUrl: {
			selector: '.share-link-content a',
			baseUrl: wishListPage.configUrl,
			regex: /.*\?.*ID=.+/
		}

	};

	before(() => client.init());

	after(() => client.end());

	describe('Send to Friend Links', () => {

		before(() => wishListPage.navigateTo()
			.then(() => loginForm.loginAsDefaultCustomer())
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
			client.click(wishListPage.CSS_SHARE_LINK)
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

});


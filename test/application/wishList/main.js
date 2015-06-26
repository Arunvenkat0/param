'use strict'

import {assert} from 'chai';

import client from '../webdriver/client';
import * as wishListPage from '../webdriver/pageObjects/wishlist';
import * as testData from '../webdriver/pageObjects/testData/main';
import * as loginForm from '../webdriver/pageObjects/forms/login';

describe('Wishlist', () => {
	let customer;
	let login = 'testuser1@demandware.com';
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
		 	selector: wishListPage.CSS_SHARE_LINK,
		},
		shareLinkUrl: {
			selector: '.share-link-content a',
			baseUrl: wishListPage.configUrl,
			regex: /.*\?.*WishListID=.+/
		}

	};

	before(() => client.init());

	after(() => client.end());

	describe('Send to Friend Links', () => {

		before(() => wishListPage.navigateTo()
			.then(() => loginForm.loginAsDefaultCustomer())
		);

		it('should display a Facebook icon and link', () => 
			client.isExisting(socialLinks.facebook.selector)
				.then(doesExist => assert.isTrue(doesExist))
				.then(() => client.getAttribute(socialLinks.facebook.selector, 'href'))
				.then(href => {
					assert.isTrue(href.startsWith(socialLinks.facebook.baseUrl))
					assert.ok(href.match(socialLinks.facebook.regex))
				})
		);

		it('should display a Twitter icon and link', () => 
			client.isExisting(socialLinks.twitter.selector)
				.then(doesExist => assert.isTrue(doesExist))
				.then(() => client.getAttribute(socialLinks.twitter.selector, 'href'))
				.then(href => {
					assert.isTrue(href.startsWith(socialLinks.twitter.baseUrl))
					assert.ok(href.match(socialLinks.twitter.regex))
				})
		);

		it('should display a Google Plus icon and link', () => 
			client.isExisting(socialLinks.googlePlus.selector)
				.then(doesExist => assert.isTrue(doesExist))
				.then(() => client.getAttribute(socialLinks.googlePlus.selector, 'href'))
				.then(href => {
					assert.isTrue(href.startsWith(socialLinks.googlePlus.baseUrl))
					assert.ok(href.match(socialLinks.googlePlus.regex))
				})
		);

		it('should display a Pinterest icon and link', () => 
			client.isExisting(socialLinks.pinterest.selector)
				.then(doesExist => assert.isTrue(doesExist))
				.then(() => client.getAttribute(socialLinks.pinterest.selector, 'href'))
				.then(href => {
					assert.isTrue(href.startsWith(socialLinks.pinterest.baseUrl))
					assert.ok(href.match(socialLinks.pinterest.regex))
				})
		);

		it('should display a Mail icon and link', () => 
			client.isExisting(socialLinks.emailLink.selector)
				.then(doesExist => assert.isTrue(doesExist))
				.then(() => client.getAttribute(socialLinks.emailLink.selector, 'href'))
				.then(href => {
					assert.isTrue(href.startsWith(socialLinks.emailLink.baseUrl))
					assert.ok(href.match(socialLinks.emailLink.regex))
				})
		);

		it('should display a link icon', () => 
			client.isExisting(socialLinks.shareLinkIcon.selector)
				.then(doesExist => assert.isTrue(doesExist))
		);

		it('should display a URL when chain icon clicked', () => 
			client.click(wishListPage.CSS_SHARE_LINK)
				.then(() => client.waitForVisible(socialLinks.shareLinkUrl.selector))
				.then(() => client.isVisible(socialLinks.shareLinkUrl.selector))
				.then(visible => assert.isTrue(visible))
				.then(() => client.getAttribute(socialLinks.shareLinkUrl.selector, 'href'))
				.then(href => {
					assert.isTrue(href.startsWith(socialLinks.shareLinkUrl.baseUrl))
					assert.ok(href.match(socialLinks.shareLinkUrl.regex))
				})
		);
	});

});


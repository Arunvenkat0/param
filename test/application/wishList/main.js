'use strict';

import {assert} from 'chai';

import client from '../webdriver/client';
import * as wishListPage from '../webdriver/pageObjects/wishlist';
import * as loginForm from '../webdriver/pageObjects/helpers/forms/login';
import * as cartPage from '../webdriver/pageObjects/cart';
import * as accountPage from '../webdriver/pageObjects/account';

describe('Wishlist', () => {
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
			selector: wishListPage.CSS_SHARE_LINK
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
			client.click(wishListPage.CSS_SHARE_LINK)
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

	describe('Gift Certificates',() => {
		var giftCertItemSelector = 'table div a[href*=giftcertpurchase]';
		var btnGiftCertAddToCart = giftCertItemSelector + '.button';
		var formGiftCertPurchase = '.gift-certificate-purchase';
		var isGiftCertAdded;
		var fieldMap = {
			from: {
				selector: 'input[id$="giftcert_purchase_from"]'
			},
			recipient: {
				selector: 'input[id$="giftcert_purchase_recipient"]',
				value: 'Joe Smith'

			},
			recipientEmail: {
				selector: 'input[id$="giftcert_purchase_recipientEmail"]',
				value: 'jsmith@someBogusEmailDomain.tv'
			},
			confirmecipientEmail: {
				selector: 'input[id$="giftcert_purchase_confirmRecipientEmail"]',
				value: 'jsmith@someBogusEmailDomain.tv'
			},
			message: {
				selector: 'textarea[id$="purchase_message"]',
				value: 'Congratulations!'
			},
			amount: {
				selector: 'input[id$="purchase_amount"]',
				value: 250
			}
		};

		before(() => accountPage.navigateTo());
		before(() => loginForm.loginAsDefaultCustomer());
		before(() => cartPage.emptyCart());
		before(() => wishListPage.navigateTo());

		it('should redirect to the Gift Certificate Purchase page when adding one to the Cart', () => {
			return client.isExisting(giftCertItemSelector)
				.then(exists => {
					if (!exists) {
						wishListPage.clickAddGiftCertButton();
					}
				})
				.then(() => client.click(btnGiftCertAddToCart))
				.then(() => client.url())
				.then(url => assert.isTrue(url.value.endsWith('giftcertpurchase')));
		});

		it('should automatically populate the Your Name field', () => {
			let defaultCustomer;
			return testData.getCustomerByLogin(loginForm.DEFAULT_RETURNING_CUSTOMER)
				.then(customer => defaultCustomer = customer)
				.then(() => client.getValue(fieldMap.from.selector))
				.then(from => {
					let expectedYourName = defaultCustomer.firstName + ' ' + defaultCustomer.lastName;
					assert.equal(from, expectedYourName);
				});
		});
	});
});


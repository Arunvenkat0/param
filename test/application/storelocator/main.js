'use strict';

import {assert} from 'chai';
import config from '../webdriver/config';
import client from '../webdriver/client';
import * as storeLocatorPage from '../pageObjects/storeLocator';

describe('Storelocator', () => {

	before(() => client.init());
	after(() => client.end());

	it('should display the storelocator page after clicking the link in the navigation menu.', function () {
		return client.url(config.url).click('.menu-utility-user .stores').getTitle()
			.then(title => assert.equal(title.split('|')[0].trim(), 'Site Genesis Store Locator'));
	});

	describe('Country form field', () => {

		beforeEach(() => storeLocatorPage.navigateTo());

		it('should display stores if germany is selected', () =>
			client.selectByValue(storeLocatorPage.STORE_FORM_COUNTRY, 'DE')
				.click(storeLocatorPage.BTN_COUNTRY)
				.waitForVisible(storeLocatorPage.TBL_RESULTS)
				.isExisting(storeLocatorPage.TBL_RESULTS)
				.then(doesExist => assert.isTrue(doesExist))
				.then(() => storeLocatorPage.getResults())
				.then(rows => {
					return assert.equal(1, rows.value.length);
				})
		);

		it('should display stores if USA is selected', () =>
			client.selectByValue(storeLocatorPage.STORE_FORM_COUNTRY, 'US')
				.click(storeLocatorPage.BTN_COUNTRY)
				.waitForVisible(storeLocatorPage.TBL_RESULTS)
				.isExisting(storeLocatorPage.TBL_RESULTS)
				.then(doesExist => assert.isTrue(doesExist))
				.then(() => storeLocatorPage.getResults())
				.then(rows => {
					return assert.isAbove(rows.value.length, 0);
				})
		);
	});

	describe('Zip code and Radius', () => {
		beforeEach(() => storeLocatorPage.navigateTo());
		it('should find stores if the Zip Code is 01801 and the radius is 30 miles', () =>
			client.selectByValue(storeLocatorPage.STORE_FORM_RADIUS, '30')
				.setValue(storeLocatorPage.STORE_FORM_ZIP, '01801')
				.click(storeLocatorPage.BTN_ZIP)
				.waitForVisible(storeLocatorPage.TBL_RESULTS)
				.isExisting(storeLocatorPage.TBL_RESULTS)
				.then(doesExist => assert.isTrue(doesExist))
				.then(() => storeLocatorPage.getResults())
				.then(rows => {
					return assert.isAbove(rows.value.length, 0);
				})
		);
	});

	describe('State and Details', () => {
		before(() => storeLocatorPage.navigateTo());

		let googleMapLink = {
			selector: '#store-location-results tbody tr:first-of-type .store-map a',
			baseUrl: 'http://maps.google.com/maps',
			regex: /.*\?.*q=10%20Presidential%20Way,%20Woburn,%2001801,%20MA,%20US+/
		};

		it('should find stores if the state is Massachusetts', () =>
			client.selectByValue(storeLocatorPage.STORE_FORM_STATE, 'MA')
				.click(storeLocatorPage.BTN_STATE)
				.waitForVisible(storeLocatorPage.TBL_RESULTS)
				.isExisting(storeLocatorPage.TBL_RESULTS)
				.then(doesExist => assert.isTrue(doesExist))
				.then(() => storeLocatorPage.getResults())
				.then(rows => {
					return assert.isAbove(rows.value.length, 0);
				})
		);

		it('should display links to google maps behind the MAP link', () =>
			client.waitForExist(googleMapLink.selector)
				.getAttribute(googleMapLink.selector, 'href')
				.then(href => {
					assert.isTrue(href.startsWith(googleMapLink.baseUrl));
					assert.ok(href.match(googleMapLink.regex));
				})
		);

		it('should open a model window when the details link is clicked from the results table', () =>
			client.click(storeLocatorPage.TBL_RESULTS_DETAILS_LINK)
			.waitForVisible(storeLocatorPage.TBL_RESULTS_DETAILS_MODEL)
			.then(() => storeLocatorPage.getStoreInfo())
			.then(storeName => assert.equal(storeName, 'Demandware'))
		);

	});
});

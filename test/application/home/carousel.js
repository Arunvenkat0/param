'use strict';

import {assert} from 'chai';
import client from '../webdriver/client';

import * as homePage from '../webdriver/pageObjects/home';
import * as common from '../webdriver/pageObjects/helpers/common';

describe('Homepage General #C84584', () => {
	before(() => client.init());
	after(() => client.end());
	describe('Main carousel links', () => {
		beforeEach(() => homePage.navigateTo());

		it('#1 should go to Mens Suits', () =>
			homePage.mainCarouselSlide(1)
				.then(() => client.click(homePage.MAIN_CAROUSEL))
				.then(() => common.getPageTitle())
				.then(title => assert.equal(title, 'Mens Suits for Business and Casual'))
		);

		it('#2 should go to Women\'s Accessories', () =>
			homePage.mainCarouselSlide(2)
				.then(() => client.click(homePage.MAIN_CAROUSEL))
				.then(() => common.getPageTitle())
				.then(title => assert.equal(title, 'Women\'s Accessories Belts, Wallets. Gloves, Hats, Watches, Luggage & More'))
		);

		it('#3 should go to Women\'s Shoes', () =>
			homePage.mainCarouselSlide(3)
				.then(() => client.click(homePage.MAIN_CAROUSEL))
				.then(() => common.getPageTitle())
				.then(title => assert.equal(title, 'Womens Shoes Including Casual, Flat, Mid Heels & High Heels'))
		);

		it('#4 should go to Women\'s Dresses', () =>
			homePage.mainCarouselSlide(4)
				.then(() => client.click(homePage.MAIN_CAROUSEL))
				.then(() => common.getPageTitle())
				.then(title => assert.equal(title, 'Women\'s Dresses for all Occasions'))
		);

		it('#5 should go to New Arrivals for Womens', () =>
			homePage.mainCarouselSlide(5)
				.then(() => client.click(homePage.MAIN_CAROUSEL))
				.then(() => common.getPageTitle())
				.then(title => assert.equal(title, 'New Arrivals in Women\'s Footwear, Outerwear, Clothing & Accessories'))
		);
	});
	describe('Vertical carousel', () => {
		before(() => homePage.navigateTo());
		it('#1 should be Sleeveless Cowl Neck Top', () =>
			homePage.verticalCarouselSlide(1)
				.then(() => homePage.isVerticalCarouselSlideVisible(1))
				.then(visible => assert.ok(visible))
				.then(() => homePage.getVerticalCarouselProductName(1))
				.then(name => assert.equal(name, 'Sleeveless Cowl Neck Top'))
		);
		it('#2 should be Charcoal Flat Front Athletic Fit Shadow Striped Wool Suit', () =>
			homePage.verticalCarouselSlide(2)
				.then(() => homePage.isVerticalCarouselSlideVisible(2))
				.then(visible => assert.ok(visible))
				.then(() => homePage.getVerticalCarouselProductName(2))
				.then(name => assert.equal(name, 'Charcoal Flat Front Athletic Fit Shadow Striped Wool Suit'))
		);
		it('#3 should be Straight Fit Shorts', () =>
			homePage.verticalCarouselSlide(3)
				.then(() => homePage.isVerticalCarouselSlideVisible(3))
				.then(visible => assert.ok(visible))
				.then(() => homePage.getVerticalCarouselProductName(3))
				.then(name => assert.equal(name, 'Straight Fit Shorts'))
		);
		it('#4 should be Button Front Skirt', () =>
			homePage.verticalCarouselSlide(4)
				.then(() => homePage.isVerticalCarouselSlideVisible(4))
				.then(visible => assert.ok(visible))
				.then(() => homePage.getVerticalCarouselProductName(4))
				.then(name => assert.equal(name, 'Button Front Skirt'))
		);
	});
});

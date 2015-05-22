'use strict';

import client from '../client';
import config from '../config';

const basePath = '/home';

export const MAIN_CAROUSEL = '#homepage-slider';
export const VERTICAL_CAROUSEL = '#vertical-carousel';

export function navigateTo(path = basePath) {
	return client.url(config.url + path);
}

/**
 * @description move to a specific slide of the main carousel
 * @param {number} position - slide position, start from 1
 */
export function mainCarouselSlide(position) {
	var carouselControlSelector = MAIN_CAROUSEL + ' .jcarousel-control a:nth-child(' + position + ')';
	return client.waitForExist(carouselControlSelector)
		.then(() => client.click(carouselControlSelector))
		.then(() => {
			// only wait for slider transition if not the first slide
			if (position !== 1) {
				return client.pause(500);
			}
		});
}

/**
 * @description move to a specific slide of the vertical carousel
 * @param {number} position - slide position, start from 1
 */
export function verticalCarouselSlide(position) {
	var carouselNextSelector = VERTICAL_CAROUSEL + ' .jcarousel-next';
	return client.waitForExist(carouselNextSelector)
		.then(() => {
			if (position !== 1) {
				return client.click(carouselNextSelector)
					// wait for carousel transition
					.then(() => client.pause(500));
			}
		});
}

/**
 * @description check if a vertical carousel slide is visible
 * @param {number} position - slide position, start from 1
 */
export function isVerticalCarouselSlideVisible(position) {
	var slideSelector = VERTICAL_CAROUSEL + ' ul li:nth-child(' + position + ') .product-tile';
	return client.isVisible(slideSelector);
}

/**
 * @description get name of product in a vertical carousel slide
 * @param {number} position - slide position, start from 1
 */
export function getVerticalCarouselProductName(position) {
	var slideProductNameSelector = VERTICAL_CAROUSEL + ' ul li:nth-child(' + position + ')  .product-name a';
	return client.getText(slideProductNameSelector);
}

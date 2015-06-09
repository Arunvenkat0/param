'use strict';

import _ from 'lodash';

/**
 * Extracts specific customer from customers array by login value
 *
 * @param {string} login - Customer's login value
 * @returns {Object} - Customer
 */
export function getCustomer (customers, login) {
	return _.findWhere(customers, {'login': login});
}

/**
 * Processes parsed JSONified file data and sends back a map of Price Books
 *
 * @param {Object} rawCustomers - Parsed data from XML files
 * @returns {Array} - Customer objects
 */
export function parseCustomers (rawCustomers) {
	let parsedCustomers = [];

	for (let customer of rawCustomers.customers.customer) {
		let profile = customer.profile[0];

		let proxy = {
			login: customer.credentials[0].login[0],
			salutation: profile.salutation[0],
			title: profile.title[0],
			firstName: profile['first-name'][0],
			lastName: profile['last-name'][0],
			suffix: profile.suffix[0],
			company: profile['company-name'][0],
			jobTitle: profile['job-title'][0],
			email: profile.email[0],
			phoneHome: profile['phone-home'][0],
			phoneWork: profile['phone-business'][0],
			phoneMobile: profile['phone-mobile'][0],
			fax: profile.fax[0],
			gender: profile.gender[0] === '1' ? 'M' : 'F'
		};

		if (customer.hasOwnProperty('addresses')) {
			proxy.addresses = _parseAddresses(customer.addresses[0].address);
		}

		parsedCustomers.push(proxy);
	}

	return parsedCustomers;
}

function _parseAddresses (rawAddresses) {
	let addresses = [];

	for (let address of rawAddresses) {
		let proxy = {
			addressId: address.$['address-id'],
			preferred: (address.$.preferred === 'true'),
			salutation: address.salutation[0],
			title: address.title[0],
			firstName: address['first-name'][0],
			secondName: address['second-name'][0],
			lastName: address['last-name'][0],
			suffix: address.suffix[0],
			companyName: address['company-name'][0],
			jobTitle: address['job-title'][0],
			address1: address.address1[0],
			address2: address.address2[0],
			suite: address.suite[0],
			postbox: address.postbox[0],
			city: address.city[0],
			postalCode: address['postal-code'][0],
			stateCode: address['state-code'][0],
			countryCode: address['country-code'][0],
			phone: address.phone[0]
		};

		addresses.push(proxy);
	}

	return addresses;
}

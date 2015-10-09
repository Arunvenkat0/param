'use strict';

import _ from 'lodash';

/**
 * Extracts specific customer from customers array by login value
 *
 * @param {String} login - Customer's login value
 * @returns {Customer} - customer
 */
export function getCustomer (customers, login) {
	let customer = customers[login];
	if (customer instanceof Customer) {
		return customer;
	}

	return new Customer(customer);
}

/**
 * Processes parsed JSONified file data and sends back a map of Price Books
 *
 * @param {Object} rawCustomers - Parsed data from XML files
 * @returns {Array} - Customer objects
 */
export function parseCustomers (rawCustomers) {
	let parsedCustomers = {};

	for (let customer of rawCustomers.customers.customer) {
		let instance = new Customer(customer);
		let login = instance.login;
		parsedCustomers[login] = instance;
	}

	return parsedCustomers;
}

export class Customer {
	constructor (customer) {
		if (customer.hasOwnProperty('login')) {
			_.extend(this, customer);
			this.isLoaded = true;
		} else {
			let profile = customer.profile[0];

			this.login = customer.credentials[0].login[0];
			this.salutation = profile.salutation[0];
			this.title = profile.title[0];
			this.firstName = profile['first-name'][0];
			this.lastName = profile['last-name'][0];
			this.suffix = profile.suffix[0];
			this.company = profile['company-name'][0];
			this.jobTitle = profile['job-title'][0];
			this.email = profile.email[0];
			this.phoneHome = profile['phone-home'][0];
			this.phoneWork = profile['phone-business'][0];
			this.phoneMobile = profile['phone-mobile'][0];
			this.fax = profile.fax[0];
			this.gender = profile.gender[0] === '1' ? 'M' : 'F';

			if (customer.hasOwnProperty('addresses')) {
				this.addresses = _parseAddresses(customer.addresses[0].address);
			}
		}
	}

	getPreferredAddress () {
		return _.findWhere(this.addresses, {preferred: true});
	}
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

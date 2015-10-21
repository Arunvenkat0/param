'use strict';

/**
 * Controller provides functions for editing, adding, and removing addresses to a customer addressbook.
 * It also sets the default address in the addressbook.
 * @module controllers/Address
 */

/* API Includes */
var Resource = require('dw/web/Resource');
var Transaction = require('dw/system/Transaction');
var URLUtils = require('dw/web/URLUtils');

/* Script Modules */
var app = require('~/cartridge/scripts/app');
var guard = require('~/cartridge/scripts/guard');

/**
 * List addresses in customer profile Input: (none)
 */
function list() {
    var pageMeta = require('~/cartridge/scripts/meta');

    var content = app.getModel('Content').get('myaccount-addresses');
    if (content) {
        pageMeta.update(content.object);
    }

    app.getView().render('account/addressbook/addresslist');
}

/**
 * Renders a dialog for adding a new address to the address
 * book.
 */
function add() {
    app.getForm('profile').clear();

    app.getView({
        Action: 'add',
        ContinueURL: URLUtils.https('Address-Form')
    }).render('account/addressbook/addressdetails');
}

/**
 * The address form handler.
 */
function handleForm() {
    var Address;
    var success;
    var message;

    Address = app.getModel('Address');

    var addressForm = app.getForm('customeraddress');

    addressForm.handleAction({
        cancel: function () {
            success = false;
        },
        create: function () {
            if (!session.forms.profile.address.valid || !Address.create(session.forms.profile.address)) {
                response.redirect(URLUtils.https('Address-Add'));
                success = false;
            }

            success = true;
        },
        edit: function () {
            if (!session.forms.profile.address.valid) {
                success = false;
                message = 'Form is invalid';
            }
            try {
                Address.update(request.httpParameterMap.addressid.value, session.forms.profile.address);
                success = true;
            } catch (e) {
                success = false;
                message = e.message;
            }
        },
        error: function () {
            success = false;
        },
        remove: function () {
            if (Address.remove(session.forms.profile.address.addressid.value)) {
                success = false;
            }
        }
    });

    if (request.httpParameterMap.format.stringValue === 'ajax') {
        let r = require('~/cartridge/scripts/util/Response');

        r.renderJSON({
            success: success,
            message: message
        });
        return;
    }

    response.redirect(URLUtils.https('Address-List'));
}

/**
 * Renders a dialog for editing an existing address.
 */
function edit() {
    var profileForm, addressBook, address;

    profileForm = session.forms.profile;
    app.getForm('profile').clear();

    // get address to be edited
    addressBook = customer.profile.addressBook;
    address = addressBook.getAddress(request.httpParameterMap.AddressID.value);

    app.getForm(profileForm.address).copyFrom(address);
    app.getForm(profileForm.address.states).copyFrom(address);

    app.getView({
        Action: 'edit',
        ContinueURL: URLUtils.https('Address-Form'),
        Address: address
    }).render('account/addressbook/addressdetails');
}

/**
 * Sets the default address.
 */
function setDefault() {
    var addressBook, address;

    addressBook = customer.profile.addressBook;
    address = addressBook.getAddress(request.httpParameterMap.AddressID.value);

    Transaction.wrap(function () {
        addressBook.setPreferredAddress(address);
    });

    response.redirect(URLUtils.https('Address-List'));
}

/**
 * Returns a customer address as JSON response. Required to fill address form
 * with selected address from address book.
 */
function getAddressDetails() {
    var addressBook, address;

    addressBook = customer.profile.addressBook;
    address = addressBook.getAddress(request.httpParameterMap.AddressID.value);

    app.getView({
        Address: address
    }).render('account/addressbook/addressjson');
}

/**
 * Deletes an existing address.
 */
function Delete() {
    var CustomerStatusCodes = require('dw/customer/CustomerStatusCodes');
    var deleteAddressResult = app.getModel('Address').remove(decodeURIComponent(request.httpParameterMap.AddressID.value));

    if (request.httpParameterMap.format.stringValue !== 'ajax') {
        response.redirect(URLUtils.https('Address-List'));
        return;
    }

    let r = require('~/cartridge/scripts/util/Response');

    r.renderJSON({
        status: deleteAddressResult ? 'OK' : CustomerStatusCodes.CUSTOMER_ADDRESS_REFERENCED_BY_PRODUCT_LIST,
        message: deleteAddressResult ? '' : Resource.msg('addressdetails.' + CustomerStatusCodes.CUSTOMER_ADDRESS_REFERENCED_BY_PRODUCT_LIST, 'account', null)
    });
}

/*
* Web exposed methods
*/

/** @see module:controllers/Address~list */
exports.List = guard.ensure(['get', 'https', 'loggedIn'], list);
/** @see module:controllers/Address~add */
exports.Add = guard.ensure(['get', 'https', 'loggedIn'], add);
/** @see module:controllers/Address~Edit */
exports.Edit = guard.ensure(['get', 'https', 'loggedIn'], edit);
/** @see module:controllers/Address~handleorm */
exports.Form = guard.ensure(['post', 'https', 'loggedIn'], handleForm);
/** @see module:controllers/Address~SetDefault */
exports.SetDefault = guard.ensure(['get', 'https', 'loggedIn'], setDefault);
/** @see module:controllers/Address~GetAddressDetails */
exports.GetAddressDetails = guard.ensure(['get', 'https', 'loggedIn'], getAddressDetails);
/** @see module:controllers/Address~Delete */
exports.Delete = guard.ensure(['https', 'loggedIn'], Delete);

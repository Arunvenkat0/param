'use strict';

/**
 * This controller implements the logic for the multishipping scenario. Multishipping involves more
 * than one shipment, shipping address, and/or shipping method per order.
 *
 * @module controllers/COShippingMultiple
 */

/* API Includes */
var ShippingMgr = require('dw/order/ShippingMgr');
var Transaction = require('dw/system/Transaction');
var UUIDUtils = require('dw/util/UUIDUtils');
var URLUtils = require('dw/web/URLUtils');

/* Script Modules */
var app = require('~/cartridge/scripts/app');
var guard = require('~/cartridge/scripts/guard');

var Cart = app.getModel('Cart');
var Profile = app.getModel('Profile');
var TransientAddress = app.getModel('TransientAddress');

/**
 * Starting point for multishipping scenario. Renders a page providing address selection for each product line item.
 */
function start() {
    var cart = Cart.get();

    if (cart) {

        // Stores session and customer addresses in sessionAddressBook attribute.
        Transaction.wrap(function () {
            cart.initAddressBook(customer);
        });

        // Creates for each quantity of ProductLineItems new QuantityLineItems helper objects.
        var quantityLineItems = null;
        var plis = cart.getProductLineItems();
        for (var i = 0; i < plis.length; i++) {
            quantityLineItems = cart.separateQuantities(plis[i], quantityLineItems);
        }

        initAddressForms(cart, quantityLineItems);

        app.getController('COShipping').PrepareShipments();
        Transaction.wrap(function () {
            cart.calculate();
        });

        app.getView({
            Basket: cart.object,
            ContinueURL: URLUtils.https('COShippingMultiple-MultiShippingAddresses')
        }).render('checkout/shipping/multishipping/multishippingaddresses');
    } else {
        app.getController('Cart').Show();
        return;
    }
}

/**
 * Form handler for multishipping form.
 */
function multiShippingAddresses() {
    var multiShippingForm = app.getForm('multishipping');

    multiShippingForm.handleAction({
        save: function () {
            var cart = Cart.get();

            var result = Transaction.wrap(function () {
                return cart.mergeQuantities(session.forms.multishipping.addressSelection.quantityLineItems);
            });

            if (result) {
                Transaction.wrap(function () {
                    cart.calculate();
                });

                multiShippingForm.setValue('addressSelection.fulfilled', true);

                startShipments();
                return;
            } else {
                app.getView({
                    Basket: cart.object,
                    ContinueURL: URLUtils.https('COShippingMultiple-MultiShippingAddresses')
                }).render('checkout/shipping/multishipping/multishippingaddresses');
                return;
            }
        }
    });
}

/**
 * The second step of multishipping: renders a page for each shipment, providing a shipping method selection per shipment.
 */
function startShipments() {
    var cart = Cart.get();

    if (cart) {

        app.getController('COShipping').PrepareShipments();

        // Initializes the forms for the multishipment setting.
        session.forms.multishipping.shippingOptions.clearFormElement();

        app.getForm(session.forms.multishipping.shippingOptions.shipments).copyFrom(cart.getShipments());

        // Initializes the shipping method list for each shipment.
        var count = session.forms.multishipping.shippingOptions.shipments.childCount;
        for (var i = 0; i < count; i++) {
            var shipmentForm = session.forms.multishipping.shippingOptions.shipments[i];
            var shippingMethods = ShippingMgr.getShipmentShippingModel(shipmentForm.object).applicableShippingMethods;

            shipmentForm.shippingMethodID.setOptions(shippingMethods.iterator());
        }

        Transaction.wrap(function () {
            cart.calculate();
        });

        app.getView({
            Basket: cart.object,
            ContinueURL: URLUtils.https('COShippingMultiple-MultiShippingMethods')
        }).render('checkout/shipping/multishipping/multishippingshipments');
    } else {
        app.getController('Cart').Show();
        return;
    }
}

/**
 * TODO
 */
function multiShippingMethods() {
    var multiShippingForm = app.getForm('multishipping');

    multiShippingForm.handleAction({
        save: function () {
            Transaction.wrap(function () {
                var count = session.forms.multishipping.shippingOptions.shipments.childCount;
                for (var i = 0; i < count; i++) {
                    var shipmentForm = session.forms.multishipping.shippingOptions.shipments[i];

                    if (shipmentForm.shippingMethodID.selectedOptionObject !== null) {
                        shipmentForm.getObject().setShippingMethod(shipmentForm.shippingMethodID.selectedOptionObject);
                    }

                    if (!app.getForm(shipmentForm).copyTo(shipmentForm.object)) {
                        app.getView({
                            Basket: Cart.get().object,
                            ContinueURL: URLUtils.https('COShippingMultiple-MultiShippingMethods')
                        }).render('checkout/shipping/multishipping/multishippingshipments');
                        return;
                    }
                }
            });

            // Mark step as fulfilled.
            session.forms.multishipping.shippingOptions.fulfilled.value = true;

            app.getController('COBilling').Start();
            return;
        }
    });
}

/**
 * Initializes the forms for the multiaddress selection.
 */
function initAddressForms(cart, quantityLineItems) {

    // Set flag, that customer has entered the multi shipping scenario.
    session.forms.multishipping.entered.value = true;

    if (!session.forms.multishipping.addressSelection.fulfilled.value) {
        session.forms.multishipping.addressSelection.clearFormElement();
        app.getForm(session.forms.multishipping.addressSelection.quantityLineItems).copyFrom(quantityLineItems);
    }

    var addresses = cart.getAddressBookAddresses();

    if (!addresses) {
        start();
        return;
    } else {
        for (var i = 0; i < session.forms.multishipping.addressSelection.quantityLineItems.childCount; i++) {
            var quantityLineItem = session.forms.multishipping.addressSelection.quantityLineItems[i];
            quantityLineItem.addressList.setOptions(addresses.iterator());
        }

    }
}

/**
 * Renders a form dialog to edit an address. The dialog is supposed to be opened by an Ajax request and ends
 * in templates, which trigger a JavaScript event. The calling page of this dialog is responsible for
 * handling these events.
 */
function editAddresses() {
    var cart = Cart.get();

    if (cart) {

        session.forms.multishipping.editAddress.clearFormElement();

        var addresses = cart.getAddressBookAddresses();

        if (!addresses) {
            start();
            return;
        } else {
            session.forms.multishipping.editAddress.addressList.setOptions(addresses.iterator());
            app.getView({
                Basket: cart.object,
                ContinueURL: URLUtils.https('COShippingMultiple-EditForm')
            }).render('checkout/shipping/multishipping/editaddresses');
        }

        return;
    } else {
        app.getController('Cart').Show();
        return;
    }
}

/**
 * TODO
 */
function editForm() {
    var multiShippingForm = app.getForm('multishipping');

    multiShippingForm.handleAction({
        cancel: function () {
            start();
            return;
        },
        save: function () {
            var addEditAddressResult = addEditAddress();
            if (addEditAddressResult.error) {
                app.getView({
                    ContinueURL: URLUtils.https('COShippingMultiple-EditForm')
                }).render('checkout/shipping/multishipping/editaddresses');
                return;
            }

            start();
            return;
        },
        selectAddress: function () {
            if (!session.forms.multishipping.editAddress.addressList.selectedOption) {

                session.forms.multishipping.editAddress.clearFormElement();
                editAddresses();

                return;
            }

            app.getForm(session.forms.multishipping.editAddress.addressFields).copyFrom(session.forms.multishipping.editAddress.addressList.selectedOptionObject);
            app.getForm(session.forms.multishipping.editAddress.addressFields.states).copyFrom(session.forms.multishipping.editAddress.addressList.selectedOptionObject);
            app.getView({
                Basket: Cart.get().object,
                ContinueURL: URLUtils.https('COShippingMultiple-EditForm')
            }).render('checkout/shipping/multishipping/editaddresses');

            return;
        }
    });
}

/**
 * TODO
 * @returns {*}
 */
function addEditAddress() {
    var cart = Cart.get();

    var newAddress = new TransientAddress();
    newAddress.UUID = UUIDUtils.createUUID();

    if (!app.getForm(session.forms.multishipping.editAddress.addressFields).copyTo(newAddress) || !app.getForm(session.forms.multishipping.editAddress.addressFields.states).copyTo(newAddress)) {
        return {success: false, error: true};
    } else {

        var referenceAddress = session.forms.multishipping.editAddress.addressList.selectedOptionObject;
        var addToCustomerAddressBook = session.forms.multishipping.editAddress.addToAddressBook.checked;
        var customerAddress = null;

        // Handle customer address book update process
        if (addToCustomerAddressBook && addToCustomerAddressBook === true) {
            if (referenceAddress) {
                // Get address from adress book
                if (referenceAddress.ID) {
                    customerAddress = Profile.get().getAddessBook().getAddress(referenceAddress.ID);
                }
            } else {
                customerAddress = Transaction.wrap(function () {
                    return Profile.get().addAddressToAddressBook(newAddress);
                });
                newAddress.ID = customerAddress.ID;
                newAddress.referenceAddressUUID = customerAddress.getUUID();
            }

            if (customerAddress) {
                var helperAddress = new TransientAddress();
                helperAddress.copyFrom(newAddress);
                Transaction.wrap(function () {
                    helperAddress.copyTo(customerAddress);
                });
            }
        }

        // Handle session address book update process
        if (referenceAddress) {
            // Update Address
            newAddress.UUID = referenceAddress.UUID;
            Transaction.wrap(function () {
                cart.updateAddressBookAddress(newAddress);
            });
        } else {
            Transaction.wrap(function () {
                cart.addAddressToAddressBook(newAddress);
            });
        }

        for (var i = 0; i < session.forms.multishipping.addressSelection.quantityLineItems.childCount; i++) {
            var quantityLineItem = session.forms.multishipping.addressSelection.quantityLineItems[i];
            quantityLineItem.addressList.setOptions(cart.getAddressBookAddresses().iterator());
        }

        return {sucess: true, address: newAddress};
    }
}

/**
 * TODO
 */
function addEditAddressJSON() {
    var addEditAddressResult = addEditAddress();

    let r = require('~/cartridge/scripts/util/Response');
    r.renderJSON({
        address: addEditAddressResult.address,
        success: addEditAddressResult.success
    });
}

/*
 * Module exports
 */

/*
 * Web exposed methods
 */
/** @see module:controllers/COShippingMultiple~start */
exports.Start = guard.ensure(['https'], start);
/** @see module:controllers/COShippingMultiple~startShipments */
exports.StartShipments = guard.ensure(['https', 'get'], startShipments);
/** @see module:controllers/COShippingMultiple~editAddresses */
exports.EditAddresses = guard.ensure(['https', 'get'], editAddresses);
/** @see module:controllers/COShippingMultiple~addEditAddressJSON */
exports.AddEditAddressJSON = guard.ensure(['https', 'get'], addEditAddressJSON);
/** @see module:controllers/COShippingMultiple~multiShippingAddresses */
exports.MultiShippingAddresses = guard.ensure(['https', 'post'], multiShippingAddresses);
/** @see module:controllers/COShippingMultiple~multiShippingMethods */
exports.MultiShippingMethods = guard.ensure(['https', 'post'], multiShippingMethods);
/** @see module:controllers/COShippingMultiple~editForm */
exports.EditForm = guard.ensure(['https', 'post'], editForm);

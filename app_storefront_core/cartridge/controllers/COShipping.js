'use strict';

/**
 * Single Shipping Scenario
 * -----------------------------
 * This controller implements the logic for the default (single) shipping scenario. It is responsible for dealing with
 * one shipment only, respectively one shipping addresses as well as one shipping method.
 *
 * @module controller/COShipping
 */

/* API Includes */
var Cart = require('~/cartridge/scripts/model/Cart');
var Form = require('~/cartridge/scripts/model/Form');
var HashMap = require('dw/util/HashMap');
var Profile = require('~/cartridge/scripts/model/Profile');
var ShippingMgr = require('dw/order/ShippingMgr');
var Transaction = require('~/cartridge/scripts/transaction');

/* Script Modules */
var guard = require('~/cartridge/scripts/guard');
var singleShippingForm = require('~/cartridge/scripts/model/Form').get('singleshipping');
var view = require('~/cartridge/scripts/view');

/**
 * Starting point for single shipping scenario
 */
function start() {
    var cart = Cart.get();

    if (cart.object) {
        /*
         * Redirect to multi shipping scenario if more than one physical shipment is
         * contained in the basket.
         */
	    var physicalShipments = cart.getPhysicalShipments();
	    if (!(dw.system.Site.getCurrent().getCustomPreferenceValue('enableMultiShipping') && physicalShipments && physicalShipments.size() > 1)) {

	        /**
	         * Initializes the address and shipping method form: - prepopulates form with shipping address of default
	         * shipment if address exists, otherwise preselects shipping method in list if set at shipment
	         */
	        if (cart.getDefaultShipment().getShippingAddress()) {
		        Form.get(session.forms.singleshipping.shippingAddress.addressFields).copyFrom(cart.getDefaultShipment().getShippingAddress());
		        Form.get(session.forms.singleshipping.shippingAddress.addressFields.states).copyFrom(cart.getDefaultShipment().getShippingAddress());
		        Form.get(session.forms.singleshipping.shippingAddress).copyFrom(cart.getDefaultShipment());
	        }
	        else {
		        if (customer.authenticated && customer.registered && customer.addressBook.preferredAddress) {
			        Form.get(session.forms.singleshipping.shippingAddress.addressFields).copyFrom(customer.addressBook.preferredAddress);
			        Form.get(session.forms.singleshipping.shippingAddress.addressFields.states).copyFrom(customer.addressBook.preferredAddress);
		        }
	        }
	        session.forms.singleshipping.shippingAddress.shippingMethodID.value = cart.getDefaultShipment().getShippingMethodID();

            /*
             * Clean shipments.
             */
            var homeDeliveries = prepareShipments();

            Transaction.autocommit(function () {
                cart.calculate();
            });

            /*
             * Go to billing step, if we have no product line items, but only gift
             * certificates in the basket. Shipping step is not required.
             */
            if (cart.getProductLineItems().size() === 0) {
                require('./COBilling').Start();
                return;
            }
            else {

                require('./dw/web').updatePageMetaData("SiteGenesis Checkout");

                view.get({
                    Basket         : cart.object,
                    HomeDeliveries : homeDeliveries
                }).render('checkout/shipping/singleshipping');
            }
        }
        else {
            require('./COShippingMultiple').Start();
            return;
        }
    }
    else {
        require('./Cart').Show();
        return;
    }

}

function singleShipping() {

    var formResult = singleShippingForm.handleAction({
	    'save'           : function (formgroup) {
		    var cart = Cart.get();
		    if (cart.object) {

			    handleShippingSettings(cart);

			    /**
			     * Attempts to save the used shipping address in the customer address book.
			     */
			    if (customer.authenticated && session.forms.singleshipping.shippingAddress.addToAddressBook.value) {
				    Profile.get(customer.profile).addAddressToAddressBook(cart.getDefaultShipment().getShippingAddress());
			    }

			    /**
			     * Binds the store message from the user to the shipment.
			     */
			    if (dw.system.Site.getCurrent().getCustomPreferenceValue('enableStorePickUp')) {

				    if (!Form.get(session.forms.singleshipping.inStoreShipments.shipments).copyTo(cart.getShipments())) {
					    require('./Cart').Show();
					    return;
				    }
			    }

			    /*
			     * Mark step as fulfilled.
			     */
			    session.forms.singleshipping.fulfilled.value = true;

			    require('./COBilling').Start();
			    return;
		    }
		    else {
			    require('./Cart').Show();
			    return;
		    }
	    },
	    'selectAddress'  : function (formgroup) {

		    updateAddressDetails(Cart.get());
		    require('./dw/web').updatePageMetaData("SiteGenesis Checkout");
		    view.get().render('checkout/shipping/singleshipping');

		    return;
	    },
	    'shipToMultiple' : function (formgroup) {
		    require('./COShippingMultiple').Start();
		    return;
	    }
    });

}

/**
 * Select a shipping method for the default shipment. Sets the shipping method
 * and returns the result as JSON response.
 */
function selectShippingMethod(cart) {

	var cart = Cart.get();

	if (cart.object) {

		var ScriptResult = new dw.system.Pipelet('Script', {
			Transactional : true,
			OnError       : 'PIPELET_ERROR',
			ScriptFile    : 'checkout/GetApplicableShippingMethods.ds'
		}).execute({
				Basket     : cart.object,
				City       : request.httpParameterMap.city.stringValue,
				Country    : request.httpParameterMap.countryCode.stringValue,
				PostalCode : request.httpParameterMap.postalCode.stringValue,
				State      : request.httpParameterMap.stateCode.stringValue,
				Address1   : request.httpParameterMap.address1.stringValue,
				Address2   : request.httpParameterMap.address2.stringValue
			});
		if (ScriptResult.result === PIPELET_ERROR) {
			view.get({Basket : cart.object}).render('checkout/shipping/selectshippingmethodjson');
			return;
		}

        Transaction.autocommit(function () {
            cart.updateShipmentShippingMethod(cart.getDefaultShipment().getID(), request.httpParameterMap.shippingMethodID.stringValue, null, ScriptResult.ShippingMethods);
            cart.calculate();
        });

		view.get({Basket : cart.object}).render('checkout/shipping/selectshippingmethodjson');
		return;
	}
	else {
		view.get().render('checkout/shipping/selectshippingmethodjson');
		return;
	}
}

/**
 * Determine the list of applicable shipping methods for the default shipment of
 * the current basket. The applicable shipping methods are based on the
 * merchandise in the cart and the address parameters included in the request
 * (if any). Change the shipping method of this shipment if the current method
 * is no longer applicable. Pre-calculate the shipping cost for each applicable
 * shipping method by simulating the shipping selection i.e. explicitly add each
 * shipping method and then calculate cart (to get cost and
 * discounts/promotions). The simulation is done so that shipping cost along
 * with discounts and promotions can be shown to the user before making a
 * selection.
 */
function updateShippingMethodList() {

	var cart = Cart.get();

    if (!cart.object) {
        // TODO don't mix process and view pipelines
        // TODO this should end with a template
        return;
    }

    var ScriptResult = new dw.system.Pipelet('Script', {
        Transactional : false,
        OnError       : 'PIPELET_ERROR',
        ScriptFile    : 'checkout/GetApplicableShippingMethods.ds'
    }).execute({
            Basket     : cart.object,
            City       : request.httpParameterMap.city.stringValue,
            Country    : request.httpParameterMap.countryCode.stringValue,
            PostalCode : request.httpParameterMap.postalCode.stringValue,
            State      : request.httpParameterMap.stateCode.stringValue,
            Address1   : request.httpParameterMap.address1.stringValue,
            Address2   : request.httpParameterMap.address2.stringValue
        });
    var applicableShippingMethods = ScriptResult.ShippingMethods;

    var shippingCosts = new HashMap();
    var currentShippingMethod = cart.getDefaultShipment().getShippingMethod() || ShippingMgr.getDefaultShippingMethod();

    /*
     * Transaction controls are for fine tuning the performance of the data base
     * interactions when calculating shipping methods
     */
    Transaction.begin();

    for (var i = 0; i < applicableShippingMethods.length; i++) {
        var method = applicableShippingMethods[i];

        cart.updateShipmentShippingMethod(cart.getDefaultShipment().getID(), method.getID(), method, applicableShippingMethods);
        cart.calculate();

        shippingCosts.put(method.getID(), cart.preCalculateShipping(method));
    }

    // TODO what the heck?
    Transaction.rollback();

    Transaction.autocommit(function () {
	    cart.updateShipmentShippingMethod(cart.getDefaultShipment().getID(), currentShippingMethod.getID(), currentShippingMethod, applicableShippingMethods);
        cart.calculate();
    });

    session.forms.singleshipping.shippingAddress.shippingMethodID.value = cart.getDefaultShipment().getShippingMethodID();

    view.get({
        Basket                    : cart.object,
        ApplicableShippingMethods : applicableShippingMethods,
        ShippingCosts             : shippingCosts
    }).render('checkout/shipping/shippingmethods');
}


/**
 * Determine the list of applicable shipping methods for the default shipment of
 * the current customer's basket and return the response as a JSON array. The
 * applicable shipping methods are based on the merchandise in the cart and any
 * address parameters included in the request parameters.
 */
function getApplicableShippingMethodsJSON() {
    var Basket = Cart.get().object;

    var ScriptResult = new dw.system.Pipelet('Script', {
        Transactional : false,
        OnError       : 'PIPELET_ERROR',
        ScriptFile    : 'checkout/GetApplicableShippingMethods.ds'
    }).execute({
            Basket     : Basket,
            City       : request.httpParameterMap.city.stringValue,
            Country    : request.httpParameterMap.countryCode.stringValue,
            PostalCode : request.httpParameterMap.postalCode.stringValue,
            State      : request.httpParameterMap.stateCode.stringValue,
            Address1   : request.httpParameterMap.address1.stringValue,
            Address2   : request.httpParameterMap.address2.stringValue
        });

	view.get({ApplicableShippingMethods : ScriptResult.ShippingMethods}).render('checkout/shipping/shippingmethodsjson');
}


/**
 * Handles the selected shipping address and shipping method: - copies the
 * address details and gift options to the basket's default shipment - set the
 * selected shipping method at the default shipment
 */
function handleShippingSettings(cart) {

	Transaction.autocommit(function () {
		var defaultShipment = cart.getDefaultShipment();
		var shippingAddress = cart.createShipmentShippingAddress(defaultShipment.getID());

		shippingAddress.setFirstName(session.forms.singleshipping.shippingAddress.addressFields.firstName.value);
		shippingAddress.setLastName(session.forms.singleshipping.shippingAddress.addressFields.lastName.value);
		shippingAddress.setAddress1(session.forms.singleshipping.shippingAddress.addressFields.address1.value);
		shippingAddress.setAddress2(session.forms.singleshipping.shippingAddress.addressFields.address2.value);
		shippingAddress.setCity(session.forms.singleshipping.shippingAddress.addressFields.city.value);
		shippingAddress.setPostalCode(session.forms.singleshipping.shippingAddress.addressFields.postal.value);
		shippingAddress.setStateCode(session.forms.singleshipping.shippingAddress.addressFields.states.state.value);
		shippingAddress.setCountryCode(session.forms.singleshipping.shippingAddress.addressFields.country.value);
		shippingAddress.setPhone(session.forms.singleshipping.shippingAddress.addressFields.phone.value);
		defaultShipment.setGift(session.forms.singleshipping.shippingAddress.isGift.value);
		defaultShipment.setGiftMessage(session.forms.singleshipping.shippingAddress.giftMessage.value);

		cart.updateShipmentShippingMethod(cart.getDefaultShipment().getID(), session.forms.singleshipping.shippingAddress.shippingMethodID.value, null, null);
		cart.calculate();

		var validationResult = cart.validateForCheckout();

		var BasketStatus = validationResult.BasketStatus;
		var EnableCheckout = validationResult.EnableCheckout;

	});

	return;
}


/**
 * Prepares shipments by separating all gift certificate line items from product
 * line items and creating one shipment per gift certificate to purchase. As
 * second step empty shipments are removed. This start node can be called by any
 * checkout step to clean existing shipments according to these conditions.
 */
function prepareShipments() {

	var cart = Cart.get();

	var homeDeliveries = Transaction.autocommit(function () {

		var homeDeliveries = false;

		cart.updateGiftCertificateShipments();
		cart.removeEmptyShipments();

		if (dw.system.Site.getCurrent().getCustomPreferenceValue('enableStorePickUp')) {
			homeDeliveries = cart.consolidateInStoreShipments();

			session.forms.singleshipping.inStoreShipments.shipments.clearFormElement();
			Form.get(session.forms.singleshipping.inStoreShipments.shipments).copyFrom(cart.getShipments());
		}
		else {
			homeDeliveries = true;
		}

		return homeDeliveries;
	});

    return homeDeliveries;
}


/**
 * Renders a form dialog to edit an address. The dialog is supposed to be opened
 * by an Ajax request and ends in templates, which just trigger a certain JS
 * event. The calling page of this dialog is responsible for handling these
 * events.
 */
function editAddress() {

    session.forms.shippingaddress.clearFormElement();

    var shippingAddress = customer.getAddressBook().getAddress(request.httpParameterMap.addressID.stringValue);

    if (shippingAddress) {
        Form.get(session.forms.shippingaddress).copyFrom(shippingAddress);
        Form.get(session.forms.shippingaddress.states).copyFrom(shippingAddress);
    }

	view.get().render('checkout/shipping/shippingaddressdetails');
}

function editShippingAddress() {

    var TriggeredAction = request.triggeredFormAction;
    if (TriggeredAction != null) {
        if (TriggeredAction.formId == 'apply') {
            if (!Form.get(session.forms.shippingaddress).copyTo(ShippingAddress) || !Form.get(session.forms.shippingaddress.states).copyTo(ShippingAddress)) {
                view.get().render('checkout/shipping/shippingaddressdetails');
                return;
            }
	        else {
	            view.get().render('components/dialog/dialogapply');
                return;
            }
        }
        else if (TriggeredAction.formId == 'remove') {
            var RemoveCustomerAddressResult = new dw.system.Pipelet('RemoveCustomerAddress').execute({
                Address  : session.forms.shippingaddress.object,
                Customer : customer
            });
            if (RemoveCustomerAddressResult.result === PIPELET_ERROR) {
	            view.get().render('checkout/shipping/shippingaddressdetails');
                return;
            }

	        view.get().render('components/dialog/dialogdelete');
            return;
        }
    }

	view.get().render('checkout/shipping/shippingaddressdetails');
}

function updateAddressDetails(cart) {

    if (cart.object) {

        var addressID = !request.httpParameterMap.addressID.value ? request.httpParameterMap.dwfrm_singleshipping_addressList.value : request.httpParameterMap.addressID.value;
        var segments = addressID.split("??");

        var lookupCustomer = customer;
        var lookupID = addressID;

        if (segments.length > 1) {
            var profile = dw.customer.CustomerMgr.queryProfile("email = {0}", segments[0]);
	        lookupCustomer = profile.getCustomer();
            lookupID = segments[1];
        }

        var address = lookupCustomer.getAddressBook().getAddress(lookupID);
        Form.get(session.forms.singleshipping.shippingAddress.addressFields).copyFrom(address);
        Form.get(session.forms.singleshipping.shippingAddress.addressFields.states).copyFrom(address);

        Transaction.autocommit(function () {
            var defaultShipment = cart.getDefaultShipment();
            var shippingAddress = cart.createShipmentShippingAddress(defaultShipment.getID());

            shippingAddress.setFirstName(session.forms.singleshipping.shippingAddress.addressFields.firstName.value);
            shippingAddress.setLastName(session.forms.singleshipping.shippingAddress.addressFields.lastName.value);
            shippingAddress.setAddress1(session.forms.singleshipping.shippingAddress.addressFields.address1.value);
            shippingAddress.setAddress2(session.forms.singleshipping.shippingAddress.addressFields.address2.value);
            shippingAddress.setCity(session.forms.singleshipping.shippingAddress.addressFields.city.value);
            shippingAddress.setPostalCode(session.forms.singleshipping.shippingAddress.addressFields.postal.value);
            shippingAddress.setStateCode(session.forms.singleshipping.shippingAddress.addressFields.states.state.value);
            shippingAddress.setCountryCode(session.forms.singleshipping.shippingAddress.addressFields.country.value);
            shippingAddress.setPhone(session.forms.singleshipping.shippingAddress.addressFields.phone.value);
            defaultShipment.setGift(session.forms.singleshipping.shippingAddress.isGift.value);
            defaultShipment.setGiftMessage(session.forms.singleshipping.shippingAddress.giftMessage.value);
        });

        start();
    }
    else {
        require('./Cart').Show();
        return;
    }
}

/*
 * Module exports
 */

/*
 * Web exposed methods
 */
/** @see module:controller/COShipping~start */
exports.Start = guard.ensure(['https'], start);
/** @see module:controller/COShipping~selectShippingMethod */
exports.SelectShippingMethod = guard.ensure(['https', 'get'], selectShippingMethod);
/** @see module:controller/COShipping~updateShippingMethodList */
exports.UpdateShippingMethodList = guard.ensure(['https', 'get'], updateShippingMethodList);
/** @see module:controller/COShipping~getApplicableShippingMethodsJSON */
exports.GetApplicableShippingMethodsJSON = guard.ensure(['https', 'get'], getApplicableShippingMethodsJSON);
/** @see module:controller/COShipping~editAddress */
exports.EditAddress = guard.ensure(['https', 'get'], editAddress);
/** @see module:controller/COShipping~updateAddressDetails */
exports.UpdateAddressDetails = guard.ensure(['https', 'get'], updateAddressDetails);
/** @see module:controller/COShipping~singleShipping */
exports.SingleShipping = guard.ensure(['https', 'post'], singleShipping);
/** @see module:controller/COShipping~editShippingAddress */
exports.EditShippingAddress = guard.ensure(['https', 'post'], editShippingAddress);

/*
 * Local methods
 */
exports.PrepareShipments = prepareShipments;

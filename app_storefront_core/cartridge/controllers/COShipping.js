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

/**
 * Starting point for single shipping scenario
 */
function start() {
	var cart = Cart.get();

	if (!cart.object) {
		require('./Cart').Show();
		return;
	}

	/*
	 * Redirect to multi shipping scenario if more than one physical shipment is
	 * contained in the basket.
	 */
	if (requiresMultiShipping(cart)) {
		require('./COShippingMultiple').Start();
		return;
	}

	initForms(cart);

	/*
	 * Clean shipments.
	 */
	var homeDeliveries = prepareShipments({
		Basket : cart.object
	}).HomeDeliveries;

	Transaction.autocommit(function () {
		cart.calculate();
	});

	/*
	 * Go to billing step, if we have no product line items, but only gift
	 * certificates in the basket. Shipping step is not required.
	 */
	if (cart.getProductLineItems().size() == 0) {
		require('./COBilling').Start();
		return;
	}

	require('./dw/web').updatePageMetaData("SiteGenesis Checkout");

	response.renderTemplate('checkout/shipping/singleshipping', {
		Basket         : cart.object,
		HomeDeliveries : homeDeliveries
	});

}


function showSingleShipping(args) {
	require('./dw/web').updatePageMetaData("SiteGenesis Checkout");

	args ? response.renderTemplate('checkout/shipping/singleshipping', args) : response.renderTemplate('checkout/shipping/singleshipping');
}


function singleShipping() {
	var TriggeredAction = request.triggeredFormAction;
	if (TriggeredAction != null) {
		if (TriggeredAction.formId == 'save') {
			// this is a new request, so we have to resolve the context again
			var Basket = Cart.get().object;

			if (!Basket) {
				require('./Cart').Show();
				return;
			}

			var handleShippingSettingsResult = handleShippingSettings({
				Basket : Basket
			});
			if (handleShippingSettingsResult.error) {

				require('./dw/web').updatePageMetaData("SiteGenesis Checkout");
				response.renderTemplate('checkout/shipping/singleshipping', {
					Basket         : Basket,
					HomeDeliveries : prepareShipments({Basket : Basket}).HomeDeliveries
				});

				return;
			}

			/**
			 * Attempts to save the used shipping address in the customer address book.
			 */
			if (customer.authenticated && session.forms.singleshipping.shippingAddress.addToAddressBook.value) {
				Profile.get(customer.profile).addAddressToAddressBook(cart.getDefaultShipment().getShippingAddress());
			}

			updateInStoreMessage(Basket);

			/*
			 * Mark step as fulfilled.
			 */
			session.forms.singleshipping.fulfilled.value = true;

			require('./COBilling').Start();
			return;
		}
		else if (TriggeredAction.formId == 'selectAddress') {
			updateAddressDetails();
			return;
		}
		else if (TriggeredAction.formId == 'shipToMultiple') {
			require('./COShippingMultiple').Start();
			return;
		}
	}

	require('./dw/web').updatePageMetaData("SiteGenesis Checkout");
	response.renderTemplate('checkout/shipping/singleshipping');
}

/**
 * Initializes the address and shipping method form: - prepopulates form with
 * shipping address of default shipment if address exists, otherwise -
 * preselects shipping method in list if set at shipment
 */
function initForms(cart) {

	if (cart.getDefaultShipment().getShippingAddress()) {
		Form.get(session.forms.singleshipping.shippingAddress.addressFields).updateWithObject(cart.getDefaultShipment().getShippingAddress());
		Form.get(session.forms.singleshipping.shippingAddress.addressFields.states).updateWithObject(cart.getDefaultShipment().getShippingAddress());
		Form.get(session.forms.singleshipping.shippingAddress).updateWithObject(cart.getDefaultShipment());
	}
	else {
		if (customer.authenticated && customer.registered && customer.addressBook.preferredAddress) {
			Form.get(session.forms.singleshipping.shippingAddress.addressFields).updateWithObject(customer.addressBook.preferredAddress);
			Form.get(session.forms.singleshipping.shippingAddress.addressFields.states).updateWithObject(customer.addressBook.preferredAddress);
		}
	}

	session.forms.singleshipping.shippingAddress.shippingMethodID.value = cart.getDefaultShipment().getShippingMethodID();

	return;
}


/**
 * Select a shipping method for the default shipment. Sets the shipping method
 * and returns the result as JSON response.
 */
function selectShippingMethod() {
	var Basket = Cart.get();

	if (!Basket.object) {
		response.renderTemplate('checkout/shipping/selectshippingmethodjson', {});
		return;
	}

	var ScriptResult = new dw.system.Pipelet('Script', {
		Transactional : true,
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
	if (ScriptResult.result == PIPELET_ERROR) {
		response.renderTemplate('checkout/shipping/selectshippingmethodjson', {
			Basket : Basket
		});
		return;
	}
	var ApplicableShippingMethods = ScriptResult.ShippingMethods;

	var ScriptResult = new dw.system.Pipelet('Script', {
		Transactional : true,
		OnError       : 'PIPELET_ERROR',
		ScriptFile    : 'checkout/UpdateShipmentShippingMethod.ds'
	}).execute({
			ShippingMethodID : request.httpParameterMap.shippingMethodID.stringValue,
			Shipment         : Basket.defaultShipment,
			ShippingMethods  : ApplicableShippingMethods
		});
	if (ScriptResult.result == PIPELET_ERROR) {
		response.renderTemplate('checkout/shipping/selectshippingmethodjson', {
			Basket : Basket
		});
		return;
	}

	require('./Cart').Calculate();

	response.renderTemplate('checkout/shipping/selectshippingmethodjson', {
		Basket : Basket
	});
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
	var cart = Cart.get().object;

	if (!Basket) {
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

		var ScriptResult = new dw.system.Pipelet('Script', {
			Transactional : true,
			OnError       : 'PIPELET_ERROR',
			ScriptFile    : 'checkout/UpdateShipmentShippingMethod.ds'
		}).execute({
				ShippingMethodID : method.getID(),
				Shipment         : cart.getDefaultShipment(),
				ShippingMethod   : method,
				ShippingMethods  : ApplicableShippingMethods
			});
		if (ScriptResult.result == PIPELET_ERROR) {
			continue;
		}

		cart.calculate();

		var ScriptResult = new dw.system.Pipelet('Script', {
			Transactional : true,
			OnError       : 'PIPELET_ERROR',
			ScriptFile    : 'checkout/PreCalculateShipping.ds'
		}).execute({
				Basket : cart.object,
				Method : method
			});
		if (ScriptResult.result !== PIPELET_ERROR) {
			shippingCosts.put(method.getID(), ScriptResult.ShippingCost);
		}
	}

	// TODO what the heck?
	Transaction.rollback();


	var ScriptResult = new dw.system.Pipelet('Script', {
		Transactional : true,
		OnError       : 'PIPELET_ERROR',
		ScriptFile    : 'checkout/UpdateShipmentShippingMethod.ds'
	}).execute({
			ShippingMethodID : currentShippingMethod.getID(),
			Shipment         : cart.getDefaultShipment(),
			ShippingMethod   : currentShippingMethod,
			ShippingMethods  : applicableShippingMethods
		});

	if (ScriptResult.result !== PIPELET_ERROR) {
		Transaction.autocommit(function () {
			cart.calculate();
		});
	}

	session.forms.singleshipping.shippingAddress.shippingMethodID.value = cart.getDefaultShipment().getShippingMethodID();

	response.renderTemplate('checkout/shipping/shippingmethods', {
		Basket                    : cart.object,
		ApplicableShippingMethods : applicableShippingMethods,
		ShippingCosts             : shippingCosts
	});
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
	var ApplicableShippingMethods = ScriptResult.ShippingMethods;


	response.renderTemplate('checkout/shipping/shippingmethodsjson', {
		ApplicableShippingMethods : ApplicableShippingMethods
	});
}


/**
 * Handles the selected shipping address and shipping method: - copies the
 * address details and gift options to the basket's default shipment - set the
 * selected shipping method at the default shipment
 */
function handleShippingSettings(args) {
	var Basket = args.Basket;

	var ScriptResult = new dw.system.Pipelet('Script', {
		Transactional : true,
		OnError       : 'PIPELET_ERROR',
		ScriptFile    : 'checkout/CreateShipmentShippingAddress.ds'
	}).execute({
			AddressForm     : session.forms.singleshipping.shippingAddress,
			Shipment        : Basket.defaultShipment,
			GiftOptionsForm : session.forms.singleshipping.shippingAddress,
		});
	if (ScriptResult.result == PIPELET_ERROR) {
		return {
			error : true
		};
	}

	new dw.system.Pipelet('Script', {
		Transactional : true,
		OnError       : 'PIPELET_ERROR',
		ScriptFile    : 'checkout/UpdateShipmentShippingMethod.ds'
	}).execute({
			ShippingMethodID : session.forms.singleshipping.shippingAddress.shippingMethodID.value,
			Shipment         : Basket.defaultShipment
		});

	require('./Cart').Calculate();

	var ScriptResult = new dw.system.Pipelet('Script', {
		Transactional : false,
		OnError       : 'PIPELET_ERROR',
		ScriptFile    : 'cart/ValidateCartForCheckout.ds'
	}).execute({
			Basket      : Basket,
			ValidateTax : true
		});

	if (ScriptResult.result == PIPELET_ERROR) {
		require('./Cart').Show();
		return;
	}
	var BasketStatus = ScriptResult.BasketStatus;
	var EnableCheckout = ScriptResult.EnableCheckout;

	return {
		next : true
	};
}


/**
 * Prepares shipments by separating all gift certificate line items from product
 * line items and creating one shipment per gift certificate to purchase. As
 * second step empty shipments are removed. This start node can be called by any
 * checkout step to clean existing shipments according to these conditions.
 */
function prepareShipments(args) {
	var cart = Cart.get(args.Basket);

	cart.updateGiftCertificateShipments();
	cart.removeEmptyShipments();

	return inStoreFormInit({
		Basket : cart.object
	});
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
		Form.get(session.forms.shippingaddress).updateWithObject(shippingAddress);
		Form.get(session.forms.shippingaddress.states).updateWithObject(shippingAddress);
	}

	response.renderTemplate('checkout/shipping/shippingaddressdetails');
}

function editShippingAddress() {

	var TriggeredAction = request.triggeredFormAction;
	if (TriggeredAction != null) {
		if (TriggeredAction.formId == 'apply') {
			var form = require('./dw/form');
			if (!form.updateObjectWithForm(ShippingAddress, session.forms.shippingaddress)) {
				response.renderTemplate('checkout/shipping/shippingaddressdetails');
				return;
			}

			if (!form.updateObjectWithForm(ShippingAddress, session.forms.shippingaddress.states)) {
				response.renderTemplate('checkout/shipping/shippingaddressdetails');
				return;
			}

			response.renderTemplate('components/dialog/dialogapply', {});
			return;
		}
		else if (TriggeredAction.formId == 'remove') {
			var RemoveCustomerAddressResult = new dw.system.Pipelet('RemoveCustomerAddress').execute({
				Address  : session.forms.shippingaddress.object,
				Customer : customer
			});
			if (RemoveCustomerAddressResult.result == PIPELET_ERROR) {
				response.renderTemplate('checkout/shipping/shippingaddressdetails');
				return;
			}

			response.renderTemplate('components/dialog/dialogdelete', {});
			return;
		}
	}

	response.renderTemplate('checkout/shipping/shippingaddressdetails');
}

/**
 * Checks if the basket requires a multi shipping checkout by determining the
 * physical shipments of the basket. If more than one physical shipment is
 * contained in the basket a multi shipping checkout is required. The node ends
 * on named end nodes "yes" and "no" in order to communicates back to the
 * calling node.
 */
function requiresMultiShipping(cart) {

    var physicalShipments = cart.getPhysicalShipments();

    if (physicalShipments && physicalShipments.size() > 1 && dw.system.Site.getCurrent().getCustomPreferenceValue('enableMultiShipping')) {
        return true;
    }
    else {
        return false;
    }
}


function updateAddressDetails() {
	var Basket = Cart.get().object;

	if (!Basket) {
		require('./Cart').Show();
		return;
	}

	var ScriptResult = new dw.system.Pipelet('Script', {
		Transactional : false,
		OnError       : 'PIPELET_ERROR',
		ScriptFile    : 'account/addressbook/GetAddressCustomer.ds'
	}).execute({
			AddressId       : empty(request.httpParameterMap.addressID.value) ? request.httpParameterMap.dwfrm_singleshipping_addressList.value : request.httpParameterMap.addressID.value,
			CurrentCustomer : customer
		});
	var LookupCustomer = ScriptResult.Customer;
	var addressId = ScriptResult.LookupId;

	var address = LookupCustomer.getAddressBook().getAddress(addressId);

	Form.get(session.forms.singleshipping.shippingAddress.addressFields).updateWithObject(address);
	Form.get(session.forms.singleshipping.shippingAddress.addressFields.states).updateWithObject(address);

	if (Basket.getDefaultShipment().getShippingAddress() != null) {
		new dw.system.Pipelet('Script', {
			Transactional : true,
			OnError       : 'PIPELET_ERROR',
			ScriptFile    : 'checkout/CreateShipmentShippingAddress.ds'
		}).execute({
				AddressForm     : session.forms.singleshipping.shippingAddress,
				Shipment        : Basket.defaultShipment,
				GiftOptionsForm : session.forms.singleshipping.shippingAddress
			});
	}

	start();
}


/**
 * Binds the store message from the user to the shipment.
 */
function updateInStoreMessage(Basket) {
	if (dw.system.Site.getCurrent().getCustomPreferenceValue('enableStorePickUp')) {

		if (!require('./dw/form').updateObjectWithForm(Basket.shipments, session.forms.singleshipping.inStoreShipments.shipments)) {
			require('./Cart').Show();

			return;
		}
	}
}


/**
 * Used to initialize the single shipping form with instore pick up shipments
 */
function inStoreFormInit(args) {
	var Basket = args.Basket;
	var HomeDeliveries = false;

	if (dw.system.Site.getCurrent().getCustomPreferenceValue('enableStorePickUp')) {
		var ScriptResult = new dw.system.Pipelet('Script', {
			Transactional : true,
			OnError       : 'PIPELET_ERROR',
			ScriptFile    : 'checkout/storepickup/InStoreShipments.ds'
		}).execute({
				Basket : Basket
			});
		if (ScriptResult.result == PIPELET_ERROR) {
			// TODO either return something - or render something!
			var CartController = require('./Cart');
			CartController.Show();
			return {
				error : true
			};
		}
		HomeDeliveries = ScriptResult.homedeliveries;

		session.forms.singleshipping.inStoreShipments.shipments.clearFormElement();

		Form.get(session.forms.singleshipping.inStoreShipments.shipments).updateWithObject(Basket.getShipments());
	}
	else {
		HomeDeliveries = true;
	}

	return {
		HomeDeliveries : HomeDeliveries
	};
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

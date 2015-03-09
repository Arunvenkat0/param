'use strict';
/**
 * Controller handling customer service related pages, like help desk as well as the contact us form.
 *
 * @module controller/CustomerService
 */

/* API Includes */
var Mail = require('dw/net/Mail');
var Template = require('dw/util/Template');

/* Script Modules */
var guard = require('~/cartridge/scripts/guard');
var contactUsForm = require('~/cartridge/scripts/model/Form').get('contactus');
var view = require('~/cartridge/scripts/_view');

/**
 * Renders the customer service overview page.
 */
function show() {

    var customerServiceView = view.get('view/CustomerServiceView');

    customerServiceView.CustomerServiceLinks = customerServiceView.getCustomerServiceLinks();
    customerServiceView.render('content/customerservice');
}


/**
 * Renders the left hand navigation.
 */
function leftNav() {

    var customerServiceView = view.get('view/CustomerServiceView');

    customerServiceView.CustomerServiceLinks = customerServiceView.getCustomerServiceLinks();
    customerServiceView.render('content/customerserviceleftnav');

}


/**
 * Provides a contact us form which sends an email to the configured customer service email address.
 */
function contactUs() {

    contactUsForm.clear();
    view.get('view/CustomerServiceView').render('content/contactus');

}

/**
 * The form handler.
 */
function submit() {

    var contactUsResult = contactUsForm.handleAction({
        'send' : function (formgroup) {

            var template = new Template('mail/contactus');
            var mail = new Mail();

            // Change the MailTo in order to send to the store's customer service email address. It defaults to the
            // user's email for demonstration.
            mail.addTo(formgroup.email.value);
            mail.setFrom(formgroup.email.value);
            mail.setSubject(formgroup.myquestion.value);
            mail.setContent(template.render());

            return mail.send();
        }
    });

    if (contactUsResult && (contactUsResult.getStatus() === dw.system.Status.OK)) {
        view.get('view/CustomerServiceView', {
            ConfirmationMessage : 'edit'
        }).render('content/contactus');
    }
    else {
        view.get('view/CustomerServiceView').render('content/contactus');
    }

}

/*
 * Module exports
 */

/*
 * Web exposed methods
 */
/* @see module:controller/CustomerService~show */
exports.Show        = guard.filter(['get', 'https'], show);
/* @see module:controller/CustomerService~leftNav */
exports.LeftNav     = guard.filter(['get', 'https'], leftNav);
/* @see module:controller/CustomerService~contactUs */
exports.ContactUs   = guard.filter(['get', 'https'], contactUs);
/* @see module:controller/CustomerService~submit */
exports.Submit      = guard.filter(['post', 'https'], submit);

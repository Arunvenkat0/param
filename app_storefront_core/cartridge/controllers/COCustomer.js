var g = require('./dw/guard');

/**
 * Pipeline implements the first step of the cart checkout process, which is to ask the customer to login, 
 * register or checkout anonymously.
 */

/**
 * First step of the checkout: provide to choose checkout type (returning, guest or create account)
 */
function Start()
{
    var CurrentForms = session.forms;
    var CurrentCustomer = customer;

    
    prepareCheckout();

    if (CurrentCustomer.authenticated)
    {
    	/*
    	 * Direct to first checkout step if already authenticated
    	 */
    	var COShippingController = require('./COShipping');
        COShippingController.Start();
        return;
    }

    var form = require('./dw/form');
    form.clearFormElement(CurrentForms.login);

    if (CurrentCustomer.registered)
    {
    	/*
    	 * Prepopulate login form field with customer's login name
    	 */
    	CurrentForms.login.username.value = CurrentCustomer.profile.credentials.login;
    }


    var web = require('./dw/web');
    web.updatePageMetaDataForContent(dw.content.ContentMgr.getContent("myaccount-login"));

    showLogin();
}

function showLogin()
{
	response.renderTemplate('checkout/checkoutlogin');
}


function LoginForm()
{
    var CurrentForms = session.forms;

    
	// TODO this should all end in a redirect?
	var TriggeredAction = request.triggeredAction;
	if (TriggeredAction != null)
	{
	    if (TriggeredAction.formId == 'login')
	    {
	        var Login = CurrentForms.login.username.value;
	        var Password = CurrentForms.login.password.value;
	        var RememberMe = CurrentForms.login.rememberme.value;

	        // TODO do not perform login ourselves?
	        /*
	         * Delegate login to appropriate authentication pipeline and react on success/failure
	         */
	        var LoginController = require('./Login');
	        var ProcessResult = LoginController.Process();
	        if (ProcessResult.login_failed)
	        {
	        	showLogin();
	        	return;
	        }

	        response.redirect(dw.web.URLUtils.https('COShipping-Start'));
	        return;
	    }
	    else if (TriggeredAction.formId == 'register')
	    {
	        // TODO requireRegistration like login?
	        var AccountController = require('./Account');
	        var RegisterResult = AccountController.Register();

            response.redirect(dw.web.URLUtils.https('COShipping-Start'));
	        return;
	    }
	    else if (TriggeredAction.formId == 'unregistered')
	    {
	        var COShippingController = require('./COShipping');
	        COShippingController.Start();
	        return;
	    }
	}
	
	showLogin();
}


/**
 * Prepares the checkout initially: removes all payment instruments from the basket and clears all 
 * forms used in the checkout process, when the customer enters the checkout. The single steps (shipping, billing etc.) 
 * may not contain the form clearing in order to support navigating forth and back in the checkout steps without losing 
 * already entered form values.
 */
function prepareCheckout()
{
    var CurrentForms = session.forms;

    
    var form = require('./dw/form');
    form.clearFormElement(CurrentForms.singleshipping);
    form.clearFormElement(CurrentForms.multishipping);
    form.clearFormElement(CurrentForms.billing);


    var GetBasketResult = new dw.system.Pipelet('GetBasket', {
        Create: true
    }).execute();
    if (GetBasketResult.result == PIPELET_NEXT)
    {
        var txn = require('dw/system/Transaction');
        txn.begin();
        
        var Basket = GetBasketResult.Basket;
        Basket.removeAllPaymentInstruments();
        
        txn.commit();
    }
}


/*
 * Module exports
 */

/*
 * Web exposed methods
 */
// TODO called with GET and POST
exports.Start               = g.https(Start);
exports.LoginForm           = g.httpsPost(LoginForm);

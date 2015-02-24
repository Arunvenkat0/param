/**
 * Verifies a credit card against a valid card number and expiration date and possibly invalidates invalid form fields. 
 * If the verification was successful a credit card payment instrument is created.
 * The pipeline just reuses the basic credit card validation pipeline from processor BASIC_CREDIT.
 */
function Handle(args)
{
    var BASIC_CREDITController = require('./BASIC_CREDIT');
    return BASIC_CREDITController.Handle(args);
}


/**
 * Authorizes a payment using a credit card. A real integration is not supported, that's why the pipeline returns 
 * this state back to the calling checkout pipeline.
 */
function Authorize(args)
{
	return {
	    not_supported: true
	};
}

/*
 * Module exports
 */

/*
 * Local methods
 */
exports.Handle = Handle;
exports.Authorize = Authorize;

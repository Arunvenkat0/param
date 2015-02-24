/**
 * Verifies a credit card against a valid card number and expiration date and possibly invalidates invalid form fields. 
 * If the verification was successful a credit card payment instrument is created.
 */
function Handle(args)
{
    var CurrentForms = session.forms;
    
    var Basket = args.Basket;
    var Order = args.Order;


    var VerifyPaymentCardResult = new dw.system.Pipelet('VerifyPaymentCard', {
        VerifySecurityCode: true
    }).execute({
        PaymentCard: dw.order.PaymentMgr.getPaymentCard(CurrentForms.billing.paymentMethods.creditCard.type.value),
        CardNumber: CurrentForms.billing.paymentMethods.creditCard.number.value,
        ExpirationMonth: CurrentForms.billing.paymentMethods.creditCard.month.value,
        ExpirationYear: CurrentForms.billing.paymentMethods.creditCard.year.value,
        CardSecurityCode: CurrentForms.billing.paymentMethods.creditCard.cvn.value
    });
    if (VerifyPaymentCardResult.result == PIPELET_ERROR)
    {
    	// TODO is this also return in case of error?
        var CreditCardStatus = VerifyPaymentCardResult.Status;

        new dw.system.Pipelet('Script', {
            Transactional: false,
            OnError: 'PIPELET_ERROR',
            ScriptFile: 'checkout/InvalidatePaymentCardFormElements.ds'
        }).execute({
            CreditCardForm: CurrentForms.billing.paymentMethods.creditCard,
            Status: CreditCardStatus
        });
        
        return {
            error: true
        };
    }
    var CreditCardStatus = VerifyPaymentCardResult.Status;
    


    var ScriptResult = new dw.system.Pipelet('Script', {
        Transactional: true,
        OnError: 'PIPELET_ERROR',
        ScriptFile: 'checkout/CreatePaymentInstrument.ds'
    }).execute({
        PaymentType: dw.order.PaymentInstrument.METHOD_CREDIT_CARD,
        RemoveExisting: true,
        LineItemCtnr: Basket != null ? Basket : Order
    });
    if (ScriptResult.result == PIPELET_ERROR)
    {
        return {
            error: true
        };
    }
    var PaymentInstrument = ScriptResult.PaymentInstrument;

    var txn = require('dw/system/Transaction');
    txn.begin();
   
    PaymentInstrument.creditCardHolder = CurrentForms.billing.paymentMethods.creditCard.owner.value;
    PaymentInstrument.creditCardNumber = CurrentForms.billing.paymentMethods.creditCard.number.value;
    PaymentInstrument.creditCardType = CurrentForms.billing.paymentMethods.creditCard.type.value;
    PaymentInstrument.creditCardExpirationMonth = CurrentForms.billing.paymentMethods.creditCard.month.value;
    PaymentInstrument.creditCardExpirationYear = CurrentForms.billing.paymentMethods.creditCard.year.value;
    
    txn.commit();

    return {
        success: true
    };
}


/**
 * Authorizes a payment using a credit card. The payment is authorized by using the BASIC_CREDIT processor 
 * only and setting the order no as the transaction ID. Customizations may use other processors and custom 
 * logic to authorize credit card payment.
 */
function Authorize(args)
{
    var GetPaymentProcessorResult = new dw.system.Pipelet('GetPaymentProcessor').execute({
        ID: "BASIC_CREDIT"
    });
    if (GetPaymentProcessorResult.result == PIPELET_ERROR)
    {
    	return {
    	    error: true
    	};
    }
    var PaymentProcessor = GetPaymentProcessorResult.PaymentProcessor;

    var txn = require('dw/system/Transaction');
    txn.begin();
    
    PaymentInstrument.paymentTransaction.transactionID = OrderNo;
    PaymentInstrument.paymentTransaction.paymentProcessor = PaymentProcessor;
    
    txn.commit();
    
    return {
        authorized: true
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

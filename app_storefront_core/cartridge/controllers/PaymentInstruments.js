var g = require('./dw/guard');

/**
 * Displays credit card information and other payment related information and
 * lets the user change it.
 */

/**
 * Renders a list of the saved credit card payment instruments of the current
 * customer.
 */
function List()
{
    var GetCustomerPaymentInstrumentsResult = new dw.system.Pipelet('GetCustomerPaymentInstruments').execute({
        PaymentMethod : dw.order.PaymentInstrument.METHOD_CREDIT_CARD,
        Customer : customer
    });
    var PaymentInstruments = GetCustomerPaymentInstrumentsResult.PaymentInstruments;


    var form = require('./dw/form');
    form.clearFormElement(session.forms.paymentinstruments);
    form.updateFormWithObject(session.forms.paymentinstruments.creditcards.storedcards, PaymentInstruments);


    var web = require('./dw/web');
    web.updatePageMetaDataForContent(dw.content.ContentMgr.getContent("myaccount-paymentsettings"));

    response.renderTemplate('account/payment/paymentinstrumentlist', {
        PaymentInstruments : PaymentInstruments
    });
}


/**
 * Provides functionality to add a new credit card payment instrument to the
 * saved payment instruments of the current customer.
 */
function Add()
{
    var form = require('./dw/form');
    form.clearFormElement(session.forms.paymentinstruments);
    form.setFormOptions(session.forms.paymentinstruments.creditcards.newcreditcard.type, dw.order.PaymentMgr
            .getPaymentMethod(dw.order.PaymentInstrument.METHOD_CREDIT_CARD).activePaymentCards);

    response.renderTemplate('account/payment/paymentinstrumentdetails');
}


function PaymentForm()
{
    var TriggeredAction = request.triggeredFormAction;
    if (TriggeredAction != null)
    {
        if (TriggeredAction.formId == 'create')
        {
            if (!create())
            {
                // TODO this should be a redirect
                // must show the problems in the form
                response.renderTemplate('account/payment/paymentinstrumentdetails');
                return;
            }
        }
    }

    // TODO what is this?
    /*
    if (session.forms.paymentinstruments.creditcards.valid)
    {
        create();
        return;
    }
    */

    response.redirect(dw.web.URLUtils.https('PaymentInstruments-List'));
}


function create()
{
    if (!verifyCreditCard())
    {
        return false;
    }
    
    
    var newCreditCardForm = session.forms.paymentinstruments.creditcards.newcreditcard;
    
    
    var GetCustomerPaymentInstrumentsResult = new dw.system.Pipelet('GetCustomerPaymentInstruments').execute({
        PaymentMethod : dw.order.PaymentInstrument.METHOD_CREDIT_CARD,
        Customer : customer
    });
    var PaymentInstruments = GetCustomerPaymentInstrumentsResult.PaymentInstruments;

    
    var ScriptResult = new dw.system.Pipelet('Script', {
        Transactional : false,
        OnError : 'PIPELET_ERROR',
        ScriptFile : 'account/payment/DuplicateCheck.ds'
    }).execute({
        NoIn : newCreditCardForm.number.value,
        PIList : PaymentInstruments
    });
    if (ScriptResult.result == PIPELET_ERROR)
    {
        return false;
    }
    var DuplicateCard = ScriptResult.Duplicate;
    var OldCard = ScriptResult.OldCard;

    
    var txn = require('dw/system/Transaction');
    txn.begin();
    

    var CreateCustomerPaymentInstrumentResult = new dw.system.Pipelet('CreateCustomerPaymentInstrument').execute({
        PaymentMethod : dw.order.PaymentInstrument.METHOD_CREDIT_CARD,
        Customer : customer
    });
    var PaymentInstrument = CreateCustomerPaymentInstrumentResult.PaymentInstrument;


    var form = require('./dw/form');
    if (!form.updateObjectWithForm(PaymentInstrument, newCreditCardForm))
    {
        txn.rollback();

        return false;
    }

    if (DuplicateCard)
    {
        new dw.system.Pipelet('RemoveCustomerPaymentInstrument').execute({
            PaymentInstrument : OldCard
        });
    }

    txn.commit();

    var form = require('./dw/form');
    form.clearFormElement(session.forms.paymentinstruments);
    
    return true;
}


/**
 * Deletes a saved credit card payment instrument.
 */
function Delete()
{
    var TriggeredAction = request.triggeredFormAction;
    if (TriggeredAction != null)
    {
        new dw.system.Pipelet('RemoveCustomerPaymentInstrument').execute({
            PaymentInstrument : TriggeredAction.object
        });
    }

    response.redirect(dw.web.URLUtils.https('PaymentInstruments-List'));
}


/*
 * Private helpers
 */

/**
 * Verifies a credit card.
 */
function verifyCreditCard()
{
    var newCreditCardForm = session.forms.paymentinstruments.creditcards.newcreditcard;

    var VerifyPaymentCardResult = new dw.system.Pipelet('VerifyPaymentCard', {
        VerifySecurityCode : false
    }).execute({
        PaymentCard : dw.order.PaymentMgr.getPaymentCard(newCreditCardForm.type.value),
        CardNumber : newCreditCardForm.number.value,
        ExpirationMonth : newCreditCardForm.month.value,
        ExpirationYear : newCreditCardForm.year.value,
        CardSecurityCode : newCreditCardForm.cvn.value
    });
    if (VerifyPaymentCardResult.result == PIPELET_ERROR)
    {
        var Status = VerifyPaymentCardResult.Status;

        new dw.system.Pipelet('Script', {
            Transactional : false,
            OnError : 'PIPELET_ERROR',
            ScriptFile : 'checkout/InvalidatePaymentCardFormElements.ds'
        }).execute({
            CreditCardForm : newCreditCardForm,
            Status : Status
        });

        return false;
    }

    return true;
}

/**
 * A decorator which ensures that only authenticated customers can access the functions.
 */
function loggedIn(action)
{
    return function()
    {
        if (!customer.authenticated)
        {
            var accountController = require('./Account');
            accountController.requireLogin({
                TargetAction : 'PaymentInstruments-List'
            });
            return;
        }
        
        action();
    };
}

/*
 * Module exports
 */

/*
 * Web exposed methods
 */
exports.List            = g.httpsGet(loggedIn(List));
exports.Add             = g.httpsGet(loggedIn(Add));
exports.PaymentForm     = g.httpsPost(loggedIn(PaymentForm));
exports.Delete          = g.https(loggedIn(Delete));

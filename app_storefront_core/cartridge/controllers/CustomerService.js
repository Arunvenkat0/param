var g = require('./dw/guard');

/**
 * Renders the customer service overview page.
 */
function Show()
{
    var links = getLinks();

    response.renderTemplate('content/customerservice', {
        CustomerServiceLinks: links        
    });
}


/**
 * Renders the left hand navigation.
 */
function LeftNav()
{
    var links = getLinks();

    response.renderTemplate('content/customerserviceleftnav', {
        CustomerServiceLinks: links        
    });
}

    
/**
 * Provides a contact us form which sends an email to the configured customer service email address.
 */
function ContactUs()
{
    var form = require('./dw/form');
    form.clearFormElement(session.forms.contactus);

    response.renderTemplate('content/contactus', {});
}


/**
 * The form handler.
 */
function Submit()
{
	var TriggeredAction = request.triggeredAction;
	if (TriggeredAction != null)
	{
	    if (TriggeredAction.formId == 'send')
	    {
	        var contactForm = session.forms.contactus;
	        
	        var m = require('./dw/mail');
	        m.sendMail({
		        MailFrom: contactForm.email.value,
		        MailSubject: contactForm.myquestion.value,
		        MailTemplate: 'mail/contactus',
		        MailTo: contactForm.email.value
	        });
	        
	        // TODO this should trigger a redirect
	        response.renderTemplate('content/contactus', {
	            ConfirmationMessage: 'edit'
	    	});
	    	return;
	    }
	}

	response.redirect(dw.web.URLUtils.https('CustomerService-ContactUs'));
}


/*
 * Private methods
 */

/**
 * Determines the customer navigation from the folder structure in the content library.
 */
function getLinks()
{
    var ScriptResult = new dw.system.Pipelet('Script', {
        Transactional: false,
        OnError: 'PIPELET_ERROR',
        ScriptFile: 'customerservice/GetCustomerServiceContent.ds'
    }).execute({
        FolderID: 'customer-service'
    });
    if (ScriptResult.result == PIPELET_ERROR)
    {
        return null;
    }
    
    return ScriptResult.CustomerServiceLinks;
}


/*
 * Module exports
 */

/*
 * Web exposed methods
 */
exports.Show        = g.httpsGet(Show);
exports.LeftNav     = g.httpsGet(LeftNav);
exports.ContactUs   = g.httpsGet(ContactUs);
exports.Submit      = g.httpsPost(Submit);

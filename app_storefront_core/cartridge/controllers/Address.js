var g = require('./dw/guard');
var f = require('./dw/form');

/**
 * Address management at customer profile
 */

/**
 * List addresses in customer profile Input: (none)
 */
function List()
{
    var web = require('./dw/web');
    web.updatePageMetaDataForContent(dw.content.ContentMgr.getContent("myaccount-addresses"));

    response.renderTemplate('account/addressbook/addresslist');
}

/**
 * Renders a dialog providing functionality to add a new address to the address
 * book.
 */
function Add()
{
    f.clearFormElement(session.forms.profile);

    response.renderTemplate('account/addressbook/addressdetails', {
        Action : 'add',
        FormAction: 'Address-AddForm'
    });
}

/**
 * The form handler.
 */
function AddForm()
{
    var TriggeredAction = request.triggeredFormAction;
    if (TriggeredAction != null)
    {
        if (TriggeredAction.formId == 'cancel')
        {
            response.redirect(dw.web.URLUtils.https('Address-List'));
            return;
        }
        else if (TriggeredAction.formId == 'create')
        {
            if (!create())
            {
                response.redirect(dw.web.URLUtils.https('Address-Add'));
                return;
            }
            
            if (request.httpParameterMap.format.stringValue == 'ajax')
            {
                response.renderJSON({
                    success : true
                });
                return;
            }

            response.redirect(dw.web.URLUtils.https('Address-List'));
            return;
        }
    }

    // TODO what is this? Does this make sense?
    if (session.forms.profile.address.valid)
    {
        if (!create())
        {
            response.redirect(dw.web.URLUtils.https('Address-Add'));
            return;
        }

        if (request.httpParameterMap.format.stringValue == 'ajax')
        {
            response.renderJSON({
                success : true
            });
            return;
        }

        response.redirect(dw.web.URLUtils.https('Address-List'));
        return;
    }

    // default
    response.redirect(dw.web.URLUtils.https('Address-List'));
}

/**
 * Creates an address.
 * 
 * @returns true, if the address was created
 */
function create()
{
    var profileForm = session.forms.profile;

    var CreateCustomerAddressResult = new dw.system.Pipelet('CreateCustomerAddress').execute({
        AddressID : profileForm.address.addressid.value,
        Customer : customer
    });
    if (CreateCustomerAddressResult.result == PIPELET_ERROR)
    {
        f.invalidateFormElement(profileForm.address.addressid);

        return false;
    }
    var Address = CreateCustomerAddressResult.Address;

    if (!f.updateObjectWithForm(Address, profileForm.address))
    {
        return false;
    }

    if (!f.updateObjectWithForm(Address, profileForm.address.states))
    {
        return false;
    }

    return true;
}


/**
 * Renders a dialog providing functionality to edit an existing address.
 */
function Edit()
{
    var profileForm = session.forms.profile;
    f.clearFormElement(profileForm);


    var GetCustomerAddressResult = new dw.system.Pipelet('GetCustomerAddress').execute({
        AddressID : decodeURIComponent(request.httpParameterMap.AddressID.value),
        Customer : customer
    });
    if (GetCustomerAddressResult.result == PIPELET_ERROR)
    {
        response.renderTemplate('components/dialog/closedialog');
        return;
    }
    var Address = GetCustomerAddressResult.Address;


    f.updateFormWithObject(profileForm.address, Address);
    f.updateFormWithObject(profileForm.address.states, Address);


    response.renderTemplate('account/addressbook/addressdetails', {
        Action : 'edit',
        FormAction: 'Address-EditForm',
        Address: Address
    });
}


function EditForm()
{
    // TODO this should all be cleaned up
    var TriggeredAction = request.triggeredFormAction;
    if (TriggeredAction != null)
    {
        if (TriggeredAction.formId == 'cancel')
        {
            response.redirect(dw.web.URLUtils.https('Address-List'));
            return;
        }
        // TODO how should this be possible at all? There is no create button.
        else if (TriggeredAction.formId == 'create')
        {
            if (!edit())
            {
                response.redirect(dw.web.URLUtils.https('Address-List'));
            }
            
            if (request.httpParameterMap.format.stringValue == 'ajax')
            {
                response.renderJSON({
                    success : true
                });
                return;
            }
        }
        else if (TriggeredAction.formId == 'edit')
        {
            if (!session.forms.profile.address.valid)
            {
                response.redirect(dw.web.URLUtils.https('Address-List'));
                return;
            }
            
            if (!edit())
            {
                response.redirect(dw.web.URLUtils.https('Address-List'));
                return;
            }
            
            if (request.httpParameterMap.format.stringValue == 'ajax')
            {
                response.renderJSON({
                    success : true
                });
                return;
            }
        }
        else if (TriggeredAction.formId == 'remove')
        {
            var DeleteAddressResult = deleteAddress();
            if (DeleteAddressResult.failed)
            {
                response.redirect(dw.web.URLUtils.https('Address-List'));
                return;
            }

            if (request.httpParameterMap.format.stringValue.toLowerCase() == 'ajax')
            {
                response.renderJSON({
                    success : true
                });
                return;
            }
        }
    }

    response.redirect(dw.web.URLUtils.https('Address-List'));
}

function edit()
{
    var profileForm = session.forms.profile;

    // get address to be edited
    var GetCustomerAddressResult = new dw.system.Pipelet('GetCustomerAddress').execute({
        AddressID : request.httpParameterMap.addressid.value,
        Customer : customer
    });
    if (GetCustomerAddressResult.result == PIPELET_ERROR)
    {
        f.invalidateFormElement(profileForm.address.addressid);

        return false;
    }
    var Address = GetCustomerAddressResult.Address;
    

    // check if new address id is already taken
    if (Address.ID != profileForm.address.addressid.value)
    {
        var GetCustomerAddressResult = new dw.system.Pipelet('GetCustomerAddress').execute({
            AddressID : profileForm.address.addressid.value,
            Customer : customer
        });
        if (GetCustomerAddressResult.result == PIPELET_NEXT)
        {
            f.invalidateFormElement(profileForm.address.addressid);
    
            return false;
        }
    }

    
    if (!f.updateObjectWithForm(Address, profileForm.address))
    {
        f.invalidateFormElement(profileForm.address.addressid);

        return false;
    }

    if (!f.updateObjectWithForm(Address, profileForm.address.states))
    {
        f.invalidateFormElement(profileForm.address.addressid);

        return false;
    }

    return true;
}

/**
 * Sets the default address.
 */
function SetDefault()
{
    var GetCustomerAddressResult = new dw.system.Pipelet('GetCustomerAddress').execute({
        AddressID : decodeURIComponent(request.httpParameterMap.AddressID.value),
        Customer : customer
    });
    if (GetCustomerAddressResult.result == PIPELET_ERROR)
    {
        List();
        return;
    }
    var CustomerAddress = GetCustomerAddressResult.Address;


    new dw.system.Pipelet('Script', {
        Transactional : true,
        OnError : 'PIPELET_ERROR',
        ScriptFile : 'account/addressbook/SetDefaultAddress.ds'
    }).execute({
        CustomerAddress : CustomerAddress,
        CurrentCustomer : customer
    });

    List();
}


/**
 * Returns a customer address as JSON response. Required to fill address form
 * with selected address from address book.
 */
function GetAddressDetails()
{
    var GetCustomerAddressResult = new dw.system.Pipelet('GetCustomerAddress').execute({
        AddressID : decodeURIComponent(request.httpParameterMap.addressID.value),
        Customer : customer
    });
    var Address = GetCustomerAddressResult.Address;

    response.renderTemplate('account/addressbook/addressjson', {
        Address : Address
    });
}


/**
 * Deletes an existing address.
 */
function Delete()
{
    session.forms.profile.address.addressid.value = decodeURIComponent(request.httpParameterMap.AddressID.value);

    var deleteAddressResult = deleteAddress();

    if (request.httpParameterMap.format.stringValue != 'ajax')
    {
        List();
        return;
    }
    
    var Status = deleteAddressResult.Status;

    response.renderJSON({
        status : empty(Status) ? 'OK' : Status.code,
        message : empty(Status) || Status.code == 'OK' ? '' : dw.web.Resource.msg('addressdetails.'
                + dw.customer.CustomerStatusCodes.CUSTOMER_ADDRESS_REFERENCED_BY_PRODUCT_LIST, 'account', null)
    });
}


function deleteAddress()
{
    var GetCustomerAddressResult = new dw.system.Pipelet('GetCustomerAddress').execute({
        AddressID : session.forms.profile.address.addressid.value,
        Customer : customer
    });
    if (GetCustomerAddressResult.result == PIPELET_ERROR)
    {
        return {
            failed : true
        };
    }
    var Address = GetCustomerAddressResult.Address;

    var RemoveCustomerAddressResult = new dw.system.Pipelet('RemoveCustomerAddress').execute({
        Address : Address,
        Customer : customer
    });
    if (RemoveCustomerAddressResult.result == PIPELET_ERROR)
    {
        var Status = new dw.system.Status(dw.system.Status.ERROR,
                dw.customer.CustomerStatusCodes.CUSTOMER_ADDRESS_REFERENCED_BY_PRODUCT_LIST);
        return {
            failed : true,
            Status : Status
        };
    }

    return {
        ok : true
    };
}

/*
 * Private helpers
 */

/**
 * Decorator which ensures that the embedded action is only performed when the
 * customer is authenticated. If not, a login form is displayed which returns to
 * the address list after successful authentication.
 */
function loggedIn(action)
{
    return function()
    {
        if (!customer.authenticated)
        {
            var accountController = require('./Account');
            accountController.requireLogin({
                TargetAction : 'Address-List'
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
exports.List                = g.httpsGet(loggedIn(List));
exports.Add                 = g.httpsGet(loggedIn(Add));
exports.AddForm             = g.httpsPost(loggedIn(AddForm));
exports.Edit                = g.httpsGet(loggedIn(Edit));
exports.EditForm            = g.httpsPost(loggedIn(EditForm));
exports.SetDefault          = g.httpsGet(loggedIn(SetDefault));
exports.GetAddressDetails   = g.httpsGet(loggedIn(GetAddressDetails));
exports.Delete              = g.https(loggedIn(Delete));

var g = require('./dw/guard');

/**
 * SendToFriend allows the use of dialog to gather email info to send to a
 * friend. A template that uses this dialog can set some of the values ahead of
 * time. Please look at wishlist.isml or registry.isml
 */
function Start()
{
    // TODO when embedded in a product page without https, the feature does not work
    // because the customer is not known and anonymous
    // seems to be cause by JavaScript dialogs which do not sent HTTP cookies correctly

    var CurrentHttpParameterMap = request.httpParameterMap;
    var sendToFriendForm = session.forms.sendtofriend;


    var form = require('./dw/form');
    form.clearFormElement(sendToFriendForm);


    var Product = null;
    var ProductOptionModel = null;

    if (CurrentHttpParameterMap.pid.stringValue)
    {
        Product = dw.catalog.ProductMgr.getProduct(CurrentHttpParameterMap.pid);

        var UpdateProductOptionSelectionsResult = new dw.system.Pipelet('UpdateProductOptionSelections').execute({
            Product : Product
        });
        ProductOptionModel = UpdateProductOptionSelectionsResult.ProductOptionModel;
    }


    // TODO not needed by template?
    /*
     * var ProductList = null;
     * 
     * if (CurrentHttpParameterMap.plid.stringValue) { var GetProductListResult =
     * new dw.system.Pipelet('GetProductList', { Create : false }).execute({
     * ProductListID : CurrentHttpParameterMap.plid.value }); ProductList =
     * GetProductListResult.ProductList; }
     */

    if (customer.authenticated)
    {
        sendToFriendForm.yourname.htmlValue = customer.profile.firstName + " " + customer.profile.lastName;
    }


    response.renderTemplate('account/components/sendtofrienddialog', {
        ViewMode : 'Edit',
        Product : Product,
        ProductOptionModel : ProductOptionModel
    });
}

/**
 * The form handler.
 */
function SendToFriendForm()
{
    // TODO this should end in some redirect
    // but sometimes this is called with GET and not with POST
    var TriggeredAction = request.triggeredAction;
    if (TriggeredAction != null)
    {
        if (TriggeredAction.formId == 'edit')
        {
            response.renderTemplate('account/components/sendtofrienddialog', {
                ViewMode : 'Edit'
            });
            return;
        }
        else if (TriggeredAction.formId == 'preview')
        {
            var pid = request.httpParameterMap.pid;

            var sendToFriendForm = session.forms.sendtofriend;

            if (sendToFriendForm.friendsemail.value != sendToFriendForm.confirmfriendsemail.value)
            {
                var form = require('./dw/form');
                form.invalidateFormElement(sendToFriendForm.confirmfriendsemail);
            }

            var Product = null;
            var ProductOptionModel = null;

            if (typeof (pid) != 'undefined' && pid != null)
            {
                var GetProductResult = getProduct(pid);
                Product = GetProductResult.Product;
                ProductOptionModel = GetProductResult.ProductOptionModel;
            }

            response.renderTemplate('account/components/sendtofrienddialog', {
                ViewMode : 'preview',
                Product : Product,
                ProductOptionModel : ProductOptionModel
            });
            return;
        }
        else if (TriggeredAction.formId == 'send')
        {
            send();
            return;
        }
    }

    // TODO what is this?
    /*
    if (session.forms.sendtofriend.valid)
    {
        send();
        return;
    }
    */


    // TODO view mode?
    response.renderTemplate('account/components/sendtofrienddialog');
}


function send()
{
    var CurrentHttpParameterMap = request.httpParameterMap;
    var pid = request.httpParameterMap.pid;

    var sendToFriendForm = session.forms.sendtofriend;

    if (sendToFriendForm.friendsemail.value != sendToFriendForm.confirmfriendsemail.value)
    {
        var form = require('./dw/form');
        form.invalidateFormElement(sendToFriendForm.confirmfriendsemail);

        // TODO view mode?
        response.renderTemplate('account/components/sendtofrienddialog');
        return;
    }

    /*
     * Product List Email
     */
    // TODO where should this come from? plid?
    if (typeof (ProductList) != 'undefined' && ProductList != null)
    {
        var m = require('./dw/mail');
        m.sendMail({
            MailFrom : customer.profile.email,
            MailSubjet : sendToFriendForm.subject.value,
            MailTemplate : "mail/productlist",
            MailTo : sendToFriendForm.friendsemail.value
        });


        if (empty(CurrentHttpParameterMap.format.stringValue))
        {
            if (empty(ProductList.eventCity))
            {
                var WishlistController = require('./Wishlist');
                WishlistController.Show();
                return;
            }
            else
            {
                var GiftRegistryController = require('./GiftRegistry');
                GiftRegistryController.ShowRegistry();
                return;
            }
        }
        else
        {
            response.renderTemplate('account/components/sendtofrienddialogsuccess', {
                ViewMode : 'edit'
            });
            return;
        }
    }

    /*
     * Product Email
     */
    if (typeof (pid) != 'undefined' && pid != null)
    {
        var GetProductResult = getProduct(pid);
        var CurrentCustomer = customer;
        
        var m = require('./dw/mail');
        m.sendMail({
            MailFrom : customer.profile.email,
            MailSubject : sendToFriendForm.subject.value,
            MailTemplate : "mail/product",
            MailTo : sendToFriendForm.friendsemail.value
        });


        if (empty(CurrentHttpParameterMap.format.stringValue))
        {
            var ProductController = require('./Product');
            ProductController.Show();
            return;
        }
    }
    else
    {
        /*
         * Default
         */
        var m = require('./dw/mail');
        m.sendMail({
            MailFrom : customer.profile.email,
            MailSubject : sendToFriendForm.subject.value,
            MailTemplate : "mail/productlistdefault",
            MailTo : sendToFriendForm.friendsemail.value
        });
    }


    response.renderTemplate('account/components/sendtofrienddialogsuccess', {
        ViewMode : 'edit'
    });
}


/**
 * Get a product and any product options that have been selected.
 */
function getProduct(pid)
{
    var GetProductResult = new dw.system.Pipelet('GetProduct').execute({
        ProductID : pid.stringValue
    });
    if (GetProductResult.result == PIPELET_ERROR)
    {
        return {
            error : true
        };
    }
    var Product = GetProductResult.Product;


    var UpdateProductOptionSelectionsResult = new dw.system.Pipelet('UpdateProductOptionSelections').execute({
        Product : Product
    });
    var ProductOptionModel = UpdateProductOptionSelectionsResult.ProductOptionModel;

    return {
        Product : Product,
        ProductOptionModel : ProductOptionModel
    };
}


/**
 * This pipeline is used to ensure that storefront users using the send to a
 * friend feature are logged in
 */
function Login()
{
    var accountController = require('./Account');
    accountController.requireLogin({
        TargetAction : 'SendToFriend-Start',
        TargetParameters : [ 'pid', request.httpParameterMap.pid.stringValue ]
    });
}

/*
 * Module exports
 */

/*
 * Web exposed methods
 */
exports.Start = g.httpsGet(Start);

// TODO rich UI uses GET, normal UI uses POST
exports.SendToFriendForm = g.https(SendToFriendForm);
exports.Login = g.httpsGet(Login);

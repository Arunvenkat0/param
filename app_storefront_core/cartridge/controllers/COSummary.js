var g = require('./dw/guard');

/**
 * This pipeline implements the last step of the checkout. A successful handling
 * of billing address and payment method selection leads to this pipeline. It
 * provides the customer with a last overview of the basket prior to confirm the
 * final order creation.
 */

/**
 * This pipeline renders the summary page prior to order creation.
 */
function Start()
{
    var CartController = require('./Cart');
    var GetExistingBasketResult = CartController.GetExistingBasket();

    var Basket = GetExistingBasketResult.Basket;


    /*
     * Checks whether all payment methods are still applicable. Recalculates all
     * existing non-gift certificate payment instruments totals according to
     * redeemed gift certificates or additional discounts granted through coupon
     * redemptions on this page.
     */
    var COBillingController = require('./COBilling');
    var ValidatePaymentResult = COBillingController.ValidatePayment({
        Basket : Basket
    });
    if (ValidatePaymentResult.error)
    {
        COBillingController.Start();
        return;
    }


    var CalculateResult = CartController.Calculate();

    var web = require('./dw/web');
    web.updatePageMetaData("SiteGenesis Checkout");

    response.renderTemplate('checkout/summary/summary', {
        Basket : Basket
    });
}


/**
 * This pipeline is called upon the "Place Order" action triggered by the
 * customer.
 */
function Submit()
{
    /*
     * Call the responsible pipeline which does the actual place order action
     * and any payment authorization. The called pipeline must exit with a named
     * end node "order_created" if the order was created successfully or any
     * other end node, if the order creation failed.
     */
    var COPlaceOrderController = require('./COPlaceOrder');
    var StartResult = COPlaceOrderController.Start();
    if (StartResult.error)
    {
        Start();
        return;
    }
    // TODO in all other cases, some template was already shown... This should
    // be cleaned up!
    if (StartResult.order_created)
    {
        var Order = StartResult.Order;


        ShowConfirmation({
            Order : Order
        });
    }
}


/**
 * This pipeline renders the order confirmation page after the successful order
 * creation. If a non registered customer has checked out, the confirmation page
 * provides a "Create Account" form. This pipeline is responsible to handle the
 * account creation.
 */
function ShowConfirmation(args)
{
    var CurrentForms = session.forms;
    var Order = args.Order;

    if (!customer.authenticated)
    {
        initGuestAccountCreation(Order);
    }

    var web = require('./dw/web');
    web.updatePageMetaData("SiteGenesis Checkout Confirmation");


    var form = require('./dw/form');
    form.clearFormElement(CurrentForms.profile.login.passwordconfirm);
    form.clearFormElement(CurrentForms.profile.login.password);

    response.renderTemplate('checkout/confirmation/confirmation', {
        Order : Order
    });
}


/**
 * Initializes the account creation form for guest checkouts, by populating the
 * first and last name with the used billing address.
 */
function initGuestAccountCreation(order)
{
    var profileForm = session.forms.profile;

    profileForm.customer.firstname.value = order.billingAddress.firstName;
    profileForm.customer.lastname.value = order.billingAddress.lastName;
    profileForm.customer.email.value = order.customerEmail;
}


/*
 * Module exports
 */

/*
 * Web exposed methods
 */
// TODO also called with POST from Billing form handler
exports.Start   = g.https(Start);
exports.Submit  = g.httpsPost(Submit);

/*
 * Local method
 */
exports.ShowConfirmation = ShowConfirmation;

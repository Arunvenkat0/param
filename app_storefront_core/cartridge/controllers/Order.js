var g = require('./dw/guard');

/**
 * Manages the order history of a registered user.
 */

/**
 * Renders a page with the order history of the current logged in customer.
 */
function History()
{
    var orderListForm = session.forms.orders.orderlist;


    var SearchSystemObjectResult = new dw.system.Pipelet('SearchSystemObject', {
        ObjectType : 'Order',
        SearchExpression : 'customerNo={1} AND status!={2}'
    }).execute({
        SortBy1 : "creationDate",
        SortBy1Direction : 2,
        Search1Value : customer.profile.customerNo,
        Search2Value : dw.order.Order.ORDER_STATUS_REPLACED
    });
    var OrdersUnpaged = SearchSystemObjectResult.SearchResult;
    var OrdersUnpagedCount = SearchSystemObjectResult.SearchResultCount;


    var PagingResult = new dw.system.Pipelet('Paging', {
        DefaultPageSize : 5
    }).execute({
        Objects : OrdersUnpaged,
        PageSize : 5,
        ObjectsCount : OrdersUnpagedCount,
        Start : request.httpParameterMap.start.intValue
    });
    var OrderPagingModel = PagingResult.PagingModel;


    var form = require('./dw/form');
    form.clearFormElement(orderListForm);
    form.updateFormWithObject(orderListForm, OrderPagingModel.pageElements);


    var web = require('./dw/web');
    web.updatePageMetaDataForContent(dw.content.ContentMgr.getContent("myaccount-orderhistory"));


    response.renderTemplate('account/orderhistory/orders', {
        OrderPagingModel : OrderPagingModel
    });
}


// TODO this should be a simple GET request to avoid refresh / back button
// problems
function Orders()
{
    var TriggeredAction = request.triggeredAction;
    if (TriggeredAction != null)
    {
        if (TriggeredAction.formId == 'show')
        {
            var Order = TriggeredAction.object;

            response.renderTemplate('account/orderhistory/orderdetails', {
                Order : Order
            });
            return;
        }
    }

    response.redirect(dw.web.URLUtils.https('Order-History'));
}


/**
 * Renders a page with details of a single order. The pipeline is intended to
 * render the order details by the UUID of the order, therefore can also be used
 * for unregistered customers to track the status of their orders.
 */
function Track()
{
    var CurrentHttpParameterMap = request.httpParameterMap;

    if (empty(CurrentHttpParameterMap.orderID.stringValue))
    {
        response.renderTemplate('account/orderhistory/orderdetails');
        return;
    }


    var SearchSystemObjectResult = new dw.system.Pipelet('SearchSystemObject', {
        ObjectType : 'Order',
        SearchExpression : 'UUID={1} AND status!={2}'
    }).execute({
        Search1Value : CurrentHttpParameterMap.orderID.stringValue,
        Search2Value : dw.order.Order.ORDER_STATUS_REPLACED
    });
    var Orders = SearchSystemObjectResult.SearchResult;


    if (empty(Orders))
    {
        response.renderTemplate('account/orderhistory/orderdetails');
        return;
    }


    var Order = Orders.next();

    response.renderTemplate('account/orderhistory/orderdetails', {
        Order : Order
    });
}


/**
 * This pipeline is intended to find an order by its order number and the postal
 * code of the billing address. The pipeline is used by the login page and end
 * on a named end node "ok" if the order was found or ends with a named end node
 * "error" to report back to the calling pipeline.
 */
function Find()
{
    var orderTrackForm = session.forms.ordertrack;

    if (empty(orderTrackForm.orderNumber.value) || empty(orderTrackForm.postalCode.value)
            || empty(orderTrackForm.orderEmail.value))
    {
        return {
            error : true
        };
    }

    var SearchSystemObjectResult = new dw.system.Pipelet('SearchSystemObject', {
        ObjectType : 'Order',
        SearchExpression : 'orderNo={1} AND status!={2}'
    }).execute({
        Search1Value : orderTrackForm.orderNumber.value,
        Search2Value : dw.order.Order.ORDER_STATUS_REPLACED
    });
    var Orders = SearchSystemObjectResult.SearchResult;

    if (empty(Orders))
    {
        return {
            error : true
        };
    }

    var FoundOrder = Orders.next();

    if (!FoundOrder.billingAddress.postalCode.toUpperCase().equals(orderTrackForm.postalCode.value.toUpperCase()))
    {
        return {
            error : true
        };
    }

    var Order = FoundOrder;

    if (Order.customerEmail != orderTrackForm.orderEmail.value)
    {
        return {
            error : true
        };
    }

    return {
        ok : true,
        Order : Order
    };
}

/*
 * Private methods
 */

/**
 * Decorator which ensures that the customer is authenticated.
 */
function loggedIn(action)
{
    return function()
    {
        if (!customer.authenticated)
        {
            var accountController = require('./Account');
            accountController.requireLogin({
                TargetAction : 'Order-History'
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
exports.History = g.httpsGet(loggedIn(History));
exports.Orders = g.httpsPost(loggedIn(Orders));
exports.Track = g.httpsGet(Orders);

/*
 * Local methods
 */
exports.Find = Find;

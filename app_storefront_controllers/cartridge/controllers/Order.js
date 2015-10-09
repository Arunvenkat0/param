'use strict';

/**
 * This controller manages the order history of a registered user.
 *
 * @module controllers/Order
 */

/* API Includes */
var ContentMgr = require('dw/content/ContentMgr');
var OrderMgr = require('dw/order/OrderMgr');
var PagingModel = require('dw/web/PagingModel');

/* Script Modules */
var app = require('~/cartridge/scripts/app');
var guard = require('~/cartridge/scripts/guard');


/**
 * Renders a page with the order history of the current logged in customer.
 */
function history() {
    var orders = OrderMgr.searchOrders('customerNo={0} AND status!={1}', 'creationDate desc',
                                        customer.profile.customerNo, dw.order.Order.ORDER_STATUS_REPLACED);

    var parameterMap = request.httpParameterMap;
    var pageSize = parameterMap.sz.intValue || 5;
    var start = parameterMap.start.intValue || 0;
    var orderPagingModel = new PagingModel(orders, orders.count);
    orderPagingModel.setPageSize(pageSize);
    orderPagingModel.setStart(start);

    var orderListForm = app.getForm('orders.orderlist');
    orderListForm.invalidate();
    orderListForm.clear();
    orderListForm.copyFrom(orderPagingModel.pageElements);

    var pageMeta = require('~/cartridge/scripts/meta');
    pageMeta.update(ContentMgr.getContent('myaccount-orderhistory'));

    app.getView({
        OrderPagingModel: orderPagingModel,
        ContinueURL: dw.web.URLUtils.https('Order-Orders')
    }).render('account/orderhistory/orders');
}


/**
 * Renders the order detail page.
 */
function orders() {
    var orderListForm = app.getForm('orders.orderlist');
    orderListForm.handleAction({
        show: function (formGroup, action) {
            var Order = action.object;

            app.getView({Order: Order}).render('account/orderhistory/orderdetails');
        },
        error: function () {
            response.redirect(dw.web.URLUtils.https('Order-History'));
        }
    });

}


/**
 * Renders a page with details of a single order. This function
 * renders the order details by the UUID of the order, therefore it can also be used
 * for unregistered customers to track the status of their orders.
 */
function track () {
    var parameterMap = request.httpParameterMap;

    if (empty(parameterMap.orderID.stringValue)) {
        app.getView().render('account/orderhistory/orderdetails');
        return response;
    }

    var uuid = parameterMap.orderID.stringValue;
    var orders = OrderMgr.searchOrders('UUID={0} AND status!={1}', 'creationDate desc', uuid, dw.order.Order.ORDER_STATUS_REPLACED);

    if (empty(orders)) {
        app.getView().render('account/orderhistory/orderdetails');
    }

    var Order = orders.next();
    app.getView({Order: Order}).render('account/orderhistory/orderdetails');
}


/*
 * Module exports
 */

/*
 * Web exposed methods
 */
exports.History = guard.ensure(['get', 'https', 'loggedIn'], history);
exports.Orders = guard.ensure(['post', 'https', 'loggedIn'], orders);
exports.Track = guard.ensure(['get', 'https'], track);

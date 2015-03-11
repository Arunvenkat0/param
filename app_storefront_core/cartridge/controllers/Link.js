'use strict';

/*
 * This controller forwards calls to other controller. It is here to support legacy code where
 * content assets could link to that pipeline only. For all new code link to the respective
 * pipeline directly (Search-Show, Product-Show, etc.)
 *
 * @module controller/Link
 */

/* Script Modules */
var guard = require('~/cartridge/scripts/guard');
var view = require('~/cartridge/scripts/view');

function Category() {

    require('./Search').Show();

}

function CategoryProduct() {

    require('./Product').Show();

}

function Product() {

    require('./Product').Show();

}

function Page() {

    require('./Page').Show();

}


/*
 * Module exports
 */

/*
 * Web exposed methods
 */
/** @see module:controller/Link~category */
exports.Category = guard.filter(['get'], category);
/** @see module:controller/Link~categoryProduct */
exports.CategoryProduct = guard.filter(['get'], categoryProduct);
/** @see module:controller/Link~product */
exports.Product = guard.filter(['get'], product);
/** @see module:controller/Link~page */
exports.Page = guard.filter(['get'], page);

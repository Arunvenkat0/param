'use strict';
/**
 * Model for product list functionality, such as wishlists.
 * @module models/ProductListModel
 */

var AbstractModel = require('./AbstractModel');
var ProductListMgr = require('dw/customer/ProductListMgr');
var Transaction = require('dw/system/Transaction');

/**
 * ProductList helper function providing enhanced functionality for wishlists and other product lists.
 * @class module:models/ProductListModel~ProductListModel
 */
var ProductListModel = AbstractModel.extend(
    /** @lends module:models/ProductListModel~ProductListModel.prototype */
    {
        /**
         * Deletes this Product List
         */
        remove: function () {
            var productList = this.object;
            Transaction.wrap(function () {
                if (productList.getOwner() === customer) {
                    ProductListMgr.removeProductList(productList);
                    delete this;
                } else {
                    throw 'Error: Only the owner of a Gift Registry can delete it.';
                }
            });
        },

        /**
         * Removes the given item from the product list.
         *
         * @transactional
         * @alias module:models/ProductListModel~ProductListModel/remove
         * @param  {dw.customer.ProductListItem} item the item to remove
         */
        removeItem: function (item) {
            var list = this.object;
            Transaction.wrap(function () {
                list.removeItem(item);
            });
        },

        /**
         * Adds a product to the wishlist.
         *
         * @transactional
         * @alias module:models/ProductListModel~ProductListModel/addProduct
         * @param {dw.catalog.Product} product - The product to add
         * @param {Number} quantity - The quantity to add
         * @param {dw.catalog.ProductOptionModel} optionModel The option model for the given product
         */
        addProduct: function (product, quantity, optionModel) {
            var list = this.object;
            Transaction.wrap(function () {
                var item = list.createProductItem(product);
                if (quantity && !isNaN(quantity)) {
                    item.setQuantityValue(quantity);
                }
                if (optionModel) {
                    item.setProductOptionModel(optionModel);
                }
                // Inherit the public flag from the wishlist.
                item.setPublic(true);

                return item;
            });
            return null;
        },

        /**
         * Updates an item in the Gift Registry
         *
         * @param {dw.web.FormList} formListItems
         */
        updateItem: function (formListItems) {
            Transaction.wrap(function () {
                var productListItemForm;

                for (var i = 0; i < formListItems.getChildCount(); i++) {
                    productListItemForm = formListItems[i];
                    productListItemForm.copyTo(productListItemForm.object);
                }
            });
        },

        /**
         * Sets the list to public or private.
         *
         * @transactional
         * @alias module:models/ProductListModel~ProductListModel/setPublic
         * @param {Boolean} isPublic is the value the public flag is set to.
         */
        setPublic: function (isPublic) {
            var productList = this.object;
            Transaction.wrap(function () {
                productList.setPublic(isPublic);
            });
        }
    });

/**
 * Gets the wishlist for the current customer or creates a new wishlist
 * on the fly unless an instance of a product list is passed to it.
 *
 * @transactional
 * @alias module:models/ProductListModel~ProductListModel/
 * returns {module:models/ProductListModel~ProductListModel} New ProductListModel instance.
 */
ProductListModel.get = function (parameter) {
    var obj = null;
    if (typeof parameter === 'undefined') {
        obj = ProductListMgr.getProductLists(customer, dw.customer.ProductList.TYPE_WISH_LIST);
        if (obj.empty) {
            Transaction.wrap(function () {
                obj = ProductListMgr.createProductList(customer, dw.customer.ProductList.TYPE_WISH_LIST);
            });
        } else {
            obj = obj[0];
        }
    } else if (typeof parameter === 'string') {
        obj = ProductListMgr.getProductList(parameter);
    } else if (typeof parameter === 'object') {
        obj = parameter;
    }
    return new ProductListModel(obj);
};

/**
 * Searches for a Product List
 *
 * @param {dw.web.FormGroup} simpleForm - ProductList simple form
 * @param {Number} listType - dw.customer.ProductList.TYPE_* constant
 * @returns {dw.util.Collection.<dw.customer.ProductList>}
 */
ProductListModel.search = function (searchForm, listType) {
    var registrantFirstName = searchForm.registrantFirstName;
    var registrantLastName = searchForm.registrantLastName;
    var eventType = searchForm.eventType.value;

    var CustomerMgr = require('dw/customer/CustomerMgr');
    var listOwner = CustomerMgr.queryProfile('firstName = {0} AND lastName = {1}', registrantFirstName.value, registrantLastName.value).getCustomer();

    if (eventType) {
        return ProductListMgr.getProductLists(listOwner, listType, eventType);
    } else {
        return ProductListMgr.getProductLists(listOwner, listType);
    }
};

/** The ProductList class */
module.exports = ProductListModel;

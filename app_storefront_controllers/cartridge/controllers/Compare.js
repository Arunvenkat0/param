'use strict';

/**
 * This controller provides functions for creating, modifying and showing a product comparison.
 * @module controllers/Compare
 */

/* API Includes */
var HashMap = require('dw/util/HashMap');

/* Script Modules */
var app = require('~/cartridge/scripts/app');
var guard = require('~/cartridge/scripts/guard');

var Product = app.getModel('Product');
var Category = app.getModel('Category');
var Compare = app.getModel('Compare');

/**
 * Gets a compare form and gets or creates a comparison object associated with the session.
 */
function show() {
    var compareForm = app.getForm('compare');

    // Get the product comparison object from the session or create a new one.
    var comparison = Compare.get();
    comparison.setCategory(request.httpParameterMap.category.value);

    // Store selected compare list properties in a map.
    var map = new HashMap();
    map.put('categories', comparison.getCategories());
    map.put('products', comparison.getProducts());
    map.put('attributegroups', comparison.getAttributeGroups());
    map.put('category', comparison.getCategory());

    compareForm.copyFrom(map);
    compareForm.object.categories.setOptions(map.categories);

    app.getView({CompareList : map}).render('product/compare/compareshow');
}

/**
 * Adds a product to a comparison.
 */
function addProduct() {
	let r = require('~/cartridge/scripts/util/Response');

    var product = Product.get(request.httpParameterMap.pid.value);
    if (!product) {
        r.renderJSON({
            success : false
        });
        return;
    }
    
    var category = Category.get(request.httpParameterMap.category.value);
    if (!category) {
        r.renderJSON({
            success : false
        });
        return;
    }
    
    // Get the product comparison object from the session or create a new one.
    var comparison = Compare.get();
    comparison.add(product.object, category.object);
    comparison.setCategory(category.getID());

    r.renderJSON({
        success : true
    });
}

/**
 * Removes a product from a comparison.
 */
 function removeProduct() {
	let r = require('~/cartridge/scripts/util/Response');

    var product = Product.get(request.httpParameterMap.pid.value);
    if (!product) {
        r.renderJSON({
            success : false
        });
        return;
    }
    
    var category = Category.get(request.httpParameterMap.category.value);
    if (!category) {
        r.renderJSON({
            success : false
        });
        return;
    }
    
    // Get the product comparison object from the session or create a new one.
    var comparison = Compare.get();
    comparison.remove(product.object, category.object);
    comparison.setCategory(category.getID());

    r.renderJSON({
        success : true
    });
}

/**
 * Renders the product comparison widget.
 */
function controls() {

    var category = Category.get(request.httpParameterMap.category.value);
    if (!category) {
        app.getView().render('search/components/productcomparewidget');
        return;
    }
    
    // Get the product comparison object from the session or create a new one.
    var comparison = Compare.get();
    app.getView({CompareList : comparison, Category : category.object}).render('search/components/productcomparewidget');
}

/*
 * Web exposed methods
 */
/** @see module:controllers/Compare~Show */
exports.Show = guard.all(show);
/** @see module:controllers/Compare~AddProduct */
exports.AddProduct = guard.ensure(['get'], addProduct);
/** @see module:controllers/Compare~RemoveProduct */
exports.RemoveProduct = guard.ensure(['get'], removeProduct);
/** @see module:controllers/Compare~Controls */
exports.Controls = guard.ensure(['get'], controls);

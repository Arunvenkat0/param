'use strict';
/**
 * Renders the home page.
 *
 * @module Home
 */

var guard = require('./dw/guard');

/**
 * Renders the home page.
 */
function show() {
    var rootFolder = require('dw/content/ContentMgr').getSiteLibrary().root;
    require('~/cartridge/scripts/meta').update(rootFolder);

    response.renderTemplate('content/home/homepage');
    return response;
}

/**
 * Remote include for the header
 * This is designed as a remote include to achieve optimal caching results for the header
 */
function includeHeader() {
    response.renderTemplate('components/header/header');
    return response;
}


/**
 * Renders the category navigation and the menu to use as a remote include. It's
 * cached.
 *
 * @deprecated Converted into a template include
 */
function includeHeaderMenu() {
    response.renderTemplate('components/header/headermenu');
    return response;
}


/**
 * Renders customer information.
 *
 * This is designed as a remote include as it represents dynamic session information and must not be
 * cached.
 */
function includeHeaderCustomerInfo() {
    response.renderTemplate('components/header/headercustomerinfo');
    return response;
}


function errorNotFound() {
	response.setStatus(404);
	response.renderTemplate('error/notfound');
    return response;
}

// @TODO As we want to have a responsive layout, do we really need the below?
function mobileSite() {
    session.custom.device = 'mobile';
    response.renderTemplate('components/changelayout');
    return response;
}

// @TODO remove - not responsive - maybe replace with a css class forcing the layout
function fullSite() {
    session.custom.device = 'fullsite';
    response.renderTemplate('components/changelayout');
    return response;
}

// @TODO remove - not responsive
function setLayout() {
    response.renderTemplate('components/setlayout');
    return response;
}


// @TODO remove - not responsive
function deviceLayouts() {
	response.renderTemplate('util/devicelayouts');
	return response;
}

/*
 * Export the publicly available controller methods
 */
exports.Show                        = guard.filter(['get'],show);
exports.IncludeHeader               = guard.filter(['get'],includeHeader);
//exports.IncludeHeaderMenu           = guard.filter(['get'],includeHeaderMenu);
exports.IncludeHeaderCustomerInfo   = guard.filter(['get'],includeHeaderCustomerInfo);
exports.ErrorNotFound               = guard.filter(['get'],errorNotFound);
exports.MobileSite                  = guard.filter(['get'],mobileSite);
exports.FullSite                    = guard.filter(['get'],fullSite);
exports.SetLayout                   = guard.filter(['get'],setLayout);
exports.DeviceLayouts               = guard.filter(['get'],deviceLayouts);

'use strict';

/**
 * Renders the home page.
 *
 * @module controllers/Home
 */

var app = require('~/cartridge/scripts/app');
var guard = require('~/cartridge/scripts/guard');

/**
 * Renders the home page.
 */
function show() {
    var rootFolder = require('dw/content/ContentMgr').getSiteLibrary().root;
    require('~/cartridge/scripts/meta').update(rootFolder);

    app.getView().render('content/home/homepage');
}

/**
 * Remote include for the header
 * This is designed as a remote include to achieve optimal caching results for the header
 */
function includeHeader() {
    app.getView().render('components/header/header');
}

/**
 * Renders the category navigation and the menu to use as a remote include. It's
 * cached.
 *
 * @deprecated Converted into a template include
 */
function includeHeaderMenu() {
    app.getView().render('components/header/headermenu');
}

/**
 * Renders customer information.
 *
 * This is designed as a remote include as it represents dynamic session information and must not be
 * cached.
 */
function includeHeaderCustomerInfo() {
    app.getView().render('components/header/headercustomerinfo');
}

/**
 * TODO
 */
function errorNotFound() {
    // @FIXME Correct would be to set a 404 status code but that breaks the page as it utilizes
    // remote includes which the WA won't resolve
    response.setStatus(410);
    app.getView().render('error/notfound');
}

/**
 * TODO As we want to have a responsive layout, do we really need the below?
 */
function mobileSite() {
    session.custom.device = 'mobile';
    app.getView().render('components/changelayout');
}

/**
 * TODO remove - not responsive - maybe replace with a CSS class forcing the layout.
 */
function fullSite() {
    session.custom.device = 'fullsite';
    app.getView().render('components/changelayout');
}

/**
 * TODO remove - not responsive
 */
function setLayout() {
    app.getView().render('components/setlayout');
}

/**
 * TODO remove - not responsive
 */
function deviceLayouts() {
    app.getView().render('util/devicelayouts');
}

/*
 * Export the publicly available controller methods
 */
/** @see module:controllers/Home~show */
exports.Show = guard.ensure(['get'], show);
/** @see module:controllers/Home~includeHeader */
exports.IncludeHeader = guard.ensure(['include'], includeHeader);
/** @see module:controllers/Home~includeHeaderMenu */
exports.IncludeHeaderMenu = guard.ensure(['include'],includeHeaderMenu);
/** @see module:controllers/Home~includeHeaderCustomerInfo */
exports.IncludeHeaderCustomerInfo = guard.ensure(['include'], includeHeaderCustomerInfo);
/** @see module:controllers/Home~errorNotFound */
exports.ErrorNotFound = guard.ensure(['get'], errorNotFound);
/** @see module:controllers/Home~mobileSite */
exports.MobileSite = guard.ensure(['get'], mobileSite);
/** @see module:controllers/Home~fullSite */
exports.FullSite = guard.ensure(['get'], fullSite);
/** @see module:controllers/Home~setLayout */
exports.SetLayout = guard.ensure(['get'], setLayout);
/** @see module:controllers/Home~deviceLayouts */
exports.DeviceLayouts = guard.ensure(['get'], deviceLayouts);

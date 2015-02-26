'use strict';
/**
 * Renders the home page.
 *
 * @module Home
 */

var g = require('./dw/guard');

/**
 * Renders the whole menu to use as a remote include. It's cached.
 */
function show()
{
    var rootFolder = require('dw/content/ContentMgr').getSiteLibrary().root;
    require('~/cartridge/scripts/meta').update(rootFolder);

    response.renderTemplate('content/home/homepage');
}

/**
 * Remote include for the header
 * This is designed as a remote include to achieve optimal caching results for the header
 */
function includeHeader()
{
    response.renderTemplate('components/header/header');
}


/**
 * Renders the category navigation and the menu to use as a remote include. It's
 * cached.
 *
 * @deprecated Converted into a template include
 */
function includeHeaderMenu()
{
    response.renderTemplate('components/header/headermenu');
}


/**
 * Renders customer information.
 *
 * This is designed as a remote include as it represents dynamic session information and must not be
 * cached.
 */
function includeHeaderCustomerInfo()
{
    response.renderTemplate('components/header/headercustomerinfo');
}


function errorNotFound()
{
    response.renderTemplate('error/notfound');
}

// @TODO As we want to have a responsive layout, do we really need the below?
function mobileSite()
{
    session.custom.device = 'mobile';

    response.renderTemplate('components/changelayout');
}


function fullSite()
{
    session.custom.device = 'fullsite';

    response.renderTemplate('components/changelayout');
}


function setLayout()
{
    response.renderTemplate('components/setlayout');
}


function deviceLayouts()
{
    response.renderTemplate('util/devicelayouts');
}

/*
 * Export the publicly available controller methods
 */
exports.Show                        = g.get(show);
exports.IncludeHeader               = g.get(includeHeader);
//exports.IncludeHeaderMenu           = g.get(includeHeaderMenu);
exports.IncludeHeaderCustomerInfo   = g.get(includeHeaderCustomerInfo);
exports.ErrorNotFound               = g.get(errorNotFound);
exports.MobileSite                  = g.get(mobileSite);
exports.FullSite                    = g.get(fullSite);
exports.SetLayout                   = g.get(setLayout);
exports.DeviceLayouts               = g.get(deviceLayouts);

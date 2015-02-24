var g = require('./dw/guard');

/**
 * Renders the home page.
 */

/**
 * Renders the whole menu to use as a remote include. It's cached.
 */
function Show()
{
    var web = require('./dw/web');
    web.updatePageMetaDataForFolder(dw.content.ContentMgr.getSiteLibrary().root, dw.system.Site.getCurrent().name,
            "SiteGenesis, Reference Application", "SiteGenesis");

    response.renderTemplate('content/home/homepage');
}


function IncludeHeader()
{
    response.renderTemplate('components/header/header');
}


/**
 * Renders the category navigation and the menu to use as a remote include. It's
 * cached.
 */
function IncludeHeaderMenu()
{
    response.renderTemplate('components/header/headermenu');
}


/**
 * Renders customer information. This is session information and must not be
 * cached.
 */
function IncludeHeaderCustomerInfo()
{
    response.renderTemplate('components/header/headercustomerinfo');
}


function ErrorNotFound()
{
    response.renderTemplate('error/notfound');
}


function MobileSite()
{
    session.custom.device = 'mobile';

    response.renderTemplate('components/changelayout');
}


function FullSite()
{
    session.custom.device = 'fullsite';

    response.renderTemplate('components/changelayout');
}


function SetLayout()
{
    response.renderTemplate('components/setlayout');
}


function DeviceLayouts()
{
    response.renderTemplate('util/devicelayouts');
}


/*
 * Module exports
 */

/*
 * Web exposed methods
 */
exports.Show                        = g.get(Show);
exports.IncludeHeader               = g.get(IncludeHeader);
exports.IncludeHeaderMenu           = g.get(IncludeHeaderMenu);
exports.IncludeHeaderCustomerInfo   = g.get(IncludeHeaderCustomerInfo);
exports.ErrorNotFound               = g.get(ErrorNotFound);
exports.MobileSite                  = g.get(MobileSite);
exports.FullSite                    = g.get(FullSite);
exports.SetLayout                   = g.get(SetLayout);
exports.DeviceLayouts               = g.get(DeviceLayouts);

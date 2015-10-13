'use strict';

/** @module views/View */

var ISML = require('dw/template/ISML');

var Class = require('~/cartridge/scripts/util/Class').Class;
var object = require('~/cartridge/scripts/object');

var View = Class.extend(
/** @lends module:views/View~View.prototype */
{

    /**
     * Base class for all modules following the {@tutorial Views}.
     *
     * Just loops the parameters through to the template
     *
     * @constructs
     * @extends module:util/Class~Class
     * @param {Object} params The parameters to pass
     */
    init: function (params) {
        // copy all properties of params to the view
        if (params) {
            object.extend(this, params);
        }

        return this;
    },

    /**
     * Renders the current view with the given template
     *
     * @abstract
     * @return {Void}
     */
    render: function (templateName) {
        templateName = templateName || this.template;
        // provide reference to View itself
        this.View = this;
        // provide Meta
        this.Meta = require('~/cartridge/scripts/meta');
        // backward compatibility
        this.CurrentForms = session.forms;
        this.CurrentHttpParameterMap = request.httpParameterMap;
        this.CurrentCustomer = customer;
        this.CurrentSession = session;
        this.CurrentPageMetaData = request.pageMetaData;
        this.CurrentRequest = request;
        try {
            ISML.renderTemplate(templateName, this);
        } catch (e) {
            dw.system.Logger.error('Error while rendering template ' + templateName);
            throw e;
        }
        return this;
    }
});

/** @type {module:views/View~View.prototype} */
module.exports = View;

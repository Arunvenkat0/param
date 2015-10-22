'use strict';

/** @module views/LoginView */
var View = require('./View');

var LoginView = View.extend(
/** @lends module:views/LoginView~LoginView.prototype */
{
    // does not work, hence workaround via init()
    //ContinueURL : dw.web.URLUtils.https('Login-LoginForm'),
    template: 'account/login/accountlogin',

    /**
     * Generates the view consumed by the login templates
     *
     * @constructs
     * @extends module:views/View~View
     */
    init: function (params) {
        this._super(params);
        this.ContinueURL = dw.web.URLUtils.https('Login-LoginForm');
    }

});

module.exports = LoginView;
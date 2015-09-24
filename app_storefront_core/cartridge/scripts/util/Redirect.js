'use strict';

var URLUtils = require('dw/web/URLUtils');
/**
 * @input CurrentHttpParamMap : dw.web.HttpParameterMap
 * @input CurrentRequest : dw.system.Request
 * @output Location : String
 */
/* jshint unused:false */
function execute(args) {
	var location = args.CurrentHttpParameterMap.Location.stringValue;
	// match hostname, only if followed by / or ends
	var hostRegExp = new RegExp('^https?://' + args.CurrentRequest.getHttpHost() + '(?=/|$)');
	if (!location || !hostRegExp.test(location)) {
		location = URLUtils.httpHome().toString();
	}
	args.Location = location;
	return PIPELET_NEXT;
}

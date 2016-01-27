'use strict';

import path from 'path';
import properties from 'properties-parser';

function msg (key, bundleName, defaultValue) {
    let bundlePath, props, value;
    if (!key) {
        return;
    }
    if (bundleName) {
        bundlePath = path.resolve('./app_storefront_core/cartridge/templates/resources/' + bundleName + '.properties');
        props = properties.read(bundlePath);
        value = props[key];
    }
    if (!value) {
        if (defaultValue) {
            return defaultValue;
        } else {
            return key;
        }
    }
    return value;
}
function msgf () {
    // pass through to msg if there are no extra format arguments
    if (arguments.length < 4) {
        return msg.apply(null, arguments);
    }
    let args = Array.prototype.slice.call(arguments);
    let value = msg.apply(null, args.slice(0, 3));
    return value.replace(/{(\d)}/g, function (match, p) {
        let position = Number(p);
        if (args[position + 3]) {
            return args[position + 3];
        // if no arguments found, return the original placeholder
        } else {
            return match;
        }
    });
}

module.exports = {
    msg: msg,
    msgf: msgf
};

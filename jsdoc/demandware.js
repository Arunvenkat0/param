'use strict';
/**
 * Demandware plugin to document controller-based Demandware script code.
 */

var logger = require('jsdoc/util/logger');

exports.handlers = {
    beforeParse: function(e) {
        // make E4X parsable (code becomes unusable but for doc generation OK)
        e.source = e.source.replace(/::\[/g,'[').replace(/::/g,'');
        // remove for each loops
        e.source = e.source.replace(/for each ?\(/g,'for');
    },
    newDoclet : function(e) {
        var params = e.doclet.params;
        if(params){
            for(var i = 0; i < params.length; i++){
                var p = params[i];
                if(p.type && p.type.names){
                    var names = p.type.names;
                    for(var j = 0; j < names.length; j++){
                        var name = names[j];
                        if(name.indexOf('dw.') === 0){
                            //logger.warn(name);
                        }
                    }
                }
            }
        }
    }
};

exports.defineTags = function(dictionary) {
	dictionary.defineTag('transactional', { mustHaveValue : false, canHaveName : false, canHaveType : false,
	    onTagged: function(doclet, tag) {
		    doclet.transactional = true;
	    }
    });
};

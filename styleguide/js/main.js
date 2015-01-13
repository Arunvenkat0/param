'use strict';

var MainView = require('./views/main');
require('./handlebars');

var main = new MainView({
	el: document.querySelector('#main')
}).render();

Prism.highlightAll();

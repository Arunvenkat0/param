'use strict';

var View = require('ampersand-view');
var template = require('../../templates/main.hbs');
var NavView = require('./nav');
var ContentView = require('./content');

var MainView = View.extend({
	template: template,
	render: function () {
		this.renderWithTemplate();
		this.renderSubview(new NavView());
		this.renderSubview(new ContentView());
		return this;
	}
});

module.exports = MainView;

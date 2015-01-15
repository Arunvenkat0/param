'use strict';

var View = require('ampersand-view');
var template = require('../../templates/main.hbs');
var NavView = require('./nav');
var FoundationView = require('./foundation');
var ElementsView = require('./elements');

var MainView = View.extend({
	template: template,
	render: function () {
		this.renderWithTemplate();
		this.renderSubview(new NavView());
		this.renderSubview(new FoundationView());
		this.renderSubview(new ElementsView());
		return this;
	}
});

module.exports = MainView;

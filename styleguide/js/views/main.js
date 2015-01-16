'use strict';

var View = require('ampersand-view');
var template = require('../../templates/main.hbs');

var FoundationView = require('./foundation');
var ElementsView = require('./elements');

var MainView = View.extend({
	template: template,
	render: function () {
		this.renderWithTemplate();
		this.renderSubview(new FoundationView());
		this.renderSubview(new ElementsView());
		return this;
	}
});

module.exports = MainView;

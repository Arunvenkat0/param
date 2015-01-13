'use strict';

var View = require('ampersand-view');
var Collection = require('ampersand-collection');
var template = require('../../templates/content.hbs');
var ColorsView = require('./colors');
var colors = require('../../colors.json');

var ContentView = View.extend({
	template: template,
	render: function () {
		this.renderWithTemplate();
		this.renderSubview(new ColorsView({
			collection: new Collection(colors)
		}));
		return this;
	}
});

module.exports = ContentView;

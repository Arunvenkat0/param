'use strict';

var View = require('ampersand-view');
var Model = require('ampersand-model');
var template = require('../../templates/content.hbs');
var ColorsView = require('./colors');
var TypographyView = require('./typography');
var ButtonsView = require('./buttons');

var TypographyModel = Model.extend({
	props: {
		fonts: 'array',
		headings: {
			type: 'array',
			default: function () {return ['h1', 'h2', 'h3', 'h4', 'h5'];}
		}
	}
});

var ColorsModel = Model.extend({
	props: {
		colors: 'array'
	}
});

var ContentView = View.extend({
	template: template,
	render: function () {
		this.renderWithTemplate();
		this.renderSubview(new ColorsView({
			model: new ColorsModel({
				colors: require('../../colors.json')
			})
		}));
		this.renderSubview(new TypographyView({
			model: new TypographyModel({
				fonts: require('../../fonts.json')
			})
		}));
		this.renderSubview(new ButtonsView());
		return this;
	}
});

module.exports = ContentView;

'use strict';

var View = require('ampersand-view');
var Model = require('ampersand-model');
var template = require('../../templates/content.hbs');

var ButtonsView = require('./buttons');
var ColorsView = require('./colors');
var TypographyView = require('./typography');

var ButtonsModel = require('../models/buttons');
var ColorsModel = require('../models/colors');
var TypographyModel = require('../models/typography');

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
		this.renderSubview(new ButtonsView({
			model: new ButtonsModel({
				button: require('../../templates/elements/button.hbs')(),
				fancyButton: require('../../templates/elements/buttonFancylarge.hbs')()
			})
		}));
		return this;
	}
});

module.exports = ContentView;

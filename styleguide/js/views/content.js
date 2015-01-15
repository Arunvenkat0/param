'use strict';

var View = require('ampersand-view');
var Model = require('ampersand-model');
var template = require('../../templates/content.hbs');

var ColorsView = require('./colors');
var TypographyView = require('./typography');
var IconsView = require('./icons');
var DemoView = require('./demo');

var ColorsModel = require('../models/colors');
var TypographyModel = require('../models/typography');
var IconsModel = require('../models/icons');
var DemoModel = require('../models/demo');

var ContentView = View.extend({
	template: template,
	render: function () {
		this.renderWithTemplate();
		this.renderSubview(new ColorsView({
			model: new ColorsModel({
				colors: require('../../data/colors.json')
			})
		}));
		this.renderSubview(new TypographyView({
			model: new TypographyModel({
				fonts: require('../../data/fonts.json')
			})
		}));
		this.renderSubview(new IconsView({
			model: new IconsModel({
				icons: require('../../data/icons.json')
			})
		}));
		this.renderSubview(new DemoView({
			model: new DemoModel({
				title: 'Buttons',
				demos: [
					require('../../templates/elements/button.hbs')(),
					require('../../templates/elements/buttonFancylarge.hbs')()
				]
			})
		}));
		this.renderSubview(new DemoView({
			model: new DemoModel({
				title: 'Breadcrumb',
				demos: [
					require('../../templates/elements/breadcrumb.hbs')(require('../../data/breadcrumb.json'))
				]
			})
		}));
		this.renderSubview(new DemoView({
			model: new DemoModel({
				title: 'Variations Swatches',
				demos: [
					require('../../templates/elements/variations.hbs')(require('../../data/variations.json'))
				]
			})
		}));
		return this;
	}
});

module.exports = ContentView;

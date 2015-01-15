'use strict';

var View = require('ampersand-view');
var template = require('../../templates/elements.hbs');

var DemoView = require('./demo');
var DemoModel = require('../models/demo');

module.exports = View.extend({
	template: template,
	render: function () {
		this.renderWithTemplate();
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
})

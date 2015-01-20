'use strict';

var View = require('ampersand-view');
var template = require('../../templates/elements.hbs');

var DemoView = require('./demo');
var DemoModel = require('../models/demo');

module.exports = View.extend({
	template: template,
	render: function () {
		this.renderWithTemplate();
		// buttons
		this.renderSubview(new DemoView({
			model: new DemoModel({
				title: 'Buttons',
				slug: 'buttons',
				column: 2,
				demos: [
					require('../../templates/elements/button.hbs')(),
					require('../../templates/elements/buttonFancylarge.hbs')()
				]
			})
		}));
		// breadcrumb
		this.renderSubview(new DemoView({
			model: new DemoModel({
				title: 'Breadcrumb',
				slug: 'breadcrumb',
				demos: [
					require('../../templates/elements/breadcrumb.hbs')(require('../../data/breadcrumb.json'))
				]
			})
		}));
		// variation swatches
		this.renderSubview(new DemoView({
			model: new DemoModel({
				title: 'Variations Swatches',
				slug: 'variations',
				column: 2,
				demos: [
					require('../../templates/elements/variations.hbs')(require('../../data/variations.json'))
				]
			})
		}));
		return this;
	}
})

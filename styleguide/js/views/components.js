'use strict';

var View = require('ampersand-view');
var template = require('../../templates/components.hbs');

var DemoView = require('./demo');
var DemoModel = require('../models/demo');

module.exports = View.extend({
	template: template,
	render: function () {
		this.renderWithTemplate();
		// header
		this.renderSubview(new DemoView({
			model: new DemoModel({
				title: 'Header',
				slug: 'header',
				demos: [
					require('../../templates/components/header.hbs')(require('../../data/header.json'))
				]
			})
		}));
		return this;
	}
});

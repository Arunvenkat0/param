'use strict';

var View = require('ampersand-view');
var template = require('../../templates/components.hbs');

var SectionView = require('./sectionWithDemos');
var SectionModel = require('../models/section');
var DemoModel = require('../models/demo');

module.exports = View.extend({
	template: template,
	render: function () {
		this.renderWithTemplate();
		// header
		this.renderSubview(new SectionView({
			model: new SectionModel({
				title: 'Header',
				slug: 'header',
				demos: [
					new DemoModel({
						code: require('../../templates/components/header.hbs')(require('../../data/header.json'))
					})
				]
			})
		}));
		return this;
	}
});

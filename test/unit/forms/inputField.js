'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru();

// Demandware server dependencies
var ContentMgr = require('../../mocks/dw/content/ContentMgr');
var StringUtils = require('../../mocks/dw/util/StringUtils');
var Resource = require('../../mocks/dw/web/Resource');
var URLUtils = require('../../mocks/dw/web/URLUtils');

var inputField = proxyquire('../../../app_storefront_core/cartridge/scripts/common/inputField.ds', {
	'dw/content/ContentMgr': ContentMgr,
	'dw/util/StringUtils': StringUtils,
	'dw/web/Resource': Resource,
	'dw/web/URLUtils': URLUtils
});

describe('Input Field', function () {
	it('text input - with minimum default options', function () {
		var field = inputField({
			formfield: {
				htmlName: 'testfield',
				label: 'Test',
				valid: true
			},
			type: 'text'
		});
		assert.deepEqual(field, {
			rowClass: '',
			label: '<label for="testfield"><span>Test</span></label>',
			input: '<input class="input-text " type="text"  id="testfield" name="testfield" value="" />',
			caption: '<div class="form-caption"></div>',
			help: ''
		});
	});

	it('checkbox', function () {
		var field = inputField({
			formfield: {
				htmlName: 'testfield',
				label: 'Test',
				valid: true
			},
			type: 'checkbox'
		});
		assert.deepEqual(field, {
			rowClass: '',
			label: '<label for="testfield"><span>Test</span></label>',
			input: '<input class="input-checkbox " type="checkbox"  id="testfield" name="testfield" value="" />',
			caption: '<div class="form-caption"></div>',
			help: ''
		});
	});

	it('hidden', function () {
		var field = inputField({
			formfield: {
				htmlName: 'testfield',
				label: 'Test',
				valid: true
			},
			type: 'hidden'
		});
		assert.deepEqual(field, {
			rowClass: '',
			label: '<label for="testfield"><span>Test</span></label>',
			input: '<input class=" " type="hidden"  id="testfield" name="testfield" value="" />',
			caption: '<div class="form-caption"></div>',
			help: ''
		});
	});

	it('textarea', function () {
		var field = inputField({
			formfield: {
				htmlName: 'testfield',
				label: 'Test',
				valid: true
			},
			type: 'textarea'
		});
		assert.deepEqual(field, {
			rowClass: '',
			label: '<label for="testfield"><span>Test</span></label>',
			input: '<textarea class="input-textarea " id="testfield" name="testfield" ></textarea>',
			caption: '<div class="form-caption"></div>',
			help: ''
		});
	});

	it('radio', function () {
		var field = inputField({
			formfield: {
				htmlName: 'testfield',
				label: 'Test',
				valid: true,
				options: {
					one: {
						value: 'one',
						label: 'One'
					},
					two: {
						value: 'two',
						label: 'Two'
					}
				}
			},
			type: 'radio'
		});
		assert.deepEqual(field, {
			rowClass: '',
			label: '<label for="testfield"><span>Test</span></label>',
			input: '<input class="input-radio " type="radio" id="testfield" name="testfield" value="one" />One\
<input class="input-radio " type="radio" id="testfield" name="testfield" value="two" />Two',
			caption: '<div class="form-caption"></div>',
			help: ''
		});
	});

	it('select', function () {
		var field = inputField({
			formfield: {
				htmlName: 'testfield',
				label: 'Test',
				valid: true,
				options: {
					one: {
						value: 'one',
						label: 'One'
					},
					two: {
						value: 'two',
						label: 'Two'
					}
				}
			},
			type: 'select'
		});
		assert.deepEqual(field, {
			rowClass: '',
			label: '<label for="testfield"><span>Test</span></label>',
			input: '<select class="input-select " id="testfield" name="testfield" >\
<option class="select-option" label="One" value="one" >One</option>\
<option class="select-option" label="Two" value="two" >Two</option>\
</select>',
			caption: '<div class="form-caption"></div>',
			help: ''
		});
	});
});

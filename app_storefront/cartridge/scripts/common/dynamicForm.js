'use strict';

var FormField = require('dw/web/FormField');
var FormGroup = require('dw/web/FormGroup');

/**
 * @description parse FormField element, create context and apply inputfield template to generate form field markup
 * @param {dw.web.FormField} field
 * @param {Object} fieldData extra data that contains context for the template
 * @return {String} HTML markup of the field
 */
function getFieldContext(field, fieldData) {
	var context = {};
	var type;
	switch (field.type) {
		case FormField.FIELD_TYPE_BOOLEAN:
			type = 'checkbox';
			break;
		case FormField.FIELD_TYPE_DATE:
			type = 'date';
			break;
		case FormField.FIELD_TYPE_INTEGER:
		case FormField.FIELD_TYPE_NUMBER:
			type = 'number';
			break;
		case FormField.FIELD_TYPE_STRING:
			type = 'text';
			break;
	}
	context.formfield = field;
	context.type = type;
	if (fieldData) {
		for (var prop in fieldData) {
			if (fieldData.hasOwnProperty(prop)) {
				context[prop] = fieldData[prop];
			}
		}
	}
	return context;
}

module.exports.getFields = function (formObject, formData) {
	var fields = [];
	for (var formElementName in formObject) {
		var formElement = formObject[formElementName];
		var fieldData;
		if (formData) {
			fieldData = formData[formElementName];
		}
		if (formElement instanceof FormField) {
			if (fieldData && fieldData.skip) {
				continue;
			}
			fields.push(getFieldContext(formElement, fieldData));
		} else if (formElement instanceof FormGroup) {
			if (fieldData && fieldData.isFormGroup && fieldData.childField) {
				var childFieldElement = formElement[fieldData.childField];
				fields.push(getFieldContext(childFieldElement, fieldData));
			}
		}
	}
	return fields;
};

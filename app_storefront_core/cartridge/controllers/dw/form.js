/**
 * This module provides convenience methods for the handling of forms.
 */

/**
 * Clears the value of the given form element.
 */
function clearFormElement(formElement)
{
    var ClearFormElementPipelet = new dw.system.Pipelet('ClearFormElement');
    ClearFormElementPipelet.execute({
        FormElement: formElement
    });
}


/**
 * Invalidates the given form element.
 */
function invalidateFormElement(formElement)
{
    var InvalidateFormElementPipelet = new dw.system.Pipelet('InvalidateFormElement');
    InvalidateFormElementPipelet.execute({
        FormElement: formElement
    });
}


/**
 * Updates the specified form with the corresponding property values from the given object.
 * 
 * @param form the form
 * @param object the object
 * @param clear optional, if true, the form is cleared first before updating it
 */
function updateFormWithObject(form, object, clear)
{
    clear = (typeof clear !== 'undefined') ? clear : false;
    
    
    var UpdateFormWithObjectPipelet = new dw.system.Pipelet('UpdateFormWithObject', {
        Clear: clear
    });
    UpdateFormWithObjectPipelet.execute({
        Form: form,
        Object: object
    });
}


/**
 * Updates the specified object with the corresponding property values contained in the given form.
 * 
 * @return true if successful, false in case of error
 */
function updateObjectWithForm(object, form)
{
    var UpdateObjectWithFormPipelet = new dw.system.Pipelet('UpdateObjectWithForm');
    var UpdateObjectWithFormResult = UpdateObjectWithFormPipelet.execute({
        Form: form,
        Object: object
    });
    
    if (UpdateObjectWithFormResult.result == PIPELET_ERROR)
    {
        return false;
    }
    return true;
}


/**
 * Clears the options of the form field and updates the form field from a map of name/value pairs contained in options.
 * The begin and end values specify which elements in options should be used.
 * 
 * @param begin the optional beginning, default is 0
 * @param end the optional end, default is max int
 */
function setFormOptions(formField, options, begin, end)
{
    begin = (typeof begin !== 'undefined') ? begin : 0;
    end = (typeof end !== 'undefined') ? end : Number.MAX_VALUE;
    
    var SetFormOptionsPipelet = new dw.system.Pipelet('SetFormOptions', {
        Begin: begin,
        End: end
    });
    SetFormOptionsPipelet.execute({
        FormField: formField,
        Options: options
    });
}


/**
 * Transfers the values contained in the form to the object that is bound to the form.
 */
function acceptForm(form)
{
    var AcceptFormPipelet = new dw.system.Pipelet('AcceptForm');
    AcceptFormPipelet.execute({
        Form: form
    });
}


/*
 * Module exports
 */
exports.acceptForm = acceptForm;
exports.clearFormElement = clearFormElement;
exports.invalidateFormElement = invalidateFormElement;
exports.setFormOptions = setFormOptions;
exports.updateFormWithObject = updateFormWithObject;
exports.updateObjectWithForm = updateObjectWithForm;

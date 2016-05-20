'use strict';

var ajax = require('./ajax'),
    minicart = require('./minicart'),
    util = require('./util'),
    page = require('./page');

var setAddToCartHandler = function (e) {
    e.preventDefault();
    var form = $(this).closest('form');

    var options = {
        url: util.ajaxUrl(form.attr('action')),
        method: 'POST',
        cache: false,
        data: form.serialize()
    };
    $.ajax(options).done(function (response) {
        if (response.success) {
            ajax.load({
                url: Urls.minicartGC,
                data: {lineItemId: response.result.lineItemId},
                callback: function (response) {
                    minicart.show(response);
                    form.find('.input-text, textarea').val('');
                }
            });
        } else {
            form.find('span.error').hide();
            if (response.error && response.error == 'CSRF Token Mismatch') {
                page.redirect(Urls.csrffailed);
            }
            Object.keys(response.errors.FormErrors).forEach(function (id) {
                var $errorEl = $('#' + id).addClass('error').removeClass('valid').next('.error');
                if (!$errorEl || $errorEl.length === 0) {
                    $errorEl = $('<span for="' + id + '" generated="true" class="error"></span>');
                    $('#' + id).after($errorEl);
                }
                $errorEl.text(response.errors.FormErrors[id].replace(/\\'/g, '\'')).show();
            )};
        }
    }).fail(function (xhr, textStatus) {
        // failed
        if (textStatus === 'parsererror') {
            window.alert(Resources.BAD_RESPONSE);
        } else {
            window.alert(Resources.SERVER_CONNECTION_ERROR);
        }
    });
};

exports.init = function () {
    $('#AddToBasketButton').on('click', setAddToCartHandler);
};

'use strict';

var ajax = require('./ajax'),
	minicart = require('./minicart'),
	util = require('./util');

function setAddToCartHandler(e) {
	e.preventDefault();
	var form = $(this).closest("form");

	var options = {
		url : util.ajaxUrl(form.attr('action')),
		method : 'POST',
		cache: false,
		contentType : 'application/json',
		data : form.serialize()
	};
	$.ajax(options).done(function (response) {
		if( response.success ) {
			ajax.load({
				url : app.urls.minicartGC,
				data :{lineItemId : response.result.lineItemId},
				callback : function(response){
					minicart.show(response);
					form.find('input,textarea').val('');
				}
			});
		} else {
			form.find('span.error').hide();
			for( id in response.errors.FormErrors ) {
				var error_el = $('#'+id).addClass('error').removeClass('valid').next('.error');
				if( !error_el || error_el.length===0 ) {
					error_el = $('<span for="'+id+'" generated="true" class="error" style=""></span>');
					$('#'+id).after(error_el);
				}
				error_el.text(response.errors.FormErrors[id].replace(/\\'/g,"'")).show();
			}
			console.log(JSON.stringify(response.errors));
		}
	}).fail(function (xhr, textStatus) {
		// failed
		if (textStatus === "parsererror") {
			window.alert(app.resources.BAD_RESPONSE);
		} else {
			window.alert(app.resources.SERVER_CONNECTION_ERROR);
		}
	});
}

exports.init = function(){
	$("#AddToBasketButton").on('click', setAddToCartHandler);
}

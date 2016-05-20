'use strict';

function getAndInsertCSRFToken(formid){
    $(document).ready(function(){
        $.ajax({
            url: '${URLUtils.url("CSRF-GetToken")}',
            context: document.body,
            dataType: 'json',
            success: function(data, status){
                insertCSRFForm(data, 'csrf_test_js');
            },
            error: function(xhr, status, error){
                alert('error' + error);
            }
        });
    });
}
function insertCSRFForm(csrfjson, formid){
    var csrfName = csrfjson.csrf_token_name;
    var csrfValue = csrfjson.csrf_token_value;
    var form = document.getElementById(formid);
    var inputfield = document.createElement('input');
    inputfield.type = 'text';
    inputfield.name = csrfName;
    inputfield.value = csrfValue;
    var children = form.children;
    form.insertBefore(inputfield, children[children.length-1]);
}


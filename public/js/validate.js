
// jQuery validator for bootstrap 4
jQuery.validator.setDefaults({
    onfocusout: function (e) {
        this.element(e);
    },
    onkeyup: false,

    highlight: function (element) {
        jQuery(element).closest('.form-control').addClass('is-invalid');
    },
    unhighlight: function (element) {
        jQuery(element).closest('.form-control').removeClass('is-invalid');
        jQuery(element).closest('.form-control').addClass('is-valid');
    },

    errorElement: 'div',
    errorClass: 'invalid-feedback',
    errorPlacement: function (error, element) {
        if (element.parent('.input-group-prepend').length) {
            $(element).siblings(".invalid-feedback").append(error);
            //error.insertAfter(element.parent());
        } else {
            error.insertAfter(element);
        }
    }
});

// server validator
function insertAfter(referenceNode, newNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

function validate(error) {
    if (error) {

        for (var i = 0; i<error.errors.length; i++) {
            var el_id = error.errors[i].path;

            var el = document.getElementById(el_id);
            el.classList.add("is-invalid");
                    
            var div = document.createElement("div");
            div.classList.add("invalid-feedback");
            div.innerHTML = error.errors[i].message;

            insertAfter(el, div);

            el.addEventListener('change', function (event) {
                event.target.classList.remove("is-invalid");
                event.target.nextElementSibling.remove();
            });
        }

    }
}

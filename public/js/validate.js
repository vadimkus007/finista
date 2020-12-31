function insertAfter(referenceNode, newNode) {
          referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
        }

        $(document).ready(function(e) {
            var err = e;
            for (var i = 0; i<err.errors.length; i++) {
                var el_id = err.errors[i].path;

                var el = document.getElementById(el_id);
                el.classList.add("is-invalid");
                
                var div = document.createElement("div");
                div.classList.add("invalid-feedback");
                div.innerHTML = err.errors[i].message;

                insertAfter(el, div);

                el.addEventListener('change', function (event) {
                    event.target.classList.remove("is-invalid");
                    event.target.nextElementSibling.remove();
                });
            }
        })
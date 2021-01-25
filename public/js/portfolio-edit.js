
$(document).ready(function() {

    // jQuery validator
    $('.validate').validate({
        rules: {
            title: {
                required: true
            },
            comission: {
                number: true
            }
        },
        messages: {
            title: {
                required: 'Пожалуйста введите название портфеля'
            },
            comission: {
                number: 'Комиссия должна иметь числовое значение'
            }
        }
    });
    // validation from server response
    validate(err);
});
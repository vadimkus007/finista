
// Edit trade scripts
function updateForm() {

            if (typeof data.trade !== 'undefined') {
                var secid = JSON.stringify(data.trade.secid); 
                var index = data.securities.findIndex((element, index, array) => {
                    if (element.secid == data.trade.secid) {
                        return true;
                    } else {
                        return false;
                    }
                });
                console.log(index);
                var group = data.securities[index].group;

                $('#type option:contains('+group+')').prop('selected', true);
            }

            var type = $("#type :selected").val();

                switch(type) {
                    // shares
                    case '1':
                        
                        $("#secid").show();
                        $("secid").empty();
                        buildSelect('Акция ETF/ПИФ');

                        $('#operationId').empty();
                        $('#operationId').append('<option value="1">Покупка</option>');
                        $('#operationId').append('<option value="2">Продажа</option>');
                        $('#operationId').append('<option value="3">Дивиденд</option>');
                        
                        $("#labelPrice").text("Цена:*");

                        $("#amount").show();
                        $("#labelAmount").show();

                        $('#value').val('100');
                        $('#value').hide();
                        $('#valueLabel').hide();

                        $('#accint').val('0');
                        $('#accint').hide();
                        $('#accintLabel').hide();

                        break;
                    // cashe
                    case '3':
                        $("#secid").empty();
                        $("#secid").append('<option value="RUB" selected="selected">Деньги</option>');
                        // $("#secid").hide();

                        $('#operationId').empty();
                        $('#operationId').append('<option value="1">Внести</option>');
                        $('#operationId').append('<option value="2">Вывести</option>');

                        $("#labelPrice").text("Сумма:*");

                        $("#amount").val('1');
                        $("#amount").hide();
                        $("#labelAmount").hide();

                        $('#value').val('100');
                        $('#value').hide();
                        $('#valueLabel').hide();

                        $('#accint').val('0');
                        $('#accint').hide();
                        $('#accintLabel').hide();


                        break;

                    // bonds
                    case '2':
                        $("#secid").show();
                        $("secid").empty();
                        buildSelect('Облигация');

                        $('#operationId').empty();
                        $('#operationId').append('<option value="7">Покупка</option>');
                        $('#operationId').append('<option value="8">Продажа</option>');
                        $('#operationId').append('<option value="4">Погашение</option>');
                        $('#operationId').append('<option value="5">Купон</option>');
                        $('#operationId').append('<option value="6">Амортизация</option>');

                        $('#value').val('100');
                        $('#value').show();
                        $('#valueLabel').show();

                        $('#accint').val('0');
                        $('#accint').show();
                        $('#accintLabel').show();

                        break;
                }

                if (typeof data.trade !== 'undefined') {
                    $('#operationId option[value='+data.trade.operationId+']').prop('selected', true);
                }
        } // updateForm

        function buildSelect(groups) {

            const securities = data.securities;

            $("#secid").empty();
            $("#secid").append('<option value="" disabled selected>Выберите бумагу</option>');
             // construct options for secid select
            securities.forEach(function(security) {
                if (groups.includes(security.group)) {
                    $("#secid").append('<option value="'+security.secid+'">'+security.secid+' ('+security.name+') ('+security.group+')</option>')
                }
            });

            if (typeof data.trade !== 'undefined') {
                var secid = JSON.stringify(data.trade.secid); 
            } else {
                var secid = null;
            }

            $("#secid option[value="+secid+"]").prop("selected",true);
        } // buildSelect

// update form when operation changed
function updateOperationSelect() {
    var type = $("#type :selected").val();
    var operation = $('#operationId :selected').val();
    // shares
    if (type == 1) {    
        if (operation == 1 || operation == 2) {
            $('#priceLabel').text('Цена:*');
        }
        if (operation == 3) {
            $('#priceLabel').text('Начисление:*');
        }
    }
    // bonds
    if (type == 2) {
        if (operation == 7 || operation == 8) {
            $('#priceLabel').text('Цена в % от номинала:*');
        }
        if (operation == 4) {
            $('#priceLabel').text('Цена в % от номинала:*');   
        }
        if (operation == 5 || operation == 6) {
            $('#priceLabel').text('Начисление:*');
        }
    }
    // cashe
    if (type == 3) {
        if (operation == 1 || operation == 2) {
            $('#priceLabel').text('Сумма:*');
        }
    }
} // updateOperationSelect

// build select
$(document).ready(function() {   

    updateForm();
    updateOperationSelect();
    $(".select2").select2();
    validate(err);

    $('.validate').validate({
        rules: {
            secid: {
                required: true
            },
            price: {
                required: true
            },
            amount: {
                number: true,
                min: 1
            },
            value: {
                number: true,
                min: 0
            },
            accint: {
                number: true,
                min: 0
            }
        },
        messages: {
            secid: {
                required: 'Пожалуйста, выберите элемент из списка'
            },
            price: {
                required: 'Цена сделки не может быть пустой'
            },
            amount: {
                number: 'Неправильно введено количество',
                min: 'Количество не может быть меньше 1'
            },
            value: {
                number: 'Номинал облигации должен быть числом',
                min: 'Номинал облигации не можеь быть отрицательным'
            },
            accint: {
                number: 'НКД должен быть числом',
                min: 'НКД не можеь быть отрицательным'
            }
        }
    })
});

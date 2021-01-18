function buildSelect() {

            $("#secidNew").empty();
            $("#secidNew").append('<option value="" disabled selected>Выберите бумагу</option>');
             // construct options for secid select
            securities.forEach(function(security) {
                $("#secidNew").append('<option value="'+security.secid+'">'+security.secid+' ('+security.name+') ('+security.group+')</option>')
            })
}

// add row into table
function addRow(tableId) {
    
    var secid = $('#secidNew').val();
    var elname = 'secid['+secid+']';
    var element = $("input[name='secid["+secid+"]']");

    if (secid && document.getElementsByName(elname).length == 0) {
        var row = '<tr>';
        row = row + '<td>'+secid+'</td><td><input type="text" name="secid['+secid+']" value="0" onChange="calculateSum();"/></td>';
        row = row + '<td>';
        row = row + '<ul class="navbar-nav ml-auto">';
        row = row + '<li class="nav-item dropdown no-arrow mx-1">';
        row = row + '<a class="nav-link dropdown-toggle" href="#" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"><i class="fas fa-fw fa-ellipsis-h"></i></a>';
        row = row + '<div class="dropdown-menu dropdown-menu-right shadow" aria-labelledby="userDropdown">';
        row = row + '<button type="button" class="btn btn-sm dropdown-item" placeholder="Удалить" onClick="$(this).closest(\'tr\').remove();">';
        row = row + '<i class="fas fa-times fa-sm fa-fw mr-2 text-gray-400"></i>Удалить</button>';
        row = row + '</div></li></ul></td></tr>';

        $('#'+tableId+' > tbody').append(row);
    } 
} // addRow

// delete row
function calculateSum() {

    var sum = 0;

    $('#secidsTable input[type="text"]').each(function() {
        sum = sum + $(this).val() * 1;
    });

    $('#sum').html('Сумма: ' + sum);

} // calculateSum

function setSecidId(id) {
    document.getElementById('goalId').value = id;
}

$(document).ready(function() {                
    buildSelect();
    
    $(".select2").select2();

    calculateSum();

});
$(document).ready(function() {
    $('[data-toggle="popover"]').popover()

    $('.table').dataTable({
            "bPaginate": false,
            "bFilter": false,
            "bInfo": false
        });

})
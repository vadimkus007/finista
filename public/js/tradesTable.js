$(document).ready(function() {
        $('#tradesTable').dataTable({
            "columnDefs": [ {
                "targets": 'no-sort',
                "orderable": false
            }]
        });
});


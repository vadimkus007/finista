function filterTable(src, target) {
    var input, filter, table, tr, td, i;
    input = document.getElementById(src);
    filter = input.value.toLowerCase();
    table = document.getElementById(target);
    tr = table.getElementsByTagName("tr");
    for (i = 0; i < tr.length; i++) {
        td = tr[i].cells[0];
        if (td.innerHTML.toLowerCase().indexOf(filter) > -1) {
            tr[i].style.display = "";
        } else {
            tr[i].style.display = "none";
        }
    }
}
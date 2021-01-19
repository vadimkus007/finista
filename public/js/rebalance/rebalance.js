
function update() {

    var total = data.total + parseFloat($('#income').val());

    var available = total - data.sumShare - data.sumEtf;

    var sum = 0;
    data.share.forEach(function(item) {
        sum = sum + $('#amount'+item.secid).val() * item.price;
        $('#sum'+item.secid).html(($('#amount'+item.secid).val() * item.price).toFixed(2));
    });
    var dShare = sum;

    data.etf.forEach(item => {
        sum = sum + $('#amount'+item.secid).val() * item.price;
        $('#sum'+item.secid).html(($('#amount'+item.secid).val() * item.price).toFixed(2));
    });
    var dEtf = sum - dShare;

    available = available - sum;

    // calculate new percents
    var newperShare = 0;
    var newperEtf = 0;
    var newperCashe = 0;
    data.share.forEach(function(item) {
        $('#percat'+item.secid).html((100*(item.sum + $('#amount'+item.secid).val() * item.price)/(data.sumShare + dShare)).toFixed(2));
        $('#per'+item.secid).html(( 100*(item.sum + $('#amount'+item.secid).val() * item.price)/total).toFixed(2) );
        newperShare = newperShare + Number( 100*(item.sum + $('#amount'+item.secid).val() * item.price)/total);
    });
    data.etf.forEach(function(item) {
        $('#percat'+item.secid).html((100*(item.sum + $('#amount'+item.secid).val() * item.price)/(data.sumEtf + dEtf)).toFixed(2));
        $('#per'+item.secid).html(( 100*(item.sum + $('#amount'+item.secid).val() * item.price)/total).toFixed(2) );
        newperEtf = newperEtf + Number( 100*(item.sum + $('#amount'+item.secid).val() * item.price)/total);
    });

    newperCashe = Number(100*available/total).toFixed(2);

    $('#newperShare').html(newperShare.toFixed(2));
    $('#newperEtf').html(newperEtf.toFixed(2));
    $('#newperCashe').html(Number(newperCashe).toFixed(2));

    $('#available').html(available.toFixed(2));

}


$(document).ready(function() {

    $('[data-toggle="popover"]').popover()

    update();

})
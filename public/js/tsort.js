(function($){
    $.fn.tsort=function(){
        var
            v=function(e,i){return $(e).children('td').eq(i).text()},
            c=function(i){return function(a,b){var k=v(a,i),m=v(b,i);return $.isNumeric(k)&&$.isNumeric(m)?k-m:k.localeCompare(m)}};
        this.each(function(){
            var
                th=$(this).children('thead').first().find('tr > th'),
                tb=$(this).children('tbody').first();

            th.click(function(){
                var r=tb.children('tr').toArray().sort(c($(this).index()));
                th.removeClass('sel'),$(this).addClass('sel').toggleClass('asc');
                if($(this).hasClass('asc'))r=r.reverse();
                for(var i=0;i<r.length;i++)tb.append(r[i])
            })
        })
    }
})(jQuery);
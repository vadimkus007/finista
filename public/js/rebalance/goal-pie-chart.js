
var actives = [];
for (var i = 0; i<data.share.length; i++) {
  let obj = {};
  obj.name = data.share[i].secid;
  obj.y = Number(data.share[i].percentGoalTotal);
  actives.push(obj);
}
for (var i = 0; i<data.etf.length; i++) {
  let obj = {};
  obj.name = data.etf[i].secid;
  obj.y = Number(data.etf[i].percentGoalTotal);
  actives.push(obj);
}


Highcharts.chart('goal-pie-chart', {
  chart: {
    plotBackgroundColor: null,
    plotBorderWidth: null,
    plotShadow: false,
    type: 'pie'
  },
  title: {
    text: ''
  },
  tooltip: {
    pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
  },
  accessibility: {
    point: {
      valueSuffix: '%'
    }
  },
  plotOptions: {
    pie: {
      allowPointSelect: true,
      cursor: 'pointer',
      dataLabels: {
        enabled: true,
        format: '<b>{point.name}</b>: {point.percentage:.1f} %'
      }
    }
  },
  series: [{
    name: 'Доля',
    colorByPoint: true,
    data: actives
  }]
});
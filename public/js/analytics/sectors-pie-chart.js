for (var i = 0; i<sectors.length; i++) {
  sectors[i].y = Number(sectors[i].y);
}



Highcharts.chart('sectors-pie-chart', {
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
        format: '<b>{point.name}</b>: {point.percentage:.1f} % ({point.label})'
      }
    }
  },
  series: [{
    name: 'Доля',
    colorByPoint: true,
    data: sectors
  }]
});
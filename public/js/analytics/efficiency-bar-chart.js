
function processData(data) {
  var arr = [];
  for (var i = 0; i<data.length; i++) {
    var el = {};
    el.x = i;
    el.y = data[i];
    el.name = "";
    if (data[i] > 0) {
      el.color = "#44EEA8";
    } else {
      el.color = "#FF7474";
    }
    arr.push(el);
  }
  return arr;
}

Highcharts.chart('efficiency-bar-chart', {
  chart: {
    type: 'bar'
  },
  title: {
    text: null
  },
  subtitle: {
    text: null
  },
  accessibility: {
    point: {
      valueDescriptionFormat: '{index}. Age {xDescription}, {value}.'
    }
  },
  xAxis: [{
    categories: efficiency.categories,
    reversed: true,
    labels: {
      step: 1
    },
    accessibility: {
      description: 'Age (male)'
    }
  }],
  yAxis: {
    title: {
      text: null
    },
    labels: {
      formatter: function () {
        return this.value;
      }
    },
    accessibility: {
      description: 'Percentage population',
      rangeDescription: 'Range: 0 to 5%'
    }
  },

  plotOptions: {
    series: {
      stacking: 'normal'
    }
  },

  tooltip: {
    formatter: function () {
      return '<b>' + this.point.category + ': ' +
        Highcharts.numberFormat(this.point.y, 1);
    }
  },

  series: [{
    name: 'Security',
    data: processData(efficiency.data)
  }]
});

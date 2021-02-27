import React from 'react';

import BarChart from 'highcharts-react-official';
import Highcharts from 'highcharts/highstock';

export default function ({data, options}) {

    const processData = (data) => {
        var arr = [];
        for (var i = 0; i<data.length; i++) {
            var el = {};
            el.x = i;
            el.y = data[i][1];
            el.name = String(data[i][0]);
            if (el.y > 0) {
              el.color = "#44EEA8";
            } else {
              el.color = "#FF7474";
            }
            el.dataLabels = {
              enabled: true,
              format: el.name,
              align: (el.y > 0) ? 'left' : 'right',
              inside: false
            }
            arr.push(el);
        }
        return arr;
    }

    const customOptions = options ? options : {
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
        categories: data.categories,
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
          return '<b>' + this.point.name + ': ' +
            Highcharts.numberFormat(this.point.y, 1);
        }
      },

      series: [{
        name: 'Securities',
        data: processData(data)
      }]
    };

    return (
        <figure className="highcharts-figure">
            <BarChart
                highcharts={Highcharts}
                options={customOptions}
            />
        </figure>
    );

}
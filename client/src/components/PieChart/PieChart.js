import React from 'react';
import PieChart from 'highcharts-react-official';
import Highcharts from 'highcharts/highstock';

export default function ({data, options}) {

    const customOptions = options ? options : {
        chart: {
            type: 'pie',
            plotBackgroundColor: null,
            plotBorderWidth: null,
            plotShadow: false,
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
                    format: '<b>{point.name}</b>: {point.percentage:.1f} % {point.label}'
                }
            }
        },
        series: [{
            name: 'Доля',
            colorByPoint: true,
            data: data
        }]
    };

    return (
        <figure className="highcharts-figure">
            <PieChart
                highcharts={Highcharts}
                options={customOptions}
            />
        </figure>
    );

}
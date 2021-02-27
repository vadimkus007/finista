import React, { useState, useEffect } from 'react';

import { Card } from 'react-bootstrap';

import { faRubleSign } from "@fortawesome/free-solid-svg-icons";
import { faCalendar } from "@fortawesome/free-solid-svg-icons";
import { faClipboardList } from "@fortawesome/free-solid-svg-icons";
import { faComments } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { NotificationManager } from 'react-notifications';

import HighchartsReact from 'highcharts-react-official';
import Highcharts from 'highcharts/highstock';

import ReactTableSort from '../../components/ReactTableSort';

import Spinner from '../../components/Spinner';

import { getRequest } from '../../helpers';

// spinner
const SPINNER = (<div><Spinner /></div>);


export default function Actives(props) {

    const [loading, setLoading] = useState(true);

    const [portfolio, setPortfolio] = useState({});

    const [shares, setShares] = useState([]);

    const [etf, setEtf] = useState([]);

    const [bonds, setBonds] = useState([]);

    const [history, setHistory] = useState([]);

    const chartOptions = {
        title: {
            text: null
        },
        series: [{
            name: 'Стоимость портфеля',
            data: history,
            tooltip: {
                valueDecimals: 2
            }
        }]
    };

    useEffect(() => {
        const portfolio = JSON.parse(localStorage.getItem('portfolio'));
        if (portfolio) {
            setPortfolio(portfolio);
        } else {
            props.history.push({
                pathname: '/portfolios', 
                state: {
                    from: '/portfolio/trades'
                }
            });
        };

        loadData(portfolio.id);

        setLoading(false);

    }, []);

    const loadData = (portfolioId) => {
        const endPoint = '/portfolio/' + portfolioId + '/actives';
        getRequest(endPoint)
        .then(results => {
            if (results.error) {
                NotificationManager.error(results.error, 'Error', 2000);
                return;
            }
            setPortfolio(results.data.portfolio);
            setShares(results.data.shares);
            setEtf(results.data.etf);
            setBonds(results.data.bonds);
            setHistory(results.data.history);
            setLoading(false);
        })
        .catch(err => {
            NotificationManager.error(err, 'Error', 2000);
        });
    }

    const getClassName = (value) => {
        if (Number(value) > 0) {
            return 'text-success';
        } else if (Number(value) < 0) {
            return 'text-danger';
        } else {
            return '';
        }
    }

    const columns = [
        {
            Header: 'Тикер',
            accessor: 'secid',
            Cell: (row) => (<a href={'/quotes'+row.value}>{row.value}</a>)
        },
        {
            Header: 'Название',
            accessor: 'SHORTNAME'
        },
        {
            Header: 'Количество',
            accessor: 'amount',
        },
        {
            Header: 'Средняя цена',
            accessor: 'meanPrice',
            Cell: (row) => (<span>{Number(row.value).toFixed(2)}</span>)
        },
        {
            Header: 'Текущая цена',
            accessor: 'last',
            Cell: (row) => (<span>{Number(row.value).toFixed(2)}</span>)
        },
        {
            Header: 'Стоимость',
            accessor: 'cost',
            Cell: (row) => (<span>{Number(row.value).toFixed(2)}</span>)
        },
        {
            Header: 'Курсовая прибыль, %',
            accessor: 'exchangeProfitPrc',
            Cell: (row) => (<span className={getClassName(row.value)}>{Number(row.value).toFixed(2)}</span>),
        },
        {
            Header: 'Прибыль',
            accessor: 'profit',
            Cell: (row) => (<span className={getClassName(row.value)}>{Number(row.value).toFixed(2)}</span>)
        },
        {
            Header: 'Изменение за день',
            accessor: 'changePrc',
            Cell: (row) => (<span className={getClassName(row.value)}>{Number(row.value).toFixed(2)} %</span>)
        },
        {
            Header: 'Текущая доля',
            accessor: 'percentage',
            Cell: (row) => (<span>{Number(row.value).toFixed(2)}</span>)
        }
    ];

    const data = [
        {
            secid: 'AFLT'
        },
        {
            secid: 'GAZP'
        }
    ];


    return (
        <div className="container-fluid">
            <div className="d-sm-flex align-items-center justify-content-between mb-4">
                <h1 className="h3 mb-4 text-gray-800">Портфель - { portfolio.title }</h1>
            </div>

            <div className="row">

                <div class="col-xl-3 col-md-6 mb-4">
                    <Card className="border-left-primary shadow h-100 py-2">
                        <Card.Body>
                            <div className="row no-gutters align-items-center">
                                <div className="col mr-2">
                                    <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                                        Стоимость
                                    </div>
                                    <div className="h5 mb-0 font-weight-bold text-gray-800">
                                        { Number(portfolio.cost).toFixed(2) }
                                        <span className="ml-2">
                                            <FontAwesomeIcon icon={ faRubleSign } size="sm"  />
                                        </span>
                                    </div>
                                </div>
                                <div class="col-auto">
                                    <FontAwesomeIcon icon={ faRubleSign } size="2x" className="text-gray-300" />
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </div>

                <div class="col-xl-3 col-md-6 mb-4">
                    <Card className="border-left-success shadow h-100 py-2">
                        <Card.Body>
                            <div className="row no-gutters align-items-center">
                                <div className="col mr-2">
                                    <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                                        Прибыль
                                    </div>
                                    <div className="h5 mb-0 font-weight-bold text-gray-800">
                                        <span className={ getClassName(portfolio.profit) }>
                                            { Number(portfolio.profit).toFixed(2) }
                                             <span className="ml-2">
                                                <FontAwesomeIcon icon={ faRubleSign } size="sm"  />
                                            </span>
                                        </span>
                                    </div>
                                </div>
                                <div class="col-auto">
                                    <FontAwesomeIcon icon={ faCalendar } size="2x" className="text-gray-300" />
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </div>

                <div class="col-xl-3 col-md-6 mb-4">
                    <Card className="border-left-info shadow h-100 py-2">
                        <Card.Body>
                            <div className="row no-gutters align-items-center">
                                <div className="col mr-2">
                                    <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                                        Годовая доходность
                                    </div>
                                    <div className="h5 mb-0 font-weight-bold text-gray-800">
                                        <span className={ getClassName(portfolio.xirr) }>
                                            { Number(portfolio.xirr).toFixed(2) }
                                            <span> %</span>
                                        </span>
                                    </div>
                                </div>
                                <div class="col-auto">
                                    <FontAwesomeIcon icon={ faClipboardList } size="2x" className="text-gray-300" />
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </div>

                <div class="col-xl-3 col-md-6 mb-4">
                    <Card className="border-left-warning shadow h-100 py-2">
                        <Card.Body>
                            <div className="row no-gutters align-items-center">
                                <div className="col mr-2">
                                    <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                                        Изменение за день
                                    </div>
                                    <div className="h5 mb-0 font-weight-bold text-gray-800">
                                        <span className={ getClassName(portfolio.change) }>
                                        { Number(portfolio.change).toFixed(2) }
                                            <span className="ml-2">
                                                <FontAwesomeIcon icon={ faRubleSign } size="sm"  />
                                            </span>
                                            <span className="ml-2">
                                                ({Number(portfolio.changePrc).toFixed(2)}
                                                    <span className="ml-2">%</span>)
                                            </span>
                                         </span>
                                    </div>
                                </div>
                                <div class="col-auto">
                                    <FontAwesomeIcon icon={ faComments } size="2x" className="text-gray-300" />
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </div>

            </div>

            <div className="row">
                <div className="col-12">
                    <Card className="shadow mb-4">
                        <Card.Header className="py-3">
                            <h6 class="m-0 text-primary font-weight-bold">Состав портфеля по активам</h6>
                        </Card.Header>
                        <Card.Body>
                            <table className="table table-striped table-bordered">
                                <thead>
                                    <tr>
                                        <th>Актив</th>
                                        <th>Текущая стоимость</th>
                                        <th>Прибыль</th>
                                        <th>Изменение за день</th>
                                        <th>Текущая доля, %</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    { (portfolio.shares && portfolio.shares.cost > 0) && (
                                    <tr>
                                        <td>Акции</td>
                                        <td>{ Number(portfolio.shares.cost).toFixed(2) }</td>
                                        <td className=
                                        { getClassName(portfolio.shares.profit) }
                                        >
                                            { Number(portfolio.shares.profit).toFixed(2) }
                                        </td>
                                        <td className=
                                        { getClassName(portfolio.shares.change) }
                                        >
                                            { Number(portfolio.shares.change).toFixed(2) } ({Number(portfolio.shares.changePrc).toFixed(2)} %)</td>
                                        <td>{ Number(portfolio.shares.percentage).toFixed(2) }</td>
                                    </tr>
                                    )}
                                    { (portfolio.etf && portfolio.etf.cost > 0) && (
                                    <tr>
                                        <td>ETF/ПИФ</td>
                                        <td>
                                            { Number(portfolio.etf.cost).toFixed(2) }
                                        </td>
                                        <td className=
                                        { getClassName(portfolio.etf.profit) }
                                        >
                                            { Number(portfolio.etf.profit).toFixed(2) }
                                        </td>
                                        <td className={ getClassName(portfolio.etf.change) } >
                                            { Number(portfolio.etf.change).toFixed(2) } ({Number(portfolio.etf.changePrc).toFixed(2)} %)
                                        </td>
                                        <td>{ Number(portfolio.etf.percentage).toFixed(2) }</td>
                                    </tr>
                                    )}
                                    { (portfolio.bonds && portfolio.bonds.cost > 0) && (
                                    <tr>
                                        <td>Облигации</td>
                                        <td>{ Number(portfolio.bonds.cost).toFixed(2) }</td>
                                        <td  className=
                                        { getClassName(portfolio.bonds.profit) }
                                        >
                                            { Number(portfolio.bonds.profit).toFixed(2) }
                                        </td>
                                        <td  className=
                                        { getClassName(portfolio.bonds.change) }
                                        >
                                            { Number(portfolio.bonds.change).toFixed(2) } ({Number(portfolio.bonds.changePrc).toFixed(2)} %)
                                        </td>
                                        <td>{ Number(portfolio.bonds.percentage).toFixed(2) }</td>
                                    </tr>
                                    )}
                                    <tr>
                                        <td>Рубли</td>
                                        <td>{ Number(portfolio.cashe).toFixed(2) }</td>
                                        <td>-</td>
                                        <td>-</td>
                                        <td>{ Number(portfolio.cashePercentage).toFixed(2) }</td>
                                    </tr>
                                </tbody>
                            </table>



                        </Card.Body>
                    </Card>
                </div>
            </div>

{ shares.length > 0 && (
            <div className="row">
                <div className="col-12">
                    <Card className="shadow mb-4">
                        <Card.Header className="py-3">
                            <h6 class="m-0 text-primary font-weight-bold">Акции</h6>
                        </Card.Header>
                        <Card.Body>

                           <ReactTableSort columns={columns} data={shares} />

                        </Card.Body>
                    </Card>
                </div>
            </div>
)}

            {etf.length > 0 && (
            <div className="row">
                <div className="col-12">
                    <Card className="shadow mb-4">
                        <Card.Header className="py-3">
                            <h6 class="m-0 text-primary font-weight-bold">ETF/ПИФ</h6>
                        </Card.Header>
                        <Card.Body>

                            <ReactTableSort columns={ columns } data={ etf } />

                        </Card.Body>
                    </Card>
                </div>
            </div>
            )}

            {bonds.length > 0 && (
            <div className="row">
                <div className="col-12">
                    <Card className="shadow mb-4">
                        <Card.Header className="py-3">
                            <h6 class="m-0 text-primary font-weight-bold">Облигации</h6>
                        </Card.Header>
                        <Card.Body>
                            <ReactTableSort columns={ columns } data={ bonds } />
                        </Card.Body>
                    </Card>
                </div>
            </div>
            )}

            <div className="row">
                <div className="col-12">
                    <Card className="shadow mb-4">
                        <Card.Header className="py-3">
                            <h6 class="m-0 text-primary font-weight-bold">Стоимость портфеля</h6>
                        </Card.Header>
                        <Card.Body>
                            <div>
                            <HighchartsReact
                                highcharts={Highcharts}
                                constructorType={'stockChart'}
                                options={chartOptions}

                            />
                            </div>
                        </Card.Body>
                    </Card>
                </div>
            </div>



        </div>
    );

}
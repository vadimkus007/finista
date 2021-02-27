import React, { useState, useEffect } from 'react';

import { 
    Card,
    Button
} from 'react-bootstrap';

import PieChart from 'highcharts-react-official';
import Highcharts from 'highcharts/highstock';

import { NotificationManager } from 'react-notifications';

import { getRequest } from '../../helpers';

import Toolbar from '../../components/Toolbar';

export default function Rebalance(props) {

    const [portfolio, setPortfolio] = useState({});
    const [total, setTotal] = useState({});
    const [shares, setShares] = useState([]);
    const [etf, setEtf] = useState([]);
    const [bonds, setBonds] = useState([]);

    const [income, setIncome] = useState('0');

    const [available, setAvailable] = useState(0);

    const [goal, setGoal] = useState({});

    const [dif, setDif] = useState({});

    const [operation, setOperation] = useState({});

    const [sum, setSum] = useState({});

    const [rebalanceCategory, setRebalanceCategory] = useState({});

    const [rebalanceTotal, setRebalanceTotal] = useState({});

    useEffect(() => {

        const portfolio = JSON.parse(localStorage.getItem('portfolio'));
        if (portfolio) {
            setPortfolio(portfolio);
        } else {
            props.history.push({
                pathname: '/portfolios', 
                state: {
                    from: '/portfolio/rebalance'
                }
            });
        };

        loadData(portfolio.id);


    }, []);

    const handleGoalsList = () => {
        props.history.push({
            pathname: '/portfolio/rebalance/goals',
            state: {}
        });
    };

    const loadData = (portfolioId) => {
        const endPoint = '/portfolio/'+portfolioId+'/rebalance';
        getRequest(endPoint)
        .then(results => {
            let cost = Number(results.total.shares.current) + 
                        Number(results.total.etf.current) + 
                        Number(results.total.bonds.current) + 
                        Number(results.total.cashe.current);
            results.total.cost = cost;
            setTotal(results.total);
            setShares(results.shares);
            setEtf(results.etf);
            setBonds(results.bonds);
            setAvailable(Number(results.total.cashe.current));
            setIncome(0);

            const secids = [...results.shares, ...results.etf, ...results.bonds];
            let _sum = sum;
            let _operation = operation;
            secids.map(row => {
                _sum[row.secid] = 0;
                _operation[row.secid] = '0';
            });
            setSum(_sum);
            setOperation(_operation);

        })
        .catch(err => {

            NotificationManager.error(err.message, 'Error', 2000);
        });
    }

    const handleIncome = (e) => {
        const { name, value } = e.target;
        setIncome(value);
    }

    const handleOperation = (e) => {

        const { name, value } = e.target;
        setOperation({...operation, [name]:value});
        updateSum(name, value);
    }

    useEffect(() => {
        updateAvailable();
        updateGoal();
    }, [income]);

    useEffect(() => {
        updateGoal();
    }, [available]);

    useEffect(() => {
        updateDif();
        updateRebalanceTotal();
        updateRebalanceCategory();
    }, [goal]);

    useEffect(() => {
        updateAvailable();
        updateRebalanceTotal();
        updateRebalanceCategory();
    }, [operation]);

    const getCost = (array, key) => {
            let row = array.find((element) => {
                return (element.secid === key) ? true : false;
            });
            return row.cost;
    }

    const getPrice = (array, key) => {
            let row = array.find((element) => {
                return (element.secid === key) ? true : false;
            });
            return row.price;
    }

    const getGoal = (array, key) => {
        let row = array.find((element) => {
            return (element.secid === key) ? true : false;
        });
        return row.goal;
    }

    const getGoalPrc = (array, key) => {
        let row = array.find((element) => {
            return (element.secid === key) ? true : false;
        });
        return row.goalPrc;
    }

    const updateGoal = () => {
        // const all = total.cost + available;
        const all = total.cost + Number(income);

        const array = [...shares, ...etf, ...bonds];

        let _goal = {...goal};
        array.map(row => {
            _goal[row.secid] = row.goal * all / 100;
        });
        setGoal(_goal);
    }

    const updateDif = () => {

        let array = [...shares,...etf,...bonds];

        let _dif = {...dif};
        for (var key in goal) {
            let cost = getCost(array, key);
            let _sum = sum[key] ? sum[key] : 0;
            _dif[key] = goal[key] - cost - _sum;
        }
        setDif(_dif);
    }

    const updateAvailable = () => {
        if (total.cashe) {
            setAvailable(Number(total.cashe.current) + Number(income) - getSum());
        } else {
            setAvailable(0);
        };
    }

    const updateSum = (name, value) => {
        const array = [...shares, ...etf, ...bonds];
        setOperation({...operation, [name]:value});
        setSum({...sum, [name]:(getPrice(array, name) * value)});
    }

    const updateRebalanceTotal = () => {
        const secids = [...shares, ...etf, ...bonds];
        var cost = total.cost;
        const _rebalanceTotal = {...rebalanceTotal};

        for (var key in sum) {
            cost += sum[key];
        }

        secids.map(secid => {
            _rebalanceTotal[secid.secid] = 100 * (getCost(secids, secid.secid) + Number(sum[secid.secid])) / cost;
        });
        setRebalanceTotal(_rebalanceTotal);
    }

    const updateRebalanceCategory = () => {
        const secids = [...shares, ...etf, ...bonds];
        const _rebalanceCategory = {...rebalanceCategory};

        var cost = {shares: 0, etf: 0, bonds: 0};
        secids.map(row => {
            cost[row.group] += Number(row.cost) + Number(sum[row.secid]);
        });

        secids.map(row => {
            _rebalanceCategory[row.secid] = 100 * (getCost(secids, row.secid) + Number(sum[row.secid])) / cost[row.group];
        });

        setRebalanceCategory(_rebalanceCategory);
    }

    const getSum = () => {
        let result = 0;
        for (var key in sum) {
            result += Number(sum[key]);
        }
        return result;
    }

    const getTdClass = (value, basis, degree = 0.1) => {
        if (Math.abs(Number(value)) > (basis * degree)) {
            if (Number(value) > 0) {
                return 'table-success';
            }
            if (Number(value) < 0) {
                return 'table-danger';
            }
            
        }
        return '';
    }

    // Highchart
    const currentChartData = () => {
        let data = [];
        const array = [...shares, ...etf, ...bonds];

        array.map(row => {
            let obj = {
                name: row.secid,
                y: 100 * row.cost / total.cost
            };
            data.push(obj);
        });
        return data;
    }

    const goalChartData = () => {
        let data = [];
        const array = [...shares, ...etf, ...bonds];
        array.map(row => {
            let obj = {
                name: row.secid,
                y: Number(row.goal)
            };
            data.push(obj);
        });

        return data;
    }

    const currentChartOptions = {
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
                    format: '<b>{point.name}</b>: {point.percentage:.1f} %'
                }
            }
        },
        series: [{
            name: 'Доля',
            colorByPoint: true,
            data: currentChartData()
        }]
    };

    const goalChartOptions = {
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
                    format: '<b>{point.name}</b>: {point.percentage:.1f} %'
                }
            }
        },
        series: [{
            name: 'Доля',
            colorByPoint: true,
            data: goalChartData()
        }]
    };
    // -- Highchart

    return (
        <div className="container-fluid">
            <div className="d-sm-flex align-items-center justify-content-between mb-4">
                <h1 className="h3 text-gray-800">Ребалансировка - { portfolio.title }</h1>
            </div>

            <Toolbar>
                <Button
                    variant="primary"
                    size="sm"
                    onClick={ handleGoalsList }
                >
                    Изменить список инструментов
                </Button>
            </Toolbar>

            <div className="row">
                <div className="col-sm-12 col-md-6">
                    <Card className="shadow mb-4">
                        <Card.Body>
                            <table class="table table-bordered table-sm input">
                                <thead>
                                    <tr>
                                        <th>Актив</th>
                                        <th>Состав</th>
                                        <th>Цель</th>
                                        <th>Ребалансировка</th>
                                    </tr>
                                </thead>
                                <tbody>
                                { total && total.shares && total.shares.current > 0 && (
                                    <tr>
                                        <td>Акции</td>
                                        <td>{ Number(total.shares.currentPrc).toFixed(2) }</td>
                                        <td>{ Number(total.shares.goalPrc).toFixed(2) }</td>
                                        <td></td>
                                    </tr>
                                )}
                                { total && total.etf && total.etf.current > 0 && (
                                    <tr>
                                        <td>ETF/ПИФ</td>
                                        <td>{ Number(total.etf.currentPrc).toFixed(2) }</td>
                                        <td>{ Number(total.etf.goalPrc).toFixed(2) }</td>
                                        <td></td>
                                    </tr>
                                )}
                                { total && total.bonds && total.bonds.current > 0 && (
                                    <tr>
                                        <td>Облигации</td>
                                        <td>{ Number(total.bonds.currentPrc).toFixed(2) }</td>
                                        <td>{ Number(total.bonds.goalPrc).toFixed(2) }</td>
                                        <td></td>
                                    </tr>
                                )}
                                { total && total.cashe && (
                                    <tr>
                                        <td>Рубли</td>
                                        <td>{ Number(total.cashe.currentPrc).toFixed(2) }</td>
                                        <td>{ Number(total.cashe.goalPrc).toFixed(2) }</td>
                                        <td></td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </Card.Body>
                    </Card>
                </div>

                <div className="col-sm-12 col-md-6">
                    <Card className="shadow mb-4">
                        <Card.Body>
                            <div class="row">
                                <div class="col-6">
                                    Доп инвестиции:
                                </div>
                                <div class="col-6">
                                    <input type="text" name="income" class="" id="income" value ={ income } onChange={ handleIncome } />
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-6">
                                    Стоимость портфеля:
                                </div>
                                <div class="col-6" id="final">
                                    { parseFloat(total.cost).toFixed(2) }
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-6">
                                    Доступно для покупки:
                                </div>
                                <div class="col-6 text-primary font-weight-bold" id="available">
                                    { Number(available).toFixed(2) }
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </div>
            </div>

            <div className="row">
                <div className="col-12">
                    <Card className="shadow mb-4">
                        <Card.Body>
                            <table className="table table-bordered table-sm input">
                                <thead>
                                    <tr>
                                        <th colspan="7" className="text-center">Текущий состав портфеля</th>
                                        <th colspan="3" className="text-center">Цель</th>
                                        <th colspan="5" className="text-center">После ребалансировки</th>
                                    </tr>
                                    <tr>
                                        <th>Тикер</th>
                                        <th>Цена</th>
                                        <th>Кол-во</th>
                                        <th>Сумма</th>
                                        <th>% категории</th>
                                        <th>% всего</th>
                                        <th>Лот</th>
                                        <th>% категории</th>
                                        <th>% всего</th>
                                        <th>Сумма</th>
                                        <th>
                                            Разница
                                        </th>
                                        <th>Покупка/продажа</th>
                                        <th>Сумма итог</th>
                                        <th>% категории</th>
                                        <th>% всего</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    { shares.length > 0 && (
                                    <tr>
                                        <td colspan="15" class="text-center">Акции</td>
                                    </tr>
                                    )}
                                    
                                    { shares.map(row => (
                                        <tr>
                                            <td>{ row.secid }</td>
                                            <td>{ parseFloat(row.price).toFixed(2) }</td>
                                            <td>{ row.amount }</td>
                                            <td>{ parseFloat(row.cost).toFixed(2) }</td>
                                            <td>{ parseFloat(100 * row.cost / total.shares.current).toFixed(2) }</td>
                                            <td>{ parseFloat(100 * row.cost / total.cost).toFixed(2) }</td>
                                            <td>{ row.lotsize }</td>
                                            <td>{ parseFloat(100 * row.goal / total.shares.goalPrc).toFixed(2) }</td>
                                            <td>{ row.goal }</td>
                                            <td>{ Number(goal[row.secid]).toFixed(2) }</td>
                                            <td className={getTdClass(dif[row.secid], row.cost)}>{ Number(dif[row.secid]).toFixed(2) }</td>
                                            <td>
                                                <input 
                                                    type="number" 
                                                    name={ row.secid } 
                                                    step={ row.lotsize } 
                                                    value={ operation[row.secid] ? operation[row.secid] : 0 }
                                                    onChange={ handleOperation }
                                                />
                                            </td>
                                            <td>{ sum[row.secid] ? Number(sum[row.secid]).toFixed(2) : '0.00' }</td>
                                            <td>{ rebalanceCategory[row.secid] ? Number(rebalanceCategory[row.secid]).toFixed(2) : '0.00' }</td>
                                            <td>{ rebalanceTotal[row.secid] ? Number(rebalanceTotal[row.secid]).toFixed(2) : '0.00' }</td>
                                        </tr>
                                    )) }
                                </tbody>

                                <tbody>
                                    { etf.length > 0 && (
                                    <tr>
                                        <td colspan="15" class="text-center">ETF/ПИФ</td>
                                    </tr>
                                    )}
                                    { etf.map(row => (
                                        <tr>
                                            <td>{ row.secid }</td>
                                            <td>{ parseFloat(row.price).toFixed(2) }</td>
                                            <td>{ row.amount }</td>
                                            <td>{ parseFloat(row.cost).toFixed(2) }</td>
                                            <td>{ parseFloat(100 * row.cost / total.etf.current).toFixed(2) }</td>
                                            <td>{ parseFloat(100 * row.cost / total.cost).toFixed(2) }</td>
                                            <td>{ row.lotsize }</td>
                                            <td>{ parseFloat(100 * row.goal / total.etf.goalPrc).toFixed(2) }</td>
                                            <td>{ row.goal }</td>
                                            <td>{ Number(goal[row.secid]).toFixed(2) }</td>
                                            <td className={getTdClass(dif[row.secid], row.cost)}>{ Number(dif[row.secid]).toFixed(2) }</td>
                                            <td>
                                                <input 
                                                    type="number" 
                                                    name={ row.secid } 
                                                    step={ row.lotsize } 
                                                    value={ operation[row.secid] ? operation[row.secid] : 0 }
                                                    onChange={ handleOperation }
                                                />
                                            </td>
                                            <td>{ sum[row.secid] ? Number(sum[row.secid]).toFixed(2) : '0.00' }</td>
                                            <td>{ rebalanceCategory[row.secid] ? Number(rebalanceCategory[row.secid]).toFixed(2) : '0.00' }</td>
                                            <td>{ rebalanceTotal[row.secid] ? Number(rebalanceTotal[row.secid]).toFixed(2) : '0.00' }</td>
                                        </tr>
                                    )) }
                                </tbody>

                                <tbody>
                                    { bonds.length > 0 && (
                                    <tr>
                                        <td colspan="15" class="text-center">Облигации</td>
                                    </tr>
                                    )}
                                    { bonds.map(row => (
                                        <tr>
                                            <td>{ row.secid }</td>
                                            <td>{ parseFloat(row.price).toFixed(2) }</td>
                                            <td>{ row.amount }</td>
                                            <td>{ parseFloat(row.cost).toFixed(2) }</td>
                                            <td>{ parseFloat(100 * row.cost / total.bonds.current).toFixed(2) }</td>
                                            <td>{ parseFloat(100 * row.cost / total.cost).toFixed(2) }</td>
                                            <td>{ row.lotsize }</td>
                                            <td>{ parseFloat(100 * row.goal / total.bonds.goalPrc).toFixed(2) }</td>
                                            <td>{ row.goal }</td>
                                            <td>{ Number(goal[row.secid]).toFixed(2) }</td>
                                            <td className={getTdClass(dif[row.secid], row.cost)}>{ Number(dif[row.secid]).toFixed(2) }</td>
                                            <td>
                                                <input 
                                                    type="number" 
                                                    name={ row.secid } 
                                                    step={ row.lotsize } 
                                                    value={ operation[row.secid] ? operation[row.secid] : 0 }
                                                    onChange={ handleOperation }
                                                />
                                            </td>
                                            <td>{ sum[row.secid] ? Number(sum[row.secid]).toFixed(2) : '0.00' }</td>
                                            <td>{ rebalanceCategory[row.secid] ? Number(rebalanceCategory[row.secid]).toFixed(2) : '0.00' }</td>
                                            <td>{ rebalanceTotal[row.secid] ? Number(rebalanceTotal[row.secid]).toFixed(2) : '0.00' }</td>
                                        </tr>
                                    )) }
                                </tbody>
                            </table>
                        </Card.Body>
                    </Card>
                </div>
            </div>

            <div className="row">
                <div className="col-sm-12 col-md-6">
                    <Card className="shadow mb-4">
                        <Card.Header>
                            <h6 class="m-0 font-weight-bold text-primary">Текущий состав портфеля</h6>
                        </Card.Header>
                        <Card.Body>
                            <div>
                                <PieChart
                                    highcharts={Highcharts}
                                    options={currentChartOptions}
                                />
                            </div>
                        </Card.Body>
                    </Card>
                </div>

                <div className="col-sm-12 col-md-6">
                    <Card className="shadow mb-4">
                        <Card.Header>
                            <h6 class="m-0 font-weight-bold text-primary">Целевой состав портфеля</h6>
                        </Card.Header>
                        <Card.Body>
                            <div>
                                <PieChart
                                    highcharts={Highcharts}
                                    options={goalChartOptions}
                                />
                            </div>
                        </Card.Body>
                    </Card>
                </div>                
            </div>

        </div>
    );

}
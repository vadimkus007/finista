import React, { useState, useEffect } from 'react';
import { Card } from 'react-bootstrap';

import { NotificationManager } from 'react-notifications';

import PieChart from '../../components/PieChart';
import BarChart from '../../components/BarChart';

import { getRequest } from '../../helpers';

export default function Analytics(props) {

    const [portfolio, setPortfolio] = useState({});

    const [actives, setActives] = useState([]);

    const [activeTypes, setActiveTypes] = useState([]);

    const [shares, setShares] = useState([]);

    const [etf, setEtf] = useState([]);

    const [sectors, setSectors] = useState([]);

    const [efficiency, setEfficiency] = useState([]);


    const loadData = (portfolioId) => {
        const endPoint = '/portfolio/' + portfolioId + '/analytics';

        getRequest(endPoint)
        .then(results => {
            setActives(results.actives);
            setActiveTypes(results.activeTypes);
            setShares(results.shares);
            setEtf(results.etf);
            setSectors(results.sectors);
            setEfficiency(results.efficiency);
        })
        .catch(err => {
            NotificationManager.error(err.message, 'Error', 2000);
        });
    }

    useEffect(() => {
        const portfolio = JSON.parse(localStorage.getItem('portfolio'));
        if (portfolio) {
            setPortfolio(portfolio);
        } else {
            props.history.push({
                pathname: '/portfolios', 
                state: {
                    from: '/portfolio/analytics'
                }
            });
        };

        loadData(portfolio.id);

    }, []);

    return (
        <div className="container-fluid">
            
            <div className="d-sm-flex align-items-center justify-content-between mb-4">
                <h1 className="h3 mb-4 text-gray-800">Аналитика - { portfolio.title }</h1>
            </div>

            <div className="row">
                <div className="col-sm-12 col-md-6">
                    <Card className="shadow mb-4">
                        <Card.Header>
                            <h6 class="m-0 font-weight-bold text-primary">Распределенте всех активов в портфеле</h6>
                        </Card.Header>
                        <Card.Body>
                            <div>
                                <PieChart data={actives} />
                            </div>
                        </Card.Body>
                    </Card>
                </div>

                <div className="col-sm-12 col-md-6">
                    <Card className="shadow mb-4">
                        <Card.Header>
                            <h6 class="m-0 font-weight-bold text-primary">Состав портфеля по типу активов</h6>
                        </Card.Header>
                        <Card.Body>
                            <PieChart data={activeTypes} />
                        </Card.Body>
                    </Card>
                </div>

            </div>

            <div className="row">
                <div className="col-sm-12 col-md-6">
                    <Card className="shadow mb-4">
                        <Card.Header>
                            <h6 class="m-0 font-weight-bold text-primary">Состав портфеля акций</h6>
                        </Card.Header>
                        <Card.Body>
                            <PieChart data={ shares } />
                        </Card.Body>
                    </Card>
                </div>

                <div className="col-sm-12 col-md-6">
                    <Card className="shadow mb-4">
                        <Card.Header>
                            <h6 class="m-0 font-weight-bold text-primary">Состав портфеля ETF/ПИФ</h6>
                        </Card.Header>
                        <Card.Body>
                            <PieChart data={ etf } />
                        </Card.Body>
                    </Card>
                </div>
            </div>

            <div className="row">
                <div className="col-sm-12 col-md-6">
                    <Card className="shadow mb-4">
                        <Card.Header>
                            <h6 class="m-0 font-weight-bold text-primary">Распределение портфеля акций по секторам</h6>
                        </Card.Header>
                        <Card.Body>
                            <PieChart data={ sectors } />
                        </Card.Body>
                    </Card>
                </div>

                <div className="col-sm-12 col-md-6">
                    <Card className="shadow mb-4">
                        <Card.Header>
                            <h6 class="m-0 font-weight-bold text-primary">Эффективность бумаг в портфеле</h6>
                        </Card.Header>
                        <Card.Body>
                            <BarChart data={ efficiency } />
                        </Card.Body>
                    </Card>
                </div>
            </div>

        </div>
    );
}
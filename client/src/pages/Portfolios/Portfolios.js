import React, { useState, useEffect } from 'react';
import { Card, Button } from 'react-bootstrap';

import Toolbar from '../../components/Toolbar';
import TableCellMenu from '../../components/TableCellMenu';

import { getRequest } from '../../helpers';

import { authenticationService } from '../../services';

import { NotificationManager } from 'react-notifications';

import Spinner from '../../components/Spinner';

export default function Portfolios(props) {

    const [portfolios, setPortfolios] = useState([]);

    const [loading, setLoading] = useState(true);

    const getPortfolios = () => {
        const endPoint = '/portfolios';
        getRequest(endPoint)
        .then(results => {
            setPortfolios(results.portfolios);
            setLoading(false);
        })
        .catch(err => {
            NotificationManager.error(err, 'Error', 2000);
        });
    }

    const SPINNER = (
        <div>
            <Spinner />
        </div>
    );

    useEffect(() => {
        getPortfolios();
        localStorage.removeItem('portfolio');
    }, []);

    const handlePortfolioSelect = (portfolio) => {
        localStorage.setItem('portfolio', JSON.stringify(portfolio));
        const fromPath = props.location.state ? props.location.state.from : null;
        if (fromPath) {
            props.history.push(fromPath);
        } else {
            props.history.push('/');
        }
    }

    const handleNewPortfolio = (e) => {
        e.preventDefault();
        props.history.push({
            pathname: '/portfolios/edit',
            state: {}
        });
    }

    const handleEditPortfolio = (portfolio) => {
        props.history.push({
            pathname: '/portfolios/edit',
            state: portfolio
        });
    }

    const handleDeletePortfolio = (portfolio) => {
        const conf = window.confirm('Дествительно удалить портфель и все его содержимое?');
        if (conf) {
            // del portfolio
        }
    }

    return (
        <div className="container-fluid">
            <h1 className="h3 mb-4 text-gray-800">Портфели</h1>

            <div className="row">
                <div className="col-12">

                    <Card className="shadow mb-4">
                        <Card.Header className="d-flex flex-row align-items-center justify-content-between">
                            <h6 className="m-0 text-primary font-weight-bold">
                                Выбор портфеля
                            </h6>
                        </Card.Header>
                        <Card.Body>
                            
                            <Toolbar>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={handleNewPortfolio}
                                >
                                    Добавить портфель
                                </Button>
                            </Toolbar>

                            <div className="row">
                                <div className="col-12">
                                    <table className="table table-striped table-bordered table-hover">
                                        <thead>
                                            <tr>
                                                <th className="text-xs-left" role="columnheader">Название</th>
                                                <th className="text-xs-right" role="columnheader">Дата открытия</th>
                                                <th className="text-xs-center" role="columnheader">Валюта</th>
                                                <th className="text-xs-right" role="columnheader">Фикс. комиссия</th>
                                                <th className="text-xs-right" role="columnheader" width="20"></th>
                                            </tr>
                                        </thead>
                                        <tbody>

                                                { loading ? SPINNER : 

                                                    portfolios.map(portfolio => (
                                                        <tr>
                                                            <td  onClick={() => handlePortfolioSelect(portfolio)}>{ portfolio.title }</td>
                                                            <td  onClick={() => handlePortfolioSelect(portfolio)}>{ portfolio.dateopen.slice(0,10) }</td>
                                                            <td  onClick={() => handlePortfolioSelect(portfolio)}>{ portfolio.currency }</td>
                                                            <td  onClick={() => handlePortfolioSelect(portfolio)}>{ portfolio.comission }</td>
                                                            <td>
                                                                <TableCellMenu 
                                                                    onEdit={() => handleEditPortfolio(portfolio)}
                                                                    onDelete={() => handleDeletePortfolio(portfolio)}
                                                                />
                                                            </td>
                                                        </tr>
                                                    ))

                                                }

                                        </tbody>
                                        
                                    </table>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>

                </div>
            </div>

        </div>
    );

}
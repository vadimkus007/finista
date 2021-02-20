import React, { useState, useEffect } from 'react';

import { 
    Card,
    Button
} from 'react-bootstrap';

import { NotificationManager } from 'react-notifications';

import Spinner from '../../components/Spinner';

import { getRequest, postRequest } from '../../helpers';

import ReactTable from '../../components/ReactTable';

import TableCellMenu from '../../components/TableCellMenu';

import Toolbar from '../../components/Toolbar';

export default function Trades(props) {

    const [portfolio, setPortfolio] = useState({});

    const [trades, setTrades] = useState([]);

    const [loading, setLoading] = useState(true);

    const SPINNER = (<div><Spinner /></div>);

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
        }
        // get trades
        getTrades(portfolio.id);

    }, []);

    const getTrades = (portfolioId) => {
        const endPoint = '/portfolio/' + portfolioId + '/trades';
        getRequest(endPoint)
        .then(results => {
            if (results.error) {
                NotificationManager.error(results.error, 'Error', 2000);
                return;
            }
            setTrades(results.trades);
            setLoading(false);
        })
        .catch(err => {
            NotificationManager.error(err, 'Error', 2000);
        });
    }

    const handleNewTrade = () => {
        props.history.push({
            pathname: '/portfolio/trades/edit',
            state: {}
        })
    }

    const handleEditTrade = (trade) => {
        props.history.push({
            pathname: '/portfolio/trades/edit',
            state: trade
        });
    }

    const handleDeleteTrade = (trade) => {
        const endPoint = '/portfolio/trades/delete';
        postRequest(endPoint, trade)
        .then(result => {
            if (result.message) {
                NotificationManager.success(result.message, 'Success', 2000);
                getTrades(portfolio.id);
                return;
            }
            if (result.error) {
                if (result.error.name == 'SequelizeValidationError') {
                    result.error.errors.map(item => {
                        NotificationManager.error(item.message, 'Error', 2000);
                    });
                } else {
                    NotificationManager.error(result.error, 'Error', 2000);
                }
            }
        })
        .catch(err => {
            NotificationManager.error(err, 'Error', 2000);
        })
    }


    const columns = [
        {
            accessor: 'secid',
            Header: 'Тикер',
        },
        {
            Header: 'Операция',
            accessor: 'operation.title'
        },
        {
            accessor: 'date',
            Header: 'Дата',
            Cell: (row) => row.value.slice(0,10)
        },
        {
            Header: 'Количество',
            accessor: 'amount'
        },
        {
            accessor: 'price',
            Header: 'Цена'
        },
        {
            accessor: 'comission',
            Header: 'Комиссия'
        },
        {
            accessor: (original) => {
                return (original.price * original.amount + Number(original.comission)).toFixed(2);
            },
            Header: 'Сумма',
        },
        {
            accessor: (original) => <TableCellMenu onEdit={() => handleEditTrade(original)} onDelete={() => handleDeleteTrade(original)} />,
            id: 'Row menu'
        }
    ];


    return (
        <div className="container-fluid">
            <div className="d-sm-flex align-items-center justify-content-between mb-4">
                <h1 className="h3 mb-4 text-gray-800">Сделки - { portfolio.title } </h1>
            </div>

            <Card className="shadow mb-4">
                <Card.Body>
                    <Toolbar>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={handleNewTrade}
                        >
                            Добавить сделку
                        </Button>
                    </Toolbar>

                    { loading ? SPINNER : <ReactTable columns={columns} data={ trades } /> }
                </Card.Body>
            </Card>

        </div>
    );

}
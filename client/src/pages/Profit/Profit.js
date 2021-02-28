import React, { useState, useEffect } from 'react';

import { 
    Tabs, 
    Tab,
    Card,
} from 'react-bootstrap';

import { NotificationManager } from 'react-notifications';

import { faRubleSign } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { getRequest } from '../../helpers';

import PopoverInfo from '../../components/PopoverInfo';

import CardProfit from '../../components/CardProfit';

import Table from '../../components/ReactTableSort';


export default function Profit(props) {

    const [portfolio, setPortfolio] = useState({});

    const [periods, setPeriods] = useState([]);

    const [loading, setLoading] = useState(true);


    useEffect(() => {
        const portfolio = JSON.parse(localStorage.getItem('portfolio'));
        if (portfolio) {
            setPortfolio(portfolio);
        } else {
            props.history.push({
                pathname: '/portfolios', 
                state: {
                    from: '/portfolio/profit'
                }
            });
        };

        loadData(portfolio.id);

    }, []);

    const loadData = (portfolioId) => {
        const endPoint = '/portfolio/' + portfolioId + '/profit';

        getRequest(endPoint)
        .then(data => {
            setPeriods(data.periods);
        })
        .catch(err => {
            NotificationManager.error(err.message, 'Error', 2000);
        });
    }

    const columns = [
        {
            Header: 'Бумага',
            accessor: 'secid'
        },
        {
            Header: 'Доходность (% годовых)',
            accessor: 'profit'
        }
    ];

    return (
        <div className="container-fluid">
            <div className="d-sm-flex align-items-center justify-content-between mb-4">
                <h1 className="h3 text-gray-800">Доходность - { portfolio.title }</h1>
            </div>

            <div className="row">
                <div className="col-12">
                    <Tabs defaultActiveKey="tab_0" id="profitTabs" className="mb-4">
                        { periods.map((period, index) => (
                        <Tab eventKey={ 'tab_'+index } title={ period.title } >
                            <div className="row">
                                <div className="col-sm-12 col-md-6">
                                    <CardProfit data={ period } />
                                </div>

                                <div className="col-sm-12 col-md-6">
                                    <Card className="shadow mb-4">
                                        <Card.Header>
                                            <h6 class="m-0 font-weight-bold text-primary">Годовые доходности активов (XIRR)</h6>
                                        </Card.Header>
                                        <Card.Body>
                                            <Table columns={ columns } data={ period.securities } />
                                        </Card.Body>
                                    </Card>
                                </div>
                            </div>
                        </Tab>
                        )) }

                    </Tabs>
                </div>
            </div>

        </div>
    );
}
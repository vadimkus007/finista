import React, { useState, useEffect } from 'react';
import { getRequest } from '../../helpers';

import { 
    SharesTable, 
    IndexTable,
    BondsTable 
} from '../../components/DataTables';

import { 
    Card
} from 'react-bootstrap';

import Spinner from '../../components/Spinner';


export default function Quotes() {

    const [data, setData] = useState({});

    const [loading, setLoading] = useState(true);

    const getQuotes = () => {
        const endPoint = '/quotes';
        getRequest(endPoint)
        .then(data => {
            setData(data.data);
            setLoading(false);
        })
        .catch(err => {
            console.log(err);
        })
    }

    useEffect(() => {
        getQuotes();
    }, []);

    const TABLES = (
        <div className="tab-content">
            <div className="tab-pane fade show active" id="stock">
                <SharesTable data={ data.shares }/>
            </div>
            <div className="tab-pane fade show" id="etf">
                <SharesTable data={ data.etf }/>
            </div>
            <div className="tab-pane fade show" id="index">
                <IndexTable data={ data.index }/>
            </div>
            <div className="tab-pane fade show" id="bonds">
                <BondsTable data={ data.bonds }/>
            </div>
        </div>
    );

    const SPINNER = (
        <div>
            <Spinner />
        </div>
    );

    return (
        

                <div className="container-fluid">
                    <div className="d-sm-flex align-items-center justify-content-between mb-4">
                        <h1 className="h3 mb-0 text-gray-800">Котировки</h1>
                    </div>

                    <Card className="shadow mb-4">
                        <Card.Body>
                            <ul className="nav nav-tabs">
                                <li className="nav-item">
                                    <a className="nav-link active" data-toggle="tab" href="#stock">Акции</a>
                                </li>
                                <li className="nav-item">
                                    <a className="nav-link" data-toggle="tab" href="#etf">ETF/ПИФы</a>
                                </li>
                                <li className="nav-item">
                                    <a className="nav-link" data-toggle="tab" href="#index">Индексы</a>
                                </li>
                                <li className="nav-item">
                                    <a className="nav-link" data-toggle="tab" href="#bonds">Облигации</a>
                                </li>
                            </ul>

                            {loading ? SPINNER : TABLES}

                        </Card.Body>
                    </Card>

                </div>


    );
}
import React, { useState, useEffect } from 'react';
import { getRequest, postRequest } from '../../helpers';
import { authenticationService } from '../../services';

import { Card } from 'react-bootstrap';

import { Link } from 'react-router-dom';

import HighchartsReact from 'highcharts-react-official';
import Highcharts from 'highcharts/highstock';

export default function Quote(props) {

    const [secid, setSecid] = useState(props.match.params.secid);

    const [data, setData] = useState({});

    const [user, setUser] = useState({});

    const [favorite, setFavorite] = useState();

    var linkUrl = 'https://www.moex.com';

    if (data.securities) {
        switch (data.securities.SECTYPE) {
            case '1' : 
                linkUrl = 'https://www.moex.com/ru/issue.aspx?code=' + secid;
                break;
            case 'D' :
                linkUrl = 'https://www.moex.com/ru/issue.aspx?code=' + secid;
                break;
            case 'E' :
                linkUrl = 'https://www.moex.com/ru/issue.aspx?code=' + secid;
                break;
            case '4' :
                linkUrl = 'https://www.moex.com/ru/issue.aspx?board='+data.securities.BOARDID+'&code='+secid;
                break;
            case '3' :
                linkUrl = 'https://www.moex.com/ru/issue.aspx?board='+data.securities.BOARDID+'&code='+secid;
                break;
            default:
                linkUrl = 'https://www.moex.com/ru/index/' + secid;
                break;

        }
    }

    const getSecurity = () => {
        const endPoint = '/quotes/'+secid;
        getRequest(endPoint)
        .then(data => {

//alert(data.favorite);
            setData(data);
            setFavorite(data.favorite);
        })
        .catch(err => {
            console.log(err);
        })
    }

    // for highcharts



    const chartOptions = {
        title: {
            text: null
        },
        series: [{
            name: data.securities ? data.securities.SECID : '',
            data: data.history,
            tooltip: {
                valueDecimals: 2
            }
        }]
    };

    useEffect(() => {
        getSecurity();
        const currentUser = authenticationService.currentUserValue;
        if (currentUser) {
            setUser(currentUser.user);
        }
    }, []);

    // coinditional render

    function renderDividends(dividends) {
        return (
            <Card className="shadow mb-4">
                <Card.Header>
                    <h6 className="m-0 text-primary font-weight-bold">
                        Дивиденды
                    </h6>
                </Card.Header>
                <Card.Body>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Дата</th>
                                <th>Размер дивидендов</th>
                                <th>Цена акции</th>
                                <th>Дивидендная доходность</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dividends.map((row) => (
                                <tr>
                                    <td>{row.registryclosedate}</td>
                                    <td>{row.value}</td>
                                    <td>{row.price}</td>
                                    <td>{row.yield ? Number(row.yield).toFixed(2) : ''}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card.Body>
            </Card>
        );
    }

    function handleFavorite() {
        const endPoint = '/quotes/'+secid;
        postRequest(endPoint)
        .then(result => {
            setFavorite(result.favorite);
        })
        .catch(err => {
            console.log(err);
        })

    }

    return (
        <div id="content-wrapper" className="d-flex flex-column">
            <div id="content">
                <div className="container-fluid">
                    <h1 className="h3 mb-4 text-gray-800">Информация об инструменте</h1>

                    <Card className="shadow mb-4">
                        <Card.Header className="d-flex flex-row align-items-center justify-content-between">
                            <h6 className="m-0 text-primary font-weight-bold">{data.securities ? data.securities.SECNAME : ''} ({data.securities ? data.securities.SECID : ''})</h6>
                            
                            <div>
                                {data.favorite !== null ? 
                                    <div>
                                        <span className="mr-2">Favorite:</span>
                                        <input type="checkbox" checked={favorite} onChange={handleFavorite}/>
                                    </div>
                                    : null
                                }
                            </div>
                        </Card.Header>
                        <Card.Body>
                            <div className="d-flex">
                                <div className="display-4 mr-2">
                                {data.securities ? data.securities.LAST : ''}
                                </div>
                                <div className={
                                    data.securities 
                                    ?  data.securities.LASTCHANGE > 0 
                                        ? 'text-success' 
                                        : 'text-danger'
                                    : ''
                                }>
                                    <span className="mr-2">{data.securities ? data.securities.LASTCHANGE : ''}</span>
                                    <span className="percent">{data.securities ? data.securities.LASTCHANGEPRCNT : ''}</span>
                                </div>
                            </div>
                            <hr />
                            <a href={linkUrl} target="_blank">Профиль эмитента &rarr;</a>
                        </Card.Body>
                    </Card>

                    <Card className="shadow mb-4">
                        <Card.Header>
                            <h6 className="m-0 text-primary font-weight-bold">
                                {data.securities ? data.securities.SECID : ''} Stock Diagramm
                            </h6>
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

                    {data.dividends && data.dividends.length > 0 
                        ? renderDividends(data.dividends) : null}

                </div>
            </div>
        </div>
        
    );
}
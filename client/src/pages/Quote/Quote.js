import React, { useState, useEffect } from 'react';
import { getRequest, postRequest } from '../../helpers';
import { authenticationService } from '../../services';

import { Card } from 'react-bootstrap';

import { Link } from 'react-router-dom';

import HighchartsReact from 'highcharts-react-official';
import Highcharts from 'highcharts/highstock';

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar as fasStar } from "@fortawesome/free-solid-svg-icons";
import { faStar as farStar } from "@fortawesome/free-regular-svg-icons";
import { faRubleSign } from '@fortawesome/free-solid-svg-icons';

import './Quote.css';

export default function Quote(props) {

    const [secid, setSecid] = useState(props.match.params.secid);

    const [data, setData] = useState({});

    const [user, setUser] = useState({});

    const [favorite, setFavorite] = useState();

    var linkUrl = 'https://www.moex.com';

    if (data.securities) {
        switch (data.securities.market) {
            case 'shares' : 
                linkUrl = 'https://www.moex.com/ru/issue.aspx?code=' + secid;
                break;
            case 'foreignshares' :
                linkUrl = 'https://www.moex.com/ru/issue.aspx?code=' + secid;
                break;
            case 'index' :
                linkUrl = 'https://www.moex.com/ru/index/' + secid;
                break;
            case 'bonds' :
                linkUrl = 'https://www.moex.com/ru/issue.aspx?board='+data.securities.BOARDID+'&code='+secid;
                break;
            default:
                linkUrl = 'https://www.moex.com/ru/issue.aspx?board='+data.securities.BOARDID+'&code='+secid;
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

    const renderBonds = () => (
        <>
        <hr />
        <div className="d-inline-flex flex-row justify-content-between col-12">
            <div>
                Доходность последней сделки: 
            </div>

            <div>
                {Number(data.securities.YIELD).toFixed(2)}
                <span> %</span>
            </div>
        </div>
        
        <hr />
        <div className="d-inline-flex flex-row justify-content-between col-12">
            <div>
                Дата погашения: 
            </div>
            <div>
                {data.securities.MATDATE}
            </div>
        </div>
        
        <div className="d-inline-flex flex-row justify-content-between col-12">
            <div>
                Дюрация: 
            </div>
            <div>
                {data.securities.DURATION}
            </div>
        </div>
        
        <hr />  
        <div className="d-inline-flex flex-row justify-content-between col-12">
            <div>
                Номинальная стоимость лота: 
            </div>
            <div>
                {data.securities.LOTVALUE}
                <span> <FontAwesomeIcon icon={faRubleSign} size="sm" /></span>
            </div>
        </div>
        
        <hr />
        <div className="d-inline-flex flex-row justify-content-between col-12">
            <div>
                Дата досрочного выкупа: 
            </div>
            <div>
                {(data.securities.OFFERDATE) ? data.securities.OFFERDATE : 'Нет'}
            </div>
        </div>

            <div className="d-inline-flex flex-row justify-content-between col-12">
                <div>
                    Цена оферты: 
                </div>
                <div>
                    {Number(data.securities.BUYBACKPRICE).toFixed(2)}
                    <span> <FontAwesomeIcon icon={faRubleSign} size="sm" /></span>
                </div>
            </div>
            
            <div className="d-inline-flex flex-row justify-content-between col-12">
                <div>
                    Цена оферты: 
                </div>
                <div>
                    {Number(data.securities.BUYBACKPRICE).toFixed(2)}
                    <span> <FontAwesomeIcon icon={faRubleSign} size="sm" /></span>
                </div>
            </div>
         
        <hr />
        <div className="d-inline-flex flex-row justify-content-between col-12">
            <div>
                Дата выплаты купона: 
            </div>
            <div>
                {data.securities.NEXTCOUPON}
            </div>
        </div>
        
        <div className="d-inline-flex flex-row justify-content-between col-12">
            <div>
                Сумма купона: 
            </div>
            <div>
                {data.securities.COUPONVALUE}
                <span> <FontAwesomeIcon icon={faRubleSign} size="sm" /></span>
            </div>
        </div>
        
        <div className="d-inline-flex flex-row justify-content-between col-12">
            <div>
                Ставка купона: 
            </div>
            <div>
                {data.securities.COUPONPERCENT ? data.securities.COUPONPERCENT : 0} %
            </div>
        </div>
                    
        <div className="d-inline-flex flex-row justify-content-between col-12">
            <div>
                Длительность купона: 
            </div>
            <div>
                {data.securities.COUPONPERIOD}
            </div>
        </div>
                    
        <div className="d-inline-flex flex-row justify-content-between col-12">
            <div>
                НКД на дату расчетов: 
            </div>
            <div>
                {data.securities.ACCRUEDINT}
                <span> <FontAwesomeIcon icon={faRubleSign} size="sm" /></span>
            </div>
        </div>
        </>
    );

    return (
        <div id="content-wrapper" className="d-flex flex-column">
            <div id="content">
                <div className="container-fluid">
                    <h1 className="h3 mb-4 text-gray-800">Информация об инструменте</h1>

                    <div className="row mb-4">

                    <div className="col-cm-12 col-md-6">

                    <Card className="shadow mb-4">
                        <Card.Header className="d-flex flex-row align-items-center justify-content-between">
                            <h6 className="m-0 text-primary font-weight-bold">
                                {data.securities 
                                    ? (data.securities.market == 'index')
                                        ? data.securities.NAME 
                                        : data.securities.SECNAME 
                                    : ''} 
                                ({data.securities ? data.securities.SECID : ''})
                            </h6>
                            
                            <div>
                                {data.favorite !== null ? 
                                    <div>
                                      
                                        <input type="checkbox" className="star-checkbox" id="favorite" checked={favorite} onChange={handleFavorite}/>
                                        <label htmlFor="favorite">
                                            {favorite ? 
                                                <FontAwesomeIcon icon={fasStar} />
                                                : 
                                                <FontAwesomeIcon icon={farStar} />
                                            
                                            }
                                        </label>
                                    </div>
                                    : null
                                }
                            </div>
                        </Card.Header>
                        <Card.Body>
                            <div className="d-flex">
                                <div className="display-4 mr-2">
                                {typeof data.securities   !== 'undefined'
                                    ? data.securities.market == 'index' 
                                        ? data.securities.CURRENTVALUE 
                                        : data.securities.LAST 
                                    : ''}
                                </div>
                                <div className={
                                    data.securities 
                                    ?  data.securities.LASTCHANGE > 0 
                                        ? 'text-success' 
                                        : 'text-danger'
                                    : ''
                                }>
                                    <span className="mr-2">
                                        {data.securities 
                                            ? data.securities.LASTCHANGE : ''}
                                    </span>
                                    <span className="percent">
                                        {data.securities 
                                            ? data.securities.market == 'index' 
                                                ? data.securities.LASTCHANGETOOPENPRC 
                                                : data.securities.LASTCHANGEPRCNT 
                                            : ''}
                                    </span>
                                </div>
                            </div>
                            {data.securities
                                ? data.securities.market == 'bonds' 
                                    ? renderBonds() 
                                    : null
                                : null
                            }
                            <hr />
                            <a href={linkUrl} target="_blank">Профиль эмитента &rarr;</a>
                        </Card.Body>
                    </Card>

                    </div>
                    <div className="col-sm-12 col-md-6">

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
                    </div>

                    </div>

                    {data.dividends && data.dividends.length > 0 
                        ? renderDividends(data.dividends) : null}

                </div>
            </div>
        </div>
        
    );
}
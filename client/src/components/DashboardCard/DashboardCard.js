import React from 'react';

import { Card } from 'react-bootstrap';

import { faRubleSign } from "@fortawesome/free-solid-svg-icons";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function DashboardCard({data, callback}) {

    const getClassName = (value = 0) => {
        if (value > 0) {
            return 'text-success';
        } else if (value < 0) {
            return 'text-danger';
        } else {
            return null;
        }
    }

    const sign = (value) => ((value > 0) ? '+' : '');

    const getQuote = (data) => {
        let currency = '';
        switch (data.currencyid) {
            case 'SUR':
                currency = 'RUB';
                break;
            case 'USD':
                currency = '';
                break;
            default:
                currency = 'RUB';
                break;
        }
        let price = Number(data.last * data.lasttoprevprice / (100 + Number(data.lasttoprevprice))).toFixed(2);
        return (
            <span>
            { sign(price) }
            { price + ' '}
            { currency === 'RUB' 
                ?  <FontAwesomeIcon icon={ faRubleSign } size='sm' />
                : currency === 'USD' 
                    ? '$'
                    : null
            }
            { ' ('+sign(price)+Number(data.lasttoprevprice).toFixed(2)+' %)' }
            </span>
            
        );
    }

    return (
        <Card className="shadow mb-4" style={ {position: 'relative'} }>
            <a href={ '/quotes/'+data.secid } style={ { 'text-decoration': 'none !important', color: '#858796' } }>
                <Card.Body className="text-content-center py-3">
                    <div className="col-12 text-center font-weight-bold">
                        <h3>{ data.shortname }</h3>
                    </div>
                    <div className="col-12 text-center">
                        <h4>
                            { data.last }

                        </h4>
                    </div>
                    <div className={ 'col-12 text-center ' + getClassName(data.lasttoprevprice) }>
                        <h4>{ getQuote(data) }</h4>
                    </div>
                </Card.Body>
            </a>
            <ul className="navbar-nav" style={ { position: 'absolute', right: '0px', top: '0px' } }>
                <li className="nav-item">
                    <button type="submit" className="btn" onClick={ callback } >
                        <FontAwesomeIcon icon={ faTimes } />
                    </button>
                </li>
            </ul>   
        </Card>
    );

}
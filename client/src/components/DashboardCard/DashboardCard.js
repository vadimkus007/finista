import React from 'react';

import { Card } from 'react-bootstrap';

import { faRubleSign } from "@fortawesome/free-solid-svg-icons";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function DashboardCard({data, callback, color = 'rgb(255,255,255,0)'}) {

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
        <Card className="shadow mb-4" style={ {position: 'relative', background: color} }>
            <a href={ '/quotes/'+data.secid } style={ { color: '#FFFFFF' } }>
                <Card.Body className="py-3" style={ { color: '#FFFFFF' } }>
                    <div className="col-12 text-left font-weight-bold">
                        <h1>{ data.shortname }</h1>
                    </div>
                    <div className={ 'col-12 text-right font-weight-bold' }>
                        <h1>{ Number(data.lasttoprevprice).toFixed(2) } %</h1>
                    </div>
                    <div className="col-12 text-left">
                        <h3>
                            { data.last }

                        </h3>
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
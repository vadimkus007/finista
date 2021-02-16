import React, { useState, useEffect } from 'react';

import { Card, Button } from 'react-bootstrap';

import { authenticationService } from '../../services';

import { postRequest } from '../../helpers';
import { authHeader } from '../../helpers';

import { NotificationManager } from 'react-notifications';

export default function PortfolioEdit(props) {

    const [portfolio, setPortfolio] = useState({
        title: '',
        currency: 'RUB',
        comission: '0.00',
        dateopen: new Date().toISOString().slice(0,10),
        memo: '',
        userId: authenticationService.currentUserValue.user.id
    });

    useEffect(() => {
        if (Object.keys(props.location.state).length > 0) {
            setPortfolio(props.location.state);
        };
    }, []);

    const handleUserInput = (e) => {
        const { name, value } = e.target;
        setPortfolio({ ...portfolio, [name]: value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        postRequest('/portfolios/save', portfolio)
        .then(result => {
            if (result.portfolio) {
                NotificationManager.success('Portfolio saved successfully', 'Success', 2000);
                props.history.push('/portfolios');
                return;
            }
            if (result.message) {
                NotificationManager.success(result.message, 'Success', 2000);
                props.history.push('/portfolios');
                return;
            }
        })
        .catch(err => {
            NotificationManager.error(err, 'Error', 2000);
        });
    };

    return (
        <div className="container-fluid">
            <h1 className="h3 mb-4 text-gray-800">Свойства портфеля</h1>

            <Card className="shadow mb-4">
                <Card.Body>
                    <form className="form" method="post" onSubmit={ handleSubmit } >
                        <div className="form-group form-row">
                            <label htmlFor="title">* Название портфеля:</label>
                            <input class="form-control mr-sm-2" id="title" name="title" type="text" value={portfolio.title} placeholder="Введите название портфеля" required="required" onChange={handleUserInput} />
                        </div>
                        <div className="form-group form-row">
                            <div className="col">
                                <label htmlFor="currency" class="mr-sm-2">Валюта:</label>
                                <select 
                                    name="currency" 
                                    id="currency" 
                                    className="form-control mr-sm-2" 
                                    value={ portfolio.currency } 
                                    onChange={ handleUserInput }
                                >
                                    <option value="RUB">
                                            RUB
                                    </option>
                                    <option value="USD">
                                            USD
                                    </option>
                                    <option value="EUR">
                                            EUR
                                    </option>
                                    <option value="GBP">
                                            GBP
                                    </option>
                                </select>
                            </div>
                            <div className="col">
                            <label htmlFor="comission" class="mr-sm-2">Комиссия по умолчанию, %:</label>
                                <input className="form-control mr-sm-2" id="comission" type="text" name="comission" value={ portfolio.comission } onChange={ handleUserInput } />
                            </div>
                        </div>

                        <div className="form-group form-row">
                                <label htmlFor="dateopen" class="mr-sm-2">Дата открытия:</label>
                                <input type="date" id="dateopen" name="dateopen" className="form-control mr-sm-2" 
                                value={ portfolio.dateopen ? portfolio.dateopen.slice(0,10) : new Date().toISOString().slice(0,10) }  onChange={ handleUserInput } />
                        </div>
                        
                        <div className="form-group form-row">
                            <label htmlFor="memo">Описание:</label>
                            <textarea name="memo" className="form-control mr-sm-2" placeholder="Описание"  onChange={ handleUserInput } >
                                { portfolio.memo }
                            </textarea>
                        </div>

                        <div className="form-group form-row d-flex justify-center ml-2">
                            <button type="submit" className="btn btn-primary btn-sm mr-sm-2">Сохранить</button>
                            <a href="/portfolios" className="btn btn-primary btn-sm">Отменить</a>
                        </div>
                    </form>
                </Card.Body>
            </Card>
        </div>
    );

}
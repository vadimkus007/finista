import React, { useState, useEffect } from 'react';

import { 
    Card,
//     Button
} from 'react-bootstrap';

import { NotificationManager } from 'react-notifications';

import { faEllipsisH, faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import Select from 'react-select';

import { getRequest, postRequest } from '../../helpers';

import './table-input.css';


export default function Goals(props) {

    const [portfolio, setPortfolio] = useState({});

    const [goals, setGoals] = useState([]);

    const [securities, setSecurities] = useState([]);

    const [sum, setSum] = useState(0);

    const [selectSecurity, setSelectSecurity] = useState({});

    useEffect(() => {
        const portfolio = JSON.parse(localStorage.getItem('portfolio'));
        if (portfolio) {
            setPortfolio(portfolio);
        } else {
            props.history.push({
                pathname: '/portfolios', 
                state: {
                    from: '/portfolio/rebalance/goals'
                }
            });
        };

        getGoals(portfolio.id);
        getSecurities();

    }, []);

    useEffect(() => {
        let s = 0;
        goals.forEach(goal => {
            s += Number(goal.amount);
        });
        setSum(s);
    }, [goals]);

    const getGoals = (portfolioId) => {
        const endPoint = '/portfolio/'+portfolioId+'/goals';
        getRequest(endPoint)
        .then(result => {
            setGoals(result.goals);
        })
        .catch(err => {
            NotificationManager.error(err, 'Error', 2000);
        });
    }

    const getSecurities = () => {
        const endPoint = '/securities';
        getRequest(endPoint)
        .then(request => {

            let securities = [];

            request.securities.forEach((secid) => {
                securities.push({ value: secid.secid, label: secid.secid + ' (' + secid.name + ') ('+secid.group+')' });
            });

            setSecurities(securities);
        })
        .catch(err => {
            NotificationManager.error(err, 'Error', 2000);
        });
    }



    const handleInput = (e) => {
//        e.preventDefault();
        var { name, value } = e.target;
        const index = goals.findIndex((element) => {
            if (element.secid === name) {
                return true;
            } else {
                return false;
            }
        });

        value = parseFloat(value);

        const _goals = [...goals];
        _goals[index].amount = value;
        setGoals(_goals);
    }

    const handleDeleteRow = (secid, e) => {
        // e.preventDefault();
        const index = goals.findIndex((element) => {
            if (element.secid === secid) {
                return true;
            } else {
                return false;
            }
        });
        var _goals = [...goals];
        _goals.splice(index, 1);
        setGoals(_goals);
    }

    const handleAddRow = () => {
        if (Object.keys(selectSecurity).length > 0) {
            let res = goals.findIndex((element) => {
                if (element.secid === selectSecurity.value) {
                    return true;
                } else {
                    return false;
                }
            });
            if (res === -1) {
                const _goals = [...goals];
                let obj = {
                    amount: '0.00',
                    id: '',
                    secid: selectSecurity.value
                };
                _goals.push(obj);
                setGoals(_goals);
            }
        }
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        const endPoint = '/portfolio/'+portfolio.id+'/goals';
        postRequest(endPoint, goals)
        .then(result => {
            if (result.success) {
                NotificationManager.success('Goals saved successfully', 'Success', 2000);
                props.history.push('/portfolio/rebalance');
                return;
            }
            if (result.message) {
                NotificationManager.info(result.message, 'Info', 2000);
                return;
            }
        })
        .catch(err => {
            NotificationManager.error(err, 'Error', 2000);
        });
    };

    const handleSecurity = (obj) => {
        setSelectSecurity(obj);
    }

    const cellMenu = (secid) => (
        <ul className="navbar-nav ml-auto">
            <li className="nav-item dropdown no-arrow mx-1">
                <a className="nav-link dropdown-toggle" href="#" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                    <FontAwesomeIcon icon = { faEllipsisH } />
                </a>
                <div className="dropdown-menu dropdown-menu-right shadow" aria-labelledby="userDropdown">
                    <button 
                        type="button" 
                        className="btn btn-sm dropdown-item" 
                        placeholder="Удалить" 
                        onClick={ (e) => handleDeleteRow(secid, e) }
                    >
                        <FontAwesomeIcon icon={ faTimes } size="sm" className="mr-2 text-gray-400" />
                        Удалить
                    </button>
                </div>
            </li>
        </ul>
    );

    return (
        <div className="container-fluid">
            <div className="d-sm-flex align-items-center justify-content-between mb-4">
                <h1 className="h3 text-gray-800">Редактирование целей</h1>
            </div>

            <div className="row">
                <div className="col-xl-6 ">
                    <div className="form-row">
                        <div className="form-group col-md-4">
                            <Select 
                                id="secid" 
                                options={ securities }
                                value = { selectSecurity }
                                placeholder='Выберите бумагу...'
                                onChange={ handleSecurity }
                            />
                        </div>
                        <div className="form-group col-md-2">
                            <button type="button" className="btn btn-primary btn-sm ml-auto form-control" onClick={handleAddRow} >Добавить</button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row">
                <div className="col-6">
                    <Card className="shadow mb-4">
                        <Card.Body>
                            <div className="row">
                                <div className="col-12">
                                    <table className="table table-bordered table-sm input" id="secidsTable">
                                        <thead>
                                            <tr>
                                                <th>Тикер</th>
                                                <th>Состав</th>
                                                <th className="text-xs-right" role="columnheader" width="20"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {goals.map((goal, i) => (
                                                <tr>
                                                    <td>{ goal.secid }</td>
                                                    <td>
                                                        <input 
                                                            type="text"
                                                            name={ goal.secid }
                                                            value={ goal.amount }
                                                            onChange={ handleInput }
                                                        />
                                                    </td>
                                                    <td>
                                                        { cellMenu(goal.secid) }
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfooter className="inline-block">
                                            <div className="row p-2">
                                                <div className="col-12">
                                                    <span className="mr-2">Сумма:</span>
                                                    <span>{ Number(sum).toFixed(2) }</span>
                                                </div>
                                            </div>
                                        </tfooter>
                                    </table>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-12">
                                    <div className="form-group form-inline justify-content-center">
                                        <button 
                                            type="submit" 
                                            className="btn btn-primary btn-sm form-control mr-sm-2" 
                                            onClick = { handleSubmit }
                                        >
                                            Сохранить
                                        </button>
                                        <a href="/portfolio/rebalance" className="btn btn-primary btn-sm mr-sm-2">Отменить</a>
                                    </div>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </div>
            </div>

        </div>
    );
}
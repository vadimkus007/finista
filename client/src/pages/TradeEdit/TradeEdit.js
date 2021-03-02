import React, { useState, useEffect } from 'react';

import { 
    Card,
    Button,
    Form,
    Row,
    Col
} from 'react-bootstrap';

import BaseSelect from 'react-select';

import { getRequest, postRequest } from '../../helpers';

import { NotificationManager } from 'react-notifications';

import Spinner from '../../components/Spinner';

import SelectSecids from '../../components/SelectSecids';

import FixRequiredSelect from '../../components/FixRequiredSelect';

const Select = props => (
  <FixRequiredSelect
    {...props}
    SelectComponent={BaseSelect}
    options={props.options}
  />
);


const tradeTypeOptions = [
    {
        value: '0',
        label: 'Акция/ETF/ПИФ'
    },
    {
        value: '1',
        label: 'Облигация'
    },
    {
        value: '2',
        label: 'Деньги'
    }
];

const shareOptions = [
        {
            value: '1',
            label: 'Покупка'
        },
        {
            value: '2',
            label: 'Продажа'
        },
        {
            value: '3',
            label: 'Дивиденд'
        }
    ];

    const bondOptions = [
        {
            value: '7',
            label: 'Покупка'
        },
        {
            value: '8',
            label: 'Продажа'
        },
        {
            value: '4',
            label: 'Погашение'
        },
        {
            value: '5',
            label: 'Купон'
        },
        {
            value: '6',
            label: 'Амортизация'
        }
    ];

    const casheOptions = [
        {
            value: '1',
            label: 'Внести'
        },
        {
            value: '2',
            label: 'Вывести'
        }
    ];

export default function TradeEdit(props) {

    const [portfolio, setPortfolio] = useState({});

    const [trade, setTrade] = useState({
        id: '',
        portfolioId: '',
        secid: '',
        operationId: '1',
        date: new Date().toISOString().slice(0, 10),
        price: '',
        amount: '',
        value: '100',
        accint: '0',
        comission: '',
        comment: ''
    });

    const [tradeType, setTradeType] = useState(tradeTypeOptions[0]);

    const [loading, setLoading] = useState(true);

    const [secids, setSecids] = useState([]);

    const [secidSelected, setSecidSelected] = useState({});

    const [selectOperation, setSelectOperation] = useState({});

    const [activeOperations, setActiveOperations] = useState({});

    const SPINNER = (<div><Spinner /></div>);



    useEffect(() => {

        // get secids for options
        const fetchOptions = async () => {
            const result = await getSecids();
        }
        fetchOptions();

        // set portfolio state or redirect to select portfolio
        const portfolio = JSON.parse(localStorage.getItem('portfolio'));
        if (portfolio) {
            setPortfolio(portfolio);
            let value = portfolio.id;
            setTrade({...trade, ['portfolioId']:value});
        } else {
            props.history.push({
                pathname: '/portfolios', 
                state: {
                    from: '/portfolio/trades/edit'
                }
            });
        }

        if (Object.keys(props.location.state).length > 0) {
            setTrade(props.location.state);
        }
        
        

            switch (props.location.state.group) {
                case 'Облигация':
                    setTradeType(tradeTypeOptions[1]);
                    break;
                case null:
                    setTradeType(tradeTypeOptions[2]);
                    break;
                default:
                    setTradeType(tradeTypeOptions[0]);
                    break;
            };

        if (props.location.state.secid == 'RUB') {
            setTradeType(tradeTypeOptions[2]);
        }

        updateOperation();

        // hide spinner
        setLoading(false);

    },[]);

    useEffect(() => {
        updateOperation();
        if (secids.length > 0 && tradeType.value) {
            selectSecid(trade.secid);
        }
    });

    const updateOperation = () => {
        let op;
        switch (tradeType.value) {
            case '0':
                op = shareOptions;
                break;
            case '1':
                op = bondOptions;
                break;
            case '2':
                op = casheOptions;
                break;
            default:
                break;
        }
        let obj = op.find((element, index, array) => {
            if (Number(element.value) == trade.operationId) {
                return true;
            } else {
                return false;
            }
        });
        setActiveOperations(op);
        setSelectOperation(obj);
    }

    const selectSecid = (secid) => {
        let obj = secids[tradeType.value].find((element, index, array) => {
            if (element.value == secid) {
                return true;
            } else {
                return false;
            }
        });

        setSecidSelected(obj);
    }

    
    const handleTradeType = (obj) => {
        setTradeType(obj);
        if (obj.value == '2') {
            setTrade({...trade, ['secid']:'RUB'});
        } else {
            if (trade.secid == 'RUB') {
                setTrade({...trade, ['secid']:''});
            }
        }
        updateOperation();
    }

    const handleSecids = (obj) => {
        setSecidSelected(obj);
        setTrade({...trade, ['secid']:obj.value});
    }

    const handleOperations = (obj) => {
        setSelectOperation(obj);
        setTrade({...trade, ['operationId']:obj.value});
    }

    const handleUserInput = (e) => {
        const { name, value } = e.target;
        setTrade({ ...trade, [name]: value });
    };

    const getSecids = () => {
        const endPoint = '/securities';
        getRequest(endPoint)
        .then(request => {

            let shares = [];
            let bonds = [];
            let rubles = [];

            request.securities.map((secid) => {
                if (secid.group === 'Облигация') {
                    bonds.push({ value: secid.secid, label: secid.secid + ' (' + secid.name + ') ('+secid.group+')' });
                } else {
                    shares.push({ value: secid.secid, label: secid.secid + ' (' + secid.name + ') ('+secid.group+')' });
                }
            });

            rubles.push({value: 'RUB', label: 'Рубли'});

            let final = [];
            final[0] = shares;
            final[1] = bonds;
            final[2] = rubles;
            setSecids(final);
        })
        .catch(err => {
            NotificationManager.error(err, 'Error', 2000);
        });
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        postRequest('/portfolio/trades/save', trade)
        .then(result => {
            if (result.trade) {
                NotificationManager.success('Trade saved successfully', 'Success', 2000);
                props.history.push('/portfolio/trades');
                return;
            }
            if (result.message) {
                NotificationManager.success(result.message, 'Success', 2000);
                props.history.push('/portfolio/trades');
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
        });
    }

    

    return (
        <div className="container-fluid">
            <div className="d-sm-flex align-items-center justify-content-between mb-4">
                <h1 className="h3 mb-4 text-gray-800">Изменить сделку</h1>
            </div>

            <Card className="shadow mb-4">
                <Card.Body>
                    
                    { loading ? SPINNER :  
                    <Form className="form" method="post" onSubmit={ handleSubmit } >

                        <div className="form-group form-row">
                            <div className="col">
                                <label htmlFor="tradeType">Тип сделки:</label>
                                <Select 
                                    id="tradeType" 
                                    onChange={handleTradeType} 
                                    options={ tradeTypeOptions }  
                                    isSearchable={false}
                                    value={ tradeType }
                                />
                            </div>
                            { tradeType.value !== '2' && (
                            <div className="col">
                                <label htmlFor="secid">
                                    Тикер*
                                </label>
                                <Select 
                                    id="secid" 
                                    options={ secids[tradeType.value] }
                                    value = { secidSelected }
                                    onChange={ handleSecids }
                                    required={'required'}
                                />
                            </div>
                            )}
                            
                        </div>

                        <div className="form-group form-row">
                            <div className="col">
                                <label htmlFor="operationId" className="">Операция:</label>
                                <Select 
                                    id="operationId" 
                                    name="operationId" 
                                    required="required" 
                                    value={selectOperation}
                                    options={ activeOperations }
                                    onChange={ handleOperations }
                                />
                                   
                            </div>
                            <div className="col">
                                <label htmlFor="date" className="">Дата:*</label>
                                <input 
                                    type="date" 
                                    id="date" 
                                    className="form-control sm-2" 
                                    name="date" 
                                    value={trade.date ? trade.date.slice(0,10) : new Date().toISOString().slice(0,10)} 
                                    required="required" 
                                    onChange={ handleUserInput }
                                />
                            </div>
                        </div>

                        <div className="form-group form-row">
                            <div className="col">
                                <label ntmlFor="price" class="" id="labelPrice">Цена:*</label>
                                <input 
                                    type="text" 
                                    id="price" 
                                    className="form-control sm-2 mb-2" 
                                    name="price" 
                                    value={trade.price} 
                                    required="required" 
                                    onChange={ handleUserInput }
                                />
                            </div>
                            
                            {tradeType.value !== '2' && (
                            <div className="col">
                                <label htmlFor="amount" className="" id="labelAmount">Количество:*</label>
                                <input 
                                    type="text" 
                                    id="amount" 
                                    className="form-control mr-sm-2 mb-2" 
                                    name="amount" 
                                    value={trade.amount} 
                                    placeholder="Количество" 
                                    required="required" 
                                    onChange={ handleUserInput }
                                />
                            </div>
                            )}
                        </div>

                        { tradeType.value === '1' && ( 

                        <div className="form-row mb-2">
                            <div className="col">
                                <label htmlFor="value" id="valueLabel">Номинал, руб.:*</label>
                                <input 
                                    type="text" 
                                    id="value" 
                                    className="form-control" 
                                    name="value" 
                                    value={trade.value} 
                                    placeholder="Номинал" 
                                    required="required" 
                                    onChange={ handleUserInput }
                                />
                            </div>
                            <div className="col">
                                <label htmlFor="accint" id="accintLabel">НКД, руб.:</label>
                                <input 
                                    type="text" 
                                    id="accint" 
                                    className="form-control" 
                                    name="accint" 
                                    value={trade.accint} 
                                    placeholder="НКД" 
                                    onChange={ handleUserInput }
                                />
                            </div>
                        </div>

                        )}

                        <div className="form-group">
                            <label htnlFor="comission">Комиссия:</label>
                            <input 
                                type="text" 
                                id="comission" 
                                className="form-control" 
                                name="comission" 
                                value={trade.comission} 
                                placeholder="Комиссия" 
                                onChange={ handleUserInput }
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="comment">Заметка:</label>
                            <input 
                                type="text" 
                                id="comment" 
                                className="form-control" 
                                name="comment" 
                                value={trade.comment} 
                                placeholder="Заметка" 
                                onChange={ handleUserInput }
                            />
                        </div>

                        <div className="form-group justify-center">
                            <button type="submit" className="btn btn-primary btn-sm mr-sm-2" >Сохранить</button>
                            <a href="/portfolio/trades" className="btn btn-primary btn-sm mr-sm-2">Отменить</a>
                        </div>

                    </Form>

                    }
                </Card.Body>
            </Card>

        </div>
    );

}
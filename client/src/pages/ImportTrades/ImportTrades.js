import React, { useState, useEffect } from 'react';
import { Card } from 'react-bootstrap';
import Select from 'react-select';

import { NotificationManager } from 'react-notifications';

import { postFile } from '../../helpers';

export default function ImportTrades(props) {

    const [portfolio, setPortfolio] = useState({});

    const [broker, setBroker] = useState({value: 0, label: 'Сбербанк'});

    const [files, setFiles] = useState({});

    const options = [
        {
            value: 0,
            label: 'Сбербанк'
        }
    ];

    useEffect(() => {
        const portfolio = JSON.parse(localStorage.getItem('portfolio'));
        if (portfolio) {
            setPortfolio(portfolio);
        } else {
            props.history.push({
                pathname: '/portfolios', 
                state: {
                    from: '/portfolio/trades/import'
                }
            });
        };



    }, []);

    const handleSelect = (obj) => {
        setBroker(obj);
    }

    const handleFileSelect = (e) => {
        const name = e.target.name;
        const file = e.target.files;
        setFiles({...files, [name]: file});
    }

    const handleUploadFiles = (e) => {
        e.preventDefault();
        if (Object.keys(files).length === 0) {
            NotificationManager.error('No file selected', 'Error', 2000);
            return;
        }
        const data = new FormData();
        data.append('broker', broker.value);
        if (files.trades) {
            data.append('trades', files.trades[0]);
        }
        if (files.cashe) {
            data.append('cashe', files.cashe[0]);
        }
        uploadFiles(data);
    }

    const uploadFiles = (data) => {
        const endPoint = '/portfolio/'+portfolio.id+'/trades/import';
        postFile(endPoint, data)
        .then(result => {
            if (result.message) {
                NotificationManager.success(result.message, 'Success', 2000);
            }
        })
        .catch(err => {
            NotificationManager.error(err.message, 'Error', 2000);
        });
    }

    return (
        <div className = "container-fluid">
            <div className="d-sm-flex align-items-center justify-content-between mb-4">
                <h1 className="h3 text-gray-800">Импорт сделок - { portfolio.title }</h1>
            </div>

            <div className="row">
                <div className="col-12">
                    <Card className="shadow mb-4">
                        <Card.Header>
                            <h6 class="m-0 text-primary font-weight-bold">Загрузка отчетов</h6>
                        </Card.Header>
                        <Card.Body>
                            <form className="form" onSubmit={ handleUploadFiles }>
                                <div className="row">
                                    <div className="col">
                                        <p>Допустимые расширения файлов: <code>.xlsx</code></p>
                                        <p>В настояший момент поддерживается импорт сделок и зачислений от брокера Сбербанк, которые можно получить через сбербанк-online.</p>
                                    </div>
                                </div>
                                <hr />
                                <div className="row">
                                    <div className="col-2">
                                        <label htmlFor="broker">Выберите брокера</label>
                                    </div>
                                    <div className="col-10">
                                        <Select 
                                            id="broker"
                                            name="broker"
                                            required="required"
                                            options={ options }
                                            value = { broker }
                                        />
                                    </div>
                                </div>

                                <hr />

                                <div className="form-group form-row">
                                    <label htmlFor="trades">Загрузить отчет по сделкам</label>
                                    <input type="file" id="trades" name="trades" class="form-control" onChange={ handleFileSelect }/>
                                </div>
                                <hr />
                                <div class="form-group form-row">
                                    <label for="cashe">Загрузить отчет по зачислениям и списаниям</label>
                                    <input type="file" id="cashe" name="cashe" class="form-control" onChange={ handleFileSelect }/>
                                </div>
                                <hr />
                                <div class="form-group form-row">
                                    <button type="submit" class="btn btn-primary btn-sm mr-sm-2">Загрузить</button>
                                    <a href="/portfolio/trades" class="btn btn-primary btn-sm mr-sm-2">Отменить</a>
                                </div>
                            </form>
                        </Card.Body>
                    </Card>
                </div>
            </div>
        </div>
    );
}
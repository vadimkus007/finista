import React from 'react';

import { Card } from 'react-bootstrap';

import { faRubleSign } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import PopoverInfo from '../PopoverInfo';

const XIRR_INFO = 'Внутренняя ставка доходности портфеля, расчитывается как функция XIRR() MS Excel. Учитывает все денежные поступления или списания за период.';
const PL_INFO = 'Доход/убыток портфеля расчитывается как разность между стоимостью портфеля на конец периода и количеством денежных средств, поступивших в портфель.';
const COMISSION_INFO = 'Сумма всех комиссий, налогов и др. списаний за период';
const DIVIDENDS_INFO = 'Сумма дивидендов, полученных по всем инструментов за период.';

export default function CardProfit(props) {

    return (
        <Card className="shadow mb-4">
            <Card.Header>
                <h6 class="m-0 font-weight-bold text-primary">Основные показатели</h6>
            </Card.Header>
            <Card.Body>

                <div class="d-inline-flex flex-row justify-content-between col-12">
                    <div>
                        Годовая доходность (XIRR): 
                        <PopoverInfo className="ml-2" content={ XIRR_INFO } />
                    </div>
                    <div>
                        { props.data ? Number(props.data.profit).toFixed(2) : '0.00' }
                        <span className="ml-2">%</span>
                    </div>
                </div>

                <div class="d-inline-flex flex-row justify-content-between col-12">
                    <div>
                        Profit/Loss портфеля: 
                        <PopoverInfo className="ml-2" content={ PL_INFO } />
                    </div>
                    <div>
                        { props.data ? Number(props.data.PL).toFixed(2) : '0.00' }
                        <span className="ml-2"><FontAwesomeIcon icon={faRubleSign} size="sm" /></span>
                    </div>
                </div>
                                
                <hr />

                <div class="d-inline-flex flex-row justify-content-between col-12">
                    <div>
                        Начальный баланс: 
                    </div>
                    <div>
                        { props.data ? Number(props.data.startBalance).toFixed(2) : '0.00' }
                        <span className="ml-2"><FontAwesomeIcon icon={faRubleSign} size="sm" /></span>
                    </div>
                </div>

                <div class="d-inline-flex flex-row justify-content-between col-12">
                    <div>
                        Конечный баланс: 
                    </div>
                    <div>
                        { props.data ? Number(props.data.endBalance).toFixed(2) : '0.00' }
                        <span className="ml-2"><FontAwesomeIcon icon={faRubleSign} size="sm" /></span>
                    </div>
                </div>

                <hr />

                <div class="d-inline-flex flex-row justify-content-between col-12">
                    <div>
                        Комиссии и др. расходы: 
                        <PopoverInfo className="ml-2" content={ COMISSION_INFO } />
                    </div>
                    <div>
                        { props.data ? Number(props.data.comission).toFixed(2) : '0.00' }
                        <span className="ml-2"><FontAwesomeIcon icon={faRubleSign} size="sm" /></span>
                    </div>
                </div>

                <hr />

                <div class="d-inline-flex flex-row justify-content-between col-12">
                    <div>
                        Пополнение: 
                    </div>
                    <div>
                        { props.data ? Number(props.data.income).toFixed(2) : '0.00' }
                        <span className="ml-2"><FontAwesomeIcon icon={faRubleSign} size="sm" /></span>
                    </div>
                </div>

                <div class="d-inline-flex flex-row justify-content-between col-12">
                    <div>
                        Вывод: 
                    </div>
                    <div>
                        { props.data ? Number(props.data.outcome).toFixed(2) : '0.00' }
                        <span className="ml-2"><FontAwesomeIcon icon={faRubleSign} size="sm" /></span>
                    </div>
                </div>

                <hr />

                <div class="d-inline-flex flex-row justify-content-between col-12">
                    <div>
                        Дивиденды: 
                        <PopoverInfo className="ml-2" content={ DIVIDENDS_INFO } />
                    </div>
                    <div>
                        { props.data ? Number(props.data.dividends).toFixed(2) : '0.00' }
                        <span className="ml-2"><FontAwesomeIcon icon={faRubleSign} size="sm" /></span>
                    </div>
                </div>
                                            
            </Card.Body>
        </Card>
    );

}
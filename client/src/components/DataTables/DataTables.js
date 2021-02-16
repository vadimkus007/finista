import React from 'react';
import ReactTable from '../ReactTable';

// import 'react-bootstrap-table-next/dist/react-bootstrap-table2.min.css';

function SharesTable (props) {

    const data = props.data;

    const columns = [
        {
            accessor: 'SECID',
            Header: 'Тикер',
            Cell: (row) => (<a href={'/quotes/'+row.value} >{row.value}</a>)
        },
        {
            accessor: 'SHORTNAME',
            Header: 'Компания'
        },
        {
            accessor: 'LAST',
            Header: 'Последняя'
        },
        {
            Header: 'Изменение, %',
            accessor: 'LASTTOPREVPRICE',
            Cell: row => <span className={(Number(row.value)>0)?"text-success":"text-danger"}>{row.value}</span>
        },
        {
            accessor: 'OPEN',
            Header: 'Открытие'
        },
        {
            accessor: 'LOW',
            Header: 'Мин.'
        },
        {
            accessor: 'HIGH',
            Header: 'Макс.'
        },
        {
            accessor: 'WAPRICE',
            Header: 'Ср. взвеш.',
            sort: true
        },
        {
            accessor: 'VALTODAY',
            Header: 'Объем'
        },
        {
            accessor: 'TIME',
            Header: 'Время'
        }
    ];

    return (
        <ReactTable data={ data } columns={ columns } />

    );
};

function IndexTable (props) {

    const data = props.data;

    const columns = [
        {
            accessor: 'SECID',
            Header: 'Тикер',
            Cell: (row) => (<a href={'/quotes/'+row.value} >{row.value}</a>)
        },
        {
            accessor: 'NAME',
            Header: 'Название'
        },
        {
            accessor: 'CURRENTVALUE',
            Header: 'Текущее значение'
        },
        {
            Header: 'Изменение за день',
            accessor: 'LASTCHANGETOOPENPRC'
        },
        {
            accessor: 'MONTHCHANGEPRC',
            Header: 'Изменение за месяц'
        },
        {
            accessor: 'YEARCHANGEPRC',
            Header: 'Изменение за год'
        }
    ];

    return (
        <ReactTable data={ data } columns={ columns } />

    );
};

function BondsTable (props) {

    const data = props.data;

    const columns = [
        {
            accessor: 'SECID',
            Header: 'Тикер',
            Cell: (row) => (<a href={'/quotes/'+row.value} >{row.value}</a>)
        },
        {
            accessor: 'SHORTNAME',
            Header: 'Название'
        },
        {
            accessor: 'LAST',
            Header: 'Цена посл., %'
        },
        {
            Header: 'Изменение посл., %',
            accessor: 'LASTCHANGEPRCNT'
        },
        {
            accessor: 'WAPRICE',
            Header: 'Ср. взв. цена, %'
        },
        {
            accessor: 'YIELD',
            Header: 'Доход. посл. сд.'
        },
        {
            accessor: 'DURATION',
            Header: 'Дюрация'
        },
        {
            accessor: 'COUPONVALUE',
            Header: 'Сумма купона'
        },
        {
            accessor: 'OFFERDATE',
            Header: 'Дата оферты'
        },
        {
            accessor: 'MATDATE',
            Header: 'Дата погашения'
        },
        {
            accessor: 'YIELDTOOFFER',
            Header: 'Доходность к оферте'
        },
        {
            accessor: 'YIELDLASTCOUPON',
            Header: 'Доходность для последнего купона'
        },
    ];

    return (
        <ReactTable data={ data } columns={ columns } />

    );
};

export {
    SharesTable,
    IndexTable,
    BondsTable
} 
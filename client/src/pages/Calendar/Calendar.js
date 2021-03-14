import React, { useState, useEffect } from 'react';

import { Card } from 'react-bootstrap';

import { NotificationManager } from 'react-notifications';

import moment from 'moment';

import { Calendar, momentLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import { getRequest } from '../../helpers';

import MyCalendar from '../../components/MyCalendar';

const localizer = momentLocalizer(moment); // or globalizeLocalizer

const tempEvents = [
    {
        title: 'AFLT',
        start: new Date(moment('08.03.2021','DD.MM.YYYY')),
        end: new Date(moment('08.03.2021','DD.MM.YYYY')),
        allDay: true,
        resource: {
            shortname: 'Aeroflot',
            dividend: 10,
            profit: '12%',
            DSI: '0.57'
        }
    },
    {
        title: 'GAZP',
        start: new Date(moment('10.03.2021','DD.MM.YYYY')),
        end: new Date(moment('10.03.2021','DD.MM.YYYY')),
        allDay: true,
        resource: {
            shortname: 'Gazprom',
            dividend: 10,
            profit: '12%',
            DSI: '0.57'
        }
    },
];

export default function CustomCalendar(props) {

    const [events, setEvents] = useState([]);

    useEffect(() => {
        loadDividends();
        // setEvents(tempEvents);
    }, []);

    const loadDividends = () => {
        const endPoint = '/dividends';
        getRequest(endPoint)
        .then(results => {
            if (results.error) {
                NotificationManager.error(results.error, 'Error', 2000);
                return;
            }

            var _events = [];

            results.data.forEach(row => {
                if (row.date !== '') {
                    let obj ={
                        title: row.secid,
                        start: new Date(moment(row.date,'DD.MM.YYYY')),
                        end: new Date(moment(row.date, 'DD.MM.YYYY')),
                        allDay: true,
                        resource: row
                    }
                    _events.push(obj);
                }
            });

            setEvents(_events);

        })
        .catch(err => {
            NotificationManager.error(err, 'Error', 2000);
        });
    }

    return (
        <div className="container-fluid">
            <div className="d-sm-flex align-items-center justify-content-between">
                <h1 className="h3 text-gray-800">Календарь событий</h1>
            </div>

            <div className="row">
                <div className="col-12">

                    <Card className="shadow mb-4">
                        <Card.Body>

                            <MyCalendar 
                                localizer={ localizer }
                                events={ events }
                                views={['month','week','year']}
                                style={ { height: 700 } }
                                tooltipAccessor={ 
                                    (event) => event.resource.shortname + ' | ' + 
                                    'dividend=' + event.resource.dividend + ' | ' + 
                                    'profit='+event.resource.profit + ' | ' +
                                    'DSI='+event.resource.DSI
                                }
                            />

                        </Card.Body>

                    </Card>

                </div>
            </div>

        </div>
    );
}
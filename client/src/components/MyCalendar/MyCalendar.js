import React from 'react';

import moment from 'moment';

import { Calendar, momentLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import Year from './Year';

const localizer = momentLocalizer(moment); // or globalizeLocalizer
localizer.formats.yearHeaderFormat = 'YYYY';

export default function MyCalendar(props) {

    return (
        <div>
            <Calendar 
                localizer = { localizer }
                events = { props.events }
                views = { {
                    year: Year,
                    month: true,
                    week: true
                } }
                messages={ { year: 'Year' } }
                    
                style = {props.style}
                tooltipAccessor = { props.tooltipAccessor }
            />
        </div>
    );

}
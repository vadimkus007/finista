// import PropTypes from 'prop-types'
import React from 'react';
import moment from 'moment';

import dates from 'react-big-calendar/lib/utils/dates';
import { Calendar, Views, Navigate } from 'react-big-calendar';

import YearGrid from './YearGrid';


class Year extends React.Component {
    render() {
        let { date, events } = this.props;
        date = date ? date : new Date();

        let range = Year.range(date);

        return (
            <YearGrid {...this.props} range={range} eventOffset={15} />
        );
    }
}

Year.range = (date) => {
    let range = [];
    let year = moment(date).format('YYYY');
    let start = new Date( moment(`${year}-01-01`, 'YYYY-MM-DD'));
    let end = new Date( moment(`${year}-12-31`, 'YYYY-MM-DD'));
    return {start: start, end: end};
}

Year.navigate = (date, action) => {
    switch (action) {
        case Navigate.PREVIOUS:
            return new Date(moment(date).add(-1, 'Y'));
        case Navigate.NEXT:
            return new Date(moment(date).add(1, 'Y'));
        default:
            return date;
    }
}

Year.title = date => {
    return `${ moment(date).format('YYYY') }`;
}

export default Year;



import React from 'react';

import moment from 'moment';

import './year.css';

export default function YearGrid(props) {

    const { 
        range, 
        events, 
        eventOffset, 
        date,
        tooltipAccessor 
    } = props;

    const MONTHS = [
        'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const rows = [
        [0, 1, 2, 3],
        [4, 5, 6, 7],
        [8, 9, 10, 11]
    ];

    const renderHeader = () => {
        return (
            <div className="rbc-row rbc-year-header" role="row">
            </div>
        );
    }

    const renderOverlay = (row) => {
        return (
            <div className="rbc-row-bg">
                {row.map((month) => {
                    let todayClass = (moment(date).month() === month) ? 'rbc-today' : '';
                     return (<div className={'rbc-month-bg '+todayClass}></div>);
                })}
            </div>
        );
    }

    const renderContentHeader = (row) => {
        return (
            <div className="rbc-row">
                { row.map(month => {
                    return(
                    <div className="rbc-date-cell" role="cell">
                        <a href="#" role="cell">{ MONTHS[month] }</a>
                    </div>
                    )
                })}
            </div>
        );
    }

    const renderEvents = (row) => {
        
        var eventsMap = [];
        row.forEach(month => {
            let ev = [];
            let count = 0;
            const eventLimit = 5;
            events.forEach(event => {
                if (moment(event.start).month() === month && moment(event.start).year() === moment(date).year()) {
                    count += 1;
                    if (count < eventLimit) {
                        ev.push(event);    
                    }
                }
            });
            if (count >= eventLimit) {
                ev.push({limit: count - eventLimit});
            }
            eventsMap[month] = ev;
        });

        return (
            <React.Fragment>
            <div className="rbc-row">
            { row.map(month => ( 
                    <div className="rbc-row-segment" style={ { 'flexBasis': '25%', 'max-width': '25%'} }>
                        { eventsMap[month].map((item) => {
                            return (!item.limit) ? (
                            <div className="rbc-event rbc-event-allday rbc-event-mb-1" tabIndex={0} onClick={props.onSelectEvent} >
                                <div className="rbc-event-content" title={ props.tooltipAccessor(item) }>
                                    { item.title }
                                </div>
                            </div>
                        ) : 
                            (<a className="rbc-show-more" href="#">+{ item.limit } more</a>);
                        }
                        ) }
                    </div> 
            
            )) }
            </div>
            </React.Fragment>
        );
    }

    const renderContent = (row) => {
        return (
            <div className="rbc-row-content">
                { renderContentHeader(row) }
                { renderEvents(row) }
            </div>
        );
    }

    const renderRow = (row) => {
        return (
            <div className="rbc-year-row" role="rowgroup">
                { renderOverlay(row) }
                { renderContent(row) }
            </div>
        );
    }

    return (
        <div className="rbc-year-view" role="table" aria-label="Year View">
            
            { renderHeader() }

            { rows.map((row) => {
                return renderRow(row)
            }) }
            
        </div>
    );
}
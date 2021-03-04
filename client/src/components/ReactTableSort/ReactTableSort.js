import React from 'react';

import { useTable, useSortBy } from 'react-table';

import { faSort } from "@fortawesome/free-solid-svg-icons";
import { faSortUp } from "@fortawesome/free-solid-svg-icons";
import { faSortDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

// default prop getter
const defaultPropGetter = () => ({});

export default function ReactTableSort({
    columns, 
    data,
    getHeaderProps = defaultPropGetter,
    getColumnProps = defaultPropGetter,
    getRowProps = defaultPropGetter,
    getCellProps = defaultPropGetter
}) {

    

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow
    } = useTable(
        {
            columns,
            data
        },
        useSortBy
    );

    return (
        <div className="row">
            <div className="col">
                <table className="table table-striped table-hover table-bordered" {...getTableProps()}>
                    <thead>
                        {headerGroups.map((headerGroup) => (
                            <tr {...headerGroup.getHeaderGroupProps()}>
                                {headerGroup.headers.map(column => (
                                    <th 
                                        {...column.getHeaderProps([
                                            {
                                                className: column.className,
                                                style: column.style
                                            },
                                            getColumnProps(column),
                                            getHeaderProps(column),
                                            column.getSortByToggleProps()
                                        ])}
                                    >
                                        {column.render('Header')}
                                        <span className="ml-2">
                                                {column.isSorted
                                                    ? column.isSortedDesc
                                                        ? <FontAwesomeIcon icon={faSortDown} />
                                                        : <FontAwesomeIcon icon={faSortUp} />
                                                    : <FontAwesomeIcon icon={faSort} className="text-gray-300" />}
                                        </span>
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody {...getTableBodyProps()}>
                        {rows.map((row, i) => {
                            prepareRow(row);
                            return (
                                <tr {...row.getRowProps(getRowProps(row))}>
                                    {row.cells.map(cell => {
                                        return (
                                            <td
                                            // Return an array of prop objects and react-table will merge them appropriately
                                            {...cell.getCellProps([
                                              {
                                                className: cell.column.className,
                                                style: cell.column.style,
                                              },
                                              getColumnProps(cell.column),
                                              getCellProps(cell),
                                            ])}
                                          >
                                            {cell.render('Cell')}
                                          </td>
                                        )
                                    })}
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );

}
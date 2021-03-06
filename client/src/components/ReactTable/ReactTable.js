import React  from 'react';

import { useTable, useFilters, useGlobalFilter, useAsyncDebounce, usePagination, useSortBy } from 'react-table';

import Pagination from 'react-js-pagination';

import { faSort } from "@fortawesome/free-solid-svg-icons";
import { faSortUp } from "@fortawesome/free-solid-svg-icons";
import { faSortDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import './ReactTable.css';

// default prop getter
const defaultPropGetter = () => ({});


// Define a default UI for filtering
    function GlobalFilter({
        preGlobalFilteredRows,
        globalFilter,
        setGlobalFilter,
    }) {
        const count = preGlobalFilteredRows.length
        const [value, setValue] = React.useState(globalFilter)
        const onChange = useAsyncDebounce(value => {
            setGlobalFilter(value || undefined)
        }, 200)

        return (
            <div className="dataTables_filter">
            <label>
                Search:{' '}
                <input
                    className="form-control form-control-sm"
                    value={value || ""}
                    onChange={e => {
                        setValue(e.target.value);
                        onChange(e.target.value);
                    }}
                    placeholder={`${count} records...`}
                />
            </label>
            </div>
        )
    }

    function DefaultColumnFilter({
        column: { filterValue, preFilteredRows, setFilter },
    }) {
        const count = preFilteredRows.length

        return (
            <input
                className="form-control"
                value={filterValue || ''}
                onChange={e => {
                    setFilter(e.target.value || undefined)
                }}
                placeholder={`Search ${count} records...`}
            />
        )
    }


function ReactTable({
    columns, 
    data,
    getHeaderProps = defaultPropGetter,
    getColumnProps = defaultPropGetter,
    getRowProps = defaultPropGetter,
    getCellProps = defaultPropGetter
}) {
    
    const defaultColumn = React.useMemo(
        () => ({
            // Default Filter UI
            Filter: DefaultColumnFilter,
        }),
        []
    )

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow,
        state,
        preGlobalFilteredRows,
        setGlobalFilter,
        page,
//        canPreviousPage,
//        canNextPage,
        pageOptions,
//        pageCount,
        gotoPage,
//        nextPage,
//        previousPage,
        setPageSize,
        state: { pageIndex, pageSize }
    } = useTable({
            columns,
            data,
            defaultColumn,
            initialState: { pageIndex: 0, pageSize: 10 }
        },

        useFilters,
        useGlobalFilter,
        useSortBy,
        usePagination
    );

    // pagination
/*    let paginationConfig = {
      totalPages: 22,
      currentPage: 15,
      showMax: 5,
      size: "md",
      threeDots: true,
      prevNext: true,
      href: 'https://example.com/items?page=*', // * will be replaced by the page number
      pageOneHref: 'https://example.com/items',
      shadow: true
    };
*/
    function handlePageChange(pageNumber) {
        gotoPage(pageNumber-1);
    }

    return (

        <div>
            <div className="row mt-4">
                <div className="col-sm-12 col-md-6">
                    <div className="dataTables_length">
                        <label>
                            Show 
                            <select 
                                className="custom-select custom-select-sm form-control form-control-sm"
                                value={pageSize}
                                onChange={e => {
                                    setPageSize(Number(e.target.value))
                                }}
                            >
                                {[5, 10, 20, 30, 40, 50].map(pageSize => (
                                    <option key={pageSize} value={pageSize}>
                                        {pageSize}
                                    </option>
                                ))}
                            </select>
                            entries
                        </label>
                    </div>
                </div>
                <div className="col-sm-12 col-md-6">
                    <GlobalFilter
                        preGlobalFilteredRows={preGlobalFilteredRows}
                        globalFilter={state.globalFilter}
                        setGlobalFilter={setGlobalFilter}
                    />
                </div>
                                    
            </div>

        <table className="table" {...getTableProps()}>
            <thead>
                {headerGroups.map((headerGroup) => (
                    <tr {...headerGroup.getHeaderGroupProps()}>
                        {headerGroup.headers.map(column => (
                            <th {...column.getHeaderProps([
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
                {page.map((row, i) => {
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
    
        <div className="row">
            <div className="col-sm-12 col-md-5">
                <div className="dataTables_info">
                    Страница {pageIndex+1} из {pageOptions.length}
                </div>
            </div>
            <div className="col-sm-12 col-md-7">
                <div className="dataTables_paginate">
                    <Pagination
                        itemClass="page-item"
                        linkClass="page-link"
                        activePage={pageIndex+1}
                        itemsCountPerPage={pageSize}
                        totalItemsCount={rows.length}
                        pageRangeDisplayed={5}
                        onChange={handlePageChange}
                    />
                </div>
            </div>
            
        </div>

        </div>

    );

};

export default ReactTable;

import React from 'react';

import { faEllipsisH } from '@fortawesome/free-solid-svg-icons';
import { faEdit } from '@fortawesome/free-solid-svg-icons';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function TableCellMenu(props) {
    return (
        <ul className="navbar-nav ml-auto">
                <li className="nav-item dropdown no-arrow mx-1">
                        <a className="nav-link dropdown-toggle" href="#" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                            <FontAwesomeIcon icon={faEllipsisH} />
                        </a>
                        <div className="dropdown-menu dropdown-menu-right shadow" aria-labelledby="userDropdown">
                                            
                            <button className="btn btn-sm dropdown-item" style={{display:'inline-block'}} placeholder="Редактировать" onClick={props.onEdit} >
                                <span className="mr-2">
                                    <FontAwesomeIcon icon={faEdit} />
                                </span>
                                Редактировать
                            </button>

                            <button className="btn btn-sm dropdown-item" style={{display:'inline-block'}} placeholder="Удалить" onClick={props.onDelete} >
                                <span className="mr-2">
                                    <FontAwesomeIcon icon={faTimes} />
                                </span>
                                Удалить
                            </button>


                        </div>
                </li>
        </ul>
    );
}
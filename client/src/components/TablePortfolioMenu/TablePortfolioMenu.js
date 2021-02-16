import React from 'react';

import { faEllipsisH } from '@fortawesome/free-solid-svg-icons';
import { faEdit } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function TablePortfolioMenu(props) {
    return (
        <ul className="navbar-nav ml-auto">
                <li className="nav-item dropdown no-arrow mx-1">
                        <a className="nav-link dropdown-toggle" href="#" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                            <FontAwesomeIcon icon={faEllipsisH} />
                        </a>
                        <div className="dropdown-menu dropdown-menu-right shadow" aria-labelledby="userDropdown">
                                            
                            <button class="btn btn-sm dropdown-item" style={{display:'inline-block'}} placeholder="Редактировать" onClick={props.fn} >
                                <span className="mr-2">
                                    <FontAwesomeIcon icon={faEdit} />
                                </span>
                                Редактировать
                            </button>
                        </div>
                </li>
        </ul>
    );
}
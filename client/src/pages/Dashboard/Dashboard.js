import React, { useState, useEffect } from 'react';

import DashboardCard from '../../components/DashboardCard';

import { getRequest, postRequest } from '../../helpers';

import { NotificationManager } from 'react-notifications';

import { confirmAlert } from 'react-confirm-alert'; // Import
import 'react-confirm-alert/src/react-confirm-alert.css';

export default function Dashboard(props) {

    const [favorites, setFavorites] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        const endPoint = '/favorites';
        getRequest(endPoint)
        .then(results => {
            if (results.error) {
                NotificationManager.error(results.error, 'Error', 2000);
                return;
            }
            setFavorites(results.favorites);
        })
        .catch(err => {
            NotificationManager.error(err, 'Error', 2000);
        });
    }

    const deleteItem = (id) => {
        postRequest('/favorites', {id: id})
        .then(result => {
            if (result.message) {
                NotificationManager.success(result.message, 'Success', 2000);
                loadData();
                return;
            }
        })
        .catch(err => {
            NotificationManager.error(err.message, 'Error', 2000);
        });
    }

    const handleButton = (id, secid) => {
        confirmAlert({
            title: 'Confirm to delete',
            message: `Are you sure to delete ${secid} from favorites?`,
            buttons: [
                {
                    label: 'Yes',
                    onClick: () => deleteItem(id)
                },
                {
                    label: 'No',

                }
            ]
        });
    }

    return (
        <div className="container-fluid">

            <div className="d-sm-flex align-items-center justify-content-between mb-4">
                <h1 className="h3 mb-4 text-gray-800">Избранное</h1>
            </div>

            <div className="row">

                { favorites.map(favorite => (
                    <div className="col-sm-6 col-xl-3">
                        <DashboardCard data={ favorite } callback={ () => handleButton(favorite.id, favorite.secid) } />
                    </div>
                )) }

                
            </div>

        </div>
    );
}
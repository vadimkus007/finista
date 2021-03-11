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

            const sorted = results.favorites.sort((a, b) =>  a.lasttoprevprice - b.lasttoprefprice);

            setFavorites(sorted);
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

    const getColor = (favorite) => {
        if (favorite.lasttoprevprice > 0) {
            let degree = favorite.lasttoprevprice / favorites[0].lasttoprevprice;
            let r = 84 - degree * 84;
            let g = 180 - degree * 100;
            let b = 108 - degree * 60;
            return `rgb(${r},${g},${b})`;         
        } else {
            let degree = favorite.lasttoprevprice / favorites[favorites.length-1].lasttoprevprice;
            let r = 223 - degree * 87;
            let g = 119 - degree * 77;
            let b = 126 - degree * 84;
            return `rgb(${r},${g},${b})`;
        }
        
    }

    return (
        <div className="container-fluid">

            <div className="d-sm-flex align-items-center justify-content-between mb-4">
                <h1 className="h3 mb-4 text-gray-800">Избранное</h1>
            </div>

            <div className="row">

                { favorites.map(favorite => (
                    <div className="col-sm-6 col-xl-3">
                        <DashboardCard 
                            data={ favorite } 
                            callback={ () => handleButton(favorite.id, favorite.secid) } 
                            color={ getColor(favorite) }
                        />
                    </div>
                )) }

                
            </div>

        </div>
    );
}
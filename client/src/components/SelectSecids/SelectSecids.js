import React from 'react';
import Select from 'react-select';

export default function SelectSecids(props) {

    const options = [
        {
            label: 'Aeroflot',
            value: 'AFLT'
        },
        {
            label: 'Gazprom',
            value: 'GAZP'
        }
    ];

    return (
        <Select 
            options={options}
            placeholder="Выберите бумагу..."
        />
    );

}
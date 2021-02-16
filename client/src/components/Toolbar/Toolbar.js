import React from 'react';

export default function Toolbar(props) {

    return (
        <div id="toolbar" className="row mb-2 d-flex justify-content-between ">
            <div className="col">
                { props.children }
            </div>
        </div>
    );

}
import React from 'react';

export default function SidebarToggle(props) {

    return(

        <div className="text-center d-none d-md-inline">
            <button className="rounded-circle border-0" id={props.id}></button>
        </div>

    );

}
import React, { useState } from 'react';
import Sidebar from '../../components/Sidebar';
import TopNavigator from '../../components/TopNavigator';

export default function DefaultLayout({children}) {

    // sidebar toggle
    const [toggled, setToggled] = useState(true);

    return(
        <div id="wrapper">
            <Sidebar toggled={toggled} setToggled={setToggled}/>
            <div id="content-wrapper">
                <TopNavigator />
                {children}
            </div>
        </div>
    );

}
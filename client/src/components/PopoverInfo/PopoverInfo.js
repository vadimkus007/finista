import React from 'react';
import { OverlayTrigger, Popover} from 'react-bootstrap';
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function PopoverInfo(props) {

    return (
        <span className={ props.className }>
            <OverlayTrigger 
                trigger="click" 
                placement="right" 
                overlay={
                    (
                    <Popover>
                        <Popover.Content>
                            { props.children || props.content }
                        </Popover.Content>
                    </Popover>
                    )
                }
            >
                <FontAwesomeIcon icon={ faInfoCircle } />
            </OverlayTrigger>
        </span>
    );

}
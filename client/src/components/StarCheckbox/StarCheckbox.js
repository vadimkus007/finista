import React, { useState } from 'react';

import styled from 'styled-components';

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar as fasStar } from "@fortawesome/free-solid-svg-icons";
import { faStar as farStar } from "@fortawesome/free-regular-svg-icons";

const IconChecked = styled.div`
  
`

const IconUnchecked = styled.div`
`

const HiddenCheckbox = styled.input.attrs({ type: 'checkbox' })`
      // Hide checkbox visually but remain accessible to screen readers.
      // Source: https://polished.js.org/docs/#hidevisually
      border: 0;
      clip: rect(0 0 0 0);
      clippath: inset(50%);
      height: 1px;
      margin: -1px;
      overflow: hidden;
      padding: 0;
      position: absolute;
      white-space: nowrap;
      width: 1px;
    `

const StyledCheckbox = styled.div`
  display: inline-block;
  width: 16px;
  height: 16px;
  ${HiddenCheckbox}:focus + & {
    box-shadow: 0 0 0 3px pink;
  }
  ${IconChecked} {
    display: ${props => props.checked ? 'inline-block' : 'none'}
  }
  ${IconUnchecked} {
    display: ${props => props.checked ? 'none' : 'inline-block'}
  }
`

const CheckboxContainer = styled.div`
  display: inline-block;
  vertical-align: middle;
`



export default function StarCheckbox(props) {

    const [checked, setChecked] = useState(false);

    function Checkbox({className, ...props}) {
        return (
            <CheckboxContainer className={className}>
                <HiddenCheckbox checked={checked} {...props} />
                <StyledCheckbox checked={checked} >
                    <IconChecked>
                        <FontAwesomeIcon icon={fasStar} />
                    </IconChecked>
                    <IconUnchecked>
                        <FontAwesomeIcon icon={farStar} />
                    </IconUnchecked>
                </StyledCheckbox>
            </CheckboxContainer>
        );
    } 

    const handleCheckboxChange = event => 
        setChecked(event.target.checked);

    return (
        <div>
            <label>
                <Checkbox 
                    checked={checked}
                    onChange={handleCheckboxChange}
                />
            </label>
        </div>
    );
}
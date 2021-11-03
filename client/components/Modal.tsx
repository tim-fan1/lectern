import React, { EventHandler, MouseEvent, MouseEventHandler, useEffect, useState } from "react";
import ReactDOM from "react-dom";
import styled from "styled-components";

// modal library from here
// https://devrecipes.net/modal-component-with-next-js/

const StyledModalTitle = styled.div`
    padding-top: 10px;
`;

const StyledModalBody = styled.div`
    padding-top: 10px;
`;

const StyledModalHeader = styled.div`
    display: flex;
    justify-content: flex-end;
    font-size: 25px;
`;

const StyledModal = styled.div`
    background: #222330;
    width: 500px;
    height: 400px;
    border-radius: 15px;
    padding: 15px;
`;

const StyledModalOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: rgba(0, 0, 0, 0.5);
`;

const Modal = ({
    show,
    onClose,
    children,
    title,
}: {
    show?: boolean;
    onClose?: (e?: any) => any;
    children?: React.ReactElement[] | React.ReactElement;
    title?: React.ReactElement;
}) => {
    const [isBrowser, setIsBrowser] = useState(false);

    useEffect(() => {
        setIsBrowser(true);
    }, []);

    const handleCloseClick = (e: MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        if (onClose !== undefined) {
            onClose();
        }
    };

    const modalContent = show ? (
        <StyledModalOverlay>
            <StyledModal>
                <StyledModalHeader>
                    <a href="#" onClick={handleCloseClick}>
                        x
                    </a>
                </StyledModalHeader>
                {title && <StyledModalTitle>{title}</StyledModalTitle>}
                <StyledModalBody>{children}</StyledModalBody>
            </StyledModal>
        </StyledModalOverlay>
    ) : null;

    if (isBrowser) {
        return ReactDOM.createPortal(modalContent, document.getElementById("modal-root")!);
    } else {
        return null;
    }
};

export default Modal;

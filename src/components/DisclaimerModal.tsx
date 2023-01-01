import React, { useState } from 'react';
import SolapeModal from './Modal';
import { Button, Checkbox } from 'antd';
import { useLocalStorageState } from '../utils/utils';
import styled from 'styled-components';

const AcceptButton = styled(Button)`
    margin: 20px 0px 0px 0px;
    background: linear-gradient(100.61deg, #B85900 0%, #FF810A 100%) !important;
    border: none;
    width: 100%;
    border-radius: 8px;
    font-weight: 500;
    font-size: 16px;

    &:disabled {
        background: #1c2222 !important;
    }
`;

const DisclaimerModal = ({
    isOpen,
    onClose,
}: {
    isOpen: boolean
    onClose?: (x) => void
}) => {
    const [, setAlphaAccepted] = useLocalStorageState('is_disclaimer_ok_13052022', false)
    const [acceptRisks, setAcceptRisks] = useState(false)

    const handleGetStarted = () => {
        setAlphaAccepted(true)
    }

    // console.log('render modal');

    return (
        <SolapeModal isOpen={isOpen} onClose={onClose} hideClose title={"DISCLAIMER"}>
            <>
                <div className="space-y-3 rounded-md bg-th-bkg-3 p-4">
                    <p>
                        The Solape DEX is a decentralised digital asset exchange that is powered by the OpenBook <a href="https://github.com/openbook-dex/program">smart contracts</a>.<p></p> As a result of the events in November 2022, Solape is pivoting alongside the Solana community to support the Serum Community Fork known as OpenBook. Please be advised that your access to and use of the Solape DEX is entirely at your own risk and could lead to substantial losses.<br></br><br></br>The exchange remains unavailable to users located or residing in <a href="/restricted-jurisdictions">Prohibited Jurisdicitons</a>.<p></p> For more information please read our <a href="https://solapeswap.io/rules.pdf">Rules</a> and <a href="https://solapeswap.io/risk-statement.pdf">Risk Statement</a>.
                    </p>
                </div>
                <div style={{ marginTop: "36px" }}>
                    <Checkbox
                        checked={acceptRisks}
                        onChange={(e) => setAcceptRisks(e.target.checked)}
                    >
                        I confirm that I have read, understand and accept the Rules and Risk Statement
                    </Checkbox>
                </div>
                <div style={{ marginTop: "28px" }}>
                    <AcceptButton
                        className="w-40"
                        disabled={!acceptRisks}
                        onClick={handleGetStarted}
                        type="primary"
                        size="large"
                    >
                        Accept and enter
                    </AcceptButton>
                </div>
            </>
        </SolapeModal>
    )
}

export default React.memo(DisclaimerModal)

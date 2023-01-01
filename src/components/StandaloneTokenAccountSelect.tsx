import React from 'react';
import { TokenAccount } from '../utils/types';
import { useSelectedTokenAccounts } from '../utils/markets';
import { List, Row, Col } from 'antd';
import { abbreviateAddress } from '../utils/utils';
import { notify } from '../utils/notifications';
import styled from 'styled-components';

const TokenAccountRow = styled.div({
  display: 'flex'
});

const TokenAccountBalance = styled.p({
  textAlign: 'right'
});

const TokenAccountSelect = styled.button({
  width: '100%',
  height: 20,
  color: '#FFFFFF',
  background: '#121616',
  fontSize: 12,
  lineHight: 20,
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer'
});

const TokenAccountSelected = styled(TokenAccountSelect)({
  color: '#FFFFFF',
  background: 'linear-gradient(100.61deg, #FF810A 0%, #FFAB5C 100%)'
});

export default function StandaloneTokenAccountsSelect({
  accounts,
  mint,
  label,
  balances,
}: {
  accounts: TokenAccount[] | null | undefined;
  mint: string | undefined;
  label?: boolean;
  balances?: Object | undefined;
}) {
  const [
    selectedTokenAccounts,
    setSelectedTokenAccounts,
  ] = useSelectedTokenAccounts();

  let selectedValue: string | undefined;
  if (mint && mint in selectedTokenAccounts) {
    selectedValue = selectedTokenAccounts[mint];
  } else if (accounts && accounts?.length > 0) {
    selectedValue = accounts[0].pubkey.toBase58();
  } else {
    selectedValue = undefined;
  }

  const setTokenAccountForCoin = (value) => {
    if (!mint) {
      notify({
        message: 'Error selecting token account',
        description: 'Mint is undefined',
        type: 'error',
      });
      return;
    }
    const newSelectedTokenAccounts = { ...selectedTokenAccounts };
    newSelectedTokenAccounts[mint] = value;
    setSelectedTokenAccounts(newSelectedTokenAccounts);
  };

  return (
    <React.Fragment>
      {accounts && accounts.map(account => (
        <Row style={{ width: '100%' }} key={account.pubkey.toBase58()}>
          <Col span={12}>
            {selectedValue === account.pubkey.toBase58() && 
              <TokenAccountSelected onClick={() => setTokenAccountForCoin(account.pubkey.toBase58())}>
                {label
                  ? abbreviateAddress(account.pubkey, 8)
                  : account.pubkey.toBase58()}
              </TokenAccountSelected>
            }
            {selectedValue !== account.pubkey.toBase58() && 
              <TokenAccountSelect onClick={() => setTokenAccountForCoin(account.pubkey.toBase58())}>
                {label
                  ? abbreviateAddress(account.pubkey, 8)
                  : account.pubkey.toBase58()}
              </TokenAccountSelect>
            }
          </Col>
          <Col span={12}>
            <TokenAccountBalance>
              {balances && (selectedValue === account.pubkey.toBase58()) &&
                // @ts-ignore
                <>{balances.wallet}</>
              }
              {selectedValue !== account.pubkey.toBase58() &&
                <>Cannot fetch balance</>
              }
            </TokenAccountBalance>
          </Col>
        </Row>
      ))}
    </React.Fragment>
  );
}

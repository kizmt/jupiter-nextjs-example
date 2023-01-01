import React from 'react';
import { Row, Divider } from 'antd';
import CoinLogos from '../config/logos.json';
import styled from 'styled-components';
import {
  useTokenAccounts,
} from '../utils/markets';
import { TokenAccount } from '../utils/types';
import StandaloneTokenAccountSelect from './StandaloneTokenAccountSelect';

const TokenAccountOptionsContainer = styled.div({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 10,
  borderRadius: 8,
  padding: '16px 16px',
  background: '#1C2222',
  overflow: 'auto'
});

const CoinRow = styled(Row)({
  margin: '8px 0',
  fontSize: 20,
  lineHeight: '25px',
});

const CoinLogo = styled.img({
  width: 24,
  height: 24,
  marginRight: 8
});

const Title = styled.div({
  color: 'rgba(255, 255, 255, 1)',
  marginTop: 0,
  marginBottom: 4
});

const TokenAccountCloseBtn = styled.button({
  position: 'sticky',
  width: '100%',
  bottom: 0,
  borderBottomRightRadius: 8,
  borderBottomLeftRadius: 8,
  border: 'none',
  padding: '16px 16px',
  background: 'linear-gradient(100.61deg, #FF810A 0%, #FFAB5C 100%)',
  textTransform: 'uppercase',
  fontWeight: 700,
  fontSize: 16,
  overflow: 'auto',
  cursor: 'pointer'
});

export default function StandaloneTokenAccountsOptions({
  accounts,
  connected,
  setIsOptionShow,
}: {
  accounts: [string | undefined, Object | undefined, string, string | undefined][];
  connected: any;
  setIsOptionShow: any;
}) {
  const [tokenAccounts] = useTokenAccounts();
  let filteredTokenAccounts: TokenAccount[] = [];

  for (let account of tokenAccounts || []) {
    const accountPubkey = account.pubkey.toBase58();
    if (!filteredTokenAccounts.find(el => el.pubkey.toBase58() === accountPubkey)) {
      filteredTokenAccounts.push(account);
    }
  }

  // console.log('tokenAccounts: ', tokenAccounts?.map(acc => acc.pubkey.toBase58()));

  return (
    <TokenAccountOptionsContainer>
      <Divider>
        <Title>Accounts</Title>
      </Divider>

      {accounts && accounts.map(([currency, balances, baseOrQuote, mint], index) => (
        <React.Fragment key={index}>
          <CoinRow>
            {currency && CoinLogos[currency] ? <CoinLogo src={CoinLogos[currency]} alt={currency} /> : currency}
            {currency}
          </CoinRow>
          {connected && (
            <Row align="middle" style={{ paddingBottom: 10 }}>
              <StandaloneTokenAccountSelect
                accounts={filteredTokenAccounts?.filter(
                  (account) => account.effectiveMint.toBase58() === mint,
                )}
                mint={mint}
                label
                balances={balances}
              />
            </Row>
          )}
          {!filteredTokenAccounts?.filter(
            (account) => {
              return account.effectiveMint.toBase58() === mint
            },
          ).length && <p>No account available (it will be created during your first trade)</p>}
        </React.Fragment>
      ))}

      <TokenAccountCloseBtn onClick={() => setIsOptionShow(false)}>
        Done
      </TokenAccountCloseBtn>
    </TokenAccountOptionsContainer>
  );
};

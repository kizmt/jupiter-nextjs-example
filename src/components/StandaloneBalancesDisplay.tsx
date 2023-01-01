import { Button, Col, Divider, Popover, Row } from 'antd';
import React, { useState } from 'react';
import FloatingElement from './Common/FloatingElement';
import styled from 'styled-components';
import {
  useFreshOpenOrdersAccounts,
  useBalances,
  useMarket,
  useOpenOrders,
  useOrderbookAccounts,
  useSelectedBaseCurrencyAccount,
  useSelectedOpenOrdersAccount,
  useSelectedQuoteCurrencyAccount,
  useTokenAccounts,
} from '../utils/markets';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import Link from './Link';
import CoinLogos from '../config/logos.json';
import { settleFunds } from '../utils/send';
import { useSendConnection } from '../utils/connection';
import { notify } from '../utils/notifications';
import { Balances } from '../utils/types';
import { InfoCircleOutlined, SettingOutlined } from '@ant-design/icons';
import { useInterval } from '../utils/useInterval';
import { useLocalStorageState } from '../utils/utils';
import { AUTO_SETTLE_DISABLED_OVERRIDE } from '../utils/preferences';
import { useReferrer } from '../utils/referrer';
import StandaloneTokenAccountOptions from './StandaloneTokenAccountOptions';
import { OpenOrders } from '@project-serum/serum';

const Title = styled.div({
  color: 'rgba(255, 255, 255, 1)',
  marginTop: 0,
});

const BalanceGroup = styled(Row)({
  '> .ant-col': {
    width: '100%',
  },
});

const BalanceType = styled(Row)({
  justifyContent: 'space-between',
  width: '100%',
  alignItems: 'center',
  color: '#676767',
  fontSize: 18,
  margin: '20px 0 8px',
});

const CoinRow = styled(Row)({
  margin: '8px 0',
  fontSize: 17,
  lineHeight: '25px',
});

const BalanceInfoCircle = styled(InfoCircleOutlined)({
  color: '#676767',
  margin: '5px 0 0 2px',
})

const ActionButton = styled(Button)({
  color: (props) => props.disabled ? '#000' : '#fff',
  backgroundColor: (props) => props.disabled ? '#2E3838' : '#FF810A',
  borderWidth: 0,
  borderRadius: 4,
  fontSize: 14,
  lineHeight: '16px',
  padding: '0 14px',
  height: 35,
  '&:hover, &:focus': {
    backgroundColor: (props) => props.disabled ? '#2E3838' : '#FF810A',
    opacity: 0.8
  },
  'img': {
    margin: '-2px 0 0 5px',
  }
});

const OpenOptionsBtn = styled.button({
  position: 'absolute',
  right: 16,
  top: 16,
  color: '#FFFAF5',
  fontSize: 12,
  background: '#2E3838',
  borderRadius: 4,
  border: 'none',
  padding: '6px 12px',
  fontWeight: 500,
  zIndex: 11,
  cursor: 'pointer',
  '&:hover': {
    background: '2E5858'
  }
});

const CoinLogo = styled.img({
  width: 24,
  height: 24,
  marginRight: 8,
});

const CreateWallet = styled.div({
  color: '#676767',
  fontSize: 16,
  display: 'flex',
  justifyContent: 'space-between',
  paddingTop: 16,
  'a': {
    textDecoration: 'underline',
  },
});

export default function StandaloneBalancesDisplay() {
  const connection = useSendConnection();
  const { baseCurrency, quoteCurrency, market } = useMarket();
  const balances = useBalances();
  const openOrdersAccountsGPA = useSelectedOpenOrdersAccount();
  const [openOrdersAccount, isLoaded] = useFreshOpenOrdersAccounts(openOrdersAccountsGPA);
  const { wallet, connected, signTransaction } = useWallet();
  const [baseOrQuote, setBaseOrQuote] = useState('');
  const baseCurrencyAccount = useSelectedBaseCurrencyAccount();
  const quoteCurrencyAccount = useSelectedQuoteCurrencyAccount();
  const baseCurrencyBalances =
    balances && balances.find((b) => b.coin === baseCurrency);
  const quoteCurrencyBalances =
    balances && balances.find((b) => b.coin === quoteCurrency);
  const { usdcRef, usdtRef } = useReferrer();

  const [isOptionShow, setIsOptionShow] = useState(false);

  async function onSettleFunds() {
    if (!wallet) {
      notify({
        message: 'Wallet not connected',
        description: 'wallet is undefined',
        type: 'error',
      });
      return;
    }

    if (!market) {
      notify({
        message: 'Error settling funds',
        description: 'market is undefined',
        type: 'error',
      });
      return;
    }
    if (!openOrdersAccount.length) {
      notify({
        message: 'Error settling funds',
        description: 'Open orders account is undefined',
        type: 'error',
      });
      return;
    }
    if (!baseCurrencyAccount) {
      notify({
        message: 'Error settling funds',
        description: 'Open orders account is undefined',
        type: 'error',
      });
      return;
    }
    if (!quoteCurrencyAccount) {
      notify({
        message: 'Error settling funds',
        description: 'Open orders account is undefined',
        type: 'error',
      });
      return;
    }

    try {
      await openOrdersAccount.reduce(async (accu, next) => {
        await accu;

        await settleFunds({
          market,
          openOrders: next,
          connection,
          wallet,
          signTransaction,
          baseCurrencyAccount,
          quoteCurrencyAccount,
          usdcRef,
          usdtRef,
        });
      }, Promise.resolve());
    } catch (e) {
      notify({
        message: 'Error settling funds',
        description: e.message,
        type: 'error',
      });
    }
  }

  const formattedBalances: [
    string | undefined,
    Balances | undefined,
    string,
    string | undefined,
  ][] = [
      [
        baseCurrency,
        baseCurrencyBalances,
        'base',
        market?.baseMintAddress.toBase58(),
      ],
      [
        quoteCurrency,
        quoteCurrencyBalances,
        'quote',
        market?.quoteMintAddress.toBase58(),
      ],
    ];

  return (
    <FloatingElement style={{ flex: 1, position: 'relative' }}>
      <div className="solape-accounts">
        {isOptionShow &&
          <StandaloneTokenAccountOptions
            accounts={formattedBalances}
            connected={connected}
            setIsOptionShow={setIsOptionShow}
          />
        }

        {(connected && !isOptionShow) &&
          <OpenOptionsBtn onClick={() => setIsOptionShow(true)}>
            Token accounts
          </OpenOptionsBtn>
        }

        <Divider>
          <Title>Accounts</Title>
        </Divider>
        <BalanceGroup>
          <Col>
            <BalanceType>
              <Col>
                Wallet balances&nbsp;
                <BalanceInfoCircle />
              </Col>
            </BalanceType>
            {formattedBalances.map(
              ([currency, balances, baseOrQuote, mint], index) => (
                <React.Fragment key={index}>
                  <CoinRow>
                    {currency && CoinLogos[currency] ? <CoinLogo src={CoinLogos[currency]} alt={currency} /> : currency}
                    {balances
                      ? (balances.wallet
                        ? new Intl.NumberFormat('en-US', { minimumFractionDigits: 4 }).format(balances.wallet)
                        : '-'
                      ) : '-'}
                  </CoinRow>
                </React.Fragment>
              ))}
          </Col>
          <Col>
            <BalanceType>
              <Col>
                Unsettled balances&nbsp;
                <BalanceInfoCircle />
              </Col>
              <Col>
                <div className="solape-settle">
                  <ActionButton block size="large" onClick={onSettleFunds}>
                    Settle
                    <img src="/icons/payment.svg" />
                  </ActionButton>
                </div>
              </Col>
            </BalanceType>
            {formattedBalances.map(
              ([currency, balances, baseOrQuote, mint], index) => {
                return (
                  <React.Fragment key={index}>
                    <CoinRow>
                      {currency && CoinLogos[currency] ? <CoinLogo src={CoinLogos[currency]} alt={currency} /> : currency}
                      {balances
                        ? (balances.unsettled
                          ? new Intl.NumberFormat('en-US', { minimumFractionDigits: 4 }).format(balances.unsettled)
                          : '-'
                        ) : '-'}
                    </CoinRow>
                  </React.Fragment>
                )
              })}
          </Col>
        </BalanceGroup>
        <CreateWallet>
          <div>Need a Solana wallet?</div>
          <div>
            <a href="https://phantom.app/" target="_blank">Phantom</a>
            &nbsp;|&nbsp;
            <a href="https://solflare.com/" target="_blank">SolFlare</a>
          </div>
        </CreateWallet>
      </div>
    </FloatingElement>
  );
}

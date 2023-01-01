import { Col, Row, Divider } from 'antd';
import React, { useState } from 'react';
import styled from 'styled-components';
import { useMarket, useBonfidaTrades } from '../utils/markets';
import { getDecimalCount } from '../utils/utils';
import FloatingElement from './Common/FloatingElement';
import { BonfidaTrade } from '../utils/types';

const Title = styled.div({
  color: 'rgba(255, 255, 255, 1)',
});

const SizeTitle = styled(Row)({
  padding: '20px 0 14px',
  color: '#676767',
});

const NumberCol = styled(Col)({
  textAlign: 'right',
});

const LinkCol = styled(Col)({
  textAlign: 'center',
});

const TradesContainer = styled.div({
  overflowY: 'scroll',
  //maxHeight: (params) => params.height + 'px',
  maxHeight: '313px',
  '&::-webkit-scrollbar': {
    display: 'none',
  },
});

const TradeRow = styled(Row)({
  marginBottom: '8px',
  lineHeight: '20px',
})

export default function PublicTrades({ smallScreen }) {
  const { baseCurrency, quoteCurrency, market, customMarkets } = useMarket();
  const [trades, loaded] = useBonfidaTrades();
  const [height, setHeight] = useState(400);

  return (
    <FloatingElement
      setHeight={setHeight}
      style={
        smallScreen
          ? {
            flex: 1, overflow: 'hidden'
          }
          : {
            marginTop: '10px',
            flex: 1,
            overflow: 'hidden',
            minHeight: 399,
          }
      }
    >
      <Divider>
        <Title>Recent Trades</Title>
      </Divider>
      <SizeTitle>
        <Col span={8}>Price ({quoteCurrency}) </Col>
        <NumberCol span={9}>
          Size ({baseCurrency})
        </NumberCol>
        <LinkCol span={3}>
          Tx
        </LinkCol>
        <NumberCol span={4}>
          Time
        </NumberCol>
      </SizeTitle>
      {!!trades && loaded && (
        <TradesContainer height={height + 115}>
          {trades.map((trade: BonfidaTrade, i: number) => (
            <TradeRow key={i}>
              <Col
                span={8}
                style={{
                  color: trade.side === 'buy' ? 'var(--buy-color-light)' : 'var(--sell-color-light)',
                }}
              >
                {market?.tickSize && !isNaN(trade.price)
                  ? new Intl.NumberFormat('en-US', { minimumFractionDigits: getDecimalCount(market.tickSize) }).format(Number(trade.price))
                  : trade.price}
              </Col>
              <NumberCol span={9}>
                {market?.minOrderSize && !isNaN(trade.size)
                  ? new Intl.NumberFormat('en-US', { minimumFractionDigits: getDecimalCount(market.minOrderSize) }).format(Number(trade.size))
                  : trade.size}
              </NumberCol>
              <LinkCol span={3}>
                {market &&
                  <a href={`https://solscan.io/account/${market.address.toString()}`} target="_blank" rel="noopener noreferrer">
                    <img src="/icons/link.svg" />
                  </a>
                }
              </LinkCol>
              <NumberCol span={4}>
                {trade.time && new Date(trade.time).toLocaleTimeString('en-GB')}
              </NumberCol>
            </TradeRow>
          ))}
        </TradesContainer>
      )}
    </FloatingElement>
  );
}

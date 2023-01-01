import { Col, Row, Divider } from 'antd';
import React, { useRef, useEffect, useState } from 'react';
import styled from 'styled-components';
import { useMarket, useOrderbook, useMarkPrice } from '../../utils/markets';
import { useInterval } from '../../utils/useInterval';
import FloatingElement from '../Common/FloatingElement';
import OrderbookRow from './OrderbookRow';
import MarkPrice from './MarkPrice';
import Spread from './Spread';

const OrdersWrapper = styled.div({
  overflowY: 'scroll',
  maxHeight: 284,
  '&::-webkit-scrollbar': {
    display: 'none',
  },
});

const Title = styled.div({
  color: 'rgba(255, 255, 255, 1)',
});

const SizeTitle = styled(Row)({
  padding: '4px 0 14px 0px',
  color: '#676767',
});

const PriceTitle = styled(Row)({
  padding: '4px 0 4px 0px',
  color: '#676767',
  position: 'absolute',
  width: '100%',
  justifyContent: 'center',
});

const TitleRow = styled(Row)({
  flexWrap: 'nowrap',
  position: 'relative',
  margin: '0 10px',
});

const TitleCol = styled(Col)({
  textAlign: (props) => props.align,
  paddingRight: (props) => props.paddingRight,
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
});

export default function Orderbook({
  smallScreen,
  depth = 80,
  onPrice,
  onSize,
}) {
  const markPrice = useMarkPrice();
  const [orderbook] = useOrderbook(90);
  const { baseCurrency, quoteCurrency } = useMarket();

  const currentOrderbookData = useRef(null);
  const lastOrderbookData = useRef(null);

  const [orderbookData, setOrderbookData] = useState(null);

  const containerStyles = {
    overflow: 'hidden',
    flex: smallScreen ? 1 : undefined,
    padding: '16px 6px',
  };

  useInterval(() => {
    if (
      !currentOrderbookData.current ||
      JSON.stringify(currentOrderbookData.current) !==
        JSON.stringify(lastOrderbookData.current)
    ) {
      let bids = orderbook?.bids || [];
      let asks = orderbook?.asks || [];

      let sum = (total, [, size], index) =>
        index < depth ? total + size : total;
      let totalSize = bids.reduce(sum, 0) + asks.reduce(sum, 0);

      let bidsToDisplay = getCumulativeOrderbookSide(bids, totalSize, false);
      let asksToDisplay = getCumulativeOrderbookSide(asks, totalSize, true);

      currentOrderbookData.current = {
        bids: orderbook?.bids,
        asks: orderbook?.asks,
      };

      setOrderbookData({ bids: bidsToDisplay, asks: asksToDisplay.reverse() });
    }
  }, 250);

  useEffect(() => {
    lastOrderbookData.current = {
      bids: orderbook?.bids,
      asks: orderbook?.asks,
    };
  }, [orderbook]);

  function getCumulativeOrderbookSide(orders, totalSize, backwards = false) {
    let cumulative = orders
      .slice(0, depth)
      .reduce((cumulative, [price, size], i) => {
        const cumulativeSize = (cumulative[i - 1]?.cumulativeSize || 0) + size;
        cumulative.push({
          price,
          size,
          cumulativeSize,
          sizePercent: Math.round((cumulativeSize / (totalSize || 1)) * 100),
        });
        return cumulative;
      }, []);
    if (backwards) {
      cumulative = cumulative.reverse();
    }
    return cumulative;
  }

  return (
    <FloatingElement style={containerStyles}>
      <Divider>
        <Title>Orderbook</Title>
      </Divider>
      <MarkPrice markPrice={markPrice} />
      <OrdersWrapper className="solape-orderbook">
        <TitleRow>
          <Col flex={1}>
            <SizeTitle>
              <TitleCol span={24} align="left">
                Size ({baseCurrency})
              </TitleCol>
            </SizeTitle>
            {orderbookData?.bids.map(({ price, size, sizePercent }) => (
              <OrderbookRow
                key={price + ''}
                price={price}
                size={size}
                side={'buy'}
                sizePercent={sizePercent}
                onPriceClick={() => onPrice(price)}
                onSizeClick={() => onSize(size)}
              />
            ))}
          </Col>
          <PriceTitle>
            <TitleCol>Price ({quoteCurrency})</TitleCol>
          </PriceTitle>
          <Col flex={1} style={{ paddingLeft: 2 }}>
            <SizeTitle>
              <TitleCol span={24} align="right">
                Size ({baseCurrency})
              </TitleCol>
            </SizeTitle>
            {orderbookData?.asks.map(({ price, size, sizePercent }) => (
              <OrderbookRow
                invert={true}
                key={price + ''}
                price={price}
                size={size}
                side={'sell'}
                sizePercent={sizePercent}
                onPriceClick={() => onPrice(price)}
                onSizeClick={() => onSize(size)}
              />
            ))}
          </Col>
        </TitleRow>
      </OrdersWrapper>
      <Spread maxBid={orderbookData?.bids[0]} minAsk={orderbookData?.asks[0]} />
    </FloatingElement>
  );
}

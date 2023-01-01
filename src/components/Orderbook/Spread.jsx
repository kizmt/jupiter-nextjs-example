import React from 'react';
import styled from 'styled-components';
import { Col, Row } from 'antd';
import { useMarket } from '../../utils/markets';
import { isEqual, getDecimalCount } from '../../utils/utils';

const SpreadRow = styled(Row)({
  background: '#1C2222',
  color: '#fff',
  borderRadius: 4,
  padding: '6px 8px',
  margin: '12px 10px 0',
  fontSize: 12,
});

const Spread = React.memo(
  ({ maxBid, minAsk }) => {
    const { market } = useMarket();
    const spread = minAsk && maxBid ? minAsk.price - maxBid.price : null;
    const percentSpread =
      minAsk && maxBid ? (spread / minAsk.price) * 100 : null;

    return (
      <SpreadRow justify="space-between">
        <Col>Spread</Col>
        <Col>
          {spread ? spread.toFixed(getDecimalCount(market?.tickSize)) : '-'}
        </Col>
        <Col>{percentSpread ? percentSpread.toFixed(2) : '-'}%</Col>
      </SpreadRow>
    );
  },
  (prevProps, nextProps) => isEqual(prevProps, nextProps, ['maxBid', 'minAsk']),
);

export default Spread;

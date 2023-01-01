import React from 'react';
import styled from 'styled-components';
import { Col, Row } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { useMarket } from '../../utils/markets';
import usePrevious from '../../utils/usePrevious';
import { isEqual, getDecimalCount } from '../../utils/utils';

const MarkPriceTitle = styled(Row)({
  padding: '4px 0 14px',
  margin: '0 10px',
  fontWeight: 700,
});

const ArrowUp = styled(ArrowUpOutlined)({
  marginRight: 5,
});

const ArrowDown = styled(ArrowDownOutlined)({
  marginRight: 5,
});

const ColLabel = styled.div({
  fontWeight: 'normal',
  color: '#fff',
  background: '#1C2222',
  borderRadius: 4,
  padding: '2px 8px',
  '&:before': {
    display: 'inline-block',
    width: 10,
    height: 10,
    borderRadius: 2,
    marginRight: 4,
    content: '""',
    background: (props) => `var(--${props['data-type']}-color-light)`,
  },
});

const MarkPrice = React.memo(
  ({ markPrice }) => {
    const { market } = useMarket();
    const previousMarkPrice = usePrevious(markPrice);

    const markPriceColor =
      markPrice > previousMarkPrice
        ? 'var(--buy-color-light)'
        : markPrice < previousMarkPrice
        ? 'var(--sell-color-light)'
        : 'white';

    const formattedMarkPrice =
      markPrice &&
      market?.tickSize &&
      new Intl.NumberFormat('en-US', { minimumFractionDigits: getDecimalCount(market.tickSize) }).format(markPrice);

    return (
      <MarkPriceTitle justify="space-between">
        <Col>
          <ColLabel data-type="buy">Buy side</ColLabel>
        </Col>
        <Col style={{ color: markPriceColor }}>
          {markPrice > previousMarkPrice && <ArrowUp />}
          {markPrice < previousMarkPrice && <ArrowDown />}
          {formattedMarkPrice || '----'}
        </Col>
        <Col>
          <ColLabel data-type="sell">Sell side</ColLabel>
        </Col>
      </MarkPriceTitle>
    );
  },
  (prevProps, nextProps) => isEqual(prevProps, nextProps, ['markPrice']),
);

export default MarkPrice;

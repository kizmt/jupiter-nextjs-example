import React, { useRef, useEffect } from 'react';
import styled, { css } from 'styled-components';
import { Col, Row } from 'antd';
import { useMarket } from '../../utils/markets';
import { isEqual, getDecimalCount } from '../../utils/utils';

const Line = styled.div({
  textAlign: (props) => (props.invert ? 'left' : 'right'),
  float: (props) => (props.invert ? 'left' : 'right'),
  height: '100%',
  width: '100%',
});

const Price = styled.div({
  position: 'absolute',
  left: (props) => (props.invert ? '5px' : undefined),
  right: (props) => (props.invert ? undefined : '5px'),
  color: (props) => props['data-color'],
});

const AlignedCol = styled(Col)({
  textAlign: (props) => props.align,
});

const StyledRow = styled(Row)({
  marginBottom: 1,
  position: 'relative',
  backgroundImage: (props) => {
    if (props['data-bgcolor'] === 'var(--buy-color-dark)') {
      return `linear-gradient(to left, ${props['data-bgcolor']}, ${props['data-bgcolor']} ${props['data-width']}, rgba(0, 0, 0, 0) ${props['data-width']})`;
    }
    if (props['data-bgcolor'] === 'var(--sell-color-dark)') {
      return `linear-gradient(to right, ${props['data-bgcolor']}, ${props['data-bgcolor']} ${props['data-width']}, rgba(0, 0, 0, 0) ${props['data-width']})`;
    }
  },
});

const OrderbookRow = React.memo(
  ({ side, price, size, sizePercent, onSizeClick, onPriceClick, invert }) => {
    const element = useRef();
    const { market } = useMarket();

    useEffect(() => {
      // eslint-disable-next-line
      !element.current?.classList.contains('flash') &&
        element.current?.classList.add('flash', invert ? 'right' : 'left');
      const id = setTimeout(
        () =>
          element.current?.classList.contains('flash') &&
          element.current?.classList.remove('flash', invert ? 'right' : 'left'),
        250,
      );
      return () => clearTimeout(id);
    }, [price, size]);

    const formattedSize =
      market?.minOrderSize && !isNaN(size)
        ? new Intl.NumberFormat('en-US', {
            minimumFractionDigits: getDecimalCount(market.minOrderSize) + 1,
          }).format(Number(size))
        : new Intl.NumberFormat('en-US').format(size);

    const formattedPrice =
      market?.tickSize && !isNaN(price)
        ? new Intl.NumberFormat('en-US', {
            minimumFractionDigits: getDecimalCount(market.tickSize) + 1,
          }).format(Number(price))
        : new Intl.NumberFormat('en-US').format(price);

    return (
      <StyledRow
        ref={element}
        onClick={onSizeClick}
        data-width={sizePercent + '%'}
        data-bgcolor={
          side === 'buy' ? 'var(--buy-color-dark)' : 'var(--sell-color-dark)'
        }
      >
        {invert ? (
          <>
            <AlignedCol align="left" span={12}>
              <Line
                invert
                // data-width={sizePercent + '%'}
                // data-bgcolor={
                //   side === 'buy'
                //     ? 'var(--buy-color-dark)'
                //     : 'var(--sell-color-dark)'
                // }
              />
              <Price invert data-color="white" onClick={onPriceClick}>
                {formattedPrice}
              </Price>
            </AlignedCol>
            <AlignedCol align="right" span={12}>
              {formattedSize}
            </AlignedCol>
          </>
        ) : (
          <>
            <AlignedCol align="left" span={12}>
              {formattedSize}
            </AlignedCol>
            <AlignedCol align="right" span={12}>
              <Line
                data-width={sizePercent + '%'}
                data-bgcolor={
                  side === 'buy'
                    ? 'var(--buy-color-dark)'
                    : 'var(--sell-color-dark)'
                }
              />
              <Price data-color="white" onClick={onPriceClick}>
                {formattedPrice}
              </Price>
            </AlignedCol>
          </>
        )}
      </StyledRow>
    );
  },
  (prevProps, nextProps) =>
    isEqual(prevProps, nextProps, ['price', 'size', 'sizePercent']),
);

export default OrderbookRow;

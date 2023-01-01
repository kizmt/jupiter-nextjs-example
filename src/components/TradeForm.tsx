import { Button, Input, Radio, Slider, Switch } from 'antd';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import {
  useFeeDiscountKeys,
  useLocallyStoredFeeDiscountKey,
  useMarket,
  useMarkPrice,
  useSelectedBaseCurrencyAccount,
  useSelectedBaseCurrencyBalances,
  useSelectedOpenOrdersAccount,
  useSelectedQuoteCurrencyAccount,
  useSelectedQuoteCurrencyBalances,
} from '../utils/markets';
import { useWallet } from '@solana/wallet-adapter-react';
import { notify } from '../utils/notifications';
import { floorToDecimal, getDecimalCount, roundToDecimal, } from '../utils/utils';
import { useGpaConnection, useSendConnection } from '../utils/connection';
import FloatingElement from './Common/FloatingElement';
import { getUnixTs, placeOrder } from '../utils/send';
import { SwitchChangeEventHandler } from 'antd/es/switch';
import { refreshCache } from '../utils/fetch-loop';
import CoinLogos from '../config/logos.json';
import tuple from 'immutable-tuple';
import { nanoid } from 'nanoid';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import SwapSuccessAnim from './animations/SwapSucessAnim';

const Wrapper = styled.div({
  padding: '10px 16px 16px',
  flex: 1,
});

const TradeSuffix = styled.span({
  fontSize: 12,
  background: '#2E3838',
  borderRadius: 4,
  width: 90,
  height: 'calc(100% + 8px)',
  marginRight: -11,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

const TradeInput = styled(Input)({
  textAlign: 'left',
  paddingBottom: 8,
  '.ant-input-affix-wrapper': {
    borderRadius: 4,
    borderTopLeftRadius: '4px !important',
    borderBottomLeftRadius: '4px !important',
  },
  '.ant-input-group-addon': {
    background: '#121616',
  }
});

const InputSuffix = styled.div({
  width: '30px',
});

const CoinLogo = styled.img({
  width: 20,
  height: 20,
  marginRight: 6,
});

const TradeButton = styled(Button)({
  margin: '20px 0px 0px 0px',
  background: '#FF810A',
  borderColor: '#FF810A',
  borderRadius: 4,
  fontWeight: 'bold',
});

const ConnectButton = styled(WalletMultiButton)({
  margin: '20px 0px 0px 0px',
  justifyContent: 'center',
  background: 'linear-gradient(100.61deg, #B85900 0%, #FF810A 100%) !important',
  border: 'none',
  width: '100%',
  borderRadius: 8,
  fontWeight: 500,
  fontSize: 16,
});

const TradeRadioGroup = styled(Radio.Group)({
  width: '100%',
});

const BuyRadio = styled(Radio.Button)({
  lineHeight: '36px',
  height: 36,
  width: '50%',
  textAlign: 'center',
  color: (props) => props['data-active'] ? 'var(--buy-color-light) !important' : '#676767',
  background: 'none !important',
  border: 'none !important',
  borderBottom: (props) => props['data-active'] ? '2px solid var(--buy-color-light) !important' : 'none',
  '&:hover': {
    color: 'var(--buy-color-dark) !important',
  },
});

const SellRadio = styled(Radio.Button)({
  lineHeight: '36px',
  height: 36,
  width: '50%',
  textAlign: 'center',
  color: (props) => props['data-active'] ? 'var(--sell-color-light) !important' : '#676767',
  background: 'none !important',
  border: 'none !important',
  borderBottom: (props) => props['data-active'] ? '2px solid var(--sell-color-light) !important' : 'none',
  '&:hover': {
    color: 'var(--sell-color-dark) !important',
  },
});

const OrderTypeContainer = styled.div({
  padding: '4px 0',
  background: '#1C2222',
  borderRadius: 4,
  display: 'flex',
  marginBottom: 5,
});

const OrderTypeButton = styled.button({
  background: (props) => props['data-active'] ? '#2E3838' : '#1C2222',
  color: (props) => props['data-active'] ? '#FFFAF5' : '#676767',
  width: '50%',
  height: 32,
  margin: '0 4px',
  borderRadius: 4,
  fontSize: 11,
  textAlign: 'center',
  border: 'none',
  'img': {
    opacity: (props) => props['data-active'] ? 1 : 0.35,
    paddingRight: 4,
  },
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center'
});

const SliderContainer = styled.div({
  margin: '16px 0 0',
  padding: '4px 3px',
  borderRadius: 4,
  background: '#2E3838',
  display: 'flex',
  position: 'relative',
});

const SliderValue = styled.div({
  margin: '0 1px',
  width: '25%',
  borderRadius: 4,
  textAlign: 'center',
  color: 'rgb(255 250 245 / 50%)',
  background: '#1C2222',
  fontSize: 10,
  lineHeight: '20px',
  cursor: 'pointer',
})

const SliderActive = styled.div({
  position: 'absolute',
  left: 3,
  margin: '0 1px',
  width: (props) => 'calc(' + props['data-fraction'] + '% - 8px)',
  maxWidth: (props) => 'calc(100% - 8px)',
  borderRadius: 4,
  background: 'linear-gradient(100.61deg, #FF810A 0%, #FFAB5C 100%)',
  textAlign: 'center',
  color: '#FFFAF5',
  fontSize: 10,
  lineHeight: '20px',
  cursor: 'pointer',
  fontWeight: 'bold',
})

const sliderMarks = {
  0: '0%',
  25: '25%',
  50: '50%',
  75: '75%',
  100: '100%',
};

export default function TradeForm({
  style,
  setChangeOrderRef,
}: {
  style?: any;
  setChangeOrderRef?: (
    ref: ({ size, price }: { size?: number; price?: number }) => void,
  ) => void;
}) {
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const { baseCurrency, quoteCurrency, market } = useMarket();
  const baseCurrencyBalances = useSelectedBaseCurrencyBalances();
  const quoteCurrencyBalances = useSelectedQuoteCurrencyBalances();
  const baseCurrencyAccount = useSelectedBaseCurrencyAccount();
  const quoteCurrencyAccount = useSelectedQuoteCurrencyAccount();
  const openOrdersAccount = useSelectedOpenOrdersAccount();
  const { wallet, connected, signTransaction } = useWallet();
  const sendConnection = useSendConnection();
  const gpaConnection = useGpaConnection();
  const markPrice = useMarkPrice();
  useFeeDiscountKeys();
  const {
    storedFeeDiscountKey: feeDiscountKey,
  } = useLocallyStoredFeeDiscountKey();

  const [postOnly, setPostOnly] = useState(false);
  const [ioc, setIoc] = useState(false);
  const [baseSize, setBaseSize] = useState<number | undefined>(undefined);
  const [quoteSize, setQuoteSize] = useState<number | undefined>(undefined);
  const [price, setPrice] = useState<number | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [sizeFraction, setSizeFraction] = useState(0);

  const availableQuote =
    openOrdersAccount && market
      ? openOrdersAccount.reduce((accu, next) => {
        return accu + market.quoteSplSizeToNumber(next.quoteTokenFree)
      }, 0)
      : 0;

  let quoteBalance = (quoteCurrencyBalances || 0) + (availableQuote || 0);
  let baseBalance = baseCurrencyBalances || 0;
  let sizeDecimalCount =
    market?.minOrderSize && getDecimalCount(market.minOrderSize);
  let priceDecimalCount = market?.tickSize && getDecimalCount(market.tickSize);

  const publicKey = wallet?.adapter.publicKey;

  useEffect(() => {
    setChangeOrderRef && setChangeOrderRef(doChangeOrder);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setChangeOrderRef]);

  useEffect(() => {
    baseSize && price && onSliderChange(sizeFraction);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [side]);

  useEffect(() => {
    updateSizeFraction();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [price, baseSize]);

  useEffect(() => {
    const warmUpCache = async () => {
      try {
        if (!wallet || !publicKey || !market) {
          return;
        }
        const startTime = getUnixTs();
        // console.log(`Refreshing accounts for ${market.address}`);
        await market?.findOpenOrdersAccountsForOwner(gpaConnection, publicKey);
        await market?.findBestFeeDiscountKey(sendConnection, publicKey);
        // const endTime = getUnixTs();
        // console.log(
        //   `Finished refreshing accounts for ${market.address} after ${endTime - startTime
        //   }`,
        // );
      } catch (e) {
        console.log(`Encountered error when refreshing trading accounts: ${e}`);
      }
    };
    warmUpCache();
    const id = setInterval(warmUpCache, 30_000);
    return () => clearInterval(id);
  }, [market, sendConnection, wallet, publicKey]);

  const onSetBaseSize = (baseSize: number | undefined) => {
    setBaseSize(baseSize);
    if (!baseSize) {
      setQuoteSize(undefined);
      return;
    }
    let usePrice = price || markPrice;
    if (!usePrice) {
      setQuoteSize(undefined);
      return;
    }
    const rawQuoteSize = baseSize * usePrice;
    const quoteSize =
      baseSize && roundToDecimal(rawQuoteSize, sizeDecimalCount);
    setQuoteSize(quoteSize);
  };

  const onSetQuoteSize = (quoteSize: number | undefined) => {
    setQuoteSize(quoteSize);
    if (!quoteSize) {
      setBaseSize(undefined);
      return;
    }
    let usePrice = price || markPrice;
    if (!usePrice) {
      setBaseSize(undefined);
      return;
    }
    const rawBaseSize = quoteSize / usePrice;
    const baseSize = quoteSize && roundToDecimal(rawBaseSize, sizeDecimalCount);
    setBaseSize(baseSize);
  };

  const doChangeOrder = ({
    size,
    price,
  }: {
    size?: number;
    price?: number;
  }) => {
    const formattedSize = size && roundToDecimal(size, sizeDecimalCount);
    const formattedPrice = price && roundToDecimal(price, priceDecimalCount);
    formattedSize && onSetBaseSize(formattedSize);
    formattedPrice && setPrice(formattedPrice);
  };

  const updateSizeFraction = () => {
    const rawMaxSize =
      side === 'buy' ? quoteBalance / (price || markPrice || 1) : baseBalance;
    const maxSize = floorToDecimal(rawMaxSize, sizeDecimalCount);
    const sizeFraction = Math.min(((baseSize || 0) / maxSize) * 100, 100);
    setSizeFraction(sizeFraction);
  };

  const onSliderChange = (value) => {
    if (!price && markPrice) {
      let formattedMarkPrice: number | string = priceDecimalCount
        ? markPrice.toFixed(priceDecimalCount)
        : markPrice;
      setPrice(
        typeof formattedMarkPrice === 'number'
          ? formattedMarkPrice
          : parseFloat(formattedMarkPrice),
      );
    }

    let newSize;
    if (side === 'buy') {
      if (price || markPrice) {
        newSize = (quoteBalance / (price || markPrice || 1)) * value;
      }
    } else {
      newSize = baseBalance * value;
    }

    // round down to minOrderSize increment
    let formatted = newSize;

    onSetBaseSize(formatted);
  };

  async function onSubmit() {
    if (!price) {
      console.warn('Missing price');
      notify({
        message: 'Missing price',
        type: 'error',
      });
      return;
    } else if (!baseSize) {
      console.warn('Missing size');
      notify({
        message: 'Missing size',
        type: 'error',
      });
      return;
    }

    setSubmitting(true);
    try {
      if (!wallet) {
        return null;
      }

      await placeOrder({
        side,
        price,
        size: baseSize,
        orderType: ioc ? 'ioc' : postOnly ? 'postOnly' : 'limit',
        market,
        connection: sendConnection,
        wallet,
        signTransaction,
        baseCurrencyAccount: baseCurrencyAccount?.pubkey,
        quoteCurrencyAccount: quoteCurrencyAccount?.pubkey,
        feeDiscountPubkey: feeDiscountKey,
      });
      refreshCache(tuple('getTokenAccounts', wallet, connected));
      setPrice(undefined);
      onSetBaseSize(undefined);
    } catch (e) {
      console.warn(e);
      notify({
        message: 'Error placing order',
        description: e.message,
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <FloatingElement
      style={{ display: 'flex', flexDirection: 'column', padding: 0, minHeight: 399, ...style }}
    >
      <TradeRadioGroup
        onChange={(e) => setSide(e.target.value)}
        value={side}
        buttonStyle="solid"
      >
        <BuyRadio data-active={side === 'buy'} value="buy">Buy</BuyRadio>
        <SellRadio data-active={side === 'sell'} value="sell">Sell</SellRadio>
      </TradeRadioGroup>
      <Wrapper
        className="solape-tradeform">
        <TradeInput
          addonBefore={<InputSuffix>Price</InputSuffix>}
          suffix={
            <TradeSuffix>
              {(quoteCurrency && CoinLogos[quoteCurrency]) &&
                <CoinLogo src={CoinLogos[quoteCurrency]} alt={quoteCurrency} />
              }
              {quoteCurrency}
            </TradeSuffix>
          }
          placeholder={"0.0000"}
          value={price}
          type="number"
          step={market?.tickSize || 1}
          onChange={(e) => setPrice(parseFloat(e.target.value))}
        />

        <OrderTypeContainer>
          <OrderTypeButton data-type="limit" data-active={true} onClick={() => setPostOnly(true)}>
            <img src="/icons/limit-order.svg" />
            Limit order
          </OrderTypeButton>
          <OrderTypeButton data-type="market" data-active={false} onClick={() => setPostOnly(false)}>
            <img src="/icons/market-order.svg" />
            Market order
          </OrderTypeButton>
        </OrderTypeContainer>

        <TradeInput
          addonBefore={<InputSuffix>Size</InputSuffix>}
          suffix={
            <TradeSuffix>
              {(baseCurrency && CoinLogos[baseCurrency]) &&
                <CoinLogo src={CoinLogos[baseCurrency]} alt={baseCurrency} />
              }
              {baseCurrency}
            </TradeSuffix>
          }
          placeholder={"0.0000"}
          value={baseSize}
          type="number"
          step={market?.minOrderSize || 1}
          onChange={(e) => onSetBaseSize(parseFloat(e.target.value))}
        />
        <TradeInput
          style={{ paddingBottom: 4 }}
          suffix={
            <TradeSuffix>
              {(quoteCurrency && CoinLogos[quoteCurrency]) &&
                <CoinLogo src={CoinLogos[quoteCurrency]} alt={quoteCurrency} />
              }
              {quoteCurrency}
            </TradeSuffix>
          }
          placeholder={"0.0000"}
          value={quoteSize}
          type="number"
          step={market?.minOrderSize || 1}
          onChange={(e) => onSetQuoteSize(parseFloat(e.target.value))}
        />

        <SliderContainer>
          {Object.keys(sliderMarks).map((value, index) => (
            <SliderValue
              key={index}
              onClick={() => onSliderChange(parseInt(value) / 100)}
            >
              {sliderMarks[value]}
            </SliderValue>
          ))}
          {(sizeFraction > 0) &&
            <SliderActive data-fraction={sizeFraction}>
              {Math.round(sizeFraction)}%
            </SliderActive>
          }
        </SliderContainer>

        {!connected ? (
          // <ConnectButton type="primary" size="large" onClick={connect}>Connect wallet</ConnectButton>
          <ConnectButton />
        ) : (
          <TradeButton
            disabled={!price || !baseSize}
            onClick={onSubmit}
            block
            type="primary"
            size="large"
            loading={submitting}
          >
            {side === 'buy' ? 'Buy' : 'Sell'}
          </TradeButton>
        )}
      </Wrapper>
    </FloatingElement >
  );
}

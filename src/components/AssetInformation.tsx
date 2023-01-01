import { Button, Col, Divider, Popover, Row } from 'antd';
import React, { useState, useEffect } from 'react';
import FloatingElement from './Common/FloatingElement';
import styled, { css } from 'styled-components';
import {
  useMarket
} from '../utils/markets';
import { useConnection } from '../utils/connection';

import { ReactComponent as LinkIcon } from '../assets/img/LinkIcon.svg'
import { ReactComponent as TelegramIcon } from '../assets/img/TelegramIcon.svg'
import { ReactComponent as DiscordIcon } from '../assets/img/DiscordIcon.svg'
import { ReactComponent as TwitterIcon } from '../assets/img/TwitterIcon.svg'
import { getTokenAccountInfo } from '../utils/tokenUtils';

const Title = styled.div`
  color: rgba(255, 255, 255, 1);
`;

const RowBox = styled(Row)`
  padding-bottom: 20px;
`;

const Subheader = styled.h2({
  color: '#FFE6CC',
  fontSize: '14px',
  lineHeight: '20px',
  fontFamily: 'Inter',
  marginBottom: 4,
})

interface MarketInfo {
  solscanLink: string,
  supply: number,
  decimals: number,
  telegramLink?: string,
  discordLink?: string,
  twitterLink?: string
}

export default function AssetInformation() {
  const { market, marketName } = useMarket();
  const connection = useConnection();

  let [currentMarket, setCurrentMarket] = useState<MarketInfo>(); 
  let [ticker, setTicker] = useState(null); 

  useEffect(() => {
    async function getTokenInfo() {
      if (market) {
        let mintinfo: any = await connection.getTokenSupply(market.baseMintAddress);
        setCurrentMarket({
          solscanLink: `https://solscan.io/token/${market.baseMintAddress.toBase58()}`,
          supply: mintinfo.value.uiAmount,
          decimals: mintinfo.value.decimals
        });
      }
    }
    getTokenInfo();

    if (marketName) {
      // @ts-ignore
      setTicker(marketName.split("/")[0]);
    }
  }, [market, marketName]);

  let marketData = {
    solscanLink: '',
    key: 1,
    supply: 1000,
    decimals: 9,
    telegramLink: 'https://telegram.com',
    discordLink: 'https://discord.com',
    twitterLink: 'https://twitter.com'
  };

  return (
    <FloatingElement style={{ marginBottom: 16 }}>
      <React.Fragment>
        <RowBox
          align="left"
          justify="space-between"
          style={{ paddingBottom: 0 }}
        >
          <Divider>
            <Title style={{ paddingBottom: 14 }}>Asset Information</Title>
          </Divider>
          {currentMarket &&
            <>
              <Col>
                <Subheader>Ticker</Subheader>
                <strong style={{ textTransform: "uppercase" }}>
                  {ticker}{' '}
                </strong>
                <a 
                  href={currentMarket.solscanLink} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{ verticalAlign: 'middle' }}
                >
                  <LinkIcon style={{ marginRight: 0, marginTop: -4, paddingTop: 0 }}/>
                </a>
              </Col>
              <Col>
                <Subheader>Total supply</Subheader>
                <strong>
                  {new Intl.NumberFormat(
                    'en-US'
                  ).format(currentMarket.supply)}
                </strong>
              </Col>
              <Col>
                <Subheader>Decimals</Subheader>
                <strong>{currentMarket.decimals}</strong>
              </Col>
              <Col>
                <Subheader>Links</Subheader>
                <strong>-</strong>
                {/* {marketData.telegramLink
                    ? <a href={marketData.telegramLink} target="_blank" rel="noopener noreferrer">
                      <TelegramIcon style={{ marginRight: 4, width: 20, height: 20 }}/>
                    </a>
                    : <TelegramIcon style={{ marginRight: 4, width: 20, height: 20, filter: "grayscale(1)" }}/>
                }
                {marketData.discordLink
                    ? <a href={marketData.discordLink} target="_blank" rel="noopener noreferrer">
                      <DiscordIcon style={{marginRight: 4, width: 20, height: 20}}/>
                    </a>
                    : <DiscordIcon style={{marginRight: 4, width: 20, height: 20, filter: "grayscale(1)" }}/>
                }
                {marketData.twitterLink
                    ? <a href={marketData.twitterLink} target="_blank" rel="noopener noreferrer">
                      <TwitterIcon style={{marginRight: 4, width: 20, height: 20}}/>
                    </a>
                    : <TwitterIcon style={{marginRight: 4, width: 20, height: 20, filter: "grayscale(1)"}}/>
                } */}
              </Col>
            </>
          }
        </RowBox>

      </React.Fragment>
    </FloatingElement>
  );
}

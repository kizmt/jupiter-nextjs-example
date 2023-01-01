import React from 'react';
import { Layout, Row, Col, Grid } from 'antd';
import Link from './Link';
import { helpUrls } from './HelpUrls';
import { useReferrer } from '../utils/referrer';
const { Footer } = Layout;
const { useBreakpoint } = Grid;

const footerElements = [
  {
    description: 'Serum Developer Resources',
    link: helpUrls.developerResources,
  },
  { description: 'Discord', link: helpUrls.discord },
  { description: 'Telegram', link: helpUrls.telegram },
  { description: 'GitHub', link: helpUrls.github },
  { description: 'Project Serum', link: helpUrls.projectSerum },
  { description: 'Solana Network', link: helpUrls.solanaBeach },
];

export const CustomFooter = () => {
  const smallScreen = !useBreakpoint().lg;
  const { refCode, allowRefLink } = useReferrer();
  return (
    <Footer
      style={{
        paddingBottom: 60,
        paddingTop: 36,
        marginTop: 50,
      }}
    >
      <Row align="top" justify="center" gutter={[16, 4]}>
        <Col flex="266px 0 0" style={{ marginRight: 104 }}>
          <a href="#" className="logo">Solape</a>
          <p>An Openbook Solana DEX built by apes, for other apes.</p>
          <p>APES. TOGETHER. STRONG.</p>
        </Col>
        <Col style={{ marginRight: 80 }}>
          <h4>Ecosystem</h4>
          <a href="https://solape.io">Swap</a>
          <a href="/#/market/8BnEgHoWFysVcuFFX7QztDmzuH8r5ZFvyP3sYwn1XTh6">Trade</a>
          <a href="https://magiceden.io/marketplace/solape_access_card" target="_blank" rel="noopener noreferrer">NFTs</a>
          <a href="https://docs.google.com/forms/d/1liE3O_dh_d_gM06IyqydLrVbeAe9wn5kc1b5R7Z9QT8/edit" target="_blank" rel="noopener noreferrer">API</a>
        </Col>
        <Col style={{ marginRight: 80 }}>
          <h4>Support</h4>
          <a href="/#/token-listing">Token Listing</a>
          <a href="https://docs.solape.io/" target="_blank" rel="noopener noreferrer">Help</a>
          <a href="mailto:info@solape.io">Contact</a>
          <a href="https://discord.gg/solape" target="_blank" rel="noopener noreferrer">Discord</a>
        </Col>
        <Col style={{ marginRight: 80 }}>
          <h4>$SOLAPE</h4>
          <a href="/#/market/4zffJaPyeXZ2wr4whHgP39QyTfurqZ2BEd4M5W6SEuon">Buy</a>
          <a href="/#/tokenomics">Tokenomics</a>
          <a href="/#/past-airdrops">Airdrops</a>
          <a href="https://www.coingecko.com/en/coins/solape-token" target="_blank" rel="noopener noreferrer">Coingecko</a>
        </Col>
        <Col style={{ width: 95 }}>
          <h4>Community</h4>
          <a href="https://twitter.com/SolApeFinance" target="_blank" rel="noopener noreferrer">Twitter</a>
          <a href="https://discord.gg/solape" target="_blank" rel="noopener noreferrer">Discord</a>
          <a href="https://solape.medium.com/" target="_blank" rel="noopener noreferrer">Medium</a>
          <a href="https://twitter.com/SolApeFinance/status/1420083043780501504" target="_blank" rel="noopener noreferrer">We're hiring ✨</a>
        </Col>
      </Row>
    </Footer>
  );
};

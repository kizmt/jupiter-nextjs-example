import {
  PlusCircleOutlined,
  SettingOutlined,
  MenuOutlined
} from '@ant-design/icons';
import { Button, Col, Menu, Popover, Row, Select } from 'antd';
import React, { useCallback, useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { useWallet } from '@solana/wallet-adapter-react';
import { ENDPOINTS, useConnectionConfig } from '../utils/connection';
import Settings from './Settings';
import MobileMenu from './MobileMenu';
import CustomClusterEndpointDialog from './CustomClusterEndpointDialog';
import { EndpointInfo } from '../utils/types';
import { notify } from '../utils/notifications';
import { Connection } from '@solana/web3.js';
import WalletConnect from './WalletConnect';
import { WalletIcon, WalletMultiButton } from '@solana/wallet-adapter-react-ui';

import AppSearch from './AppSearch';
import { getTradePageUrl } from '../utils/markets';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import { logGroup } from '../modules/helpers';
import { useSetState } from 'react-use';

const ConnectButton = styled(WalletMultiButton)`
  &.wallet-adapter-button {
    margin: 0px;
    justify-content: center;
    background: transparent;
    border: 2px solid #ff810a;
    width: 100%;
    height: 38px;
    border-radius: 8px;
    font-weight: 500;
    font-size: 16px;
    font-family: 'Inter';

    &:hover{
      background: #ff810a;
    }
  }
`

const Wrapper = styled.div`
  background: linear-gradient(100.61deg, #090B0B 0%, #1C2222 100%);
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  padding: 0 30px;
  flex-wrap: wrap;
  
  @media (max-width: 1020px) {
    padding: 16px 30px;
  }
`;
const LogoWrapper = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;
  img {
    height: 34px;
    margin-right: 8px;
    margin-top: 4px;
  }
`;

const ConnectButtonWrapper = styled.div`
  display: flex;
  align-items: center;
`;

const EXTERNAL_LINKS = {
  '/learn': 'https://serum-academy.com/en/serum-dex/',
  '/add-market': 'https://serum-academy.com/en/add-market/',
  '/wallet-support': 'https://serum-academy.com/en/wallet-support',
  '/dex-list': 'https://serum-academy.com/en/dex-list/',
  '/developer-resources': 'https://serum-academy.com/en/developer-resources/',
  '/explorer': 'https://explorer.solana.com',
  '/srm-faq': 'https://projectserum.com/srm-faq',
  '/swap': 'https://swap.projectserum.com',
  'https://solapeswap.io/#/swap/': 'https://solapeswap.io/#/swap/',
  'https://apexlev.solapeswap.io/': 'https://apexlev.solapeswap.io/',
};

export default function TopBar() {
  const { connected, wallet } = useWallet();
  const {
    endpoint,
    endpointInfo,
    setEndpoint,
    availableEndpoints,
    setCustomEndpoints,
  } = useConnectionConfig();
  const [addEndpointVisible, setAddEndpointVisible] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const location = useLocation();
  const history = useHistory();
  const [searchFocussed, setSearchFocussed] = useState(false);
  const [isMobileMenuActive, setIsMobileMenuActive] = useState(false);

  const handleClick = useCallback(
    (e) => {
      document.body.classList.remove('mobile-menu--open');
      setIsMobileMenuActive(false);

      if (!(e.key in EXTERNAL_LINKS)) {
        history.push(e.key);
      }
    },
    [history],
  );

  const onAddCustomEndpoint = (info: EndpointInfo) => {
    const existingEndpoint = availableEndpoints.some(
      (e) => e.endpoint === info.endpoint,
    );
    if (existingEndpoint) {
      notify({
        message: `An endpoint with the given url already exists`,
        type: 'error',
      });
      return;
    }

    const handleError = (e) => {
      console.log(`Connection to ${info.endpoint} failed: ${e}`);
      notify({
        message: `Failed to connect to ${info.endpoint}`,
        type: 'error',
      });
    };

    try {
      const connection = new Connection(info.endpoint, 'recent');
      connection
        .getEpochInfo()
        .then((result) => {
          setTestingConnection(true);
          console.log(`testing connection to ${info.endpoint}`);
          const newCustomEndpoints = [
            ...availableEndpoints.filter((e) => e.custom),
            info,
          ];
          setEndpoint(info.endpoint);
          setCustomEndpoints(newCustomEndpoints);
        })
        .catch(handleError);
    } catch (e) {
      handleError(e);
    } finally {
      setTestingConnection(false);
    }
  };

  const endpointInfoCustom = endpointInfo && endpointInfo.custom;
  useEffect(() => {
    const handler = () => {
      if (endpointInfoCustom) {
        setEndpoint(ENDPOINTS[0].endpoint);
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [endpointInfoCustom, setEndpoint]);

  const tradePageUrl = location.pathname.startsWith('/market/')
    ? location.pathname
    : getTradePageUrl();

  const homePageUrl = "https://solape.io";

  interface State {
    run: boolean;
    steps: Step[];
  }

  const [{ run, steps }, setState] = useSetState<State>({
    run: false,
    steps: [
      {
        title: <h1>Get started<br />with Solape!</h1>,
        content: 'Follow this guide to start trading Solana (SPL) cryptocurrencies on the trustless and secure Openbook decentralized exchange',
        locale: { skip: <strong aria-label="skip">Skip</strong> },
        placement: 'center',
        target: 'body',
      },
      {
        title: <h2>Connect Wallet</h2>,
        content: 'If you do not have a DeFi Wallet, the Select Wallet menu will provide prompts for guides that you can follow to get started',
        floaterProps: {
          disableAnimation: true,
        },
        spotlightPadding: 20,
        target: '.wallet-adapter-button',
        placement: 'right',
      },
      {
        content:
          'Select the market you would like to trade from the menu, or use the search function to find a specific token pair',
        placement: 'left',
        target: '.ant-select-selector',
        title: <h2>Trading Pairs</h2>,
        floaterProps: {
          disableAnimation: true,
        },
        spotlightPadding: 10,
      },
      {
        content: 'When connected, the Accounts box features wallet balances, unsettled balances, a token accounts button, and a Settle button for use after trades have been executed', placement: 'top',
        target: '.solape-accounts',
        title: <h2>Token Accounts</h2>,
        floaterProps: {
          disableAnimation: true,
        },
        spotlightPadding: 30,
      },
      {
        title: <h2>Charts & Stats</h2>,
        content: 'View token charts and statistics that are easy to read and provide informaiton on token pairs across the Solana ecosystem',
        floaterProps: {
          disableAnimation: true,
        },
        spotlightPadding: 10,
        target: '.solape-charts',
        placement: 'right',
      },
      {
        content: 'Stay up to date with real-time data from the Openbook Central Limit Orderbook (CLOB).',
        placement: 'top',
        target: '.solape-orderbook',
        title: <h2>Orderbook</h2>,
        floaterProps: {
          disableAnimation: true,
        },
        spotlightPadding: 0,
      },
      {
        content: (
          <div>
            Input your Buy or Sell price and adjust your Sizes accordingly. You can also click/tap the Orderbook prices to update amounts automatically.
          </div>
        ),
        placement: 'top',
        target: '.solape-tradeform',
        title: <h2>Trade Form</h2>,
        floaterProps: {
          disableAnimation: true,
        },
        spotlightPadding: 0,
      },
      {
        content: (
          <div>
            <h1>Open Orders</h1>
            <br />
            View your open orders, recent trade history, token-balances and fees structure.          </div>
        ),
        placement: 'bottom',
        target: '.user-info-tabs',
      },
      {
        title: <h2>Settle</h2>,
        content: 'After your Limit Order trade has been filled, click the Settle button to transfer funds from your trading account back into your wallet',
        floaterProps: {
          disableAnimation: true,
        },
        spotlightPadding: 10,
        target: '.solape-settle',
        placement: 'bottom',
      },
      {
        content: 'Add any custom Openbook market and trade it live exclusively through the Solape GUI.',
        placement: 'top',
        target: '.solape-addmarket',
        title: <h2>Add Custom Market</h2>,
        floaterProps: {
          disableAnimation: true,
        },
        spotlightPadding: 10,
      },
      {
        title: <h1>Quick Guide Complete</h1>,
        content: (
          <div>
            Great job on getting through the guide, if you would like
            more info join us in discord.gg/solape <br />
          </div>
        ),
        floaterProps: {
          disableAnimation: true,
        },
        spotlightPadding: 40,
        target: 'body',
        placement: 'center',
      },
    ],
  });

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setState({ run: false });
    }

    logGroup(type, data);
  };

  const handleClickStart = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();

    setState({
      run: true,
    });
  };

  return (
    <>
      <CustomClusterEndpointDialog
        visible={addEndpointVisible}
        testingConnection={testingConnection}
        onAddCustomEndpoint={onAddCustomEndpoint}
        onClose={() => setAddEndpointVisible(false)}
      />
      <Joyride
        callback={handleJoyrideCallback}
        continuous
        hideCloseButton
        run={run}
        scrollToFirstStep
        showProgress
        showSkipButton
        steps={steps}
        styles={{
          options: {
            zIndex: 10000,
            primaryColor: '#FF810A',
            backgroundColor: '#121616',
            textColor: '#D1D1D1'
          },
        }} />
      <Wrapper>
        <LogoWrapper onClick={() => window.location.href = homePageUrl}>
          <img src="/solape.svg" alt="" />
        </LogoWrapper>

        <Menu
          mode="horizontal"
          onClick={handleClick}
          selectedKeys={[location.pathname]}
          className="solape__lg-menu"
          style={{
            borderBottom: 'none',
            backgroundColor: 'transparent',
            display: 'flex',
            alignItems: 'center',
            flex: 1,
          }}
        >
          <Menu.Item key="https://solape.io" style={{ margin: '0 0 0 20px', color: 'FFFAF5', fontSize: 14, fontFamily: 'Inter', fontWeight: 800 }}>
            <a href="https://solape.io" target="_self" rel="noopener noreferrer">Swap</a>
          </Menu.Item>
          <Menu.Item key={tradePageUrl} style={{ margin: '0', color: '#FFFAF5', fontSize: 14, fontFamily: 'Inter', fontWeight: 800 }}>
            Trade
          </Menu.Item>

          <Menu.Item key="/#/markets" style={{ margin: '0', fontSize: 14, color: '#FFFAF5', fontFamily: 'Inter', fontWeight: 800 }}>
            <a href="/#/markets">Markets</a>
          </Menu.Item>
          <Menu.Item key="/#/help" style={{ margin: '0', color: '#FFFAF5', fontSize: 14, fontFamily: 'Inter', fontWeight: 800 }}>
            <a href="/#/help">Help</a>
          </Menu.Item>
          <Menu.Item key="/#/about" style={{ margin: '0', color: '#FFFAF5', fontSize: 14, fontFamily: 'Inter', fontWeight: 800 }}>
            <a href="/#/about">About</a>
          </Menu.Item>
          {!searchFocussed && (
            <Menu.SubMenu
              title="More"
              key="main-submenu"
              onTitleClick={() =>
                window.open
              }
              style={{ margin: '0', color: '#FFFAF5', fontSize: 14, fontFamily: 'Inter', fontWeight: 800 }}
            >
              <Menu.Item key="/#/token-listing" style={{ margin: '0', color: '#FFFAF5', fontSize: 14 }}>
                <a href="/#/token-listing">Request Listing</a>
              </Menu.Item>
              <Menu.Item key="/#/market/4zffJaPyeXZ2wr4whHgP39QyTfurqZ2BEd4M5W6SEuon" style={{ margin: '0', color: '#FFFAF5', fontSize: 14 }}>
                <a href="/#/market/4zffJaPyeXZ2wr4whHgP39QyTfurqZ2BEd4M5W6SEuon">Buy $SOLAPE</a>
              </Menu.Item>
              <Menu.Item key="/#/tokenomics" style={{ margin: '0', color: '#FFFAF5', fontSize: 14 }}>
                <a href="/#/tokenomics">Tokenomics</a>
              </Menu.Item>
              <Menu.Item key="https://github.com/solape-dex" style={{ margin: '0', color: '#FFFAF5', fontSize: 14 }}>
                <a href="https://github.com/solape-dex" target="_blank" rel="noopener noreferrer">Github</a>
              </Menu.Item>
              <Menu.Item key="https://solscan.io/"
                style={{ margin: '0', color: '#FFFAF5', fontSize: 14 }}>
                <a href="https://solscan.io/" target="_blank" rel="noopener noreferrer">Solana Explorer</a>
              </Menu.Item>
            </Menu.SubMenu>
          )}
        </Menu>
        <Button className="" style={{
          marginRight: 30,
          marginTop: 16,
          paddingBottom: 24,
          borderColor: '',
          paddingLeft: 18,
          background: 'transparent',
          border: '1px solid #ff810a',
          borderRadius: '8px',
          fontFamily: 'Inter',
          font: 'bold',
          letterSpacing: 1,
          fontWeight: '800',
          fontSize: '14px',
        }}
          onClick={handleClickStart}>
          Quick Guide
        </Button>
        {/*<div
          style={{
            display: 'flex',
            alignItems: 'center',
            paddingRight: 5,
          }}
        >
          <AppSearch
            onFocus={() => setSearchFocussed(true)}
            onBlur={() => setSearchFocussed(false)}
            focussed={searchFocussed}
            width={searchFocussed ? '350px' : '35px'}
          />
        </div>
        <div>
          <Row
            align="middle"
            style={{ paddingLeft: 12, paddingRight: 5 }}
            gutter={16}
          >
            <Col>
              <PlusCircleOutlined
                style={{ color: '#fff' }}
                onClick={() => setAddEndpointVisible(true)}
              />
            </Col>
            {/*
            <Col>
              <Popover
                content={endpoint}
                placement="bottomRight"
                title="URL"
                trigger="hover"
              >
                <InfoCircleOutlined style={{ color: '#2abdd2' }} />
              </Popover>
            </Col>
            <Col>
              <Select
                onSelect={setEndpoint}
                value={endpoint}
                style={{ marginRight: 8, width: '150px' }}
              >
                {availableEndpoints.map(({ name, endpoint }) => (
                  <Select.Option value={endpoint} key={endpoint}>
                    {name}
                  </Select.Option>
                ))}
              </Select>
            </Col>
            
          </Row>
        </div>*/}
        {/* {connected && (
          <div>
            <Popover
              content={<Settings autoApprove={wallet?.autoApprove} />}
              placement="bottomRight"
              title="Settings"
              trigger="click"
            >
              <Button style={{ marginRight: 8, marginLeft: 10 }}>
                <SettingOutlined />
                Settings
              </Button>
            </Popover>
          </div>
        )} */}
        <ConnectButtonWrapper>
          <ConnectButton />
        </ConnectButtonWrapper>

        <div className="mobile-menu__trigger">
          <Button
            className="solape__mobile-menu__trigger__btn"
            type="text"
            onClick={() => {
              document.body.classList.add('mobile-menu--open');
              setIsMobileMenuActive(true);
            }}
            icon={<MenuOutlined />}
          />
        </div>
        {isMobileMenuActive &&
          <MobileMenu
            tradePageUrl={tradePageUrl}
            isMobileMenuActive={isMobileMenuActive}
            setIsMobileMenuActive={(a) => {
              document.body.classList.remove('mobile-menu--open');
              setIsMobileMenuActive(a);
            }}
            handleClick={handleClick}
          />
        }
      </Wrapper>
    </>
  );
}
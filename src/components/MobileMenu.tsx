import React from 'react';
import { Menu } from 'antd';
import { Button } from 'antd';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';
import {
  CloseOutlined
} from '@ant-design/icons';
import WalletConnect from './WalletConnect';

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

export default function LinkAddress({
  tradePageUrl,
  isMobileMenuActive,
  setIsMobileMenuActive,
  handleClick
}: {
  tradePageUrl: string;
  isMobileMenuActive: boolean;
  setIsMobileMenuActive: (a: boolean) => void;
  handleClick: any;
}) {
  const location = useLocation();

  return (
    <>
      {isMobileMenuActive &&
        <div className="solape__mobile-menu">

          <div className="solape__mobile-menu__header">
            <div className="solape__mobile-menu__header__actions">
              <LogoWrapper onClick={() => window.location.href = "https://solape.io"}>
                <img src="/solape.svg" alt="" />
              </LogoWrapper>
              <Button
                className="solape__mobile-menu__trigger__btn"
                type="text"
                onClick={() => setIsMobileMenuActive(false)}
                icon={<CloseOutlined />}
              />
            </div>
            <div className="solape__mobile-menu__connect" onClick={handleClick}>
              <WalletConnect />
            </div>
          </div>
          <Menu
            mode="vertical"
            onClick={handleClick}
            selectedKeys={[location.pathname]}
          >
            <Menu.Item key={"/"}>
              Swap
            </Menu.Item>
            <Menu.Item key={tradePageUrl}>
              Trade
            </Menu.Item>
            <Menu.Item key="/#/markets">
              <a href="/#/markets">Buy SOLAPE</a>
            </Menu.Item>
            <Menu.Item key="/#/airdrops">
              <a href="/#/past-airdrops">Airdrops</a>
            </Menu.Item>
            <Menu.Item key="/#/help">
              <a href="/#/help">Help</a>
            </Menu.Item>
          </Menu>
        </div>
      }
    </>
  );
}

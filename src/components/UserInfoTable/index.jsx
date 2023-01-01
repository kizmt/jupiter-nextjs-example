import BalancesTable from './BalancesTable';
import OpenOrderTable from './OpenOrderTable';
import React from 'react';
import tuple from 'immutable-tuple';
import { Tabs, Typography } from 'antd';
import FillsTable from './FillsTable';
import FloatingElement from '../Common/FloatingElement';
import FeesTable from './FeesTable';
import LoadingOrders from './LoadingOrders';
import { useOpenOrders, useBalances, useMarket } from '../../utils/markets';
import { getCache } from '../../utils/fetch-loop';
import { useWallet } from '@solana/wallet-adapter-react';
import NonConnectedTradePageTile from '../NotConnectedTradePageTile';

const { Paragraph } = Typography;
const { TabPane } = Tabs;

export default function Index() {
  const { market } = useMarket();
  const { wallet, connected } = useWallet();

  // Wait for first call to load
  const openOrderLoaded = getCache(
    tuple('getOpenOrdersAccounts', wallet, market, connected),
  );

  console.log('openOrderLoaded: ', openOrderLoaded);

  return (
    <FloatingElement style={{ flex: 1, padding: 0, maxWidth: '100%' }}>
      <div className="user-info-tabs">
        <Tabs defaultActiveKey="orders" destroyInactiveTabPane={true}>
          <TabPane tab="Open Orders" key="orders">
            {connected ? (
              openOrderLoaded ? (
                <OpenOrdersTab />
              ) : (
                <LoadingOrders />
              )
            ) : (
              <NonConnectedTradePageTile
                message={'Connect your wallet to see your orders'}
              />
            )}
          </TabPane>
          <TabPane tab="Recent Trade History" key="fills">
            <FillsTable />
          </TabPane>
          <TabPane tab="Balances" key="balances">
            <BalancesTab />
          </TabPane>
          {market && market.supportsSrmFeeDiscounts ? (
            <TabPane tab="Fee discounts" key="fees">
              <FeesTable />
            </TabPane>
          ) : null}
        </Tabs>
      </div>
    </FloatingElement>
  );
}

const OpenOrdersTab = () => {
  const openOrders = useOpenOrders();
  // const openOrders = [];

  return <OpenOrderTable openOrders={openOrders} />;
};

const BalancesTab = () => {
  const balances = useBalances();

  return <BalancesTable balances={balances} />;
};

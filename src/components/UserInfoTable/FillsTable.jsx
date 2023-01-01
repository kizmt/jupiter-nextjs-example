import React, { useState, useEffect } from 'react';
import { Row, Col, Tag } from 'antd';
import { useFillsApi, useMarket } from '../../utils/markets';
import DataTable from '../Common/DataTable';

export default function FillsTable() {
  const fills = useFillsApi();
  let fillsList = fills[0];

  const [dataSource, setDataSource] = useState(null);

  const { market, marketName } = useMarket();

  function getMarketDecimals(market) {
    return market.tickSize.toString().split('.').length > 1
      ? market.tickSize.toString().split('.')[1].length
      : 4;
  }

  const columns = [
    {
      title: 'Market',
      dataIndex: 'marketName',
      key: 'marketName',
    },
    {
      title: 'Side',
      dataIndex: 'side',
      key: 'side',
      render: (side) => (
        <Tag
          color={side === 1 ? '#41C77A' : '#F23B69'}
          style={{ fontWeight: 700 }}
        >
          {side === 1 ? 'Buy' : side === 2 ? 'Sell' : ''}
        </Tag>
      ),
    },
    {
      title: `Size`,
      dataIndex: 'size',
      key: 'size',
      render: (size) => {
        if (market) {
          return <>{Number(size).toFixed(getMarketDecimals(market))}</>;
        }
        return <>Loading...</>;
      },
    },
    {
      title: `Price`,
      dataIndex: 'price',
      key: 'price',
      render: (price) => {
        if (market) {
          return <>{Number(price).toFixed(getMarketDecimals(market))}</>;
        }
        return <>Loading...</>;
      },
    },
    {
      title: `Timestamp`,
      dataIndex: 'ts',
      key: 'ts',
      render: (ts) => <>{new Date(ts).toLocaleString()}</>,
    },
    // {
    //   title: quoteCurrency ? `Fees (${quoteCurrency})` : 'Fees',
    //   dataIndex: 'feeCost',
    //   key: 'feeCost',
    // },
  ];

  useEffect(() => {
    console.log('MOUNT');
    return () => {
      console.log('WILL UNMOUNT');
    };
  }, []);

  useEffect(() => {
    if (fillsList) {
      const data = (fillsList || []).map((fill) => ({
        ...fill,
        key: `${fill.ts}${fill.side}${fill.size}`,
        marketName,
        // liquidity: fill.eventFlags.maker ? 'Maker' : 'Taker',
      }));
      setDataSource(data);
    } else {
      setDataSource([]);
    }
  }, [fillsList]);

  return (
    <>
      <Row>
        <Col span={24}>
          <DataTable
            dataSource={dataSource}
            columns={columns}
            pagination={true}
            pageSize={5}
            emptyLabel="No fills"
          />
        </Col>
      </Row>
    </>
  );
}

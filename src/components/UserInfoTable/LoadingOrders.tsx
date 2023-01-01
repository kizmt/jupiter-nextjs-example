import { Spin } from 'antd';
import React from 'react';

export default function LoadingOrders() {
  return (
    <div style={{ flex: 1, padding: 20, display: "flex", justifyContent: "center" }}>
      <Spin tip="Loading your orders" />
    </div>
  );
}

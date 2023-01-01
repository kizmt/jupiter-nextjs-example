import React from "react"
import { Space, Spin } from 'antd';
import FloatingElement from "./Common/FloatingElement";

export default function StandaloneBalancesDisplay() {
  return <div className="c__loading-trade-page-tile">
    <FloatingElement style={{ flex: 1, position: 'relative', display: "flex" }}>
      <Spin tip="Loading balances" size="large" style={{ position: 'relative', height: '100%' }}>
        <></>
      </Spin>
    </FloatingElement>
  </div>
}

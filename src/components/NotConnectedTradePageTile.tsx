import React from "react"
import FloatingElement from "./Common/FloatingElement";

export default function NonConnectedTradePageTile({
  message = "Connect your wallet"
}: {
  message: string
}) {
  return <div className="c__loading-trade-page-tile">
    <FloatingElement style={{ flex: 1, position: 'relative', display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p>{message}</p>
    </FloatingElement>
  </div>
}

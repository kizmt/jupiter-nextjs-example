import React, { useState, useEffect } from "react";
import { Grid } from "@material-ui/core";
import { useSwapContext } from "../context/Swap";
import { useTokenMap } from "../context/TokenList";
import cgTokens from "../../../utils/cg_map.json";
import TokenChart from "./TokenChart";
import TokenStats from "./TokenStats";

export default function DestinationStats() {
  const { toMint } = useSwapContext();
  const tokenMap = useTokenMap();
  const tokenInfo = tokenMap.get(toMint.toString());

  return <TokenGrid token={tokenInfo?.symbol?.toLowerCase()} />
}

export function TokenGrid({ token, children }: { token?: string, children?: any }) {
  const [tokenDetails, setTokenDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const cgToken = cgTokens.find(cgToken => cgToken.symbol.toLowerCase() === token);

  useEffect(() => {
    if (cgToken) {
      setLoading(true);
      fetch(`https://api.coingecko.com/api/v3/coins/${cgToken.id}?tickers=false&community_data=false&developer_data=false&sparkline=true`)
        .then(response => response.json())
        .then(json => {
          setTokenDetails(json);
          setLoading(false);
    })
        .catch(e => {
          console.log('Error: ', e);
        });
    }
  }, [token])

  return (
    <>
      {loading ?
        <div>Loading...</div>
        :
        tokenDetails &&
        <Grid container style={{ padding: "5% 10% 5% 5%" }}>
          <TokenChart token={tokenDetails} />
          <TokenStats token={tokenDetails}>
            {children}
          </TokenStats>
        </Grid>
      }
    </>
  );
}

import React, { useState } from "react";
import { Grid, makeStyles } from "@material-ui/core";

const useStyles = makeStyles((theme) => ({
  statLabel: {
    fontSize: 20,
    color: "#676767",
    marginTop: 32,
  },
  stat: {
    color: "#fff",
    fontSize: 32,
  }
}));

export default function TokenStats({ token, children }: { token: any, children: any }) {
  const styles = useStyles();

  return (
    <Grid container>
      <Grid item xs={12} sm={6} md={4}>
        <h3 className={styles.statLabel}>Market Cap Rank</h3>
        <span className={styles.stat}>
          {token.market_cap_rank ? `#${token.market_cap_rank}` : "-"}
        </span>
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <h3 className={styles.statLabel}>Market Cap</h3>
        <span className={styles.stat}>
          {token.market_data?.market_cap?.["usd"] ?
            new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(token.market_data.market_cap["usd"] / 1000000) + "M"
            : "-"}
        </span>
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <h3 className={styles.statLabel}>Circulating Supply</h3>
        <span className={styles.stat}>
          {token.market_data?.circulating_supply ? new Intl.NumberFormat('en-US').format(token.market_data.circulating_supply / 1000000) + "M" : "-"}
        </span>
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <h3 className={styles.statLabel}>YTD ROI</h3>
        <span className={styles.stat}>
          {token.market_data?.roi ?
            new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(token.market_data.roi)
            : "-"}
        </span>
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <h3 className={styles.statLabel}>Trading Volume</h3>
        <span className={styles.stat}>
          {token.market_data?.total_volume?.["usd"] ?
            new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(token.market_data.total_volume["usd"])
            : "-"}
        </span>
      </Grid>
      {children &&
        <Grid item xs={12}>
          {children}
        </Grid>
      }
    </Grid>
  );
}

import React, { useState } from "react";
import { Grid, makeStyles } from "@material-ui/core";
import { Sparklines, SparklinesLine } from "react-sparklines";

const LinearGradientFill = () => {
  return (
    <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor="rgb(255, 129, 10, 0.2)" stopOpacity="1" />
      <stop offset="100%" stopColor="255, 171, 92, 0" stopOpacity="0" />
    </linearGradient>
  );
};

const useStyles = makeStyles((theme) => ({
  range: {
    borderRadius: 4,
    background: "#1C2222",
    color: "#676767",
    padding: 4,
    margin: "0 6px",
  },
  active: {
    background: "#FF810A",
    color: "#fff",
  },
}));

export default function TokenChart({ token }: { token: any }) {
  const styles = useStyles();
  const [sparkRange, setSparkRange] = useState(24);

  return (
    <Grid container className="chart-wrapper">
      <Grid item sm={12} md={10}>
        <h1 style={{ color: "#fff", fontSize: 24, lineHeight: "29px", marginBottom: 4 }}>
          {token.name}&nbsp;
          (<span style={{ color: "#FF810A" }}>{token.symbol?.toUpperCase()}</span>)
        </h1>
        <h2 style={{ color: "#FFFAF5", fontSize: 56, lineHeight: "68px", marginBottom: 4 }}>
          {token.market_data?.current_price?.["usd"] ?
            new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 4 }).format(token.market_data.current_price["usd"])
          : "-"}
        </h2>
        <div style={{ fontSize: 18, color: token.market_data?.price_change_24h >= 0 ?"#0AD171" : "red" }}>
          <span className={styles.range} style={{ color: "#FFFAF5", fontSize: 14, top: "-2px", position: "relative", marginRight: 10 }}>
            24h
          </span>
          {token.market_data?.price_change_24h &&
            new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 4 }).format(token.market_data.price_change_24h)
            + ` (${token.market_data.price_change_percentage_24h}%)`
           }
        </div>
      </Grid>
      <Grid item sm={12} md={2}>
        <a className={`${styles.range} ${sparkRange === 12 ? styles.active : ''}`} onClick={() => setSparkRange(12)}>12h</a>
        <a className={`${styles.range} ${sparkRange === 24 ? styles.active : ''}`} onClick={() => setSparkRange(24)}>1d</a>
        <a className={`${styles.range} ${sparkRange === 168 ? styles.active : ''}`} onClick={() => setSparkRange(168)}>7d</a>
      </Grid>
      <Grid item xs={12} style={{ marginTop: 16, marginLeft: 4 }}>
        {token.market_data.sparkline_7d &&
          <Sparklines data={token.market_data.sparkline_7d.price.slice(168 - sparkRange)} height={280} width={688}>
            <defs>
              <LinearGradientFill />
            </defs>
            <SparklinesLine color="#F37B21" style={{ fillOpacity: "1", fill: "url(#gradient)", strokeWidth: "2" }} />
          </Sparklines>
        }
      </Grid>
    </Grid>
  );
}

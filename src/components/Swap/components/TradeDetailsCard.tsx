import React from "react";

import {
  makeStyles,
  Typography,
  Tooltip
} from "@material-ui/core";
import { ReactComponent as InfoIcon } from '../../../assets/img/InfoIcon.svg'

const useStyles = makeStyles(() => ({
  root: {
    display: 'flex',
    alignItems: 'center',
    borderRadius: 8,
    background: '#1C2222',
    marginTop: 8,
    position: 'relative',
    border: '1px solid transparent',
    backgroundClip: 'padding-box',
    maxWidth: 424,
    width: '100%',
    // zIndex: 0,
    '&::after': {
      position: 'absolute',
      top: '-2px',
      right: '-2px',
      bottom: '-2px',
      left: '-2px',
      borderRadius: 8,
      content: '""',
      zIndex: -1,
      background: 'linear-gradient(100.61deg, #FF810A 0%, #FFAB5C 100%)'
    }
    // border: '1px solid',
    // borderImageSource: 'linear-gradient(100.61deg, #FF810A 0%, #FFAB5C 100%)'
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%',
    padding: '20px 32px 16px 32px'
  },
  detailsRow: {
    display: 'flex',
    width: '100%',
    justifyContent: 'space-between'
  },
  detailLabel: {
    color: '#A4A7A7',
    fontSize: '14px',
    marginRight: 5
  },
  detailValue: {
    color: '#FFFAF5',
    fontSize: '14px'
  },
  infoIcon: {
    width: 13,
    height: 13
  },
  labelGroup: {
    display: 'flex',
    alignItems: 'center'
  },
  exchangeDisplay: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8
  },
  exchangeText: {

  },
  tooltip: {
    fontSize: '14px'
  }
}));

const slippageInfo = "The maximum difference between the estimated price and actual swap price."
const minReceivedInfo = "The minimum amount of tokens you will receive in this swap, according to your set slippage percent"
const feesInfo = "The overal fee estimate for token(s) account setup and swap transactions"
const priceImpactInfo = "The difference between the swap price and the estimate price based on your trade size "

const TradeDetailsCard = (props) => {

  const classes = useStyles()

  const { fairRate, slippageTolerance, minReceived, fees, priceImpact } = props;
  const { fromSymbol, toSymbol } = props;

  // console.log('fairRate: ', fairRate)
  // console.log('fromSymbol: ', fromSymbol)
  // console.log('toSymbol: ', toSymbol)

  // console.log('min received: ', minReceived ?  minReceived : "")

  const exchangeVal = fairRate ? (1 / fairRate).toFixed(4) : null

  const priceImpactColor = priceImpact > 2.51 ? "#FD499D"
    : (priceImpact > 1.00 && priceImpact <= 2.50) ? "#F9DD76"
    : "#0AD171"

  return (
    <div className={classes.root}>
      <div className={classes.content}>
        <div className={classes.exchangeDisplay}>
          <Typography>{`1 ${fromSymbol} ≈ ${exchangeVal || '-'} ${toSymbol}`}</Typography>
        </div>
        {/* Slippage tolerance */}
        <div className={classes.detailsRow}>
          <div className={classes.labelGroup}>
            <Typography className={classes.detailLabel}>Slippage Tolerance</Typography>
            <Tooltip placement="right" title={slippageInfo} classes={{ tooltip: classes.tooltip }}>
              <InfoIcon className={classes.infoIcon}/>
            </Tooltip>
          </div>
          <Typography className={classes.detailValue}>{`${slippageTolerance}%`}</Typography>
        </div>
        {/* Min receieved */}
        <div className={classes.detailsRow} style={{ marginTop: 8 }}>
          <div className={classes.labelGroup}>
            <Typography className={classes.detailLabel}>Minimum Received</Typography>
            <Tooltip placement="right" title={minReceivedInfo} classes={{ tooltip: classes.tooltip }}>
              <InfoIcon className={classes.infoIcon}/>
            </Tooltip>
          </div>
          <Typography className={classes.detailValue}>{`${minReceived ? minReceived.toFixed(2) : "-"} ${toSymbol}`}</Typography>
        </div>
        {/* Setup and swap fees */}
        <div className={classes.detailsRow} style={{ marginTop: 8 }}>
          <div className={classes.labelGroup}>
            <Typography className={classes.detailLabel}>{'Setup & Swap Fees'}</Typography>
            <Tooltip placement="right" title={feesInfo} classes={{ tooltip: classes.tooltip }}>
              <InfoIcon className={classes.infoIcon}/>
            </Tooltip>
          </div>
          <Typography className={classes.detailValue}>{`${(fees || 0).toFixed(5)} SOL`}</Typography>
        </div>
        {/* Price Impact warning */}
        <div className={classes.detailsRow} style={{ marginTop: 8 }}>
          <div className={classes.labelGroup}>
            <Typography className={classes.detailLabel}>{'Price Impact Warning'}</Typography>
            <Tooltip placement="right" title={priceImpactInfo} classes={{ tooltip: classes.tooltip }}>
              <InfoIcon className={classes.infoIcon}/>
            </Tooltip>
          </div>
          <Typography style={{color: priceImpactColor}} className={classes.detailValue}>{`${priceImpact?.toFixed(2)}%`}</Typography>
        </div>
      </div>
    </div>
  )
}

export default TradeDetailsCard
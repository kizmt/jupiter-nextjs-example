import React, { useEffect } from "react";
import {
  makeStyles,
  Typography,
  Modal,
  Button,
  IconButton,
  LinearProgress,
} from "@material-ui/core";

import Logos from "../../config/logos.json"
import { ReactComponent as CloseIcon } from "../../assets/img/CloseIcon.svg"
import { ReactComponent as SwapToIcon } from "../../assets/img/SwapToIcon.svg"

const useStyles = makeStyles(() => ({
  modalRoot: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 440,
  },
  wrapper: {
    position: 'relative'
  },
  root: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    borderRadius: 8,
    backgroundColor: '#2E3838',
    padding: 24
  },
  content: {
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'column',
    width: '100%',
    position: 'relative'
  },
  countdownProgress: {
    width: '100%', 
    position: 'absolute', 
    bottom: 0, 
    left: 0,
    height: 16,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8
  },
  progressBg: {
    backgroundColor: '#1C2222'
  },
  progressBar: {
    backgroundColor: '#0AD171'
  },
  highImpactTitle: {
    fontWeight: 500,
    fontSize: 20,
    marginBottom: 16,
  },
  swapCompleteTitle: {
    fontWeight: 500,
    fontSize: 24,
    marginBottom: 8
  },
  subtitle: {
    color: '#A4A7A7',
    fontSize: 18,
    marginBottom: 24
  },
  swapHeader: {
    display: 'flex',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center'
  },
  infoBox: {
    backgroundColor: '#1C2222',
    borderRadius: 8,
    padding: '16px 20px'
  },
  infoBoxAmount: {
    backgroundColor: '#1C2222',
    borderRadius: 8,
    padding: '8px 20px',
    height: 56,
    display: 'flex',
    alignItems: 'center'
  },
  logo: {
    width: 40,
    height: 40,
    marginLeft: 16,
    marginRight: 8
  },
  infoText: {
    fontWeight: 700
  },
  percentageBox: {
    backgroundColor: '#090B0B',
    borderRadius: 2,
    padding: '0px 4px'
  },
  infoRow: {
    display: 'flex',
    alignItems: 'center'
  },
  actionButton: {
    width: "100%",
    borderRadius: 8,
    background: "linear-gradient(100.61deg, #B85900 0%, #FF810A 100%)",
    color: "#fff",
    fontSize: 20,
    fontWeight: 500,
    // padding: theme.spacing(1.5),
    "& .MuiButton-label": {
      textTransform: "none",
    },
  },
  amountText: {
    fontSize: 24,
    fontWeight: 500
  }
}));

const BaseModal = (props) => {

  const { children, open } = props
  const classes = useStyles()

  return (
    <Modal
        open={open}
        onClose={props.handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <div className={classes.modalRoot}>
          <div className={classes.wrapper}>
            <div className={classes.root}>
              {children}
            </div>
          </div>
        </div>
      </Modal>
  )
}

export const SwapSuccessModal = (props) => {

  const { open, tx, onDismiss } = props
  const classes = useStyles()
  const [progress, setProgress] = React.useState(100);

  let fromLogoSrc
  let toLogoSrc
  if(tx) {
    fromLogoSrc = tx.fromSymbol ? Logos[tx.fromSymbol] : ''
    if (fromLogoSrc) {
      if (fromLogoSrc.indexOf("/icons/tokens/") > 0) {
        fromLogoSrc = require(fromLogoSrc)
      }
    }

    toLogoSrc = tx.toSymbol ? Logos[tx.toSymbol] : ''
    if (toLogoSrc) {
      if (toLogoSrc.indexOf("/icons/tokens/") > 0) {
        toLogoSrc = require(toLogoSrc)
      }
    }
  }

  useEffect(() => {
    if(open) {
      const timer = setInterval(() => {
        setProgress((prevProgress) => (prevProgress - 2));
      }, 100);
      return () => {
        clearInterval(timer);
      };
    }
  }, [open])

  if(progress === -2) {
    onDismiss()
  }

  return (
    tx ? (
      <BaseModal open={open}>
        <div className={classes.content}>
          <IconButton onClick={onDismiss} style={{ padding: 0, position: 'absolute', top: 0, right: 0 }}>
            <CloseIcon />
          </IconButton>
          <div className={classes.swapHeader}>
            <Typography className={classes.swapCompleteTitle}>Swap Complete</Typography>  
          </div>
          <Typography className={classes.subtitle}>You’ve successfully swapped </Typography>
          <div className={classes.infoBoxAmount} style={{ marginBottom: 8 }}>
            <Typography className={classes.amountText}>
              {(tx.fromAmount || 0).toFixed(4)}
            </Typography>
            <img src={fromLogoSrc} className={classes.logo}/>
            <Typography className={classes.amountText}>
              {tx.fromSymbol}
            </Typography>
          </div>
          <SwapToIcon style={{ marginBottom: 8 }}/>
          <div className={classes.infoBoxAmount} style={{ marginBottom: 16 }}>
            <Typography className={classes.amountText}>
              {(tx.toAmount || 0).toFixed(4)}
            </Typography>
            <img src={toLogoSrc} className={classes.logo}/>
            <Typography className={classes.amountText}>
              {tx.toSymbol}
            </Typography>
          </div>
        </div>
        <LinearProgress 
          className={classes.countdownProgress}
          classes={{ bar: classes.progressBar, colorPrimary: classes.progressBg }} 
          variant="determinate" 
          value={progress}/>
      </BaseModal>
    ) : <></>
  )
}

export const HighPriceImpactModal = (props) => {

  const { open, slippageTolerance, priceImpact } = props
  const classes = useStyles()

  const priceImpactColor = priceImpact > 2.51 ? "#FD499D"
    : (priceImpact > 1.00 && priceImpact <= 2.50) ? "#F9DD76"
    : "#0AD171"

  return (
    <BaseModal open={open}>
      <div className={classes.content}>
        <Typography className={classes.highImpactTitle}>High Price Impact</Typography>
        <div className={classes.infoRow} style={{ marginBottom: 6 }}>
          <Typography>
            Your trade size has a price impact of 
          </Typography>
          <div className={classes.percentageBox} style={{ marginLeft: 6 }}>
            <Typography style={{ color: priceImpactColor }}>{`${(priceImpact || 0).toFixed(2)}%`}</Typography>
          </div>
        </div>
        <div className={classes.infoRow} style={{ marginBottom: 16 }}>
          <Typography>
            Your slippage tolerance is set at 
          </Typography>
          <div className={classes.percentageBox} style={{ marginLeft: 6 }}>
            <Typography style={{ color: '#0AD171' }}>{`${slippageTolerance}%`}</Typography>
          </div>
        </div>
        <div className={classes.infoBox} style={{ marginBottom: 16 }}>
          <Typography>
            Please <b>adjust</b> your slippage tolerance or your trade size, otherwise the swap is likely to fail.
          </Typography>
        </div>
        <Button
          variant="contained"
          className={classes.actionButton}
          onClick={props.handleClose}>
            OK, got it.
        </Button>
      </div>
    </BaseModal>
    )
}

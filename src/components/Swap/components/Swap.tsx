import React, { useState, useEffect } from "react";
import {
  PublicKey,
  Keypair,
  Transaction,
  SystemProgram,
  Signer,
} from "@solana/web3.js";
import {
  Token,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  u64,
} from "@solana/spl-token";
import { BN, Provider } from "@project-serum/anchor";
import {
  makeStyles,
  Card,
  Button,
  Typography,
  TextField,
  useTheme,
} from "@material-ui/core";
import { ExpandMore } from "@material-ui/icons";
import { useSwapContext, useSwapFair } from "../context/Swap";
import {
  useDexContext,
  useOpenOrders,
  useRouteVerbose,
  useMarket,
  usePriceImpact,
  FEE_MULTIPLIER
} from "../context/Dex";
import { useTokenMap } from "../context/TokenList";
import {
  useMint,
  useOwnedTokenAccount,
  useTokenContext
} from "../context/Token";
import { useCanSwap, useReferral, useIsWrapSol } from "../context/Swap";
import TokenDialog from "./TokenDialog";
import { SettingsButton } from "./Settings";

import RoutingDisplay from "./RoutingDisplay";
import TradeDetailsCard from "./TradeDetailsCard";
import { HighPriceImpactModal, SwapSuccessModal } from "../../Common/Modals";

import { SOL_MINT, WRAPPED_SOL_MINT } from "../../../utils/pubkeys";
import Mints from "../../../config/token-mints.json"
// import { simulateTxs } from "../../../utils/rpc";

import '../../../assets/styles/three-dots.css'
import { createAccountTransactions } from "../../../utils/web3";
import { isNum } from "../../../utils/utils"

import _ from "lodash"
import { Market } from "@project-serum/serum";

const DEFAULT_WALLET = "11111111111111111111111111111111"

const FEES = {
  BASE_FEE: 0.000005,
  CREATE_TOKEN_ACCOUNT: 0.00203928,
  WRAP_SOL: 0.00204,
  CREATE_OO_ACCOUNT: 0.02336,
}

const MAINTENANCE_ON = false;

const useStyles = makeStyles((theme) => ({
  card: {
    maxWidth: 424,
    borderRadius: 8,
    boxShadow: "0px 0px 30px 5px rgba(0,0,0,0.075)",
    padding: 0,
    background: "#1C2222",
    color: "#fff",
    "& button:hover": {
      opacity: 0.8,
    },
  },
  tab: {
    width: "50%",
  },
  actionButtons: {
    display: 'flex'
  },
  swapButton: {
    width: "100%",
    borderRadius: 8,
    background: "linear-gradient(100.61deg, #B85900 0%, #FF810A 100%)",
    color: "#fff",
    fontSize: 20,
    fontWeight: 500,
    padding: theme.spacing(1.5),
    "& .MuiButton-label": {
      textTransform: "none",
    },
    // "&.MuiButton-contained.Mui-disabled": {
    //   background: "#141414",
    //   color: "#fff",
    //   border: "2px solid #FD499D"
    // }
  },
  swapToFromButton: {
    display: "block",
    margin: "10px auto 10px auto",
    cursor: "pointer",
  },
  amountInput: {
    fontSize: 22,
    fontWeight: 600,
    color: "#fff",
  },
  input: {
    textAlign: "right",
    '&::-webkit-outer-spin-button': {
      '-webkit-appearance': 'none',
      margin: 0,
    },
    '&::-webkit-inner-spin-button': {
      '-webkit-appearance': 'none',
      margin: 0,
    },
    'input[type=number]': {
      '-moz-appearance': 'textfield'
    }
  },
  swapTokenFormContainer: {
    borderRadius: theme.spacing(2),
    display: "flex",
    justifyContent: "space-between",
    padding: theme.spacing(1),
  },
  swapTokenSelectorContainer: {
    marginLeft: 0,
    display: "flex",
    flexDirection: "column",
    width: "50%",
  },
  balanceContainer: {
    display: "flex",
    alignItems: "center",
    fontSize: "14px",
  },
  maxButton: {
    marginLeft: theme.spacing(1),
    color: "#F37B21",
    zIndex: 1,
    fontWeight: 700,
    fontSize: "12px",
    cursor: "pointer",
    position: "absolute",
    right: 15,
  },
  tokenButton: {
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
    marginBottom: theme.spacing(1),
  },
  disabledButton: {
    backgroundColor: "#1C2222 !important",
    background: "unset",
    color: "#2E3838 !important"
  },
  swapContainer: {
    // display: 'flex',
    // flexDirection: 'column',
    // alignItems: 'center',
    padding: "5% 7%"
  }
}));

export default function SwapCard({
  containerStyle,
  contentStyle,
  swapTokenContainerStyle
}: {
  containerStyle?: any;
  contentStyle?: any;
  swapTokenContainerStyle?: any;
}) {
  const styles = useStyles();
  const { slippage, fromMint, toMint, fromAmount, toAmount } = useSwapContext();
  const fairRate = useSwapFair()

  const route = useRouteVerbose(fromMint, toMint);
  const fromMarket = useMarket(
    route && route.markets ? route.markets[0] : undefined
  );
  const toMarket = useMarket(
    route && route.markets ? route.markets[1] : undefined
  );

  const openOrders = useOpenOrders();
  const fromOpenOrders = fromMarket
    ? openOrders.get(fromMarket?.address.toString())
    : undefined;

  const toOpenOrders = toMarket
    ? openOrders.get(toMarket?.address.toString())
    : undefined;

  let toWallet = useOwnedTokenAccount(toMint);
  const quoteMint = fromMarket && fromMarket.quoteMintAddress;
  const quoteWallet = useOwnedTokenAccount(quoteMint);

  const { swapClient } = useDexContext();
  let lastLegMarket = route?.markets[route.markets.length - 1]
  const impact = usePriceImpact(toAmount, lastLegMarket)

  const tokenMap = useTokenMap()
  let fromMintInfo = tokenMap.get(fromMint.toString());
  let toMintInfo = tokenMap.get(toMint.toString());
  let quoteMintInfo = tokenMap.get((quoteMint || "").toString())

  const fromSymbol = fromMintInfo?.symbol
  const toSymbol = toMintInfo?.symbol

  let minReceived

  if (fromAmount && fairRate && toMintInfo) {

    console.log('FEE_MULTIPLIER: ', FEE_MULTIPLIER)
    console.log('toMintInfo.decimals: ', toMintInfo.decimals)
    console.log('fair: ', fairRate)
    console.log('slippage: ', slippage)

    let minExchangeRate = new BN((10 ** toMintInfo.decimals * FEE_MULTIPLIER * (100 - slippage)) / fairRate)
      .divn(100).toNumber()

    console.log('minExchangeRate: ', minExchangeRate)

    minReceived = fromAmount * (minExchangeRate / (10 ** toMintInfo.decimals))

    console.log('minReceived: ', minReceived)
  }

  const disconnected = !swapClient.program.provider.wallet.publicKey
    || swapClient.program.provider.wallet.publicKey.toString() === DEFAULT_WALLET;

  // sum fees
  let fees = FEES.BASE_FEE

  const isCreatingTo = !toWallet
  if (isCreatingTo) {
    fees += FEES.CREATE_TOKEN_ACCOUNT
  }
  const isCreatingQuote = !quoteWallet
  if (isCreatingQuote) {
    fees += FEES.CREATE_TOKEN_ACCOUNT
  }
  const isCreatingFromOO = !fromOpenOrders
  if (isCreatingFromOO) {
    fees += FEES.CREATE_OO_ACCOUNT
  }
  const isCreatingToOO = toMarket && !toOpenOrders
  if (isCreatingToOO) {
    fees += FEES.CREATE_OO_ACCOUNT
  }
  const isWrappingSol = fromMint.equals(SOL_MINT) && toMarket
  if (isWrappingSol) {
    fees += FEES.WRAP_SOL
  }

  return (
    <div className={styles.swapContainer}>
      <Card className={styles.card} style={containerStyle}>
        <SwapHeader />
        <div style={contentStyle}>
          <div
            style={{
              borderRadius: 8,
              padding: '16px 24px 24px 24px',
            }}>
            <label style={{ fontWeight: 600, fontSize: 16, color: "#676767" }}>From</label>
            <SwapFromForm style={swapTokenContainerStyle} />
            <sub style={{ top: -11, color: "#676767", fontWeight: 500, fontSize: 14 }}>
              Slippage tolerance <u>{slippage}%</u>
            </sub>
          </div>
          <div
            style={{
              background: "#121616",
              borderRadius: 8,
              padding: "40px 24px 20px",
              position: "relative",
            }}
          >
            <ArrowButton />
            <label style={{ fontWeight: 600, fontSize: 16, color: "#676767" }}>To</label>
            <SwapToForm style={swapTokenContainerStyle} />
            <ActionButtons />
            <RoutingDisplay
              route={route}
              toMint={toMint}
              fromSymbol={fromSymbol}
              toSymbol={toSymbol} />
          </div>
        </div>
      </Card>
      {!disconnected && (
        <TradeDetailsCard
          fromSymbol={fromSymbol}
          toSymbol={toSymbol}
          fairRate={fairRate}
          slippageTolerance={slippage}
          minReceived={minReceived}
          priceImpact={impact}
          fees={fees} />
      )}
    </div>
  );
}

export function SwapHeader() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        position: "relative",
        borderBottom: "1px solid #121616",
        padding: "16px 24px",
      }}
    >
      <Typography
        style={{
          fontSize: 20,
          fontWeight: 500,
          color: "#fff",
          width: "100%",
          position: "absolute",
          left: 0,
          textAlign: "center",
        }}
      >
        Swap
      </Typography>

      <SettingsButton />
    </div>
  );
}

export function ArrowButton() {
  const styles = useStyles();
  const { swapToFromMints } = useSwapContext();
  return (
    <button
      className={styles.swapToFromButton}
      onClick={swapToFromMints}
      style={{
        background: "#121616 url(/icons/arrow-double.svg) center/55% no-repeat",
        border: "4px solid #1C2222",
        position: "absolute",
        width: 48,
        height: 48,
        borderRadius: 24,
        top: -34,
      }}
    />
  );
}

function SwapFromForm({ style }: { style?: any }) {
  const { fromMint, setFromMint, fromAmount, setFromAmount } = useSwapContext();
  return (
    <SwapTokenForm
      from
      style={style}
      mint={fromMint}
      setMint={setFromMint}
      amount={fromAmount}
      setAmount={setFromAmount}
    />
  );
}

function SwapToForm({ style }: { style?: any }) {
  const { toMint, setToMint, toAmount, setToAmount } = useSwapContext();
  return (
    <SwapTokenForm
      from={false}
      style={style}
      mint={toMint}
      setMint={setToMint}
      amount={toAmount}
      setAmount={setToAmount}
    />
  );
}

export function SwapTokenForm({
  from,
  style,
  mint,
  setMint,
  amount,
  setAmount,
}: {
  from: boolean;
  style?: any;
  mint: PublicKey;
  setMint: (m: PublicKey) => void;
  amount: number;
  setAmount: (a: number) => void;
}) {
  const styles = useStyles();

  const [showTokenDialog, setShowTokenDialog] = useState(false);
  const tokenAccount = useOwnedTokenAccount(mint);
  const mintAccount = useMint(mint);

  const balance =
    tokenAccount &&
    mintAccount &&
    tokenAccount.account.amount.toNumber() / 10 ** mintAccount.decimals;

  const formattedAmount =
    mintAccount && amount
      ? amount.toLocaleString("en-US", {
        maximumFractionDigits: mintAccount.decimals,
        useGrouping: false,
      })
      : '';

  return (
    <div className={styles.swapTokenFormContainer} style={style}>
      <div className={styles.swapTokenSelectorContainer}>
        <TokenButton mint={mint} onClick={() => setShowTokenDialog(true)} />
        <Typography style={{ color: "white" }} className={styles.balanceContainer}>
          {tokenAccount && mintAccount
            ? `Balance: ${balance?.toFixed(mintAccount.decimals)}`
            : <span>&nbsp;</span>}
          {from && !!balance ? (
            <span
              className={styles.maxButton}
              onClick={() => setAmount(balance)}
            >
              MAX
            </span>
          ) : null}
        </Typography>
      </div>
      <TextField
        type="number"
        value={formattedAmount}
        placeholder={'0'}
        onChange={(e) => setAmount(parseFloat(e.target.value))}
        InputProps={{
          disableUnderline: true,
          classes: {
            root: styles.amountInput,
            input: styles.input,
          },
        }}
      />
      <TokenDialog
        setMint={setMint}
        open={showTokenDialog}
        onClose={() => setShowTokenDialog(false)}
      />
    </div>
  );
}

function TokenButton({
  mint,
  onClick,
}: {
  mint: PublicKey;
  onClick: () => void;
}) {
  const styles = useStyles();
  const theme = useTheme();

  return (
    <div onClick={onClick} className={styles.tokenButton}>
      <TokenIcon mint={mint} style={{ width: theme.spacing(4) }} />
      <TokenName mint={mint} style={{ fontSize: 24, fontWeight: 500 }} />
      <ExpandMore />
    </div>
  );
}

export function TokenIcon({ mint, style }: { mint: PublicKey; style: any }) {
  const tokenMap = useTokenMap();
  let tokenInfo = tokenMap.get(mint.toString());

  let imgSrc = tokenInfo?.logoURI

  if (imgSrc) {
    if (imgSrc.indexOf("/icons/tokens/") > 0) {
      imgSrc = require(imgSrc)
    }
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        flexDirection: "column",
      }}
    >
      {tokenInfo?.logoURI ? (
        <img alt="Logo" style={style} src={imgSrc} />
      ) : (
        <div style={style}></div>
      )}
    </div>
  );
}

function TokenName({ mint, style }: { mint: PublicKey; style: any }) {
  const tokenMap = useTokenMap();
  const theme = useTheme();
  let tokenInfo = tokenMap.get(mint.toString());
  return (
    <Typography
      style={{
        marginLeft: theme.spacing(2),
        marginRight: theme.spacing(1),
        color: "#FFFAF5",
        ...style,
      }}
    >
      {tokenInfo?.symbol}
    </Typography>
  );
}

export function ActionButtons() {
  const styles = useStyles();
  const {
    fromMint,
    toMint,
    setFromAmount,
    fromAmount,
    toAmount,
    slippage,
    isClosingNewAccounts,
  } = useSwapContext();

  const { swapClient, isLoaded: isDexLoaded, updateOpenOrdersForMarkets } = useDexContext();
  const { updateTokenAccounts } = useTokenContext();

  const [isSetupLoading, setIsSetupLoading] = useState<boolean>(false)
  const [isSwapLoading, setIsSwapLoading] = useState<boolean>(false)
  const [isShowingHighImpactModal, setIsShowingHighImpactModal] = useState<boolean>(false)

  const fromMintInfo = useMint(fromMint);
  const toMintInfo = useMint(toMint);
  const openOrders = useOpenOrders();

  const [successTx, setSuccessTx] = useState<any>(null)

  // console.log('open orders: ', openOrders)

  const route = useRouteVerbose(fromMint, toMint);
  const fromMarket = useMarket(
    route && route.markets ? route.markets[0] : undefined
  );
  const toMarket = useMarket(
    route && route.markets ? route.markets[1] : undefined
  );

  // const transPriceImpact = usePriceImpactTransitive(fromMarket?.publicKey, toMarket?.publicKey)

  const canSwap = useCanSwap();
  const referral = useReferral(fromMarket);
  const fair = useSwapFair();
  const priceImpact = usePriceImpact(toAmount, route?.markets[route.markets.length - 1])

  let fromWallet = useOwnedTokenAccount(fromMint);
  let toWallet = useOwnedTokenAccount(toMint);

  let [wSolPubKey, setWSolPubKey] = useState<PublicKey | undefined>(undefined)

  const quoteMint = fromMarket && fromMarket.quoteMintAddress;
  const quoteMintInfo = useMint(quoteMint);
  const quoteWallet = useOwnedTokenAccount(quoteMint);
  const { isWrapSol, isUnwrapSol } = useIsWrapSol(fromMint, toMint);

  const fromOpenOrders = fromMarket
    ? openOrders.get(fromMarket?.address.toString())
    : undefined;

  const toOpenOrders = toMarket
    ? openOrders.get(toMarket?.address.toString())
    : undefined;

  // console.log('toOpenOrders: ', toOpenOrders)

  const disconnected = !swapClient.program.provider.wallet.adapter.publicKey
    || swapClient.program.provider.wallet.adapter.publicKey.toString() === DEFAULT_WALLET;

  // Determine if user needs to wrap sol as setup step
  // This is required when swapping from SOL > SPL
  const needsSetupWrapSol = (fromMint.equals(SOL_MINT) || toMint.equals(SOL_MINT) && !wSolPubKey)
  const [needsCreateAccounts, setNeedsCreateAccounts] = useState(!toWallet || !fromOpenOrders || (toMarket && !toOpenOrders))
  const fairRate = useSwapFair()

  let isMinimum = fromAmount > 0

  if (fromMint.equals(SOL_MINT)) {
    if (fromAmount < 0.1) { isMinimum = false }
  } else if (toMint.equals(SOL_MINT)) {

    let toAmount = 0
    if (fromAmount && fairRate && toMintInfo) {
      let minExchangeRate = new BN((10 ** toMintInfo.decimals * FEE_MULTIPLIER * (100 - slippage)) / fairRate)
        .divn(100).toNumber()
      toAmount = (minExchangeRate / 10 ** toMintInfo.decimals) * fromAmount
    }
    if (toAmount < 0.1) { isMinimum = false }
  }

  useEffect(() => {

    // console.log('toWallet: ', toWallet)
    // console.log('fromOpenOrders: ', fromOpenOrders)
    // console.log('toMarket: ', toMarket)
    // console.log('toOpenOrders: ', toOpenOrders)

    const nca = !toWallet || !fromOpenOrders || (toMarket && !toOpenOrders);

    console.log('setting needs create accounts: ', nca || false)
    setNeedsCreateAccounts(nca || false)
  }, [toWallet, fromWallet, fromOpenOrders, toOpenOrders])


  // Buttons disabled logic
  const needsSetup = ((needsSetupWrapSol && !wSolPubKey) || needsCreateAccounts)

  // console.log('needsSetup: ', needsSetup)

  const isSetupDisabled = !needsSetup
    || !isDexLoaded
    || (needsSetupWrapSol && !isMinimum)
    || isSwapLoading
    || isSetupLoading
    || fromAmount === 0
  const isSwapDisabled = !canSwap
    || needsSetup
    || !isMinimum
    || isSetupLoading
    || isSwapLoading
    || !isDexLoaded

  // Transaction building and sending

  const sendSetupTxs = async () => {

    if ((priceImpact || 0) > (slippage)) {
      setIsShowingHighImpactModal(true)
      return
    }

    const { tx: setupTx, signers: setupSigners } = await buildSetupTx()

    setIsSetupLoading(true)
    await swapClient.program.provider.send(setupTx, setupSigners)
      .then(txId => {
        if (txId) {
          swapClient.program.provider.connection.onSignature(txId,
            (result) => {
              if (result.err) {
                setIsSetupLoading(false)
              } else {

                if (route && route.markets) {
                  console.log('updating open orders for markets: ', route.markets)

                  const promises = [updateOpenOrdersForMarkets(route.markets), updateTokenAccounts([fromMint, quoteMint, toMint])]
                  Promise.all(promises)
                    .then(_ => setIsSetupLoading(false))
                }
              }
            },
            'recent')
        } else {
          setIsSetupLoading(false)
        }
      });
  }

  const sendWrapSolTransaction = async () => {
    if (!fromMintInfo || !toMintInfo) {
      throw new Error("Unable to calculate mint decimals");
    }
    if (!quoteMint || !quoteMintInfo) {
      throw new Error("Quote mint not found");
    }
    const amount = new u64(fromAmount * 10 ** fromMintInfo.decimals);

    // If the user already has a wrapped SOL account, then we perform a
    // transfer to the existing wrapped SOl account by
    //
    // * generating a new one
    // * minting wrapped sol
    // * sending tokens to the previously existing wrapped sol account
    // * closing the newly created wrapped sol account
    //
    // If a wrapped SOL account doesn't exist, then we create an associated
    // token account to mint the SOL and then leave it open.
    //
    const wrappedSolAccount = Keypair.generate()
    const wrappedSolPubkey = wrappedSolAccount
      ? wrappedSolAccount.publicKey
      : await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        fromMint,
        swapClient.program.provider.wallet.adapter.publicKey
      );

    // Wrap the SOL.
    const { tx, signers } = await wrapSol(
      swapClient.program.provider,
      wrappedSolAccount,
      fromMint,
      amount
    );

    // Close the newly created account, if needed.
    if (toWallet) {
      tx.add(
        Token.createTransferInstruction(
          TOKEN_PROGRAM_ID,
          wrappedSolPubkey,
          toWallet.publicKey,
          swapClient.program.provider.wallet.adapter.publicKey,
          [],
          amount
        )
      );
      const { tx: unwrapTx, signers: unwrapSigners } = unwrapSol(
        swapClient.program.provider,
        wrappedSolAccount.publicKey
      );
      tx.add(unwrapTx);
      signers.push(...unwrapSigners);
    }
    await swapClient.program.provider.send(tx, signers);
  };

  const sendUnwrapSolTransaction = async () => {
    if (!fromMintInfo || !toMintInfo) {
      throw new Error("Unable to calculate mint decimals");
    }
    if (!quoteMint || !quoteMintInfo) {
      throw new Error("Quote mint not found");
    }
    const amount = new u64(fromAmount * 10 ** fromMintInfo.decimals);

    // Unwrap *without* closing the existing wrapped account:
    //
    // * Create a new Wrapped SOL account.
    // * Send wrapped tokens there.
    // * Unwrap (i.e. close the newly created wrapped account).
    const wrappedSolAccount = Keypair.generate();
    const { tx, signers } = await wrapSol(
      swapClient.program.provider,
      wrappedSolAccount,
      fromMint,
      amount
    );
    tx.add(
      Token.createTransferInstruction(
        TOKEN_PROGRAM_ID,
        fromWallet!.publicKey,
        wrappedSolAccount.publicKey,
        swapClient.program.provider.wallet.adapter.publicKey,
        [],
        amount
      )
    );
    const { tx: unwrapTx, signers: unwrapSigners } = unwrapSol(
      swapClient.program.provider,
      wrappedSolAccount.publicKey
    );
    tx.add(unwrapTx);
    signers.push(...unwrapSigners);

    await swapClient.program.provider.send(tx, signers);
  };

  const createWrapSolTx = async (): Promise<{ tx: Transaction; signers: Array<Signer> }> => {
    if (!fromMintInfo || !toMintInfo) {
      throw new Error("Unable to calculate mint decimals");
    }
    if (!quoteMint || !quoteMintInfo) {
      throw new Error("Quote mint not found");
    }
    const amount = new u64(fromAmount * 10 ** fromMintInfo.decimals);

    // If the user already has a wrapped SOL account, then we perform a
    // transfer to the existing wrapped SOl account by
    //
    // * generating a new one
    // * minting wrapped sol
    // * sending tokens to the previously existing wrapped sol account
    // * closing the newly created wrapped sol account
    //
    // If a wrapped SOL account doesn't exist, then we create an associated
    // token account to mint the SOL and then leave it open.
    //
    const wrappedSolAccount = Keypair.generate()
    const wrappedSolPubkey = wrappedSolAccount
      ? wrappedSolAccount.publicKey
      : await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        fromMint,
        swapClient.program.provider.wallet.adapter.publicKey
      );

    // Wrap the SOL.
    const { tx, signers } = await wrapSol(
      swapClient.program.provider,
      wrappedSolAccount,
      fromMint,
      amount
    );

    setWSolPubKey(wrappedSolPubkey)
    return { tx, signers }
  }

  const buildSetupTx = async () => {
    let setupTx = new Transaction()
    let setupSigners = Array<Signer>()

    // console.log('needsCreateAccounts: ', needsCreateAccounts)
    // console.log('toMint: ', toMint.toString())
    // console.log('quoteMint: ', (quoteMint || "").toString())
    // console.log('fromMintInfo: ', fromMintInfo)
    // console.log('toMintInfo: ', toMintInfo)
    // console.log('quoteMintInfo: ', quoteMintInfo)
    // console.log('toWallet: ', toWallet?.publicKey.toString())
    // console.log('quoteWallet: ', quoteWallet ? quotewallet.adapter.publicKey.toString() : "")
    // console.log('fromMarket: ', fromMarket?.address.toString())
    // console.log('toMarket: ', toMarket?.address.toString())
    // console.log('fromOpenOrders: ', fromOpenOrders)
    // console.log('toOpenOrders: ', toOpenOrders)

    if (needsCreateAccounts) {
      const { tx, signers } = await createAccountTransactions(swapClient,
        toMint,
        quoteMint,
        fromMintInfo,
        toMintInfo,
        quoteMintInfo,
        toWallet,
        quoteWallet,
        fromMarket,
        toMarket,
        fromOpenOrders,
        toOpenOrders)

      setupTx.add(tx)
      setupSigners = setupSigners.concat(signers)
    }

    console.log('needsSetupWrapSol: ', needsSetupWrapSol)
    if (needsSetupWrapSol) {
      const { tx, signers } = await createWrapSolTx()
      setupTx.add(tx)
      setupSigners = setupSigners.concat(signers)
    }

    return { tx: setupTx, signers: setupSigners }
  }

  const buildSwapTxs = async () => {
    if (!fromMintInfo || !toMintInfo) {
      throw new Error("Unable to calculate mint decimals");
    }
    if (!fair) {
      throw new Error("Invalid fair");
    }
    if (!quoteMint || !quoteMintInfo) {
      throw new Error("Quote mint not found");
    }

    const amount = new BN(fromAmount * 10 ** fromMintInfo.decimals);

    // Build the swap.
    let txs = await (async () => {
      if (!fromMarket) {
        throw new Error("Market undefined");
      }

      // let minExchangeRate = new BN((10 ** toMintInfo.decimals * FEE_MULTIPLIER) / fairRate)
      //   .muln(100 - slippage)
      //   .divn(100).toNumber()

      console.log('FEE_MULTIPLIER: ', FEE_MULTIPLIER)
      console.log('toMintInfo.decimals: ', toMintInfo.decimals)
      console.log('fair: ', fair)
      console.log('slippage: ', slippage)

      const minExchangeRate = {
        rate: new BN((10 ** toMintInfo.decimals * FEE_MULTIPLIER * (100 - slippage)) / fair)
          .divn(100),
        fromDecimals: fromMintInfo.decimals,
        quoteDecimals: quoteMintInfo.decimals,
        strict: false,
      };

      console.log('minExchangeRate: ', minExchangeRate.rate.toString())

      const fromOpenOrders = fromMarket
        ? openOrders.get(fromMarket?.address.toString())
        : undefined;
      const toOpenOrders = toMarket
        ? openOrders.get(toMarket?.address.toString())
        : undefined;
      const fromWalletAddr = fromMint.equals(SOL_MINT)
        ? wSolPubKey
        : fromWallet
          ? fromWallet.publicKey
          : undefined;
      const toWalletAddr = toMint.equals(SOL_MINT)
        ? wSolPubKey
        : toWallet
          ? toWallet.publicKey
          : undefined;

      // console.log('amount: ', amount.toString())
      // console.log('fair: ', fair)
      // console.log('minExchangeRate: ', minExchangeRate)
      // console.log('fromWalletAddr: ', fromWalletAddr?.toString())
      // console.log('toWalletAddr: ', toWalletAddr?.toString())
      // console.log('fromOpenOrders: ', fromOpenOrders || "")
      // console.log('toOpenOrders: ', toOpenOrders || "")
      // console.log('quoteMint: ', quoteMint.toString())
      // console.log('fromMarket: ', fromMarket.address.toString())
      // console.log('quoteWallet: ', quoteWallet?.publicKey.toString())
      // console.log('isClosingNewAccounts: ', isClosingNewAccounts)

      return await swapClient.swapTxs({
        fromMint,
        toMint,
        quoteMint,
        amount,
        minExchangeRate,
        referral,
        fromMarket,
        toMarket,

        // Automatically created if undefined.
        fromOpenOrders: fromOpenOrders ? fromOpenOrders[0].address : undefined,
        toOpenOrders: toOpenOrders ? toOpenOrders[0].address : undefined,
        fromWallet: fromWalletAddr,
        toWallet: toWalletAddr,
        quoteWallet: quoteWallet ? quoteWallet.publicKey : undefined,

        // Auto close newly created open orders accounts.
        close: isClosingNewAccounts
      });
    })();

    // If swapping to SOL, then insert a wrap/unwrap instruction.
    if (toMint.equals(SOL_MINT) && wSolPubKey) {
      console.log('adding unwrap tx')
      const { tx: unwrapTx, signers: unwrapSigners } = unwrapSol(
        swapClient.program.provider,
        wSolPubKey
      );

      txs[0].tx.add(unwrapTx)
      txs[0].signers.push(...unwrapSigners)
    }

    return txs
  }

  // Click handler.
  const sendSwapTransaction = async () => {

    if (!fromMintInfo || !toMintInfo) {
      throw new Error("Unable to calculate mint decimals");
    }

    if ((priceImpact || 0) > (slippage)) {
      setIsShowingHighImpactModal(true)
      return
    }

    const txs = await buildSwapTxs()

    // const rawTxs = txs.map(txReq =>  ({ tx: txReq.tx, signers: txReq.signers}))
    // const simulateResults = await simulateTxs(swapClient.program.provider, rawTxs)

    console.log('txs: ', txs)

    setIsSwapLoading(true)
    const fromBeforeBalance = fromWallet?.account.amount.toNumber()
    const toBeforeBalance = toWallet?.account.amount.toNumber()

    await swapClient.program.provider.sendAll(txs)
      .then(res => {
        if (res.length > 0) {
          swapClient.program.provider.connection.onSignature(res[0],
            async (result) => {
              if (result.err) {
                setIsSwapLoading(false)
                setWSolPubKey(undefined)
              } else {
                if (route && route.markets) {
                  console.log('updating open orders for markets: ', route.markets)

                  const promises = [updateTokenAccounts([fromMint, toMint])]
                  Promise.all(promises)
                    .then(_ => {

                      const fromAfterBalance = fromWallet?.account.amount.toNumber()
                      const toAfterBalance = toWallet?.account.amount.toNumber()

                      const fromInfo = Mints.find(m => m.address === fromMint.toString())
                      const toInfo = Mints.find(m => m.address === toMint.toString())

                      const fromAmountUi = (fromBeforeBalance && isNum(fromBeforeBalance) && fromAfterBalance && isNum(fromAfterBalance))
                        ? (Math.abs(fromBeforeBalance - fromAfterBalance) / (10 ** fromMintInfo.decimals))
                        : fromAmount
                      const toAmountUi = (toBeforeBalance && isNum(toBeforeBalance) && toAfterBalance && isNum(toAfterBalance))
                        ? (Math.abs(toBeforeBalance - toAfterBalance) / (10 ** toMintInfo.decimals))
                        : toAmount


                      setSuccessTx({
                        fromSymbol: fromMint.equals(SOL_MINT) ? "SOL" : fromInfo?.name,
                        toSymbol: toMint.equals(SOL_MINT) ? "SOL" : toInfo?.name,
                        fromAmount: fromMint.equals(SOL_MINT) ? fromAmount : fromAmountUi,
                        toAmount: toMint.equals(SOL_MINT) ? toAmount : toAmountUi
                      })

                      setIsSwapLoading(false)
                      setWSolPubKey(undefined)
                      setFromAmount(0)
                    })
                }
              }
            },
            'confirmed')
        } else {
          setIsSwapLoading(false)
          setWSolPubKey(undefined)
        }
      }).catch(err => {
        console.log('SWAP err: ', err)
      });
  };

  if (MAINTENANCE_ON) {
    return (
      <Button
        variant="contained"
        className={styles.swapButton}
        onClick={sendSwapTransaction}
        disabled={true}
      >
        Swap in maintenance
      </Button>
    );
  }

  if (disconnected) {
    return (
      <Button
        variant="contained"
        className={styles.swapButton}
        onClick={() => {
          // @ts-ignore
          swapClient.program.provider.wallet.connect();
        }}
      >
        Connect wallet
      </Button>
    );
  }

  if (isWrapSol) {
    return (
      <Button
        variant="contained"
        className={styles.swapButton}
        onClick={sendWrapSolTransaction}
        disabled={!canSwap}
      >
        Wrap SOL
      </Button>
    )
  }

  if (isUnwrapSol) {
    return (
      <Button
        variant="contained"
        className={styles.swapButton}
        onClick={sendUnwrapSolTransaction}
        disabled={!canSwap}
      >
        Unwrap SOL
      </Button>
    )
  }

  // console.log('isSwapDisabled: ', isSwapDisabled)

  return (
    <div className={styles.actionButtons}>
      <HighPriceImpactModal
        open={isShowingHighImpactModal}
        slippageTolerance={slippage}
        priceImpact={priceImpact}
        handleClose={() => setIsShowingHighImpactModal(false)} />
      {successTx && (
        <SwapSuccessModal
          open={true}
          onDismiss={() => { setSuccessTx(null) }}
          tx={successTx} />
      )}
      <Button
        variant="contained"
        className={styles.swapButton}
        onClick={sendSetupTxs}
        disabled={isSetupDisabled}
        classes={{
          disabled: styles.disabledButton
        }}
      >
        {isSetupLoading || !isDexLoaded ? (
          <div className="dot-flashing"></div>
        ) : (
          <>Setup</>
        )}
      </Button>
      <Button
        variant="contained"
        className={styles.swapButton}
        classes={{
          disabled: styles.disabledButton
        }}
        onClick={() => sendSwapTransaction()}
        disabled={isSwapDisabled}
        style={{
          marginLeft: 16
        }}
      >
        {isSwapLoading ? (
          <div className="dot-flashing"></div>
        ) : (
          <>Swap</>
        )}
      </Button>
    </div>
  )
}

async function wrapSol(
  provider: Provider,
  wrappedSolAccount: Keypair,
  fromMint: PublicKey,
  amount: BN
): Promise<{ tx: Transaction; signers: Array<Signer>, wSolPubKey: PublicKey }> {
  const tx = new Transaction();
  const signers = [wrappedSolAccount];

  // Create new, rent exempt account.
  const createAccountInstruction = SystemProgram.createAccount({
    fromPubkey: provider.wallet.publicKey,
    newAccountPubkey: wrappedSolAccount.publicKey,
    lamports: await Token.getMinBalanceRentForExemptAccount(
      provider.connection
    ),
    space: 165,
    programId: TOKEN_PROGRAM_ID,
  })

  tx.add(createAccountInstruction);

  // Transfer lamports. These will be converted to an SPL balance by the
  // token program.
  if (fromMint.equals(SOL_MINT)) {
    tx.add(
      SystemProgram.transfer({
        fromPubkey: provider.wallet.publicKey,
        toPubkey: wrappedSolAccount.publicKey,
        lamports: amount.toNumber(),
      })
    );
  }
  // Initialize the account.
  tx.add(
    Token.createInitAccountInstruction(
      TOKEN_PROGRAM_ID,
      WRAPPED_SOL_MINT,
      wrappedSolAccount.publicKey,
      provider.wallet.publicKey
    )
  );
  return { tx, signers, wSolPubKey: wrappedSolAccount.publicKey };
}

function unwrapSol(
  provider: Provider,
  wrappedSolPubKey: PublicKey
): { tx: Transaction; signers: Array<Signer> } {
  const tx = new Transaction();
  tx.add(
    Token.createCloseAccountInstruction(
      TOKEN_PROGRAM_ID,
      wrappedSolPubKey,
      provider.wallet.publicKey,
      provider.wallet.publicKey,
      []
    )
  );
  return { tx, signers: [] };
}
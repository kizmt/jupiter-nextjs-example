import React, { useContext, useState, useEffect } from "react";
import * as assert from "assert";
import { useAsync } from "react-async-hook";
import { TokenInfo } from "@solana/spl-token-registry";
import { MintLayout } from "@solana/spl-token";
import { Connection, PublicKey } from "@solana/web3.js";
import { useSwapContext } from "./Swap"
import * as anchor from "@project-serum/anchor";
import { Swap as SwapClient } from "@project-serum/swap";
import {
  Market,
  OpenOrders,
  Orderbook as OrderbookSide,
} from "@project-serum/serum";
import {
  DEX_PID,
  USDC_MINT,
  USDT_MINT,
  SOL_MINT,
  WRAPPED_SOL_MINT,
  WORM_USDC_MINT,
  WORM_USDT_MINT,
  WORM_USDC_MARKET,
  WORM_USDT_MARKET,
  WORM_MARKET_BASE,
} from "../../../utils/pubkeys";
import { useTokenMap, useTokenListContext } from "./TokenList";
import { fetchSolletInfo, requestWormholeSwapMarketIfNeeded } from "./Sollet";
import { setMintCache } from "./Token";
import { useIsWrapSol } from "./Swap";
import { DEFAULT_PUBLIC_KEY } from "../../../wallet-adapters/types";

const BASE_TAKER_FEE_BPS = 0.0022;
export const FEE_MULTIPLIER = 1 - BASE_TAKER_FEE_BPS;

type DexContext = {
  // Maps market address to open orders accounts.
  openOrders: Map<string, Array<OpenOrders>>;
  closeOpenOrders: (openOrder: OpenOrders) => void;
  addOpenOrders: (newOpenOrders: OpenOrders[]) => void;
  updateOpenOrdersForMarkets: (markets: Array<PublicKey>) => Promise<void>;
  swapClient: SwapClient;
  isLoaded: boolean;
};
const _DexContext = React.createContext<DexContext | null>(null);

export function DexContextProvider(props: any) {
  const [ooAccounts, setOoAccounts] = useState<Map<string, Array<OpenOrders>>>(
    new Map()
  );
  const [isLoaded, setIsLoaded] = useState(false);

  const { swapClient } = props;

  // Removes the given open orders from the context.
  const closeOpenOrders = async (openOrder: OpenOrders) => {
    const newOoAccounts = new Map(ooAccounts);
    const openOrders = newOoAccounts
      .get(openOrder.market.toString())
      ?.filter((oo: OpenOrders) => !oo.address.equals(openOrder.address));
    if (openOrders && openOrders.length > 0) {
      newOoAccounts.set(openOrder.market.toString(), openOrders);
    } else {
      newOoAccounts.delete(openOrder.market.toString());
    }
    setOoAccounts(newOoAccounts);
  };

  const updateOpenOrdersForMarkets = async (markets: Array<PublicKey>): Promise<void> => {

    const newOoAccounts = new Map(ooAccounts);

    for (const market of markets) {
      console.log('Getting market: ', market.toString())

      const ooAccounts = newOoAccounts.get(market.toString())

      if (!ooAccounts || ooAccounts.length === 0) {
        console.log(`Couldn't find market: `, market.toString())

        const ooAccounts = await OpenOrders.findForMarketAndOwner(
          swapClient.program.provider.connection,
          market,
          swapClient.program.provider.wallet.adapter.publicKey,
          DEX_PID).catch(err => {
            console.log('Err getting open order accounts: ', err)
            return []
          })

        console.log('got new oo accounts: ', ooAccounts)
        newOoAccounts.set(market.toString(), ooAccounts)
      }
    }

    setOoAccounts(newOoAccounts)
  }

  const addOpenOrders = async (newOpenOrders: OpenOrders[]) => {

    const newOoAccounts = new Map(ooAccounts);

    for (const openOrder of newOpenOrders) {
      const openOrders = newOoAccounts
        .get(openOrder.market.toString());

      if (!openOrders) {
        newOoAccounts.set(openOrder.market.toString(), [openOrder]);
      } else {
        const sameOpenOrders = openOrders.filter((oo: OpenOrders) => oo.address.equals(openOrder.address))
        if (sameOpenOrders.length === 0) {
          openOrders.push(openOrder)
          newOoAccounts.set(openOrder.market.toString(), openOrders);
        }
      }
    }

    setOoAccounts(newOoAccounts);
  }

  // Three operations:
  //
  // 1. Fetch all open orders accounts for the connected wallet.
  // 2. Batch fetch all market accounts for those open orders.
  // 3. Batch fetch all mints associated with the markets.
  useEffect(() => {
    if (!swapClient.program.provider.wallet.adapter.publicKey || swapClient.program.provider.wallet.adapter.publicKey.equals(DEFAULT_PUBLIC_KEY)) {
      setOoAccounts(new Map());
      return;
    }
    async function findForOwner() {
      let openOrders;

      console.log('swapClient.program.provider.wallet.adapter.publicKey.toString(): ', swapClient.program.provider.wallet.adapter.publicKey.toString())

      openOrders = await OpenOrders.findForOwner(
        swapClient.program.provider.connection,
        swapClient.program.provider.wallet.adapter.publicKey,
        DEX_PID
      ).catch(e => {
        console.log('Error: ', e);
      });

      console.log('openOrders: ', openOrders)

      // .then(async (openOrders) => {
      if (openOrders) {
        const newOoAccounts = new Map();
        let markets = new Set<string>();
        openOrders.forEach((oo) => {
          markets.add(oo.market.toString());
          if (newOoAccounts.get(oo.market.toString())) {
            newOoAccounts.get(oo.market.toString()).push(oo);
          } else {
            newOoAccounts.set(oo.market.toString(), [oo]);
          }
        });
        if (markets.size > 100) {
          // Punt request chunking until there's user demand.
          throw new Error(
            "Too many markets. Please file an issue to update this"
          );
        }
        const multipleMarkets = await anchor.utils.rpc.getMultipleAccounts(
          swapClient.program.provider.connection,
          Array.from(markets.values()).map((m) => new PublicKey(m))
        );
        const marketClients = multipleMarkets.map((programAccount) => {
          return {
            publicKey: programAccount?.publicKey,
            account: new Market(
              Market.getLayout(DEX_PID).decode(programAccount?.account.data),
              -1, // Set below so that we can batch fetch mints.
              -1, // Set below so that we can batch fetch mints.
              swapClient.program.provider.opts,
              DEX_PID
            ),
          };
        });

        setOoAccounts(newOoAccounts);

        // Batch fetch all the mints, since we know we'll need them at some
        // point.
        const mintPubkeys = Array.from(
          new Set<string>(
            marketClients
              .map((m) => [
                m.account.baseMintAddress.toString(),
                m.account.quoteMintAddress.toString(),
              ])
              .flat()
          ).values()
        ).map((pk) => new PublicKey(pk));

        if (mintPubkeys.length > 100) {
          // Punt request chunking until there's user demand.
          throw new Error("Too many mints. Please file an issue to update this");
        }

        const mints = await anchor.utils.rpc.getMultipleAccounts(
          swapClient.program.provider.connection,
          mintPubkeys
        );
        const mintInfos = mints.map((mint) => {
          const mintInfo = MintLayout.decode(mint!.account.data);
          setMintCache(mint!.publicKey, mintInfo);
          return { publicKey: mint!.publicKey, mintInfo };
        });

        marketClients.forEach((m) => {
          const baseMintInfo = mintInfos.filter((mint) =>
            mint.publicKey.equals(m.account.baseMintAddress)
          )[0];
          const quoteMintInfo = mintInfos.filter((mint) =>
            mint.publicKey.equals(m.account.quoteMintAddress)
          )[0];
          assert.ok(baseMintInfo && quoteMintInfo);
          // @ts-ignore
          m.account._baseSplTokenDecimals = baseMintInfo.mintInfo.decimals;
          // @ts-ignore
          m.account._quoteSplTokenDecimals = quoteMintInfo.mintInfo.decimals;
          _MARKET_CACHE.set(
            m.publicKey!.toString(),
            new Promise<Market>((resolve) => resolve(m.account))
          );
        });

        setIsLoaded(true);
      }
    }

    findForOwner();
  }, [
    swapClient.program.provider.connection,
    swapClient.program.provider.wallet.adapter.publicKey,
    swapClient.program.provider.opts

  ]);
  return (
    <_DexContext.Provider
      value={{
        openOrders: ooAccounts,
        closeOpenOrders,
        addOpenOrders,
        swapClient,
        isLoaded,
        updateOpenOrdersForMarkets
      }}
    >
      {props.children}
    </_DexContext.Provider>
  );
}

export function useDexContext(): DexContext {
  const ctx = useContext(_DexContext);
  if (ctx === null) {
    throw new Error("Context not available");
  }
  return ctx;
}

export function useOpenOrders(): Map<string, Array<OpenOrders>> {
  const ctx = useDexContext();
  return ctx.openOrders;
}

// Lazy load a given market.
export function useMarket(market?: PublicKey): Market | undefined {
  const { swapClient } = useDexContext();

  const asyncMarket = useAsync(async () => {
    if (!market) {
      return undefined;
    }
    if (_MARKET_CACHE.get(market.toString())) {
      return _MARKET_CACHE.get(market.toString());
    }

    const marketClient = new Promise<Market>(async (resolve) => {
      // TODO: if we already have the mints, then pass them through to the
      //       market client here to save a network request.
      const marketClient = await Market.load(
        swapClient.program.provider.connection,
        market,
        swapClient.program.provider.opts,
        DEX_PID
      );
      resolve(marketClient);
    });

    _MARKET_CACHE.set(market.toString(), marketClient);
    return marketClient;
  }, [swapClient.program.provider.connection, market]);

  if (asyncMarket.result) {
    return asyncMarket.result;
  }

  return undefined;
}

// Lazy load the orderbook for a given market.
export function useOrderbook(market?: PublicKey): Orderbook | undefined {
  const { swapClient } = useDexContext();
  const marketClient = useMarket(market);
  const [refresh, setRefresh] = useState(0);

  const asyncOrderbook = useAsync(async () => {
    if (!market || !marketClient) {
      return undefined;
    }
    if (_ORDERBOOK_CACHE.get(market.toString())) {
      return _ORDERBOOK_CACHE.get(market.toString());
    }

    const orderbook = new Promise<Orderbook>(async (resolve) => {
      const [bids, asks] = await Promise.all([
        marketClient.loadBids(swapClient.program.provider.connection),
        marketClient.loadAsks(swapClient.program.provider.connection),
      ]);

      resolve({
        bids,
        asks,
      });
    });

    _ORDERBOOK_CACHE.set(market.toString(), orderbook);

    return orderbook;
  }, [refresh, swapClient.program.provider.connection, market, marketClient]);

  // Stream in bids updates.
  useEffect(() => {
    let listener: number | undefined;
    if (marketClient?.bidsAddress) {
      listener = swapClient.program.provider.connection.onAccountChange(
        marketClient?.bidsAddress,
        async (info) => {
          const bids = OrderbookSide.decode(marketClient, info.data);
          const orderbook = await _ORDERBOOK_CACHE.get(
            marketClient.address.toString()
          );
          const oldBestBid = orderbook?.bids.items(true).next().value;
          const newBestBid = bids.items(true).next().value;
          if (
            orderbook &&
            oldBestBid &&
            newBestBid &&
            oldBestBid.price !== newBestBid.price
          ) {
            orderbook.bids = bids;
            setRefresh((r) => r + 1);
          }
        }
      );
    }
    return () => {
      if (listener) {
        swapClient.program.provider.connection.removeAccountChangeListener(
          listener
        );
      }
    };
  }, [
    marketClient,
    marketClient?.bidsAddress,
    swapClient.program.provider.connection,
  ]);

  // Stream in asks updates.
  useEffect(() => {
    let listener: number | undefined;
    if (marketClient?.asksAddress) {
      listener = swapClient.program.provider.connection.onAccountChange(
        marketClient?.asksAddress,
        async (info) => {
          const asks = OrderbookSide.decode(marketClient, info.data);
          const orderbook = await _ORDERBOOK_CACHE.get(
            marketClient.address.toString()
          );
          const oldBestOffer = orderbook?.asks.items(false).next().value;
          const newBestOffer = asks.items(false).next().value;
          if (
            orderbook &&
            oldBestOffer &&
            newBestOffer &&
            oldBestOffer.price !== newBestOffer.price
          ) {
            orderbook.asks = asks;
            setRefresh((r) => r + 1);
          }
        }
      );
    }
    return () => {
      if (listener) {
        swapClient.program.provider.connection.removeAccountChangeListener(
          listener
        );
      }
    };
  }, [
    marketClient,
    marketClient?.bidsAddress,
    swapClient.program.provider.connection,
  ]);

  if (asyncOrderbook.result) {
    return asyncOrderbook.result;
  }

  return undefined;
}

export function useMarketName(market: PublicKey): string | null {
  const tokenMap = useTokenMap();
  const marketClient = useMarket(market);
  if (!marketClient) {
    return null;
  }
  const baseTicker = marketClient
    ? tokenMap.get(marketClient?.baseMintAddress.toString())?.symbol
    : "-";
  const quoteTicker = marketClient
    ? tokenMap.get(marketClient?.quoteMintAddress.toString())?.symbol
    : "-";
  const name = `${baseTicker} / ${quoteTicker}`;
  return name;
}

// Fair price for a given market, as defined by the mid.
export function useBbo(market?: PublicKey): Bbo | undefined {
  const orderbook = useOrderbook(market);
  if (orderbook === undefined) {
    return undefined;
  }
  const bestBid = orderbook.bids.items(true).next().value;
  const bestOffer = orderbook.asks.items(false).next().value;
  if (!bestBid && !bestOffer) {
    return {};
  }
  if (!bestBid) {
    return { bestOffer: bestOffer.price };
  }
  if (!bestOffer) {
    return { bestBid: bestBid.price };
  }
  const mid = (bestBid.price + bestOffer.price) / 2.0;
  return { bestBid: bestBid.price, bestOffer: bestOffer.price, mid };
}

// Fair price for a theoretical toMint/fromMint market. I.e., the number
// of `fromMint` tokens to purchase a single `toMint` token. Aggregates
// across a trade route, if needed.
export function useFairRoute(
  fromMint: PublicKey,
  toMint: PublicKey
): number | undefined {
  const route = useRoute(fromMint, toMint);
  const fromBbo = useBbo(route ? route[0] : undefined);
  const fromMarket = useMarket(route ? route[0] : undefined);
  const toBbo = useBbo(route ? route[1] : undefined);
  const { isWrapUnwrap } = useIsWrapSol(fromMint, toMint);

  if (isWrapUnwrap) {
    return undefined;
  }

  if (route === null) {
    return undefined;
  }

  if (route.length === 1 && fromBbo !== undefined) {
    if (fromMarket === undefined) {
      return undefined;
    }
    if (
      fromMarket?.baseMintAddress.equals(fromMint) ||
      (fromMarket?.baseMintAddress.equals(WRAPPED_SOL_MINT) &&
        fromMint.equals(SOL_MINT))
    ) {
      return fromBbo.bestBid && 1.0 / fromBbo.bestBid;
    } else {
      return fromBbo.bestOffer && fromBbo.bestOffer;
    }
  }
  if (
    fromBbo === undefined ||
    fromBbo.bestBid === undefined ||
    toBbo === undefined ||
    toBbo.bestOffer === undefined
  ) {
    return undefined;
  }
  return toBbo.bestOffer / fromBbo.bestBid;
}

export function useRoute(
  fromMint: PublicKey,
  toMint: PublicKey
): Array<PublicKey> | null {
  const route = useRouteVerbose(fromMint, toMint);
  if (route === null) {
    return null;
  }
  return route.markets;
}

// Types of routes.
//
// 1. Direct trades on USDC quoted markets.
// 2. Transitive trades across two USDC qutoed markets.
// 3. Wormhole <-> Sollet one-to-one swap markets.
// 4. Wormhole <-> Native one-to-one swap markets.
//
export function useRouteVerbose(
  fromMint: PublicKey,
  toMint: PublicKey
): { markets: Array<PublicKey>; kind: RouteKind } | null {

  const { swapClient } = useDexContext();
  const { wormholeMap, solletMap } = useTokenListContext();
  const asyncRoute = useAsync(async () => {
    const swapMarket = await wormholeSwapMarket(
      swapClient.program.provider.connection,
      fromMint,
      toMint,
      wormholeMap,
      solletMap
    );
    if (swapMarket !== null) {
      const [wormholeMarket, kind] = swapMarket;
      return { markets: [wormholeMarket], kind };
    }

    const markets = swapClient.route(
      fromMint.equals(SOL_MINT) ? WRAPPED_SOL_MINT : fromMint,
      toMint.equals(SOL_MINT) ? WRAPPED_SOL_MINT : toMint
    );
    if (markets === null) {
      return null;
    }
    const kind: RouteKind = "usdx";
    return { markets, kind };
  }, [fromMint, toMint, swapClient]);

  const directRoute = useAsync(async () => {
    // First look through SolAPE markets, see if we have one that can trade direct
    // let fromMintInfo = tokenMap.get(fromMint.toString());
    // let toMintInfo = tokenMap.get(toMint.toString());

    // const fromTicker = fromMintInfo?.symbol
    // const toTicker = toMintInfo?.symbol
    // const marketNameA = `${fromTicker}/${toTicker}`
    // const marketNameB = `${toTicker}/${fromTicker}`

    // const marketInfo = Markets.find(m => (m.name === marketNameA || m.name === marketNameB) && !m.deprecated)
    // if(marketInfo) {
    //   console.log('marketInfo: ', marketInfo)
    //   const kind: RouteKind = "direct"
    //   return {
    //     markets: [new PublicKey(marketInfo.address)],
    //     kind
    //   }
    // } 

    return null

  }, [fromMint, toMint])

  // We have a market to trade directly, return that
  if (directRoute.result) {
    return directRoute.result
  } else if (asyncRoute.result) {
    return asyncRoute.result;
  }
  return null;
}

type Orderbook = {
  bids: OrderbookSide;
  asks: OrderbookSide;
};

// Wormhole utils.

type RouteKind = "wormhole-native" | "wormhole-sollet" | "usdx" | "direct";

// Maps fromMint || toMint (in sort order) to swap market public key.
// All markets for wormhole<->native tokens should be here, e.g.
// USDC <-> wUSDC.
const WORMHOLE_NATIVE_MAP = new Map<string, PublicKey>([
  [wormKey(WORM_USDC_MINT, USDC_MINT), WORM_USDC_MARKET],
  [wormKey(WORM_USDT_MINT, USDT_MINT), WORM_USDT_MARKET],
]);

function wormKey(fromMint: PublicKey, toMint: PublicKey): string {
  const [first, second] =
    fromMint < toMint ? [fromMint, toMint] : [toMint, fromMint];
  return first.toString() + second.toString();
}

async function wormholeSwapMarket(
  conn: Connection,
  fromMint: PublicKey,
  toMint: PublicKey,
  wormholeMap: Map<string, TokenInfo>,
  solletMap: Map<string, TokenInfo>
): Promise<[PublicKey, RouteKind] | null> {
  let market = wormholeNativeMarket(fromMint, toMint);
  if (market !== null) {
    return [market, "wormhole-native"];
  }
  market = await wormholeSolletMarket(
    conn,
    fromMint,
    toMint,
    wormholeMap,
    solletMap
  );

  if (market === null) {
    return null;
  }
  return [market, "wormhole-sollet"];
}

function wormholeNativeMarket(
  fromMint: PublicKey,
  toMint: PublicKey
): PublicKey | null {
  return WORMHOLE_NATIVE_MAP.get(wormKey(fromMint, toMint)) ?? null;
}

// Returns the market address of the 1-1 sollet<->wormhole swap market if it
// exists. Otherwise, returns null.
async function wormholeSolletMarket(
  conn: Connection,
  fromMint: PublicKey,
  toMint: PublicKey,
  wormholeMap: Map<string, TokenInfo>,
  solletMap: Map<string, TokenInfo>
): Promise<PublicKey | null> {
  const fromWormhole = wormholeMap.get(fromMint.toString());
  const isFromWormhole = fromWormhole !== undefined;

  const toWormhole = wormholeMap.get(toMint.toString());
  const isToWormhole = toWormhole !== undefined;

  const fromSollet = solletMap.get(fromMint.toString());
  const isFromSollet = fromSollet !== undefined;

  const toSollet = solletMap.get(toMint.toString());
  const isToSollet = toSollet !== undefined;

  if ((isFromWormhole || isToWormhole) && isFromWormhole !== isToWormhole) {
    if ((isFromSollet || isToSollet) && isFromSollet !== isToSollet) {
      const base = isFromSollet ? fromMint : toMint;
      const [quote, wormholeInfo] = isFromWormhole
        ? [fromMint, fromWormhole]
        : [toMint, toWormhole];

      const solletInfo = await fetchSolletInfo(base);

      if (solletInfo.erc20Contract !== wormholeInfo!.extensions?.address) {
        return null;
      }

      const market = await deriveWormholeMarket(base, quote);
      if (market === null) {
        return null;
      }

      const marketExists = await requestWormholeSwapMarketIfNeeded(
        conn,
        base,
        quote,
        market,
        solletInfo
      );
      if (!marketExists) {
        return null;
      }

      return market;
    }
  }
  return null;
}

// Calculates the deterministic address for the sollet<->wormhole 1-1 swap
// market.
async function deriveWormholeMarket(
  baseMint: PublicKey,
  quoteMint: PublicKey,
  version = 0
): Promise<PublicKey | null> {
  if (version > 99) {
    console.log("Swap market version cannot be greater than 99");
    return null;
  }
  if (version < 0) {
    console.log("Version cannot be less than zero");
    return null;
  }

  const padToTwo = (n: number) => (n <= 99 ? `0${n}`.slice(-2) : n);
  const seed =
    baseMint.toString().slice(0, 15) +
    quoteMint.toString().slice(0, 15) +
    padToTwo(version);
  return await PublicKey.createWithSeed(WORM_MARKET_BASE, seed, DEX_PID);
}

// Experimental: calculating price impact across both markets?
export function usePriceImpactTransitive(marketA: PublicKey | undefined, marketB: PublicKey | undefined): number | undefined {
  const { fromAmount, toAmount, fromMint, toMint } = useSwapContext();

  const orderbook = useOrderbook(marketA);
  const orderbookB = useOrderbook(marketB);
  if (orderbook === undefined) {
    return undefined;
  }

  console.log('bids base mint: ', orderbook.bids.market.baseMintAddress.toString())
  // console.log('asks base mint: ', orderbook.asks.market.baseMintAddress.toString())

  // Leg 1: Sell Asset A for Quote Asset (ususally USD(x))
  const ordersA = fromMint.equals(orderbook.bids.market.baseMintAddress)
    ? orderbook.asks.items(false)
    : orderbook.bids.items(true);

  let order = ordersA.next();

  const initialPriceA = order.value.price;
  let priceAfterOrderA = initialPriceA;
  let remainingAmountA = fromAmount;
  let sellProceeds = 0

  while (!order.done && remainingAmountA > 0) {

    console.log('A: order price: ', order.value.price)
    console.log('A: order size: ', order.value.size)
    console.log('A: remainingAmount: ', remainingAmountA)

    priceAfterOrderA = order.value.price;
    sellProceeds += remainingAmountA > order.value.size
      ? (order.value.size * order.value.price)
      : (remainingAmountA * order.value.price)
    remainingAmountA = remainingAmountA > order.value.size
      ? remainingAmountA - order.value.size
      : 0;
    order = ordersA.next();
  }

  console.log('sellProceeds: ', sellProceeds)

  const priceChangeA = Math.abs(initialPriceA - priceAfterOrderA);
  const impactA = (priceChangeA * 100) / initialPriceA;

  if (orderbookB === undefined) {
    return impactA;
  }

  console.log('market B: ', marketB?.toString())
  console.log('orderbookB.bids.market.baseMintAddress: ', orderbookB.bids.market.baseMintAddress.toString())

  // Leg 2: Sell USD(x) for Asset B

  const ordersB = toMint.equals(orderbookB.bids.market.baseMintAddress)
    ? orderbookB.asks.items(false)
    : orderbookB.bids.items(true);

  let buyProceeds = 0
  let remainingAmount = sellProceeds;
  let remainingToAmount = toAmount

  order = ordersB.next();

  const initialPrice = order.value.price;
  let priceAfterOrder = initialPrice;

  while (!order.done && remainingToAmount > 0) {
    console.log('B: order price: ', order.value.price)
    console.log('B: order size: ', order.value.size)
    console.log('B: remainingAmount: ', remainingAmount)
    console.log('B: remainingToAmount:', remainingToAmount)

    priceAfterOrder = order.value.price;

    // Calculate proceeds for this order
    buyProceeds += (remainingAmount / order.value.price) > order.value.size
      ? order.value.size
      : (remainingAmount / order.value.price)

    // Track how much USD(x) we have left to spend
    remainingAmount = (remainingAmount / order.value.price) > order.value.size
      ? remainingAmount - (order.value.size * order.value.price)
      : 0

    // Track how much of the "toAmount" in Asset B we've filled
    remainingToAmount = remainingToAmount > order.value.size
      ? remainingToAmount - order.value.size
      : 0

    order = ordersB.next();
  }

  console.log('spillage: remainingAmount: ', remainingAmount)

  const priceChange = Math.abs(initialPrice - priceAfterOrder);
  const impactB = (priceChange * 100) / initialPrice;

  console.log('impactA: ', impactA)
  console.log('impactB: ', impactB)

  console.log('toAmount: ', toAmount)
  console.log('buy proceeds: ', buyProceeds)
  console.log('toAmount - buyProceeds diff: ', toAmount - buyProceeds)

  const totalImpact = impactA + impactB
  console.log('total impact: ', totalImpact)

  return totalImpact;
}

export function usePriceImpact(toAmount: number, market: PublicKey | undefined | null): number | undefined {

  const { toMint } = useSwapContext();
  const orderbook = useOrderbook(market || undefined);

  if (orderbook === undefined) {
    return undefined;
  }
  const orders = toMint.equals(orderbook.bids.market.baseMintAddress)
    ? orderbook.asks.items(false)
    : orderbook.bids.items(true);

  let remainingAmount = toAmount;
  let order = orders.next();

  if (order && order.value) {
    const initialPrice = order.value.price;
    // console.log('initialPrice: ', initialPrice)
    let priceAfterOrder = initialPrice;

    while (!order.done && remainingAmount > 0) {
      // console.log('remainingAmount: ', remainingAmount)
      // console.log('order: ', order)
      priceAfterOrder = order.value.price;
      remainingAmount =
        remainingAmount > order.value.size
          ? remainingAmount - order.value.size
          : 0;
      order = orders.next();
    }

    // console.log('priceAfterOrder: ', priceAfterOrder)

    const priceChange = Math.abs(initialPrice - priceAfterOrder);
    const impact = (priceChange * 100) / initialPrice;
    return impact;
  }

  return 0
}

type Bbo = {
  bestBid?: number;
  bestOffer?: number;
  mid?: number;
};

const _ORDERBOOK_CACHE = new Map<string, Promise<Orderbook>>();
const _MARKET_CACHE = new Map<string, Promise<Market>>();

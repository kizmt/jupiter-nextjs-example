import React, { useContext, useState, useEffect } from "react";
import * as assert from "assert";
import { useAsync } from "react-async-hook";
import { Provider, BN } from "@project-serum/anchor";
import { PublicKey, Keypair } from "@solana/web3.js";
import {
  MintInfo,
  AccountInfo as TokenAccount,
  Token,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { getOwnedTokenAccounts, parseTokenAccountData, getMultipleTokenAccounts } from "../../../utils/tokens";
import { SOL_MINT } from "../../../utils/pubkeys";

export type TokenContext = {
  provider: Provider;
  isLoaded: boolean;
  updateTokenAccounts: (mints: Array<PublicKey | null | undefined>) => Promise<void>
};
const _TokenContext = React.createContext<TokenContext | null>(null);

export function TokenContextProvider(props: any) {
  const provider = props.provider;
  const [, setRefresh] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // Fetch all the owned token accounts for the wallet.
  useEffect(() => {
    if (!provider.wallet.adapter.publicKey) {
      _OWNED_TOKEN_ACCOUNTS_CACHE.length = 0;
      setRefresh((r) => r + 1);
      return;
    } else if (provider.wallet.adapter.publicKey.toString() === "11111111111111111111111111111111") {
      // wallet hasn't loaded yet
      console.log('wallet has not loaded yet')
      return
    }
    // Fetch SPL tokens.
    // getOwnedTokenAccounts(provider.connection, provider.wallet.adapter.publicKey).then(
    //   (accs) => {
    //     if (accs) {
    //       _OWNED_TOKEN_ACCOUNTS_CACHE.push(...accs);
    //       setRefresh((r) => r + 1);
    //     }
    //     console.log("setting is loaded");
    //     setIsLoaded(true);
    //   }
    // );
    // Fetch SOL balance. 
    provider.connection
      .getAccountInfo(provider.wallet.adapter.publicKey)
      .then((acc: { lamports: number }) => {
        if (acc) {
          _OWNED_TOKEN_ACCOUNTS_CACHE.push({
            publicKey: provider.wallet.adapter.publicKey,
            // @ts-ignore
            account: {
              amount: new BN(acc.lamports),
              mint: SOL_MINT,
            },
          });
          setRefresh((r) => r + 1);
        }
      });
  }, [provider.wallet.adapter.publicKey, provider.connection]);


  const updateTokenAccounts = async (mints: Array<PublicKey | null | undefined>): Promise<void> => {
    console.log('Updating token accounts: ', mints)

    const nonSolMints: Array<PublicKey> = mints.filter((m): m is PublicKey => ((m !== undefined && m !== null) && !m.equals(SOL_MINT)))

    for (const mint of mints) {
      if (!mint) {
        continue
      }
      if (mint.equals(SOL_MINT)) {
        // manually update sol balance
        provider.connection
          .getAccountInfo(provider.wallet.adapter.publicKey)
          .then((acc: { lamports: number }) => {
            if (acc) {
              const solAcc = _OWNED_TOKEN_ACCOUNTS_CACHE.find(a => a.publicKey.equals(provider.wallet.adapter.publicKey))
              if (solAcc) {
                const solIndex = _OWNED_TOKEN_ACCOUNTS_CACHE.indexOf(solAcc)
                _OWNED_TOKEN_ACCOUNTS_CACHE[solIndex] = {
                  publicKey: provider.wallet.adapter.publicKey,
                  // @ts-ignore
                  account: {
                    amount: new BN(acc.lamports),
                    mint: SOL_MINT,
                  },
                }
              } else {
                _OWNED_TOKEN_ACCOUNTS_CACHE.push({
                  publicKey: provider.wallet.adapter.publicKey,
                  // @ts-ignore
                  account: {
                    amount: new BN(acc.lamports),
                    mint: SOL_MINT,
                  },
                });
              }
            }
          });
      }
    }

    return getMultipleTokenAccounts(provider.connection, provider.wallet.adapter.publicKey, nonSolMints).then(
      (accs) => {
        if (accs) {
          accs.forEach(acc => {
            const existingAcc = _OWNED_TOKEN_ACCOUNTS_CACHE.find(a => a.publicKey.equals(acc.publicKey))
            if (existingAcc) {
              const index = _OWNED_TOKEN_ACCOUNTS_CACHE.indexOf(existingAcc)
              _OWNED_TOKEN_ACCOUNTS_CACHE[index] = acc
            } else {
              _OWNED_TOKEN_ACCOUNTS_CACHE.push(acc)
            }
          })
        }
      }
    );
  }

  return (
    <_TokenContext.Provider
      value={{
        provider,
        isLoaded,
        updateTokenAccounts
      }}
    >
      {props.children}
    </_TokenContext.Provider>
  );
}

export function useTokenContext() {
  const ctx = useContext(_TokenContext);
  if (ctx === null) {
    throw new Error("Context not available");
  }
  return ctx;
}

// Null => none exists.
// Undefined => loading.
export function useOwnedTokenAccount(
  mint?: PublicKey
): { publicKey: PublicKey; account: TokenAccount } | null | undefined {
  const { provider } = useTokenContext();
  const [, setRefresh] = useState(0);
  const tokenAccounts = _OWNED_TOKEN_ACCOUNTS_CACHE.filter(
    (account) => mint && account.account.mint.equals(mint)
  );

  // Take the account with the most tokens in it.
  tokenAccounts.sort((a, b) =>
    a.account.amount > b.account.amount
      ? -1
      : a.account.amount < b.account.amount
        ? 1
        : 0
  );

  let tokenAccount = tokenAccounts[0];
  const isSol = mint?.equals(SOL_MINT);

  // Stream updates when the balance changes.
  useEffect(() => {
    let listener: number;
    // SOL is special cased since it's not an SPL token.
    if (tokenAccount && isSol) {
      listener = provider.connection.onAccountChange(
        provider.wallet.publicKey,
        (info: { lamports: number }) => {
          const token = {
            amount: new BN(info.lamports),
            mint: SOL_MINT,
          } as TokenAccount;
          if (token.amount !== tokenAccount.account.amount) {
            const index = _OWNED_TOKEN_ACCOUNTS_CACHE.indexOf(tokenAccount);
            assert.ok(index >= 0);
            _OWNED_TOKEN_ACCOUNTS_CACHE[index].account = token;
            setRefresh((r) => r + 1);
          }
        }
      );
    }
    // SPL tokens.
    else if (tokenAccount) {
      listener = provider.connection.onAccountChange(
        tokenAccount.publicKey,
        (info) => {
          const token = parseTokenAccountData(info.data);
          if (token.amount !== tokenAccount.account.amount) {
            const index = _OWNED_TOKEN_ACCOUNTS_CACHE.indexOf(tokenAccount);
            assert.ok(index >= 0);
            _OWNED_TOKEN_ACCOUNTS_CACHE[index].account = token;
            setRefresh((r) => r + 1);
          }
        }
      );
    }
    return () => {
      if (listener) {
        provider.connection.removeAccountChangeListener(listener);
      }
    };
  }, [provider.connection, tokenAccount]);

  if (mint === undefined) {
    return undefined;
  }

  if (!isSol && tokenAccounts.length === 0) {
    return null;
  }

  return tokenAccount;
}

export function useMint(mint?: PublicKey): MintInfo | undefined | null {
  const { provider } = useTokenContext();
  // Lazy load the mint account if needeed.
  const asyncMintInfo = useAsync(async () => {
    if (!mint) {
      return undefined;
    }
    if (_MINT_CACHE.get(mint.toString())) {
      return _MINT_CACHE.get(mint.toString());
    }

    const mintClient = new Token(
      provider.connection,
      mint,
      TOKEN_PROGRAM_ID,
      new Keypair()
    );
    const mintInfo = mintClient.getMintInfo();
    _MINT_CACHE.set(mint.toString(), mintInfo);
    return mintInfo;
  }, [provider.connection, mint]);

  if (asyncMintInfo.result) {
    return asyncMintInfo.result;
  }
  return undefined;
}

export function setMintCache(pk: PublicKey, account: MintInfo) {
  _MINT_CACHE.set(pk.toString(), new Promise((resolve) => resolve(account)));
}

// Cache storing all token accounts for the connected wallet provider.
const _OWNED_TOKEN_ACCOUNTS_CACHE: Array<{
  publicKey: PublicKey;
  account: TokenAccount;
}> = [];

// Cache storing all previously fetched mint infos.
// @ts-ignore
const _MINT_CACHE = new Map<string, Promise<MintInfo>>([
  // @ts-ignore
  [SOL_MINT.toString(), { decimals: 9 }],
]);

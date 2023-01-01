import React from 'react';
import { Dropdown, Menu } from 'antd';
import { useWallet } from '@solana/wallet-adapter-react';
import LinkAddress from './LinkAddress';
import { DownOutlined } from '@ant-design/icons';
import { useWalletModal, WalletModalButton } from '@solana/wallet-adapter-react-ui';

export default function WalletConnect() {
  const { connected, wallet, publicKey, select, connect, disconnect } = useWallet();
  const pubKey = (connected && publicKey?.toBase58()) || '';
  const { setVisible } = useWalletModal();

  // const menu = (
  //   <Menu>
  //     {connected && <LinkAddress shorten={true} address={pubKey} />}
  //     {/* <Menu.Item key="3" onClick={select}>
  //       Change Wallet
  //     </Menu.Item> */}
  //   </Menu>
  // );

  return (
    <button className="flex-row wallet-button mt-6 px-4 py-2 text-2xl"
      onClick={() => setVisible(true)}>
      Connect wallet
    </button>
  );
}

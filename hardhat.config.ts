import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-ignition";

import "hardhat-resolc";
import { config } from "dotenv";
import "./tasks/compile-revive";
import "./tasks/deploy-revive";

config();

module.exports = {
  solidity: "0.8.19",
  networks: {
    hardhat: {
      polkavm: true,
      nodeConfig: {
        nodeBinaryPath: "../../../polkadot-sdk/target/debug/substrate-node",
        rpcPort: 8000,
        dev: true,
      },
      adapterConfig: {
        adapterBinaryPath: "../../../polkadot-sdk/target/debug/eth-rpc",
        dev: true,
      },
    },
    polkavm: {
      polkavm: true,
      url: "http://127.0.0.1:8545",
      accounts: [process.env.LOCAL_PRIV_KEY, process.env.LOCAL_PRIV_KEY_2],
    },
    // polkavm: { url: "http://127.0.0.1:8545" },
    ah: {
      url: "https://westend-asset-hub-eth-rpc.polkadot.io",
      accounts: [process.env.AH_PRIV_KEY],
    },
  },
  // using remix compiler
  // resolc: {
  //   version: "1.5.2",
  //   compilerSource: "remix",
  //   settings: {
  //     optimizer: {
  //       enabled: false,
  //       runs: 600,
  //     },
  //     evmVersion: "istanbul",
  //   },
  // },

  // using binary compiler
  resolc: {
    compilerSource: "binary",
    settings: {
      optimizer: {
        enabled: true,
        runs: 400,
      },
      evmVersion: "istanbul",
      compilerPath: "~/.cargo/bin/resolc",
      standardJson: true,
    },
  },
};

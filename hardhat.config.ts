import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@parity/hardhat-polkadot";
import { config as dotConfig } from "dotenv";
dotConfig();

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  resolc: {
    compilerSource: "npm",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      polkavm: true,
      nodeConfig: {
        nodeBinaryPath:
          "/home/user/github/polkadot-sdk/target/release/substrate-node",
        dev: true,
      },
      adapterConfig: {
        adapterBinaryPath:
          "/home/user/github/polkadot-sdk/target/release/eth-rpc",
        dev: true,
      },
    },
    localNode: {
      polkavm: true,
      url: `http://127.0.0.1:8545`,
      accounts: [
        process.env.LOCAL_PRIV_KEY ?? "",
        process.env.LOCAL_PRIV_KEY_2 ?? "",
      ],
    },
    sepolia: {
      polkavm: false,
      url: process.env.SEPOLIA_URL || "https://sepolia.infura.io/v3/7b0c8b0d85d843cfb9e94bc85450f7ad",
      accounts: process.env.SEPOLIA_PRIV_KEY ? [process.env.SEPOLIA_PRIV_KEY] : [],
      chainId: 11155111,
    },
    passetHub: {
      polkavm: true,
      url: "https://testnet-passet-hub-eth-rpc.polkadot.io",
      accounts: [process.env.PH_PRIV_KEY ?? "", process.env.PH_PRIV_KEY_2 ?? ""],
    },
  },
};

export default config;

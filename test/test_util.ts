import { expect } from "chai";
import { ethers, network } from "hardhat";
import { PVMERC20Votes } from "../typechain-types/contracts/PVMERC20Votes";
import { Signer } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";


export function getWallets(n: number) {
    const provider = new ethers.JsonRpcProvider(network.config.url);

    // Handle different account configuration types
    const accounts = network.config.accounts;
    if (!Array.isArray(accounts)) {
        throw new Error("Network accounts must be configured as an array");
    }

    const privateKeys: string[] = accounts.map((account) => {
        // Handle both string private keys and account config objects
        if (typeof account === 'string') {
            return account;
        } else {
            // For HardhatNetworkAccountConfig objects, extract the privateKey
            return account.privateKey;
        }
    });

    const allWallets = privateKeys.map((privateKey: string) => new ethers.Wallet(privateKey, provider));
    return allWallets.slice(0, n);
}
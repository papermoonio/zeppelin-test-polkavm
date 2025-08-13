import { ethers, network } from "hardhat";

export function getWallets(n: number) {
    const accounts = network.config.accounts;

    if (!Array.isArray(accounts)) {
        // Fallback to Hardhat signers when accounts are not explicitly configured
        const signers = ethers.getSigners();
        // Note: this returns a Promise<Signer[]>; callers in tests should await getSigners directly if needed.
        // To keep backwards compatibility, wrap signers into a synchronous-like array via a proxy.
        // However, tests in this repo use the returned values directly; simplify by throwing if awaited usage isn't possible.
        // Instead, construct wallets from provider using first few signers' private keys when available is non-trivial.
        // So we return a thenable shim here.
        // Better approach: expose an async helper.
        throw new Error("getWallets requires configured accounts. Use ethers.getSigners() in tests.");
    }

    const provider = ethers.provider;
    const privateKeys: string[] = accounts.map((account) => {
        if (typeof account === 'string') {
            return account;
        } else {
            return account.privateKey;
        }
    });

    const allWallets = privateKeys.map((privateKey: string) => new ethers.Wallet(privateKey, provider));
    return allWallets.slice(0, n);
}

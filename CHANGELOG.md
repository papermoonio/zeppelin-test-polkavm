# change log

The repo is used to test all basic lib in open zeppelin in polkaVM. It creates each contract according to the abstract contract and extensions.

## code base

At first, it copies all source code from open zeppelin contracts folder, removed parts not successfully compiled with resolc. Then create a new contract with a new test file one by one.

## contract and test in passet hub

### PVMERC20.sol

```shell
npx hardhat test test/test_ERC20.ts --network passetHub
PVMERC20
    Deployment
      ✔ Should set the correct name and symbol (445ms)
      ✔ Should set decimals to 18 (215ms)
      ✔ Should assign the total supply of tokens to the owner (436ms)
    Transactions
      ✔ Should transfer tokens between accounts (7956ms)
      ✔ Should update balances after transfers (3509ms)
    Allowance
      ✔ Should update allowance when approve is called (7679ms)
      ✔ Should allow transferFrom with sufficient allowance (10735ms)
      ✔ Should not decrease allowance for over approval (7498ms)
      ✔ Should fail when trying to transferFrom more than allowed (3265ms)
    Edge cases
      ✔ Should fail when transferring to the zero address (434ms)
      ✔ Should fail when approving the zero address as spender (435ms)
      ✔ Should handle zero value transfers correctly (7589ms)
      ✔ Should handle zero value approvals correctly (7921ms)
```

### PVMERC20Burnable.sol

```shell
npx hardhat test test/test_ERC20Burnable.ts --network passetHub

  PVMERC20Burnable
    Burn
      ✔ Should allow owner to burn their tokens (8125ms)
      ✔ Should allow approved spender to burn tokens (10957ms)
      ✔ Should fail when trying to burn more tokens than owned (664ms)
```

### PVMERC20Capped.sol

```shell
npx hardhat test test/test_ERC20Capped.ts --network passetHub


  PVMERC20Capped
    Deployment
      ✔ Should set the correct name and symbol (463ms)
      ✔ Should assign the total supply to the owner (446ms)
    Cap functionality
      ✔ Should allow transfers within cap (3276ms)
      ✔ Should maintain total supply at or below cap (221ms)


  4 passing

```

### PVMERC20Pausable.sol

```shell
npx hardhat test test/test_ERC20Pausable.ts --network passetHub

  PVMERC20Pausable
    Deployment
      ✔ Should set the correct name and symbol (445ms)
      ✔ Should assign the total supply to the owner (451ms)
      ✔ Should be unpaused by default (250ms)
    Pausable functionality
      ✔ Should allow owner to pause and unpause (15053ms)
      ✔ Should prevent transfers when paused (7547ms)
      ✔ Should prevent transferFrom when paused (18273ms)
      ✔ Should allow transfers after unpausing (19429ms)
      ✔ Should emit Paused event when paused (3071ms)
      ✔ Should emit Unpaused event when unpaused (7312ms)

  9 passing

```

### PVMERC20Votes.sol

```shell
npx hardhat test/test_ERC20Votes.ts --network passetHub


  PVMERC20Votes
    1) "before all" hook in "PVMERC20Votes"


  0 passing (3s)
  1 failing

  1) PVMERC20Votes
       "before all" hook in "PVMERC20Votes":
     Error: fields had validation errors
      at validateFields (node_modules/micro-eth-signer/src/tx.ts:575:32)
      at new Transaction (node_modules/micro-eth-signer/src/index.ts:114:19)
      at Function.prepare (node_modules/micro-eth-signer/src/index.ts:140:12)
      at LocalAccountsProvider._getSignedTransaction (node_modules/hardhat/src/internal/core/providers/accounts.ts:327:33)
      at processTicksAndRejections (node:internal/process/task_queues:105:5)
      at async LocalAccountsProvider.request (node_modules/hardhat/src/internal/core/providers/accounts.ts:188:30)
      at async HardhatEthersSigner.sendTransaction (node_modules/@nomicfoundation/hardhat-ethers/src/signers.ts:181:18)
      at async ContractFactory.deploy (node_modules/ethers/src.ts/contract/factory.ts:111:24)
      at async Context.<anonymous> (test/test_ERC20Votes.ts:23:17)

```

Created an issue for this bug, reported as https://github.com/paritytech/hardhat-polkadot/issues/191. The root case is the initcode size is too big.

### PVMERC20Wrapper.sol

```shell
npx hardhat test test/test_ERC20Wrapper.ts --network passetHub

  PVMERC20Wrapper
    ✔ Should wrap (deposit) underlying tokens (15835ms)
9000000000000000000000n
    ✔ Should unwrap (withdraw) wrapped tokens (17667ms)


  2 passing

```

### PVMERC4626.sol

```shell
npx hardhat test test/test_ERC4626.ts --network passetHub


  PVMERC4626
AggregatedError: fields had validation errors
    at validateFields (/home/user/github/papermoon/zeppelin-test-polkavm/node_modules/micro-eth-signer/src/tx.ts:575:32)
    at new Transaction (/home/user/github/papermoon/zeppelin-test-polkavm/node_modules/micro-eth-signer/src/index.ts:114:19)
    at Function.prepare (/home/user/github/papermoon/zeppelin-test-polkavm/node_modules/micro-eth-signer/src/index.ts:140:12)
    at LocalAccountsProvider._getSignedTransaction (/home/user/github/papermoon/zeppelin-test-polkavm/node_modules/hardhat/src/internal/core/providers/accounts.ts:327:33)
    at processTicksAndRejections (node:internal/process/task_queues:105:5)
    at async LocalAccountsProvider.request (/home/user/github/papermoon/zeppelin-test-polkavm/node_modules/hardhat/src/internal/core/providers/accounts.ts:188:30)
    at async HardhatEthersSigner.sendTransaction (/home/user/github/papermoon/zeppelin-test-polkavm/node_modules/@nomicfoundation/hardhat-ethers/src/signers.ts:181:18)
    at async ContractFactory.deploy (/home/user/github/papermoon/zeppelin-test-polkavm/node_modules/ethers/src.ts/contract/factory.ts:111:24)
    at async Context.<anonymous> (/home/user/github/papermoon/zeppelin-test-polkavm/test/test_ERC4626.ts:28:21) {
  errors: [ { field: 'data', error: 'initcode is too big: 141830' } ]
}

```

It is the same root case with PVMERC20Votes. Not report the redundant issue for it.

### PVMERC20FlashMint.sol

working on this one now.

```shell
npx hardhat test/test_ERC20FlashMint.ts --network passetHub

  PVMERC20FlashMint
    Deployment
      ✔ Should set the correct name and symbol (457ms)
      ✔ Should assign the total supply to the owner (433ms)
      ✔ Should have flash loan fee of 0 (217ms)
    Flash Loan Basic Functionality
      ✔ Should execute simple flash loan (10965ms)
      ✔ Should handle flash loan with custom data (14969ms)
    Flash Loan Error Cases
      ✔ Should fail when token address is invalid (2713ms)
      ✔ Should fail when borrower doesn't implement interface (441ms)
    Flash Loan Advanced Scenarios
      ✔ Should handle multiple consecutive flash loans (29532ms)
      ✔ Should handle arbitrage scenario (17839ms)
    Standard ERC20 Functionality
      ✔ Should transfer tokens correctly (8201ms)
      ✔ Should approve and transferFrom correctly (9599ms)

  11 passing

```

### PVMERC721.sol

```shell
npx hardhat test test/test_ERC721.ts --network passetHub

  ERC721
    Deployment
      ✔ Should set the correct name and symbol (471ms)
      ✔ Should start with zero total supply (220ms)
    Minting
      ✔ Should mint a new token (3327ms)
      ✔ Should fail when minting to zero address (450ms)
      ✔ Should fail when minting token that already exists (490ms)
    Transfers
      ✔ Should fail when transferring token without approval (450ms)
      ✔ Should transfer token between accounts (7796ms)
      ✔ Should transfer token with approval (11145ms)


  8 passing (35s)
```

### PVMERC721Burnable.sol

```shell
npx hardhat test test/test_ERC721Burnable.ts --network passetHub


  PVMERC721Burnable
    Deployment
      ✔ Should set the correct name and symbol (433ms)
      ✔ Should set the deployer as owner (313ms)
    Minting
      ✔ Should allow owner to mint tokens (1156ms)
      ✔ Should prevent non-owner from minting
    Burning
      ✔ Should allow token owner to burn their token (1152ms)
      ✔ Should allow approved address to burn token (6301ms)
      ✔ Should allow operator to burn token (6302ms)
      ✔ Should prevent unauthorized burning
      ✔ Should fail when trying to burn non-existent token
    Owner Functions
      ✔ Should allow owner to transfer ownership (5155ms)
      ✔ Should prevent non-owner from transferring ownership


  11 passing
```

### PVMERC721Consecutive.sol

```shell
nh test test/test_ERC721Consecutive.ts --network passetHub

  PVMERC721Consecutive
    Deployment
AggregatedError: fields had validation errors
    at validateFields (/home/user/github/papermoon/zeppelin-test-polkavm/node_modules/micro-eth-signer/src/tx.ts:575:32)
    at new Transaction (/home/user/github/papermoon/zeppelin-test-polkavm/node_modules/micro-eth-signer/src/index.ts:114:19)
    at Function.prepare (/home/user/github/papermoon/zeppelin-test-polkavm/node_modules/micro-eth-signer/src/index.ts:140:12)
    at LocalAccountsProvider._getSignedTransaction (/home/user/github/papermoon/zeppelin-test-polkavm/node_modules/hardhat/src/internal/core/providers/accounts.ts:327:33)
    at processTicksAndRejections (node:internal/process/task_queues:105:5)
    at async LocalAccountsProvider.request (/home/user/github/papermoon/zeppelin-test-polkavm/node_modules/hardhat/src/internal/core/providers/accounts.ts:188:30)
    at async HardhatEthersSigner.sendTransaction (/home/user/github/papermoon/zeppelin-test-polkavm/node_modules/@nomicfoundation/hardhat-ethers/src/signers.ts:181:18)
    at async ContractFactory.deploy (/home/user/github/papermoon/zeppelin-test-polkavm/node_modules/ethers/src.ts/contract/factory.ts:111:24)
    at async Context.<anonymous> (/home/user/github/papermoon/zeppelin-test-polkavm/test/test_ERC721Consecutive.ts:22:21) {
  errors: [ { field: 'data', error: 'initcode is too big: 100286' } ]
}
```

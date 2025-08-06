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
npx hardhat test test/test_ERC20Votes.ts --network passetHub


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
npx hardhat test test/test_ERC721Consecutive.ts --network passetHub

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

### PVMERC721Enumerable

```shell
npx hardhat test test/test_ERC721Enumerable.ts --network passetHub

PVMERC721Enumerable
    Deployment
error is  AggregatedError: fields had validation errors
    at validateFields (/home/user/github/papermoon/zeppelin-test-polkavm/node_modules/micro-eth-signer/src/tx.ts:575:32)
    at new Transaction (/home/user/github/papermoon/zeppelin-test-polkavm/node_modules/micro-eth-signer/src/index.ts:114:19)
    at Function.prepare (/home/user/github/papermoon/zeppelin-test-polkavm/node_modules/micro-eth-signer/src/index.ts:140:12)
    at LocalAccountsProvider._getSignedTransaction (/home/user/github/papermoon/zeppelin-test-polkavm/node_modules/hardhat/src/internal/core/providers/accounts.ts:327:33)
    at processTicksAndRejections (node:internal/process/task_queues:105:5)
    at async LocalAccountsProvider.request (/home/user/github/papermoon/zeppelin-test-polkavm/node_modules/hardhat/src/internal/core/providers/accounts.ts:188:30)
    at async HardhatEthersSigner.sendTransaction (/home/user/github/papermoon/zeppelin-test-polkavm/node_modules/@nomicfoundation/hardhat-ethers/src/signers.ts:181:18)
    at async ContractFactory.deploy (/home/user/github/papermoon/zeppelin-test-polkavm/node_modules/ethers/src.ts/contract/factory.ts:111:24)
    at async Context.<anonymous> (/home/user/github/papermoon/zeppelin-test-polkavm/test/test_ERC721Enumerable.ts:19:21) {
  errors: [ { field: 'data', error: 'initcode is too big: 157182' } ]
}

```

### PVMERC721Pausable

```shell
npx hardhat test test/test_ERC721Pausable.ts --network passetHub

  PVMERC721Pausable
    Deployment
      ✔ Should set the correct name and symbol (724ms)
      ✔ Should be unpaused by default (376ms)
      ✔ Should set the deployer as owner (351ms)
    Pausable functionality
      ✔ Should allow owner to pause and unpause (23479ms)
      ✔ Should prevent transfers when paused (14019ms)
      ✔ Should prevent minting when paused (9583ms)
      ✔ Should allow transfers after unpausing (4902ms)
      ✔ Should prevent non-owner from pausing (829ms)
      ✔ Should prevent non-owner from unpausing (5244ms)
      ✔ Should emit Paused event when paused (9935ms)
      ✔ Should emit Unpaused event when unpaused (13832ms)
    Minting
      ✔ Should allow owner to mint when unpaused (5364ms)
      ✔ Should prevent non-owner from minting (1534ms)
    Standard ERC721 Functionality
      ✔ Should transfer tokens when unpaused (9976ms)
      ✔ Should handle approvals correctly (12943ms)


  15 passing (8m)
```

### PVMERC721Royalty

```shell
npx hardhat test test/test_ERC721Royalty.ts --network passetHub

  PVMERC721Royalty
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
    at async Context.<anonymous> (/home/user/github/papermoon/zeppelin-test-polkavm/test/test_ERC721Royalty.ts:22:21) {
  errors: [ { field: 'data', error: 'initcode is too big: 102102' } ]
}
```

### PVMERC721URIStorage

```shell
npx hardhat test/test_ERC721URIStorage.ts --network passetHub

  PVMERC721URIStorage
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
    at async Context.<anonymous> (/home/user/github/papermoon/zeppelin-test-polkavm/test/test_ERC721URIStorage.ts:19:21) {
  errors: [ { field: 'data', error: 'initcode is too big: 121872' } ]
}
```

### PVMERC721Votes

```shell
npx hardhat test/test_ERC721Votes.ts --network passetHub

  PVMERC721Votes
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
    at async Context.<anonymous> (/home/user/github/papermoon/zeppelin-test-polkavm/test/test_ERC721Votes.ts:21:21) {
  errors: [ { field: 'data', error: 'initcode is too big: 176850' } ]
}
```

### PVMERC721Wrapper

```shell
npx hardhat test/test_ERC721Wrapper.ts --network passetHub

  PVMERC721Wrapper
    Deployment
      ✔ Should set the correct name and symbol (737ms)
      ✔ Should set the correct underlying token (368ms)
      ✔ Should set the deployer as owner (352ms)
    Token Wrapping - Single Token
      ✔ Should deposit a single token successfully (25190ms)
      ✔ Should withdraw a single token successfully (22634ms)
    Token Wrapping - Multiple Tokens
      ✔ Should deposit multiple tokens in one transaction (36865ms)
      ✔ Should withdraw multiple tokens in one transaction (35673ms)
    Direct Transfer and onERC721Received
      ✔ Should automatically wrap tokens sent directly to contract (8314ms)
      ✔ Should reject tokens from unsupported contracts (25049ms)
    Ownership and Access Control
      ✔ Should allow deposit to different account (11050ms)
      ✔ Should allow withdraw to different account (18759ms)
      ✔ Should maintain Ownable functionality (1068ms)
    ERC721 Standard Compliance
      ✔ Should support ERC721 transfers (12190ms)
    Error Conditions
      ✔ Should revert when depositing without approval (731ms)
      ✔ Should revert when depositing non-existent token (715ms)
    Gas Optimization and Batch Operations
      ✔ Should handle large batch operations efficiently (180720ms)


  16 passing (20m)
```

### PVMERC1155

```shell
npx hardhat test test/test_ERC1155.ts --network passetHub

ERC1155
    Deployment
      ✔ Should set the correct URI (365ms)
      ✔ Should set the deployer as owner (355ms)
      ✔ Should start with zero total supply for all token IDs (709ms)
      ✔ Should return false for exists on unminted tokens (711ms)
    Minting
      ✔ Should allow owner to mint tokens (9057ms)
      ✔ Should prevent non-owners from minting (715ms)
      ✔ Should allow batch minting (9140ms)
    Burning
      ✔ Should allow burning of owned tokens (8484ms)
      ✔ Should prevent burning more than balance (735ms)
    Transfers
      ✔ Should allow transfer between accounts (8298ms)
    Approvals
      ✔ Should allow setting approval for all (12307ms)


  11 passing (1m)
```

### PVMERC1155Burnable

```shell
npx hardhat test test/test_ERC1155Burnable.ts --network passetHub


  PVMERC1155Burnable
    Deployment
      ✔ Should set the correct URI (387ms)
      ✔ Should set the deployer as owner (356ms)
    Owner Minting
      ✔ Should allow owner to mint tokens (8783ms)
      ✔ Should prevent non-owner from minting (755ms)
    Token Holder Burning
      ✔ Should allow token holders to burn their own tokens (13597ms)
      ✔ Should prevent burning more tokens than balance (725ms)
      ✔ Should allow token holders to burn batch tokens (5407ms)
    Supply Tracking
      ✔ Should track total supply correctly after burning (8698ms)
    Transfers
      ✔ Should transfer tokens normally (12993ms)

```

### PVMERC1155Pausable

```shell
npx hardhat test test/test_ERC1155Pausable.ts --network passetHub

  PVMERC1155Pausable
    Deployment
      ✔ Should set the correct URI (369ms)
      ✔ Should set the deployer as owner (353ms)
      ✔ Should start unpaused (354ms)
    Pause/Unpause Functions
      ✔ Should allow owner to pause the contract (12304ms)
      ✔ Should allow owner to unpause the contract (24339ms)
      ✔ Should prevent non-owner from pausing (690ms)
      ✔ Should prevent non-owner from unpausing (3854ms)
    Minting When Paused
      ✔ Should prevent batch minting when paused (710ms)
      ✔ Should allow minting after unpausing (11021ms)
    Burning When Paused
      ✔ Should prevent burning when paused (731ms)
      ✔ Should prevent batch burning when paused (749ms)
      ✔ Should allow burning after unpausing (10765ms)
    Transfers When Paused
      ✔ Should prevent transfers when paused (759ms)
      ✔ Should prevent batch transfers when paused (715ms)
      ✔ Should allow transfers after unpausing (21347ms)
    View Functions When Paused
      ✔ Should allow view functions when paused (1496ms)
      ✔ Should allow approval functions when paused (7789ms)
    Owner Functions When Paused
      ✔ Should allow owner to change ownership when paused (12212ms)
      ✔ Should allow new owner to unpause (10238ms)
    Supply Tracking When Paused
      ✔ Should maintain supply tracking across pause states (31794ms)


  20 passing (16m)

```

### PVMERC1155Public

```shell
npx hardhat test test/test_ERC1155Public.ts --network passetHub


  PVMERC1155Public
    Deployment
      ✔ Should set the correct URI (364ms)
      ✔ Should start with zero total supply for all token IDs (698ms)
      ✔ Should return false for exists on unminted tokens (721ms)
    Public Minting
      ✔ Should allow anyone to mint tokens (12971ms)
      ✔ Should allow anyone to mint tokens for others (8686ms)
      ✔ Should allow owner to mint tokens (12618ms)
    Public Batch Minting
      ✔ Should allow anyone to batch mint tokens (9656ms)
      ✔ Should fail when batch minting to zero address (721ms)
      ✔ Should fail when ids and values arrays have different lengths (703ms)
    Permission-Based Burning
      ✔ Should allow token holders to burn their own tokens (8927ms)
      ✔ Should prevent burning from zero address (701ms)
      ✔ Should prevent burning more than balance (714ms)
    Permission-Based Batch Burning
      ✔ Should allow token holders to batch burn their own tokens (8974ms)
    Supply Tracking
      ✔ Should update exists status correctly (11219ms)
      ✔ Should track total supply across multiple mints and burns (20069ms)
    Standard ERC1155 Functions
      ✔ Should transfer tokens between accounts (12885ms)


  16 passing (6m)
```

### PVMERC1155Supply

```shell
npx hardhat test test/test_ERC1155Supply.ts --network passetHub

  PVMERC1155Supply
    Deployment
      ✔ Should set the correct URI (359ms)
      ✔ Should set the deployer as owner (342ms)
      ✔ Should start with zero total supply for all token IDs (1032ms)
      ✔ Should return false for exists on unminted tokens (702ms)
    Single Token Supply Tracking
      ✔ Should track total supply when minting single tokens (12872ms)
      ✔ Should track total supply when minting to multiple addresses (20652ms)
      ✔ Should track total supply when burning single tokens (24637ms)
      ✔ Should update exists status when all tokens are burned (28972ms)
    Batch Supply Tracking
      ✔ Should track total supply when batch minting (9910ms)
      ✔ Should track total supply when batch burning (11604ms)
      ✔ Should handle partial batch burning (20974ms)
    Mixed Operations Supply Tracking
      ✔ Should track supply across mixed single and batch operations (45443ms)
      ✔ Should maintain accurate supply after transfers (12164ms)
    Multiple Token Types
      ✔ Should track supply independently for different token IDs (22163ms)
      ✔ Should handle exists correctly for multiple token types (19335ms)
    Edge Cases
      ✔ Should handle zero amount minting (12801ms)
      ✔ Should prevent burning more than supply (8170ms)
      ✔ Should maintain accurate counts with large numbers (24997ms)
    Access Control
      ✔ Should prevent non-owner from minting (693ms)
      ✔ Should prevent non-owner from burning (12495ms)


  20 passing (8m)

```

### PVMERC1155URIStorage

```shell
npx hardhat test test/test_ERC1155URIStorage.ts --network passetH
ub
PVMERC1155URIStorage
    Deployment
      ✔ Should set the correct default URI (1066ms)
      ✔ Should set the deployer as owner (345ms)
    Individual Token URI Management
      ✔ Should allow owner to set individual token URI (3127ms)
      ✔ Should prevent non-owner from setting token URI (687ms)
      ✔ Should emit URI event when setting token URI (12162ms)
      ✔ Should allow setting empty token URI (reverts to default) (14906ms)
      ✔ Should handle multiple token URIs independently (18916ms)
    Base URI Management
      ✔ Should allow owner to set base URI (15604ms)
      ✔ Should prevent non-owner from setting base URI (682ms)
      ✔ Should concatenate base URI with token URI (23342ms)
      ✔ Should handle empty base URI (24314ms)
      ✔ Should update existing token URIs when base URI changes (24823ms)
    URI Fallback Behavior
      ✔ Should fallback to default URI when no specific URI is set (356ms)
      ✔ Should use specific URI when set, even if base URI is also set (10335ms)
      ✔ Should fallback properly when token URI is cleared (27498ms)
    URI Management for Non-existent Tokens
      ✔ Should allow setting URI for non-existent tokens (12399ms)
      ✔ Should handle base URI with non-existent tokens (11340ms)
    Token Operations with URI Storage
      ✔ Should maintain URI after minting additional tokens (21325ms)
      ✔ Should maintain URI after burning tokens (24952ms)
      ✔ Should maintain URI after transferring tokens (25286ms)
      ✔ Should maintain URI when all tokens are burned (83848ms)
    Batch URI Operations
      ✔ Should handle URI for batch minted tokens (57750ms)
    Supply Tracking with URI Storage
      ✔ Should track supply correctly with URI operations (24865ms)


  23 passing (24m)

```

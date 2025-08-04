# description for initcode size

## privider change

code for choose different provider in test/test_util.ts

## manually test three cases to demo issue

1. deploy ERC20Vote with hardhat default provider

```shell in test/test_ERC20Votes.rs
    [owner, wallet1] = await ethers.getSigners();
    // [owner, wallet1] = getWallets(2);
```

test command

```shell
npx hardhat test test/test_ERC20Votes.ts  --network passetHub --no-compile
```

test result

```shell
  PVMERC20Votes
AggregatedError: fields had validation errors
    at validateFields (/home/user/github/papermoon/zeppelin-test-polkavm/node_modules/micro-eth-signer/src/tx.ts:575:32)
    at new Transaction (/home/user/github/papermoon/zeppelin-test-polkavm/node_modules/micro-eth-signer/src/index.ts:114:19)
    at Function.prepare (/home/user/github/papermoon/zeppelin-test-polkavm/node_modules/micro-eth-signer/src/index.ts:140:12)
    at LocalAccountsProvider._getSignedTransaction (/home/user/github/papermoon/zeppelin-test-polkavm/node_modules/hardhat/src/internal/core/providers/accounts.ts:327:33)
    at processTicksAndRejections (node:internal/process/task_queues:105:5)
    at async LocalAccountsProvider.request (/home/user/github/papermoon/zeppelin-test-polkavm/node_modules/hardhat/src/internal/core/providers/accounts.ts:188:30)
    at async HardhatEthersSigner.sendTransaction (/home/user/github/papermoon/zeppelin-test-polkavm/node_modules/@nomicfoundation/hardhat-ethers/src/signers.ts:181:18)
    at async ContractFactory.deploy (/home/user/github/papermoon/zeppelin-test-polkavm/node_modules/ethers/src.ts/contract/factory.ts:111:24)
    at async Context.<anonymous> (/home/user/github/papermoon/zeppelin-test-polkavm/test/test_ERC20Votes.ts:27:21) {
  errors: [ { field: 'data', error: 'initcode is too big: 160014' } ]
}
```

2. deploy ERC20Vote with ethers provider (success with 160014 size)

```shell in test/test_ERC20Votes.rs
    // [owner, wallet1] = await ethers.getSigners();
    [owner, wallet1] = getWallets(2);
```

test command

```shell
npx hardhat test test/test_ERC20Votes.ts  --network passetHub --no-compile
```

test result

```shell

  PVMERC20Votes
token address 0xc3b35C0b08b706Cbc90615Bca7623da43cEE7D2F
    Deployment
      ✔ Should set the correct name and symbol (781ms)
      ✔ Should assign the total supply to the owner (734ms)


  2 passing (7s)
```

3. deploy one of ERC721 (failed with size 100286)

```shell
npx hardhat test test/test_ERC721Consecutive.ts  --network passetHub --no-compile


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
    at async Context.<anonymous> (/home/user/github/papermoon/zeppelin-test-polkavm/test/test_ERC721Consecutive.ts:23:21) {
  errors: [ { field: 'data', error: 'initcode is too big: 100286' } ]
}
```

4. deploy one of ERC1155 (failed with size 125404)

```shell
npx hardhat test test/test_ERC1155.ts  --network passetHub --no-compile


  ERC1155
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
    at async Context.<anonymous> (/home/user/github/papermoon/zeppelin-test-polkavm/test/test_ERC1155.ts:22:21) {
  errors: [ { field: 'data', error: 'initcode is too big: 125404' } ]
```

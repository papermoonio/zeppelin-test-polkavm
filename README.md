# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample
contract, a test for that contract, and a Hardhat Ignition module that deploys
that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/Lock.ts
```

deploy

```shell
npx hardhat deploy-revive --contract SimpleERC20 --network ah --args a,b,18,10000000

npx hardhat deploy-revive --contract Lock --network ah --args 10000000000
```

compile

```shell
npx hardhat compile-revive --contract MiniDex.sol --network ah
```

test

```shell
npx hardhat test test/Storage.ts --network passetHub --no-compile
```

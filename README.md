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

compile

```shell
npx hardhat compile --network passetHub
```

deploy

```shell
echo y | npx hardhat ignition deploy ./ignition/modules/PVMERC20.ts --network localNode --parameters ./parameters.json
```

test, to aovid compile all again with --no-compile

```shell
npx hardhat test test/test_ERC20.ts --network localNode --no-compile
```

// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const PVMERC20Module = buildModule("PVMERC20Module", (m) => {
  const name = m.getParameter("name", "name");
  const symbol = m.getParameter("symbol", "symbol");
  const initialSupply = m.getParameter(
    "initialSupply",
    1_000_000n * 10n ** 18n,
  );

  const token = m.contract("PVMERC20", [name, symbol, initialSupply]);

  return { token };
});

export default PVMERC20Module;

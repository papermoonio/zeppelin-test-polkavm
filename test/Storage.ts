import { expect } from "chai";
import { ethers } from "hardhat";
import { Storage } from "../typechain-types/contracts/Storage";

describe("Storage", function () {
  let storage: Storage;
  const initialValue: number = 42;

  beforeEach(async () => {
    const StorageFactory = await ethers.getContractFactory("Storage");
    console.log("Deploying Storage contract...", StorageFactory);
    storage = await StorageFactory.deploy(initialValue.toString());
    await storage.waitForDeployment();
  });

  it("Should return the initial value", async function () {
    expect(await storage.number()).to.equal(initialValue.toString());
  });

  it("Should set new value", async function () {
    const newValue = 100;
    await storage.store(newValue.toString());
    expect(await storage.number()).to.equal(newValue.toString());
  });
});

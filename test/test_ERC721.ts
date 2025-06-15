import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "ethers";

import { PVMERC721 } from "../typechain-types/contracts/PVMERC721";

describe("ERC721", function () {
  let token: PVMERC721;
  let owner: Signer;
  let wallet1: Signer;
  let wallet2: Signer;

  const name = "Test NFT";
  const symbol = "TNFT";

  before(async function () {
    [owner, wallet1] = await ethers.getSigners();
    wallet2 = ethers.Wallet.createRandom(ethers.getDefaultProvider());

    const ERC721Factory = await ethers.getContractFactory("PVMERC721");
    token = await ERC721Factory.deploy(name, symbol);
    await token.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      expect(await token.name()).to.equal(name);
      expect(await token.symbol()).to.equal(symbol);
    });

    it("Should start with zero total supply", async function () {
      expect(await token.totalSupply()).to.equal(0);
    });
  });

  describe("Minting", function () {
    it("Should mint a new token", async function () {
      const ownerAddress = await owner.getAddress();
      await token.mint(ownerAddress, 1);

      expect(await token.ownerOf(1)).to.equal(ownerAddress);
      expect(await token.totalSupply()).to.equal(1);
    });

    it("Should fail when minting to zero address", async function () {
      await expect(
        token.mint(ethers.ZeroAddress, 2),
      ).to.be.reverted;
    });

    it("Should fail when minting token that already exists", async function () {
      const ownerAddress = await owner.getAddress();
      await expect(
        token.mint(ownerAddress, 1),
      ).to.be.reverted;
    });
  });

  describe("Transfers", function () {
    it("Should transfer token between accounts", async function () {
      const ownerAddress = await owner.getAddress();
      const wallet1Address = await wallet1.getAddress();

      await token.transferFrom(ownerAddress, wallet1Address, 1);

      expect(await token.ownerOf(1)).to.equal(wallet1Address);
    });

    it("Should fail when transferring token without approval", async function () {
      const wallet1Address = await wallet1.getAddress();
      const wallet2Address = await wallet2.getAddress();

      await expect(
        token.connect(wallet1).transferFrom(wallet1Address, wallet2Address, 1),
      ).to.be.reverted;
    });

    it("Should transfer token with approval", async function () {
      const wallet1Address = await wallet1.getAddress();
      const wallet2Address = await wallet2.getAddress();

      await token.connect(wallet1).approve(wallet2Address, 1);
      await token.connect(wallet2).transferFrom(
        wallet1Address,
        wallet2Address,
        1,
      );

      expect(await token.ownerOf(1)).to.equal(wallet2Address);
    });
  });

  describe("Approvals", function () {
    it("Should approve address to transfer token", async function () {
      const wallet2Address = await wallet2.getAddress();
      const wallet1Address = await wallet1.getAddress();

      await token.connect(wallet2).approve(wallet1Address, 1);
      expect(await token.getApproved(1)).to.equal(wallet1Address);
    });

    it("Should clear approval when token is transferred", async function () {
      const wallet2Address = await wallet2.getAddress();
      const wallet1Address = await wallet1.getAddress();

      await token.connect(wallet2).transferFrom(
        wallet2Address,
        wallet1Address,
        1,
      );
      expect(await token.getApproved(1)).to.equal(ethers.ZeroAddress);
    });

    it("Should set approval for all", async function () {
      const wallet1Address = await wallet1.getAddress();
      const wallet2Address = await wallet2.getAddress();

      await token.connect(wallet1).setApprovalForAll(wallet2Address, true);
      expect(await token.isApprovedForAll(wallet1Address, wallet2Address)).to.be
        .true;
    });
  });
});

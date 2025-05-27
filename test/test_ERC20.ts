// filepath: test/token/ERC20.test.ts
import { expect } from "chai";
import { ethers, network } from "hardhat";
import { Contract, Signer } from "ethers";

import { PVMERC20 } from "../typechain-types/PVMERC20";

describe("ERC20", function () {
  // Test fixture with contract and signers
  let token: PVMERC20;
  let owner: Signer;
  let addr1: Signer;
  let addr2: Signer;

  const name = "Test Token";
  const symbol = "TST";
  const initialSupply = ethers.parseEther("1000");

  // Deploy a concrete implementation of the abstract ERC20 contract before each test
  before(async function () {
    [owner, addr1] = await ethers.getSigners();
    addr2 = ethers.Wallet.createRandom(ethers.getDefaultProvider());

    // Deploy a test implementation of ERC20
    const ERC20Factory = await ethers.getContractFactory("PVMERC20");
    token = await ERC20Factory.deploy(name, symbol, initialSupply);
    await token.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      expect(await token.name()).to.equal(name);
      expect(await token.symbol()).to.equal(symbol);
    });

    it("Should set decimals to 18", async function () {
      expect(await token.decimals()).to.equal(18);
    });

    it("Should assign the total supply of tokens to the owner", async function () {
      const ownerBalance = await token.balanceOf(await owner.getAddress());
      expect(await token.totalSupply()).to.equal(ownerBalance);
      expect(ownerBalance).to.equal(initialSupply);
    });
  });

  describe("Transactions", function () {
    it("Should transfer tokens between accounts", async function () {
      const amount = ethers.parseEther("50");
      const ownerAddress = await owner.getAddress();
      const addr1Address = await addr1.getAddress();

      // Transfer from owner to addr1
      await token.transfer(addr1Address, amount);

      // Check balances reflect the transfer
      expect(await token.balanceOf(addr1Address)).to.equal(amount);
      expect(await token.balanceOf(ownerAddress)).to.equal(
        initialSupply - amount,
      );
    });

    it("Should update balances after transfers", async function () {
      const amount = ethers.parseEther("100");
      const ownerAddress = await owner.getAddress();
      const addr1Address = await addr1.getAddress();
      const addr2Address = await addr2.getAddress();

      // Transfer from owner to addr1
      await token.transfer(addr1Address, amount);
      console.log("=======================");
      console.log(await token.balanceOf(addr1Address));
      console.log(await token.balanceOf(addr2Address));


      // Transfer from addr1 to addr2
      //   const contract = new Contract(await token.getAddress(), token.interface, addr1);
      await token.connect(addr1).transfer(addr2Address, amount / ethers.toBigInt(2));

      console.log("=======================");
      console.log(await token.balanceOf(addr1Address));
      console.log(await token.balanceOf(addr2Address));


      // Check balances
      //   expect(await token.balanceOf(ownerAddress)).to.equal(initialSupply - amount);
      expect(await token.balanceOf(addr1Address)).to.equal(amount);
      console.log("=======================");
      console.log(await token.balanceOf(addr1Address));
      console.log(await token.balanceOf(addr2Address));
      expect(await token.balanceOf(addr2Address)).to.equal(amount);
    });
  });

  // describe("Allowance", function () {
  //     it("Should update allowance when approve is called", async function () {
  //         const amount = ethers.parseEther("100");
  //         const ownerAddress = await owner.getAddress();
  //         const addr1Address = await addr1.getAddress();

  //         await token.approve(addr1Address, amount);

  //         expect(await token.allowance(ownerAddress, addr1Address)).to.equal(amount);
  //     });

  //     it("Should allow transferFrom with sufficient allowance", async function () {
  //         const amount = ethers.parseEther("100");
  //         const ownerAddress = await owner.getAddress();
  //         const addr1Address = await addr1.getAddress();
  //         const addr2Address = await addr2.getAddress();

  //         await token.approve(addr1Address, amount);
  //         await token.connect(addr1).transferFrom(ownerAddress, addr2Address, amount);

  //         expect(await token.balanceOf(addr2Address)).to.equal(amount);
  //         expect(await token.allowance(ownerAddress, addr1Address)).to.equal(0);
  //     });

  //     it("Should not decrease allowance for max uint256 approval", async function () {
  //         const maxAllowance = ethers.constants.MaxUint256;
  //         const amount = ethers.parseEther("100");
  //         const ownerAddress = await owner.getAddress();
  //         const addr1Address = await addr1.getAddress();
  //         const addr2Address = await addr2.getAddress();

  //         await token.approve(addr1Address, maxAllowance);
  //         await token.connect(addr1).transferFrom(ownerAddress, addr2Address, amount);

  //         expect(await token.allowance(ownerAddress, addr1Address)).to.equal(maxAllowance);
  //     });

  //     it("Should fail when trying to transferFrom more than allowed", async function () {
  //         const allowance = ethers.parseEther("99");
  //         const amount = ethers.parseEther("100");
  //         const ownerAddress = await owner.getAddress();
  //         const addr1Address = await addr1.getAddress();
  //         const addr2Address = await addr2.getAddress();

  //         await token.approve(addr1Address, allowance);

  //         await expect(
  //             token.connect(addr1).transferFrom(ownerAddress, addr2Address, amount)
  //         ).to.be.revertedWith("ERC20InsufficientAllowance");
  //     });
  // });

  // describe("Internal functions", function () {
  //     it("Should mint tokens correctly", async function () {
  //         const amount = ethers.parseEther("500");
  //         const addr1Address = await addr1.getAddress();
  //         const initialSupply = await token.totalSupply();

  //         await token.mint(addr1Address, amount);

  //         expect(await token.balanceOf(addr1Address)).to.equal(amount);
  //         expect(await token.totalSupply()).to.equal(initialSupply.add(amount));
  //     });

  //     it("Should burn tokens correctly", async function () {
  //         const amount = ethers.parseEther("200");
  //         const ownerAddress = await owner.getAddress();
  //         const initialSupply = await token.totalSupply();

  //         await token.burn(ownerAddress, amount);

  //         expect(await token.balanceOf(ownerAddress)).to.equal(initialSupply.sub(amount));
  //         expect(await token.totalSupply()).to.equal(initialSupply.sub(amount));
  //     });

  //     it("Should fail when minting to the zero address", async function () {
  //         const amount = ethers.parseEther("100");

  //         await expect(
  //             token.mint(ethers.constants.AddressZero, amount)
  //         ).to.be.revertedWith("ERC20InvalidReceiver");
  //     });

  //     it("Should fail when burning from the zero address", async function () {
  //         const amount = ethers.parseEther("100");

  //         await expect(
  //             token.burn(ethers.constants.AddressZero, amount)
  //         ).to.be.revertedWith("ERC20InvalidSender");
  //     });
  // });

  // describe("Edge cases", function () {
  //     it("Should fail when transferring to the zero address", async function () {
  //         const amount = ethers.parseEther("100");

  //         await expect(
  //             token.transfer(ethers.constants.AddressZero, amount)
  //         ).to.be.revertedWith("ERC20InvalidReceiver");
  //     });

  //     it("Should fail when approving the zero address as spender", async function () {
  //         const amount = ethers.parseEther("100");

  //         await expect(
  //             token.approve(ethers.constants.AddressZero, amount)
  //         ).to.be.revertedWith("ERC20InvalidSpender");
  //     });

  //     it("Should handle zero value transfers correctly", async function () {
  //         const addr1Address = await addr1.getAddress();
  //         const initialBalance = await token.balanceOf(addr1Address);

  //         await token.transfer(addr1Address, 0);

  //         expect(await token.balanceOf(addr1Address)).to.equal(initialBalance);
  //     });

  //     it("Should handle zero value approvals correctly", async function () {
  //         const addr1Address = await addr1.getAddress();

  //         await token.approve(addr1Address, 0);

  //         expect(await token.allowance(await owner.getAddress(), addr1Address)).to.equal(0);
  //     });
  // });
});

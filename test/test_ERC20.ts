// filepath: test/token/ERC20.test.ts
import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";

describe("ERC20", function () {
    // Test fixture with contract and signers
    let token: Contract;
    let owner: Signer;
    let addr1: Signer;
    let addr2: Signer;
    let addrs: Signer[];
    
    const name = "Test Token";
    const symbol = "TST";
    const initialSupply = ethers.utils.parseEther("1000");

    // Deploy a concrete implementation of the abstract ERC20 contract before each test
    beforeEach(async function () {
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
        
        // Deploy a test implementation of ERC20
        const ERC20Test = await ethers.getContractFactory("ERC20Test");
        token = await ERC20Test.deploy(name, symbol);
        await token.deployed();
        
        // Mint initial supply to owner
        await token.mint(await owner.getAddress(), initialSupply);
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
            const amount = ethers.utils.parseEther("50");
            const ownerAddress = await owner.getAddress();
            const addr1Address = await addr1.getAddress();
            
            // Transfer from owner to addr1
            await token.transfer(addr1Address, amount);
            
            // Check balances reflect the transfer
            expect(await token.balanceOf(addr1Address)).to.equal(amount);
            expect(await token.balanceOf(ownerAddress)).to.equal(initialSupply.sub(amount));
        });

        it("Should fail if sender doesn't have enough tokens", async function () {
            const initialOwnerBalance = await token.balanceOf(await owner.getAddress());
            const addr1Address = await addr1.getAddress();
            
            // Try to send more tokens than available
            await expect(
                token.connect(addr1).transfer(await owner.getAddress(), 1)
            ).to.be.revertedWith("ERC20InsufficientBalance");
            
            // Owner balance shouldn't have changed
            expect(await token.balanceOf(await owner.getAddress())).to.equal(initialOwnerBalance);
        });

        it("Should update balances after transfers", async function () {
            const amount = ethers.utils.parseEther("100");
            const ownerAddress = await owner.getAddress();
            const addr1Address = await addr1.getAddress();
            const addr2Address = await addr2.getAddress();
            
            // Transfer from owner to addr1
            await token.transfer(addr1Address, amount);
            
            // Transfer from addr1 to addr2
            await token.connect(addr1).transfer(addr2Address, amount.div(2));
            
            // Check balances
            expect(await token.balanceOf(ownerAddress)).to.equal(initialSupply.sub(amount));
            expect(await token.balanceOf(addr1Address)).to.equal(amount.div(2));
            expect(await token.balanceOf(addr2Address)).to.equal(amount.div(2));
        });
    });

    describe("Allowance", function () {
        it("Should update allowance when approve is called", async function () {
            const amount = ethers.utils.parseEther("100");
            const ownerAddress = await owner.getAddress();
            const addr1Address = await addr1.getAddress();
            
            await token.approve(addr1Address, amount);
            
            expect(await token.allowance(ownerAddress, addr1Address)).to.equal(amount);
        });

        it("Should allow transferFrom with sufficient allowance", async function () {
            const amount = ethers.utils.parseEther("100");
            const ownerAddress = await owner.getAddress();
            const addr1Address = await addr1.getAddress();
            const addr2Address = await addr2.getAddress();
            
            await token.approve(addr1Address, amount);
            await token.connect(addr1).transferFrom(ownerAddress, addr2Address, amount);
            
            expect(await token.balanceOf(addr2Address)).to.equal(amount);
            expect(await token.allowance(ownerAddress, addr1Address)).to.equal(0);
        });

        it("Should not decrease allowance for max uint256 approval", async function () {
            const maxAllowance = ethers.constants.MaxUint256;
            const amount = ethers.utils.parseEther("100");
            const ownerAddress = await owner.getAddress();
            const addr1Address = await addr1.getAddress();
            const addr2Address = await addr2.getAddress();
            
            await token.approve(addr1Address, maxAllowance);
            await token.connect(addr1).transferFrom(ownerAddress, addr2Address, amount);
            
            expect(await token.allowance(ownerAddress, addr1Address)).to.equal(maxAllowance);
        });

        it("Should fail when trying to transferFrom more than allowed", async function () {
            const allowance = ethers.utils.parseEther("99");
            const amount = ethers.utils.parseEther("100");
            const ownerAddress = await owner.getAddress();
            const addr1Address = await addr1.getAddress();
            const addr2Address = await addr2.getAddress();
            
            await token.approve(addr1Address, allowance);
            
            await expect(
                token.connect(addr1).transferFrom(ownerAddress, addr2Address, amount)
            ).to.be.revertedWith("ERC20InsufficientAllowance");
        });
    });

    describe("Internal functions", function () {
        it("Should mint tokens correctly", async function () {
            const amount = ethers.utils.parseEther("500");
            const addr1Address = await addr1.getAddress();
            const initialSupply = await token.totalSupply();
            
            await token.mint(addr1Address, amount);
            
            expect(await token.balanceOf(addr1Address)).to.equal(amount);
            expect(await token.totalSupply()).to.equal(initialSupply.add(amount));
        });

        it("Should burn tokens correctly", async function () {
            const amount = ethers.utils.parseEther("200");
            const ownerAddress = await owner.getAddress();
            const initialSupply = await token.totalSupply();
            
            await token.burn(ownerAddress, amount);
            
            expect(await token.balanceOf(ownerAddress)).to.equal(initialSupply.sub(amount));
            expect(await token.totalSupply()).to.equal(initialSupply.sub(amount));
        });

        it("Should fail when minting to the zero address", async function () {
            const amount = ethers.utils.parseEther("100");
            
            await expect(
                token.mint(ethers.constants.AddressZero, amount)
            ).to.be.revertedWith("ERC20InvalidReceiver");
        });

        it("Should fail when burning from the zero address", async function () {
            const amount = ethers.utils.parseEther("100");
            
            await expect(
                token.burn(ethers.constants.AddressZero, amount)
            ).to.be.revertedWith("ERC20InvalidSender");
        });
    });

    describe("Edge cases", function () {
        it("Should fail when transferring to the zero address", async function () {
            const amount = ethers.utils.parseEther("100");
            
            await expect(
                token.transfer(ethers.constants.AddressZero, amount)
            ).to.be.revertedWith("ERC20InvalidReceiver");
        });

        it("Should fail when approving the zero address as spender", async function () {
            const amount = ethers.utils.parseEther("100");
            
            await expect(
                token.approve(ethers.constants.AddressZero, amount)
            ).to.be.revertedWith("ERC20InvalidSpender");
        });

        it("Should handle zero value transfers correctly", async function () {
            const addr1Address = await addr1.getAddress();
            const initialBalance = await token.balanceOf(addr1Address);
            
            await token.transfer(addr1Address, 0);
            
            expect(await token.balanceOf(addr1Address)).to.equal(initialBalance);
        });

        it("Should handle zero value approvals correctly", async function () {
            const addr1Address = await addr1.getAddress();
            
            await token.approve(addr1Address, 0);
            
            expect(await token.allowance(await owner.getAddress(), addr1Address)).to.equal(0);
        });
    });
});
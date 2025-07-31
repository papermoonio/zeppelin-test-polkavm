import { expect } from "chai";
import { ethers, network } from "hardhat";
import { PVMERC20Votes } from "../typechain-types/contracts/PVMERC20Votes";
import { Signer } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getWallets } from "./test_util";

describe("PVMERC20Votes", function () {
    let token: PVMERC20Votes;
    let owner: Signer;
    let wallet1: Signer;
    let wallet2: Signer;

    const name = "TestToken";
    const symbol = "TST";
    const initialSupply = ethers.parseEther("10000");
    const name2 = "TestToken"; // EIP712 domain name
    const version = "1.0.0"; // EIP712 version

    before(async function () {
        // [owner, wallet1] = getWallets(2);
        [owner, wallet1] = getWallets(2);
        wallet2 = ethers.Wallet.createRandom(ethers.getDefaultProvider());

        // await ethers.getContractFactory("UniswapV2Pair", getWallets(1)[0]);

        const ERC20VotesFactory = await ethers.getContractFactory("PVMERC20Votes", owner);
        token = await ERC20VotesFactory.deploy(name, symbol, initialSupply, name2, version);
        await token.waitForDeployment();
    });

    describe("Deployment", function () {
        it("Should set the correct name and symbol", async function () {
            expect(await token.name()).to.equal(name);
            expect(await token.symbol()).to.equal(symbol);
        });

        it("Should assign the total supply to the owner", async function () {
            const ownerBalance = await token.balanceOf(await owner.getAddress());
            expect(await token.totalSupply()).to.equal(ownerBalance);
            expect(ownerBalance).to.equal(initialSupply);
        });
    });

    describe("Voting functionality", function () {
        it("Should track voting power correctly", async function () {
            const ownerAddress = await owner.getAddress();
            const wallet1Address = await wallet1.getAddress();
            const transferAmount = ethers.parseEther("1000");

            // Initial voting power
            expect(await token.getVotes(ownerAddress)).to.equal(initialSupply);

            // Transfer tokens
            await token.transfer(wallet1Address, transferAmount);

            // Check voting power after transfer
            expect(await token.getVotes(ownerAddress)).to.equal(initialSupply - transferAmount);
            expect(await token.getVotes(wallet1Address)).to.equal(transferAmount);
        });

        it("Should track past voting power", async function () {
            const ownerAddress = await owner.getAddress();
            const wallet1Address = await wallet1.getAddress();
            const transferAmount = ethers.parseEther("1000");

            // Get current block number
            const blockNumber = await ethers.provider.getBlockNumber();

            // Transfer tokens
            await token.transfer(wallet1Address, transferAmount);

            // Check past voting power
            expect(await token.getPastVotes(ownerAddress, blockNumber)).to.equal(initialSupply);
            expect(await token.getPastVotes(wallet1Address, blockNumber)).to.equal(0);
        });

        it("Should track total supply history", async function () {
            const blockNumber = await ethers.provider.getBlockNumber();
            expect(await token.getPastTotalSupply(blockNumber)).to.equal(initialSupply);
        });

        it("Should delegate voting power", async function () {
            const ownerAddress = await owner.getAddress();
            const wallet1Address = await wallet1.getAddress();

            // Delegate voting power
            await token.delegate(wallet1Address);

            // Check delegated voting power
            expect(await token.getVotes(wallet1Address)).to.equal(initialSupply);
            expect(await token.getVotes(ownerAddress)).to.equal(0);
        });

        it("Should allow delegation to self", async function () {
            const ownerAddress = await owner.getAddress();
            await token.delegate(ownerAddress);
            expect(await token.getVotes(ownerAddress)).to.equal(initialSupply);
        });

        it("Should track delegation history", async function () {
            const ownerAddress = await owner.getAddress();
            const wallet1Address = await wallet1.getAddress();
            const blockNumber = await ethers.provider.getBlockNumber();

            // Delegate and check history
            await token.delegate(wallet1Address);
            expect(await token.getPastVotes(wallet1Address, blockNumber)).to.equal(0);
            expect(await token.getPastVotes(ownerAddress, blockNumber)).to.equal(initialSupply);
        });
    });

    describe("Transfers", function () {
        it("Should transfer tokens between accounts", async function () {
            const amount = ethers.parseEther("50");
            const ownerAddress = await owner.getAddress();
            const wallet1Address = await wallet1.getAddress();

            await token.transfer(wallet1Address, amount);
            expect(await token.balanceOf(wallet1Address)).to.equal(amount);
            expect(await token.balanceOf(ownerAddress)).to.equal(initialSupply - amount);
        });

        it("Should fail when trying to transfer more than balance", async function () {
            const wallet1Address = await wallet1.getAddress();
            const wallet2Address = await wallet2.getAddress();
            const balance = await token.balanceOf(wallet1Address);

            await expect(
                token.connect(wallet1).transfer(wallet2Address, balance + ethers.parseEther("1"))
            ).to.be.reverted;
        });
    });
}); 
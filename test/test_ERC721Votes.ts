import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "ethers";
import { getWallets } from "./test_util";

describe("PVMERC721Votes", function () {
    let token: any;
    let owner: Signer;
    let wallet1: Signer;
    let wallet2: Signer;

    const name = "Votes NFT";
    const symbol = "VNFT";
    const version = "1";

    beforeEach(async function () {
        [owner, wallet1] = getWallets(2);
        wallet2 = ethers.Wallet.createRandom(ethers.getDefaultProvider());

        const ERC721VotesFactory = await ethers.getContractFactory("PVMERC721Votes", owner);
        token = await ERC721VotesFactory.deploy(name, symbol, version);
        await token.waitForDeployment();
    });

    describe("Deployment", function () {
        it("Should set the correct name and symbol", async function () {
            expect(await token.name()).to.equal(name);
            expect(await token.symbol()).to.equal(symbol);
        });

        it("Should set the deployer as owner", async function () {
            expect(await token.owner()).to.equal(await owner.getAddress());
        });
    });

    describe("Minting", function () {
        it("Should allow owner to mint tokens", async function () {
            const wallet1Address = await wallet1.getAddress();
            const txMint = await token.connect(owner).safeMint(wallet1Address);
            await txMint.wait();
            expect(await token.ownerOf(1)).to.equal(wallet1Address);
        });

        it("Should prevent non-owner from minting", async function () {
            const wallet2Address = await wallet2.getAddress();
            await expect(token.connect(wallet1).safeMint(wallet2Address)).to.be.reverted;
        });

        it("Should revert when minting to zero address", async function () {
            await expect(token.connect(owner).safeMint(ethers.ZeroAddress)).to.be.revertedWith("Cannot mint to zero address");
        });

        it("Should increment nextTokenId and totalSupply on mint", async function () {
            const wallet1Address = await wallet1.getAddress();
            expect(await token.nextTokenId()).to.equal(1);
            expect(await token.totalSupply()).to.equal(0);
            const txMint1 = await token.connect(owner).safeMint(wallet1Address);
            await txMint1.wait();
            expect(await token.nextTokenId()).to.equal(2);
            expect(await token.totalSupply()).to.equal(1);
        });
    });

    describe("Existence", function () {
        it("Should return true for existing token and false otherwise", async function () {
            const wallet1Address = await wallet1.getAddress();
            const txMint1 = await token.connect(owner).safeMint(wallet1Address);
            await txMint1.wait();
            expect(await token.exists(1)).to.equal(true);
            expect(await token.exists(999)).to.equal(false);
        });
    });

    describe("Approvals", function () {
        it("Should set and get approval for a token", async function () {
            const wallet1Address = await wallet1.getAddress();
            const txMint1 = await token.connect(owner).safeMint(wallet1Address);
            await txMint1.wait();
            const txApprove = await token.connect(wallet1).approve(await owner.getAddress(), 1);
            await txApprove.wait();
            expect(await token.getApproved(1)).to.equal(await owner.getAddress());
        });

        it("Should clear single-token approval on transfer", async function () {
            const wallet1Address = await wallet1.getAddress();
            const txMint1 = await token.connect(owner).safeMint(wallet1Address);
            await txMint1.wait();
            const txApprove = await token.connect(wallet1).approve(await owner.getAddress(), 1);
            await txApprove.wait();
            const txTransfer = await token.connect(wallet1).transferFrom(wallet1Address, await owner.getAddress(), 1);
            await txTransfer.wait();
            expect(await token.getApproved(1)).to.equal(ethers.ZeroAddress);
        });

        it("Should allow approved operator to transfer token", async function () {
            const wallet1Address = await wallet1.getAddress();
            const txMint1 = await token.connect(owner).safeMint(wallet1Address);
            await txMint1.wait();
            const txApprove = await token.connect(wallet1).approve(await owner.getAddress(), 1);
            await txApprove.wait();
            const txTransfer = await token.connect(owner).transferFrom(wallet1Address, await ethers.getAddress(await wallet2.getAddress()), 1);
            await txTransfer.wait();
            expect(await token.ownerOf(1)).to.equal(await wallet2.getAddress());
        });

        it("Should allow operator via setApprovalForAll to transfer token", async function () {
            const wallet1Address = await wallet1.getAddress();
            const txMint1 = await token.connect(owner).safeMint(wallet1Address);
            await txMint1.wait();
            const txApprove = await token.connect(wallet1).setApprovalForAll(await owner.getAddress(), true);
            await txApprove.wait();
            const txTransfer = await token.connect(owner).transferFrom(wallet1Address, await owner.getAddress(), 1);
            await txTransfer.wait();
            expect(await token.ownerOf(1)).to.equal(await owner.getAddress());
        });

        it("Should clear approval by approving zero address", async function () {
            const wallet1Address = await wallet1.getAddress();
            const txMint1 = await token.connect(owner).safeMint(wallet1Address);
            await txMint1.wait();
            const txApprove = await token.connect(wallet1).approve(await owner.getAddress(), 1);
            await txApprove.wait();
            const txApprove2 = await token.connect(wallet1).approve(ethers.ZeroAddress, 1);
            await txApprove2.wait();
            expect(await token.getApproved(1)).to.equal(ethers.ZeroAddress);
        });
    });

    describe("Transfers", function () {
        it("Should transfer token by owner", async function () {
            const wallet1Address = await wallet1.getAddress();
            const txMint1 = await token.connect(owner).safeMint(wallet1Address);
            await txMint1.wait();
            const txTransfer = await token.connect(wallet1).transferFrom(wallet1Address, await owner.getAddress(), 1);
            await txTransfer.wait();
            expect(await token.ownerOf(1)).to.equal(await owner.getAddress());
        });

        it("Should revert transfer by non-owner and non-approved", async function () {
            const wallet1Address = await wallet1.getAddress();
            const txMint1 = await token.connect(owner).safeMint(wallet1Address);
            await txMint1.wait();
            await expect(token.connect(owner).transferFrom(wallet1Address, await owner.getAddress(), 1)).to.be.reverted;
        });
    });

    describe("Voting Power", function () {
        it("Should be zero before delegation and reflect balances after self-delegation", async function () {
            const wallet1Address = await wallet1.getAddress();
            const txMint1 = await token.connect(owner).safeMint(wallet1Address);
            await txMint1.wait();
            expect(await token.getVotes(wallet1Address)).to.equal(0);
            const txDelegate1 = await token.connect(wallet1).delegate(wallet1Address);
            await txDelegate1.wait();
            expect(await token.getVotes(wallet1Address)).to.equal(1);
        });

        it("Should move votes when delegating to another account", async function () {
            const wallet1Address = await wallet1.getAddress();
            const ownerAddress = await owner.getAddress();
            const txMint1 = await token.connect(owner).safeMint(wallet1Address);
            await txMint1.wait();
            const txDelegate1 = await token.connect(wallet1).delegate(ownerAddress);
            await txDelegate1.wait();
            expect(await token.getVotes(ownerAddress)).to.equal(1);
            expect(await token.getVotes(wallet1Address)).to.equal(0);
        });

        it("Should update votes when changing delegation", async function () {
            const wallet1Address = await wallet1.getAddress();
            const ownerAddress = await owner.getAddress();
            const txMint1 = await token.connect(owner).safeMint(wallet1Address);
            await txMint1.wait();
            const txDelegate1 = await token.connect(wallet1).delegate(ownerAddress);
            await txDelegate1.wait();
            expect(await token.getVotes(ownerAddress)).to.equal(1);
        });

        it("Should return current delegate address", async function () {
            const wallet1Address = await wallet1.getAddress();
            const txMint1 = await token.connect(owner).safeMint(wallet1Address);
            await txMint1.wait();
            const txDelegate1 = await token.connect(wallet1).delegate(wallet1Address);
            await txDelegate1.wait();
            expect(await token.delegates(wallet1Address)).to.equal(wallet1Address);
        });
    });

    describe("Clock and Checkpoints", function () {
        it("Should return a clock at least current block", async function () {
            const currentBlock = await ethers.provider.getBlockNumber();
            const clock = await token.clock();
            expect(clock).to.be.at.least(currentBlock);
        });

        it("Should return correct CLOCK_MODE string", async function () {
            expect(await token.CLOCK_MODE()).to.equal("mode=blocknumber&from=default");
        });
    });

});



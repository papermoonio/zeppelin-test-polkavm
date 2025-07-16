import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "ethers";

describe("PVMERC721Votes", function () {
    let token: any;
    let owner: Signer;
    let wallet1: Signer;
    let wallet2: Signer;

    const name = "Votes NFT";
    const symbol = "VNFT";
    const version = "1";

    beforeEach(async function () {
        [owner, wallet1] = await ethers.getSigners();
        wallet2 = ethers.Wallet.createRandom(ethers.getDefaultProvider());

        const ERC721VotesFactory = await ethers.getContractFactory("PVMERC721Votes");
        try {
            token = await ERC721VotesFactory.deploy(name, symbol, version);
            await token.waitForDeployment();
        } catch (error) {
            console.error(error);
        }
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
            await token.safeMint(wallet1Address);
            expect(await token.ownerOf(1)).to.equal(wallet1Address);
        });

        it("Should prevent non-owner from minting", async function () {
            const wallet2Address = await wallet2.getAddress();
            await expect(token.connect(wallet1).safeMint(wallet2Address)).to.be.reverted;
        });
    });

    describe("Voting Power", function () {
        beforeEach(async function () {
            // Mint tokens to different addresses
            await token.safeMint(await wallet1.getAddress()); // Token 1
            await token.safeMint(await wallet1.getAddress()); // Token 2
            await token.safeMint(await wallet2.getAddress()); // Token 3
        });

        it("Should track voting power correctly", async function () {
            const wallet1Address = await wallet1.getAddress();
            const wallet2Address = await wallet2.getAddress();

            // Each NFT gives 1 voting power
            expect(await token.getVotes(wallet1Address)).to.equal(2);
            expect(await token.getVotes(wallet2Address)).to.equal(1);
        });

        it("Should update voting power on transfers", async function () {
            const wallet1Address = await wallet1.getAddress();
            const wallet2Address = await wallet2.getAddress();

            // Transfer token 1 from wallet1 to wallet2
            await token.connect(wallet1).transferFrom(wallet1Address, wallet2Address, 1);

            expect(await token.getVotes(wallet1Address)).to.equal(1);
            expect(await token.getVotes(wallet2Address)).to.equal(2);
        });

        it("Should track past voting power", async function () {
            const wallet1Address = await wallet1.getAddress();
            const wallet2Address = await wallet2.getAddress();

            const blockNumber = await ethers.provider.getBlockNumber();

            // Transfer token
            await token.connect(wallet1).transferFrom(wallet1Address, wallet2Address, 1);

            // Check past voting power
            expect(await token.getPastVotes(wallet1Address, blockNumber)).to.equal(2);
            expect(await token.getPastVotes(wallet2Address, blockNumber)).to.equal(1);
        });
    });

    describe("Delegation", function () {
        beforeEach(async function () {
            await token.safeMint(await wallet1.getAddress()); // Token 1
            await token.safeMint(await wallet1.getAddress()); // Token 2
        });

        it("Should allow delegation of voting power", async function () {
            const wallet1Address = await wallet1.getAddress();
            const wallet2Address = await wallet2.getAddress();

            await token.connect(wallet1).delegate(wallet2Address);

            expect(await token.getVotes(wallet1Address)).to.equal(0);
            expect(await token.getVotes(wallet2Address)).to.equal(2);
        });

        it("Should allow self-delegation", async function () {
            const wallet1Address = await wallet1.getAddress();

            await token.connect(wallet1).delegate(wallet1Address);
            expect(await token.getVotes(wallet1Address)).to.equal(2);
        });

        it("Should track delegation changes", async function () {
            const wallet1Address = await wallet1.getAddress();
            const wallet2Address = await wallet2.getAddress();
            const ownerAddress = await owner.getAddress();

            // Initially delegate to wallet2
            await token.connect(wallet1).delegate(wallet2Address);
            expect(await token.getVotes(wallet2Address)).to.equal(2);

            // Change delegation to owner
            await token.connect(wallet1).delegate(ownerAddress);
            expect(await token.getVotes(wallet2Address)).to.equal(0);
            expect(await token.getVotes(ownerAddress)).to.equal(2);
        });

        it("Should track delegates correctly", async function () {
            const wallet1Address = await wallet1.getAddress();
            const wallet2Address = await wallet2.getAddress();

            await token.connect(wallet1).delegate(wallet2Address);
            expect(await token.delegates(wallet1Address)).to.equal(wallet2Address);
        });
    });

    describe("Signature-based Delegation", function () {
        it("Should allow delegation by signature", async function () {
            const wallet1Address = await wallet1.getAddress();
            const wallet2Address = await wallet2.getAddress();

            // Mint token to wallet1
            await token.safeMint(wallet1Address);

            const nonce = await token.nonces(wallet1Address);
            const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

            // Create delegation signature
            const domain = {
                name: name,
                version: version,
                chainId: await ethers.provider.getNetwork().then(n => n.chainId),
                verifyingContract: await token.getAddress()
            };

            const types = {
                Delegation: [
                    { name: "delegatee", type: "address" },
                    { name: "nonce", type: "uint256" },
                    { name: "expiry", type: "uint256" }
                ]
            };

            const value = {
                delegatee: wallet2Address,
                nonce: nonce,
                expiry: deadline
            };

            const signature = await wallet1.signTypedData(domain, types, value);
            const { v, r, s } = ethers.Signature.from(signature);

            await token.delegateBySig(wallet2Address, nonce, deadline, v, r, s);

            expect(await token.delegates(wallet1Address)).to.equal(wallet2Address);
            expect(await token.getVotes(wallet2Address)).to.equal(1);
        });
    });

    describe("Clock and Checkpoints", function () {
        it("Should return current clock", async function () {
            const currentBlock = await ethers.provider.getBlockNumber();
            const clock = await token.clock();
            expect(clock).to.be.at.least(currentBlock);
        });

        it("Should return correct clock mode", async function () {
            expect(await token.CLOCK_MODE()).to.equal("mode=blocknumber&from=default");
        });
    });

    describe("Token Existence", function () {
        beforeEach(async function () {
            await token.safeMint(await wallet1.getAddress()); // Token 1
        });

        it("Should return true for existing tokens", async function () {
            expect(await token.exists(1)).to.be.true;
        });

        it("Should return false for non-existent tokens", async function () {
            expect(await token.exists(999)).to.be.false;
        });
    });

    describe("Standard ERC721 Functionality", function () {
        beforeEach(async function () {
            await token.safeMint(await wallet1.getAddress());
        });

        it("Should transfer tokens correctly", async function () {
            const wallet1Address = await wallet1.getAddress();
            const wallet2Address = await wallet2.getAddress();

            await token.connect(wallet1).transferFrom(wallet1Address, wallet2Address, 1);
            expect(await token.ownerOf(1)).to.equal(wallet2Address);
        });

        it("Should handle approvals correctly", async function () {
            const wallet1Address = await wallet1.getAddress();
            const wallet2Address = await wallet2.getAddress();

            await token.connect(wallet1).approve(wallet2Address, 1);
            expect(await token.getApproved(1)).to.equal(wallet2Address);
        });
    });
}); 
import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "ethers";

describe("PVMERC721Royalty", function () {
    let token: any;
    let owner: Signer;
    let wallet1: Signer;
    let wallet2: Signer;
    let royaltyReceiver: Signer;

    const name = "Royalty NFT";
    const symbol = "RNFT";

    beforeEach(async function () {
        [owner, wallet1, royaltyReceiver] = await ethers.getSigners();
        wallet2 = ethers.Wallet.createRandom(ethers.getDefaultProvider());


        const ERC721RoyaltyFactory = await ethers.getContractFactory("PVMERC721Royalty");
        try {
            token = await ERC721RoyaltyFactory.deploy(name, symbol);
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

        it("Should allow minting with royalty", async function () {
            const wallet1Address = await wallet1.getAddress();
            const royaltyReceiverAddress = await royaltyReceiver.getAddress();
            const royaltyFee = 500; // 5%

            await token.safeMintWithRoyalty(wallet1Address, royaltyReceiverAddress, royaltyFee);

            expect(await token.ownerOf(1)).to.equal(wallet1Address);

            const [receiver, royalty] = await token.royaltyInfo(1, ethers.parseEther("1"));
            expect(receiver).to.equal(royaltyReceiverAddress);
            expect(royalty).to.equal(ethers.parseEther("0.05")); // 5% of 1 ETH
        });

        it("Should prevent non-owner from minting", async function () {
            const wallet2Address = await wallet2.getAddress();
            await expect(token.connect(wallet1).safeMint(wallet2Address)).to.be.reverted;
        });
    });

    describe("Default Royalty", function () {
        it("Should allow owner to set default royalty", async function () {
            const royaltyReceiverAddress = await royaltyReceiver.getAddress();
            const royaltyFee = 250; // 2.5%

            await token.setDefaultRoyalty(royaltyReceiverAddress, royaltyFee);

            // Mint a token
            await token.safeMint(await wallet1.getAddress());

            const [receiver, royalty] = await token.royaltyInfo(1, ethers.parseEther("1"));
            expect(receiver).to.equal(royaltyReceiverAddress);
            expect(royalty).to.equal(ethers.parseEther("0.025")); // 2.5% of 1 ETH
        });

        it("Should prevent setting royalty fee above 100%", async function () {
            const royaltyReceiverAddress = await royaltyReceiver.getAddress();
            const royaltyFee = 10001; // 100.01%

            await expect(
                token.setDefaultRoyalty(royaltyReceiverAddress, royaltyFee)
            ).to.be.reverted;
        });

        it("Should prevent setting royalty receiver to zero address", async function () {
            const royaltyFee = 250;

            await expect(
                token.setDefaultRoyalty(ethers.ZeroAddress, royaltyFee)
            ).to.be.reverted;
        });

        it("Should allow owner to delete default royalty", async function () {
            const royaltyReceiverAddress = await royaltyReceiver.getAddress();
            const royaltyFee = 250;

            await token.setDefaultRoyalty(royaltyReceiverAddress, royaltyFee);
            await token.deleteDefaultRoyalty();

            // Mint a token
            await token.safeMint(await wallet1.getAddress());

            const [receiver, royalty] = await token.royaltyInfo(1, ethers.parseEther("1"));
            expect(receiver).to.equal(ethers.ZeroAddress);
            expect(royalty).to.equal(0);
        });
    });

    describe("Token-specific Royalty", function () {
        beforeEach(async function () {
            await token.safeMint(await wallet1.getAddress()); // Token 1
        });

        it("Should allow owner to set token-specific royalty", async function () {
            const royaltyReceiverAddress = await royaltyReceiver.getAddress();
            const royaltyFee = 750; // 7.5%

            await token.setTokenRoyalty(1, royaltyReceiverAddress, royaltyFee);

            const [receiver, royalty] = await token.royaltyInfo(1, ethers.parseEther("1"));
            expect(receiver).to.equal(royaltyReceiverAddress);
            expect(royalty).to.equal(ethers.parseEther("0.075")); // 7.5% of 1 ETH
        });

        it("Should override default royalty with token-specific royalty", async function () {
            const defaultReceiverAddress = await wallet1.getAddress();
            const tokenReceiverAddress = await royaltyReceiver.getAddress();

            // Set default royalty
            await token.setDefaultRoyalty(defaultReceiverAddress, 250); // 2.5%

            // Set token-specific royalty
            await token.setTokenRoyalty(1, tokenReceiverAddress, 750); // 7.5%

            const [receiver, royalty] = await token.royaltyInfo(1, ethers.parseEther("1"));
            expect(receiver).to.equal(tokenReceiverAddress);
            expect(royalty).to.equal(ethers.parseEther("0.075")); // 7.5% of 1 ETH
        });

        it("Should allow owner to reset token royalty", async function () {
            const defaultReceiverAddress = await wallet1.getAddress();
            const tokenReceiverAddress = await royaltyReceiver.getAddress();

            // Set default royalty
            await token.setDefaultRoyalty(defaultReceiverAddress, 250); // 2.5%

            // Set token-specific royalty
            await token.setTokenRoyalty(1, tokenReceiverAddress, 750); // 7.5%

            // Reset token royalty
            await token.resetTokenRoyalty(1);

            // Should fall back to default royalty
            const [receiver, royalty] = await token.royaltyInfo(1, ethers.parseEther("1"));
            expect(receiver).to.equal(defaultReceiverAddress);
            expect(royalty).to.equal(ethers.parseEther("0.025")); // 2.5% of 1 ETH
        });

        it("Should prevent setting royalty for non-existent token", async function () {
            const royaltyReceiverAddress = await royaltyReceiver.getAddress();

            await expect(
                token.setTokenRoyalty(999, royaltyReceiverAddress, 250)
            ).to.be.reverted;
        });
    });

    describe("Interface Support", function () {
        it("Should support ERC2981 interface", async function () {
            // ERC2981 interface ID
            expect(await token.supportsInterface("0x2a55205a")).to.be.true;
        });

        it("Should support ERC721 interface", async function () {
            // ERC721 interface ID
            expect(await token.supportsInterface("0x80ac58cd")).to.be.true;
        });
    });

    describe("Access Control", function () {
        it("Should prevent non-owner from setting default royalty", async function () {
            const royaltyReceiverAddress = await royaltyReceiver.getAddress();

            await expect(
                token.connect(wallet1).setDefaultRoyalty(royaltyReceiverAddress, 250)
            ).to.be.reverted;
        });

        it("Should prevent non-owner from setting token royalty", async function () {
            await token.safeMint(await wallet1.getAddress());
            const royaltyReceiverAddress = await royaltyReceiver.getAddress();

            await expect(
                token.connect(wallet1).setTokenRoyalty(1, royaltyReceiverAddress, 250)
            ).to.be.reverted;
        });
    });
}); 
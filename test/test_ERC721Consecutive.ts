import { expect } from "chai";
import { ethers } from "hardhat";
import { PVMERC721Consecutive } from "../typechain-types/contracts/PVMERC721Consecutive";
import { Signer } from "ethers";
import { getWallets } from "./test_util";

describe("PVMERC721Consecutive", function () {
    let token: PVMERC721Consecutive;
    let owner: Signer;
    let wallet1: Signer;
    let wallet2: Signer;

    const name = "Consecutive NFT";
    const symbol = "CNFT";

    beforeEach(async function () {
        [owner, wallet1] = getWallets(2);

        const ERC721ConsecutiveFactory = await ethers.getContractFactory("PVMERC721Consecutive");
        try {
            token = await ERC721ConsecutiveFactory.deploy(name, symbol);
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

        it("Should start with next token ID as 1", async function () {
            expect(await token.nextTokenId()).to.equal(1);
        });

        it("Should start with total supply of 0", async function () {
            expect(await token.totalSupply()).to.equal(0);
        });
    });
}); 
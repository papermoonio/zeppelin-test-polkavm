import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "ethers";

import { PVMERC1155 } from "../typechain-types/contracts/PVMERC1155";
import { getWallets } from "./test_util";

describe("ERC1155", function () {
    let token: PVMERC1155;
    let owner: Signer;
    let wallet1: Signer;
    let wallet2: Signer;

    const uri = "https://api.example.com/metadata/{id}.json";

    beforeEach(async function () {
        [owner, wallet1] = getWallets(2);

        try {
            const ERC1155Factory = await ethers.getContractFactory("PVMERC1155", owner);
            token = await ERC1155Factory.deploy(uri);
            await token.waitForDeployment();
        } catch (error) {
            console.error(error);
        }
    });

    describe("Deployment", function () {
        it("Should set the correct URI", async function () {
            expect(await token.uri(1)).to.equal(uri);
        });

        it("Should set the deployer as owner", async function () {
            expect(await token.owner()).to.equal(await owner.getAddress());
        });

        it("Should start with zero total supply for all token IDs", async function () {
            expect(await token.totalSupply(1)).to.equal(0);
            expect(await token.totalSupply(2)).to.equal(0);
        });

        it("Should return false for exists on unminted tokens", async function () {
            expect(await token.exists(1)).to.be.false;
            expect(await token.exists(2)).to.be.false;
        });
    });
}); 
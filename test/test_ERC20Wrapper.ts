import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "ethers";
import { PVMERC20 } from "../typechain-types/PVMERC20";
import { PVMERC20Wrapper } from "../typechain-types/PVMERC20Wrapper";

describe("PVMERC20Wrapper", function () {
    let wrapper: PVMERC20Wrapper;
    let underlying: PVMERC20;
    let owner: Signer;
    let wallet1: Signer;
    let user: Signer;

    const name = "Wrapped Token";
    const symbol = "WTKN";
    const initialSupply = ethers.parseEther("10000");

    beforeEach(async function () {
        [owner, wallet1] = await ethers.getSigners();
        user = ethers.Wallet.createRandom(ethers.getDefaultProvider());

        // Deploy a mock ERC20 as the underlying token
        const ERC20Factory = await ethers.getContractFactory("PVMERC20");
        underlying = await ERC20Factory.deploy("Underlying", "UND", initialSupply);
        await underlying.waitForDeployment();

        // Deploy the wrapper contract
        const WrapperFactory = await ethers.getContractFactory("PVMERC20Wrapper");
        wrapper = await WrapperFactory.deploy(underlying.getAddress(), name, symbol);
        await wrapper.waitForDeployment();

        // Transfer some underlying tokens to user
        await underlying.transfer(await wallet1.getAddress(), ethers.parseEther("1000"));
    });

    it("Should wrap (deposit) underlying tokens", async function () {
        const depositAmount = ethers.parseEther("100");
        await underlying.connect(wallet1).approve(wrapper.getAddress(), depositAmount);

        await expect(wrapper.connect(wallet1).depositFor(await user.getAddress(), depositAmount))
            .to.emit(wrapper, "Transfer")
            .withArgs(ethers.ZeroAddress, await user.getAddress(), depositAmount);

        expect(await wrapper.balanceOf(await user.getAddress())).to.equal(depositAmount);
        expect(await underlying.balanceOf(await wrapper.getAddress())).to.equal(depositAmount);
    });

    it("Should unwrap (withdraw) wrapped tokens", async function () {
        const depositAmount = ethers.parseEther("100");
        console.log(await underlying.balanceOf(await owner.getAddress()))

        await underlying.connect(owner).approve(wrapper.getAddress(), depositAmount);

        await wrapper.connect(owner).depositFor(await wallet1.getAddress(), depositAmount)
        await wrapper.connect(wallet1).withdrawTo(await owner.getAddress(), depositAmount);

        expect(await wrapper.balanceOf(await wallet1.getAddress())).to.equal(0);
    });

});
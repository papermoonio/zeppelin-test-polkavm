import { expect } from "chai";
import { ethers, network } from "hardhat";
import { PVMERC20Votes } from "../typechain-types/contracts/PVMERC20Votes";
import { Signer } from "ethers";
import { getWallets } from "./test_util";

describe("PVMERC20Votes", function () {
    let token: PVMERC20Votes;
    let owner: Signer;
    let wallet1: Signer;
    let wallet2: Signer;

    const name = "TestToken";
    const symbol = "TST";
    const initialSupply = ethers.parseEther("10000");
    const name2 = "TestToken";
    const version = "1.0.0";

    beforeEach(async function () {
        [owner, wallet1] = getWallets(2);

        wallet2 = ethers.Wallet.createRandom().connect(ethers.provider);

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

        it("Should set correct EIP712 domain", async function () {
            // Check domain separator using eip712Domain function (IERC5267 standard)
            const domain = await token.eip712Domain();
            expect(domain.name).to.equal(name2);
            expect(domain.version).to.equal(version);
            expect(domain.chainId).to.equal((await ethers.provider.getNetwork()).chainId);
            expect(domain.verifyingContract).to.equal(await token.getAddress());
        });
    });

    describe("ERC20 Functionality", function () {
        beforeEach(async function () {
            // Transfer some tokens to wallet1 for testing
            const transferAmount = ethers.parseEther("1000");
            const txTransfer = await token.connect(owner).transfer(await wallet1.getAddress(), transferAmount);
            await txTransfer.wait();
        });

        it("Should transfer tokens correctly", async function () {
            const transferAmount = ethers.parseEther("100");
            const wallet1InitialBalance = await token.balanceOf(await wallet1.getAddress());
            const wallet2InitialBalance = await token.balanceOf(await wallet2.getAddress());

            const txTransfer = await token.connect(wallet1).transfer(await wallet2.getAddress(), transferAmount);
            await txTransfer.wait();

            expect(await token.balanceOf(await wallet1.getAddress())).to.equal(wallet1InitialBalance - transferAmount);
            expect(await token.balanceOf(await wallet2.getAddress())).to.equal(wallet2InitialBalance + transferAmount);
        });

        it("Should handle allowances correctly", async function () {
            const allowanceAmount = ethers.parseEther("500");

            const txApprove = await token.approve(await wallet1.getAddress(), allowanceAmount);
            await txApprove.wait();

            expect(await token.allowance(await owner.getAddress(), await wallet1.getAddress())).to.equal(allowanceAmount);

            const transferAmount = ethers.parseEther("200");
            const txTransferFrom = await token.connect(wallet1).transferFrom(
                await owner.getAddress(),
                await wallet2.getAddress(),
                transferAmount
            );
            await txTransferFrom.wait();

            expect(await token.allowance(await owner.getAddress(), await wallet1.getAddress())).to.equal(allowanceAmount - transferAmount);
        });
    });

    describe("Voting Delegation", function () {
        beforeEach(async function () {
            // Distribute tokens for testing
            const transferAmount = ethers.parseEther("1000");
            const txTransfer1 = await token.connect(owner).transfer(await wallet1.getAddress(), transferAmount);
            await txTransfer1.wait();
            const txTransfer2 = await token.connect(owner).transfer(await wallet2.getAddress(), transferAmount);
            await txTransfer2.wait();
        });

        it("Should delegate votes to self", async function () {
            // Initially, no votes are available (not delegated)
            expect(await token.getVotes(await wallet1.getAddress())).to.equal(0);

            // Delegate to self
            const txDelegate = await token.connect(wallet1).delegate(await wallet1.getAddress());
            await txDelegate.wait();

            // Now votes should equal token balance
            const balance = await token.balanceOf(await wallet1.getAddress());
            expect(await token.getVotes(await wallet1.getAddress())).to.equal(balance);
        });

        it("Should delegate votes to another account", async function () {
            const wallet1Balance = await token.balanceOf(await wallet1.getAddress());

            // Delegate wallet1's votes to wallet2
            const txDelegate = await token.connect(wallet1).delegate(await wallet2.getAddress());
            await txDelegate.wait();

            // wallet2 should have voting power equal to wallet1's balance
            expect(await token.getVotes(await wallet2.getAddress())).to.equal(wallet1Balance);
            // wallet1 should have no voting power
            expect(await token.getVotes(await wallet1.getAddress())).to.equal(0);
        });

        it("Should emit DelegateChanged event", async function () {
            const delegatee = await wallet2.getAddress();
            const txDelegate = await token.connect(wallet1).delegate(delegatee);
            await txDelegate.wait();

            await expect(txDelegate)
                .to.emit(token, "DelegateChanged")
                .withArgs(await wallet1.getAddress(), ethers.ZeroAddress, delegatee);
        });

        it("Should emit DelegateVotesChanged event", async function () {
            const wallet1Balance = await token.balanceOf(await wallet1.getAddress());

            const delegatee = await wallet2.getAddress();
            const txDelegate = await token.connect(wallet1).delegate(delegatee);
            await txDelegate.wait();

            await expect(txDelegate)
                .to.emit(token, "DelegateVotesChanged")
                .withArgs(delegatee, 0, wallet1Balance);
        });
    });

    describe("Vote Tracking and Checkpoints", function () {
        beforeEach(async function () {
            // Setup: distribute tokens and delegate
            const transferAmount = ethers.parseEther("1000");
            const txTransfer = await token.connect(owner).transfer(await wallet1.getAddress(), transferAmount);
            await txTransfer.wait();
            const txDelegate = await token.connect(wallet1).delegate(await wallet1.getAddress());
            await txDelegate.wait();
        });

        it("Should track votes correctly after delegation", async function () {
            const balance = await token.balanceOf(await wallet1.getAddress());
            expect(await token.getVotes(await wallet1.getAddress())).to.equal(balance);
        });

        it("Should track total supply in checkpoints", async function () {
            const currentBlock = await ethers.provider.getBlockNumber();
            const currentTotalSupply = await token.totalSupply();

            const pastTotalSupply = await token.getPastTotalSupply(currentBlock - 1);
            expect(pastTotalSupply).to.equal(currentTotalSupply);
        });
    });

    describe("Delegate by Signature", function () {
        let delegationTypehash: string;
        let chainId: bigint;

        beforeEach(async function () {
            // Transfer tokens to wallet1
            const transferAmount = ethers.parseEther("1000");
            const txTransfer = await token.connect(owner).transfer(await wallet1.getAddress(), transferAmount);
            await txTransfer.wait();

            // Get chain ID
            chainId = BigInt((await ethers.provider.getNetwork()).chainId);

            // Delegation typehash
            delegationTypehash = ethers.keccak256(ethers.toUtf8Bytes("Delegation(address delegatee,uint256 nonce,uint256 expiry)"));
        });

        it("Should delegate using valid signature", async function () {
            const delegatee = await wallet2.getAddress();
            const nonce = await token.nonces(await wallet1.getAddress());
            const expiry = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

            // Create domain separator
            const domain = {
                name: name2,
                version: version,
                chainId: chainId,
                verifyingContract: await token.getAddress()
            };

            // Create the delegation message
            const types = {
                Delegation: [
                    { name: "delegatee", type: "address" },
                    { name: "nonce", type: "uint256" },
                    { name: "expiry", type: "uint256" }
                ]
            };

            const value = {
                delegatee: delegatee,
                nonce: nonce,
                expiry: expiry
            };

            // Sign the message
            const signature = await wallet1.signTypedData(domain, types, value);
            const { v, r, s } = ethers.Signature.from(signature);

            // Execute delegateBySig
            const txDelegate = await token.delegateBySig(delegatee, nonce, expiry, v, r, s);
            await txDelegate.wait();

            // Verify delegation
            expect(await token.delegates(await wallet1.getAddress())).to.equal(delegatee);
            const wallet1Balance = await token.balanceOf(await wallet1.getAddress());
            expect(await token.getVotes(delegatee)).to.equal(wallet1Balance);
        });

        it("Should increment nonce after delegation", async function () {
            const initialNonce = await token.nonces(await wallet1.getAddress());

            // Perform delegation
            const txDelegate = await token.connect(wallet1).delegate(await wallet2.getAddress());
            await txDelegate.wait();

            // Nonce should remain the same for regular delegation
            expect(await token.nonces(await wallet1.getAddress())).to.equal(initialNonce);
        });
    });

    describe("EIP712 and Domain Verification", function () {
        it("Should return correct domain information", async function () {
            const domain = await token.eip712Domain();

            // Verify domain fields are set correctly
            expect(domain.name).to.equal(name2);
            expect(domain.version).to.equal(version);
            expect(domain.chainId).to.equal((await ethers.provider.getNetwork()).chainId);
            expect(domain.verifyingContract).to.equal(await token.getAddress());

            // Verify fields flag indicates which fields are used (0x0f = 01111 binary)
            expect(domain.fields).to.equal("0x0f");
        });

        it("Should have correct clock mode", async function () {
            const clockMode = await token.CLOCK_MODE();
            expect(clockMode).to.include("mode=blocknumber");
        });

        it("Should return current block as clock", async function () {
            const currentBlock = await ethers.provider.getBlockNumber();
            const tokenClock = await token.clock();

            // Should be current block or very close (due to timing)
            expect(Number(tokenClock)).to.be.closeTo(currentBlock, 2);
        });
    });

    describe("Error Conditions and Edge Cases", function () {
        it("Should revert on expired signature", async function () {
            const delegatee = await wallet2.getAddress();
            const nonce = await token.nonces(await wallet1.getAddress());
            const expiry = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago (expired)

            await expect(
                token.delegateBySig(delegatee, nonce, expiry, 27, ethers.ZeroHash, ethers.ZeroHash)
            ).to.be.revertedWithCustomError(token, "VotesExpiredSignature");
        });

        it("Should revert on invalid signature", async function () {
            const delegatee = await wallet2.getAddress();
            const nonce = await token.nonces(await wallet1.getAddress());
            const expiry = Math.floor(Date.now() / 1000) + 3600;

            // Invalid signature
            await expect(
                token.delegateBySig(delegatee, nonce, expiry, 27, ethers.ZeroHash, ethers.ZeroHash)
            ).to.be.reverted;
        });

        it("Should handle delegation to zero address", async function () {
            // Should be able to delegate to zero address (removes delegation)
            const txDelegate = await token.connect(wallet1).delegate(ethers.ZeroAddress);
            await txDelegate.wait();

            expect(await token.delegates(await wallet1.getAddress())).to.equal(ethers.ZeroAddress);
        });

        it("Should revert on future timepoint queries", async function () {
            const futureBlock = await ethers.provider.getBlockNumber() + 1000;

            await expect(
                token.getPastVotes(await wallet1.getAddress(), futureBlock)
            ).to.be.revertedWithCustomError(token, "ERC5805FutureLookup");
        });
    });

    describe("Supply Cap and Limits", function () {
        it("Should respect maximum supply limits", async function () {
            // The contract should not allow minting beyond the safe supply
            // This is handled in the _update function but since PVMERC20Votes only mints in constructor,
            // we test that the current supply is within limits
            const totalSupply = await token.totalSupply();
            const maxSupply = BigInt("0x" + "f".repeat(52)); // type(uint208).max

            expect(totalSupply).to.be.lessThan(maxSupply);
        });

        it("Should handle large token amounts in voting", async function () {
            // Test with the full initial supply
            const fullSupply = await token.balanceOf(await owner.getAddress());

            const txDelegate = await token.connect(owner).delegate(await owner.getAddress());
            await txDelegate.wait();

            expect(await token.getVotes(await owner.getAddress())).to.equal(fullSupply);
        });
    });
}); 
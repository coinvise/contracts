import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber, Signer } from "ethers";
import hre, { ethers } from "hardhat";
import { FWBFestAttendanceNFT } from "../../../src/types/FWBFestAttendanceNFT";
import { unitFixtureFWBFest } from "../../shared/fixtures";
import { getSignature, getTypedMessage } from "../../shared/utils";

export function unitTestFWBFest(): void {
  describe("FWBFest", function () {
    let fwbTokenDeployer: Signer;
    let fwbToken: FWBFestAttendanceNFT;
    let trustee: Signer;

    beforeEach(async function () {
      const fixture = await this.loadFixture(unitFixtureFWBFest);
      ({ fwbTokenDeployer, fwbToken, trustee } = fixture);
    });

    async function getBalance(token: FWBFestAttendanceNFT, signer: Signer) {
      const address = await signer.getAddress();
      return token.balanceOf(address);
    }

    function assertIncreasedByOne(before: BigNumber, after: BigNumber) {
      return expect(after.toNumber() - before.toNumber()).to.be.eql(1);
    }

    async function getClaimSignature(claimer: SignerWithAddress) {
      return getSignature(trustee, claimer.address);
    }

    async function claimTx(claimer: SignerWithAddress) {
      const { r, s, v } = await getClaimSignature(claimer);
      return await fwbToken.connect(claimer).claim(r, s, v);
    }

    describe("mint", function () {
      it("should mint a new token when msgSender() is owner", async function () {
        const balanceBefore = await getBalance(fwbToken, fwbTokenDeployer);
        await (await fwbToken.connect(fwbTokenDeployer).mint()).wait();
        const balanceAfter = await getBalance(fwbToken, fwbTokenDeployer);

        assertIncreasedByOne(balanceBefore, balanceAfter);
      });

      it("should not allow non owners to mint", async function () {
        await expect(fwbToken.connect(this.signers.alice).mint()).to.be.reverted;
      });
    });

    describe("isClaimed", function () {
      it("should return false for users who did not claim", async function () {
        expect(await fwbToken.isClaimed(this.signers.alice.address)).to.be.false;
      });

      it("should return true for users who already claimed", async function () {
        await (await claimTx(this.signers.alice)).wait();
        expect(await fwbToken.isClaimed(this.signers.alice.address)).to.be.true;
      });
    });

    describe("tokenURI", function () {
      beforeEach(async function () {
        await (await claimTx(this.signers.alice)).wait();
      });

      it("should return string", async function () {
        expect(await fwbToken.tokenURI(1)).to.be.string;
      });

      it("should revert when tokenId does not exist", async function () {
        await expect(fwbToken.tokenURI(2)).to.be.reverted;
      });
    });

    describe("claim", function () {
      it("should mint a new token when called from eligible user", async function () {
        const balanceBefore = await getBalance(fwbToken, this.signers.alice);
        await (await claimTx(this.signers.alice)).wait();
        const balanceAfter = await getBalance(fwbToken, this.signers.alice);

        assertIncreasedByOne(balanceBefore, balanceAfter);
      });

      it("should emit Claim event", async function () {
        await expect(claimTx(this.signers.alice)).to.emit(fwbToken, "Claim").withArgs(this.signers.alice.address, 1);
        await expect(claimTx(this.signers.bob)).to.emit(fwbToken, "Claim").withArgs(this.signers.bob.address, 2);
      });

      it("should revert with AlreadyClaimed when double claimed", async function () {
        await (await claimTx(this.signers.alice)).wait();
        await expect(claimTx(this.signers.alice)).to.be.revertedWith("AlreadyClaimed");
      });

      it("should revert when signature is invalid", async function () {
        const { r, s, v } = await getSignature(trustee, this.signers.alice.address);
        await expect(fwbToken.connect(this.signers.bob).claim(r, s, v)).to.be.revertedWith("InvalidAddress");
      });

      context("MetaTransaction", function () {
        it("should be able to claim using meta tx", async function () {
          const signer = this.signers.alice;
          const claimSignature = await getClaimSignature(signer);
          const nonce = await fwbToken.getNonce(signer.address);
          const functionSignature = fwbToken.interface.encodeFunctionData("claim", [
            claimSignature.r,
            claimSignature.s,
            claimSignature.v,
          ]);
          const typedMessage = getTypedMessage({
            nonce,
            userAddress: signer.address,
            contractAddress: fwbToken.address,
            chainId: hre.network.config.chainId as number,
            domainName: "FWBFest",
            domainVersion: "1.0.0",
            functionSignature,
          });

          const rawSignature: string = await hre.network.provider.send("eth_signTypedData_v4", [
            signer.address,
            typedMessage,
          ]);
          const { r, s, v } = ethers.utils.splitSignature(rawSignature);

          const balanceBefore = await getBalance(fwbToken, signer);

          await expect(fwbToken.connect(signer).executeMetaTransaction(signer.address, functionSignature, r, s, v))
            .to.emit(fwbToken, "Claim")
            .withArgs(signer.address, 1);

          const balanceAfter = await getBalance(fwbToken, signer);

          assertIncreasedByOne(balanceBefore, balanceAfter);
        });
      });
    });
  });
}

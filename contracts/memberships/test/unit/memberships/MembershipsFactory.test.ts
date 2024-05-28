import { AddressZero } from "@ethersproject/constants";
import { expect } from "chai";
import { Wallet } from "ethers";
import { FEE_BPS, FEE_TREASURY } from "../../../helpers/constants";
import { deployMembershipsFactory } from "../../shared/deployers";
import { unitFixtureMembershipsFactory } from "../../shared/fixtures";

export function unitTestMembershipsFactory(): void {
  describe("MembershipsFactory", function () {
    beforeEach(async function () {
      const { memberships, membershipsFactory, erc20Token } = await this.loadFixture(unitFixtureMembershipsFactory);
      this.mocks.memberships = memberships;
      this.contracts.membershipsFactory = membershipsFactory;
      this.mocks.erc20Token = erc20Token;
    });

    describe("deploy", function () {
      it("should revert with InvalidFeeTreasury() if _feeTreasury is zero address", async function () {
        await expect(deployMembershipsFactory(this.signers.alice, 0, AddressZero)).to.be.revertedWith(
          "InvalidFeeTreasury",
        );
      });

      it("should set state", async function () {
        expect(await this.contracts.membershipsFactory.membershipsLatestVersion()).to.equal(0);
        expect(await this.contracts.membershipsFactory.feeBPS()).to.equal(FEE_BPS);
        expect(await this.contracts.membershipsFactory.feeTreasury()).to.equal(FEE_TREASURY);
        expect(await this.contracts.membershipsFactory.membershipsImpls(0)).to.equal(AddressZero);
        expect(await this.contracts.membershipsFactory.membershipsImpls(1)).to.equal(AddressZero);
      });
    });

    describe("setMembershipsImplAddress()", function () {
      it("should revert if non-owner tries to setMembershipsImplAddress()", async function () {
        const randomAddress = Wallet.createRandom().address;
        await expect(
          this.contracts.membershipsFactory.connect(this.signers.bob).setMembershipsImplAddress(1, randomAddress),
        ).to.be.revertedWith("Ownable: caller is not the owner");
      });

      it("should revert with InvalidMemberships() if _memberships is zero address", async function () {
        await expect(
          this.contracts.membershipsFactory.connect(this.signers.alice).setMembershipsImplAddress(1, AddressZero),
        ).to.be.revertedWith("InvalidMemberships");
      });

      it("should emit MembershipsImplSet()", async function () {
        const randomAddress = Wallet.createRandom().address;
        await expect(
          this.contracts.membershipsFactory.connect(this.signers.alice).setMembershipsImplAddress(1, randomAddress),
        )
          .to.emit(this.contracts.membershipsFactory, "MembershipsImplSet")
          .withArgs(1, randomAddress);
      });

      it("should set memberships implementation for version", async function () {
        expect(await this.contracts.membershipsFactory.membershipsImpls(0)).to.equal(AddressZero);
        expect(await this.contracts.membershipsFactory.membershipsLatestVersion()).to.equal(0);

        let randomAddress = Wallet.createRandom().address;
        await this.contracts.membershipsFactory.connect(this.signers.alice).setMembershipsImplAddress(1, randomAddress);
        expect(await this.contracts.membershipsFactory.membershipsImpls(1)).to.equal(randomAddress);
        expect(await this.contracts.membershipsFactory.membershipsLatestVersion()).to.equal(1);

        randomAddress = Wallet.createRandom().address;
        await this.contracts.membershipsFactory.connect(this.signers.alice).setMembershipsImplAddress(2, randomAddress);
        expect(await this.contracts.membershipsFactory.membershipsImpls(2)).to.equal(randomAddress);
        expect(await this.contracts.membershipsFactory.membershipsLatestVersion()).to.equal(2);

        randomAddress = Wallet.createRandom().address;
        await this.contracts.membershipsFactory.connect(this.signers.alice).setMembershipsImplAddress(3, randomAddress);
        expect(await this.contracts.membershipsFactory.membershipsImpls(3)).to.equal(randomAddress);
        expect(await this.contracts.membershipsFactory.membershipsLatestVersion()).to.equal(3);

        randomAddress = Wallet.createRandom().address;
        await this.contracts.membershipsFactory.connect(this.signers.alice).setMembershipsImplAddress(2, randomAddress);
        // Overwrite version 2
        expect(await this.contracts.membershipsFactory.membershipsImpls(2)).to.equal(randomAddress);
        // Latest version should still be 3
        expect(await this.contracts.membershipsFactory.membershipsLatestVersion()).to.equal(3);
      });
    });

    describe("setFeeBPS()", function () {
      it("should revert if non-owner tries to setFeeBPS()", async function () {
        const newFeeBPS = 500; // 5% = 500 bps
        await expect(
          this.contracts.membershipsFactory.connect(this.signers.bob).setFeeBPS(newFeeBPS),
        ).to.be.revertedWith("Ownable: caller is not the owner");
      });

      it("should emit FeeBPSSet()", async function () {
        const newFeeBPS = 500; // 5% = 500 bps
        await expect(this.contracts.membershipsFactory.connect(this.signers.alice).setFeeBPS(newFeeBPS))
          .to.emit(this.contracts.membershipsFactory, "FeeBPSSet")
          .withArgs(FEE_BPS, newFeeBPS);
      });

      it("should set feeBPS", async function () {
        const newFeeBPS = 500; // 5% = 500 bps
        await this.contracts.membershipsFactory.connect(this.signers.alice).setFeeBPS(newFeeBPS);

        expect(await this.contracts.membershipsFactory.feeBPS()).to.equal(newFeeBPS);
      });
    });

    describe("setFeeTreasury()", function () {
      it("should revert if non-owner tries to setFeeTreasury()", async function () {
        const randomAddress = Wallet.createRandom().address;
        await expect(
          this.contracts.membershipsFactory.connect(this.signers.bob).setFeeTreasury(randomAddress),
        ).to.be.revertedWith("Ownable: caller is not the owner");
      });

      it("should revert with InvalidFeeTreasury() if _feeTreasury is zero address", async function () {
        await expect(
          this.contracts.membershipsFactory.connect(this.signers.alice).setFeeTreasury(AddressZero),
        ).to.be.revertedWith("InvalidFeeTreasury");
      });

      it("should emit FeeTreasurySet()", async function () {
        const randomAddress = Wallet.createRandom().address;
        await expect(this.contracts.membershipsFactory.connect(this.signers.alice).setFeeTreasury(randomAddress))
          .to.emit(this.contracts.membershipsFactory, "FeeTreasurySet")
          .withArgs(FEE_TREASURY, randomAddress);
      });
    });
  });
}

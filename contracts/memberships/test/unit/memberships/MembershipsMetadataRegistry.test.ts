import { expect } from "chai";
import { Wallet } from "ethers";
import { MEMBERSHIPS_BASE_URI } from "../../../helpers/constants";
import { unitFixtureMembershipsMetadataRegistry } from "../../shared/fixtures";

export function unitTestMembershipsMetadataRegistry(): void {
  describe("MembershipsMetadataRegistry", function () {
    beforeEach(async function () {
      const { membershipsMetadataRegistry } = await this.loadFixture(unitFixtureMembershipsMetadataRegistry);
      this.contracts.membershipsMetadataRegistry = membershipsMetadataRegistry;
    });

    describe("setBaseTokenURI()", function () {
      it("should set baseTokenURI for membershipsProxy", async function () {
        const randomAddress = Wallet.createRandom().address;
        const baseTokenURIBeforeChange = await this.contracts.membershipsMetadataRegistry.baseTokenURI(randomAddress);
        expect(baseTokenURIBeforeChange).to.equal("");

        await this.contracts.membershipsMetadataRegistry
          .connect(this.signers.alice)
          .setBaseTokenURI(randomAddress, MEMBERSHIPS_BASE_URI);

        const baseTokenURIAfterChange = await this.contracts.membershipsMetadataRegistry.baseTokenURI(randomAddress);
        expect(baseTokenURIAfterChange).to.equal(MEMBERSHIPS_BASE_URI);
      });

      it("should revert if non-owner tries to setBaseTokenURI()", async function () {
        const randomAddress = Wallet.createRandom().address;
        await expect(
          this.contracts.membershipsMetadataRegistry
            .connect(this.signers.bob)
            .setBaseTokenURI(randomAddress, MEMBERSHIPS_BASE_URI),
        ).to.be.revertedWith("Ownable: caller is not the owner");
      });
    });

    describe("baseTokenURI()", function () {
      it("should return baseTokenURI set for membershipsProxy", async function () {
        const randomAddress = Wallet.createRandom().address;
        await this.contracts.membershipsMetadataRegistry
          .connect(this.signers.alice)
          .setBaseTokenURI(randomAddress, MEMBERSHIPS_BASE_URI);

        const baseTokenURI = await this.contracts.membershipsMetadataRegistry.baseTokenURI(randomAddress);
        expect(baseTokenURI).to.equal(MEMBERSHIPS_BASE_URI);
      });
    });
  });
}

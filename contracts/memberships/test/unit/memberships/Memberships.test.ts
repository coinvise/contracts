import { expect } from "chai";
import { unitFixtureMemberships } from "../../shared/fixtures";
import {
  ETH_ADDRESS,
  MEMBERSHIPS_BASE_URI,
  MEMBERSHIPS_CONTRACT_URI,
  MEMBERSHIPS_NAME,
  MEMBERSHIPS_SYMBOL,
  SECONDS_PER_DAY,
} from "../../../helpers/constants";
import { parseEther } from "ethers/lib/utils";

export function unitTestMemberships(): void {
  describe("Memberships", function () {
    beforeEach(async function () {
      const { memberships, membershipsFactory, erc20Token } = await this.loadFixture(unitFixtureMemberships);
      this.contracts.memberships = memberships;
      this.mocks.membershipsFactory = membershipsFactory;
      this.mocks.erc20Token = erc20Token;
    });

    describe("initialize()", function () {
      it("should revert on initialize after deploy", async function () {
        await expect(
          this.contracts.memberships.initialize(
            this.signers.alice.address,
            this.signers.alice.address,
            MEMBERSHIPS_NAME,
            MEMBERSHIPS_SYMBOL,
            MEMBERSHIPS_CONTRACT_URI,
            MEMBERSHIPS_BASE_URI,
            {
              tokenAddress: ETH_ADDRESS,
              price: parseEther("0.1"),
              validity: Math.floor(90 * SECONDS_PER_DAY), // 90 days or ~3 months from now
              cap: 10,
              airdropToken: this.mocks.erc20Token.address,
              airdropAmount: parseEther("100"),
            },
          ),
        ).to.be.revertedWith("Initializable: contract is already initialized");
      });
    });

    describe("version()", function () {
      it("should return version 2", async function () {
        expect(await this.contracts.memberships.version()).to.equal(2);
      });
    });
  });
}

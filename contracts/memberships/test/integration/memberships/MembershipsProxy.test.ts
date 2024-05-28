import { expect } from "chai";
import { ethers } from "hardhat";
import { parseEther, parseUnits } from "ethers/lib/utils";
import {
  ETH_ADDRESS,
  SECONDS_PER_DAY,
  MEMBERSHIPS_NAME,
  MEMBERSHIPS_SYMBOL,
  MEMBERSHIPS_CONTRACT_URI,
  MEMBERSHIPS_BASE_URI,
} from "../../../helpers/constants";
import { getArgFromEvent } from "../../../helpers/events";
import { integrationFixture } from "../../shared/fixtures";
import { MembershipsProxy } from "../../../src/types/MembershipsProxy";
import { deployTestMembershipsV2 } from "../../shared/deployers";

export function integrationTestMembershipsProxy(): void {
  describe("MembershipsProxy", function () {
    beforeEach(async function () {
      const { membershipsMetadataRegistry, memberships, membershipsFactory, testMembershipsFactory, erc20Token } =
        await this.loadFixture(integrationFixture);
      this.contracts.membershipsMetadataRegistry = membershipsMetadataRegistry;
      this.contracts.memberships = memberships;
      this.contracts.membershipsFactory = membershipsFactory;
      this.contracts.testMembershipsFactory = testMembershipsFactory;
      this.contracts.erc20Token = erc20Token;

      // Set version 2 Memberships implementation
      await this.contracts.membershipsFactory.setMembershipsImplAddress(2, this.contracts.memberships.address);

      await this.contracts.erc20Token.mint(
        this.signers.alice.address,
        parseUnits("100000", await this.contracts.erc20Token.decimals()),
      );

      // Approve alice's tokens for the MembershipsFactory contract
      await this.contracts.erc20Token
        .connect(this.signers.alice)
        .approve(this.contracts.membershipsFactory.address, parseEther("100").mul(10));

      const membership = {
        tokenAddress: ETH_ADDRESS,
        price: parseEther("0.1"),
        validity: Math.floor(90 * SECONDS_PER_DAY), // 90 days or ~3 months from now
        cap: 10,
        airdropToken: this.contracts.erc20Token.address,
        airdropAmount: parseEther("100"),
      };
      const deployMemberships = await this.contracts.membershipsFactory
        .connect(this.signers.alice)
        .deployMemberships(
          this.signers.alice.address,
          this.signers.alice.address,
          MEMBERSHIPS_NAME,
          MEMBERSHIPS_SYMBOL,
          MEMBERSHIPS_CONTRACT_URI,
          MEMBERSHIPS_BASE_URI,
          membership,
        );
      const receipt = await deployMemberships.wait();
      const membershipsProxyAddress = getArgFromEvent(
        this.contracts.membershipsFactory,
        receipt,
        this.contracts.membershipsFactory.interface.events["MembershipsDeployed(address,address,address)"].name,
        "membershipsProxy",
      );

      this.membershipsProxy_Proxy = (await ethers.getContractAt(
        "MembershipsProxy",
        membershipsProxyAddress,
      )) as MembershipsProxy;
    });

    describe("deploy", function () {
      it("should revert with InvalidMemberships() if MembershipsFactory.memberships() is zero address", async function () {
        // Using TestMembershipsFactory to perform the test
        await expect(
          this.contracts.testMembershipsFactory.deployMemberships(this.contracts.memberships.address),
        ).to.be.revertedWith("InvalidMemberships()");
      });

      it("should set state", async function () {
        expect(await this.membershipsProxy_Proxy.memberships()).to.equal(this.contracts.memberships.address);
        expect(await this.membershipsProxy_Proxy.membershipsFactory()).to.equal(
          this.contracts.membershipsFactory.address,
        );
      });
    });

    describe("upgradeMemberships()", function () {
      it("should revert with Unauthorized() if called by non-factory", async function () {
        await expect(
          this.membershipsProxy_Proxy
            .connect(this.signers.alice)
            .upgradeMemberships(this.contracts.memberships.address),
        ).to.be.revertedWith("Unauthorized()");
      });

      it("should change implementation contract address", async function () {
        // Deploy new Memberships implementation contract
        const testMembershipsV2 = await deployTestMembershipsV2(
          this.signers.alice,
          this.contracts.membershipsMetadataRegistry.address,
        );
        // Change memberships implementation address on MembershipsFactory
        await this.contracts.membershipsFactory
          .connect(this.signers.alice)
          .setMembershipsImplAddress(3, testMembershipsV2.address);

        // Call MembershipsProxy.upgradeMemberships() via MembershipsFactory.upgradeProxy()
        await this.contracts.membershipsFactory.upgradeProxy(3, this.membershipsProxy_Proxy.address);

        expect(await this.membershipsProxy_Proxy.memberships()).to.equal(testMembershipsV2.address);
      });
    });
  });
}

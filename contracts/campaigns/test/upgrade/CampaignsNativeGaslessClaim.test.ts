import { expect } from "chai";
import { parseEther, parseUnits } from "ethers/lib/utils";
import { ethers, upgrades } from "hardhat";
import { CampaignsNativeGaslessClaim } from "../../src/types/contracts/campaigns";
import { upgradeFixtureCampaignsNativeGaslessClaimV1 } from "../shared/fixtures";

export function upgradeTestCampaignsNativeGaslessClaim(): void {
  describe("CampaignsNativeGaslessClaim", function () {
    beforeEach(async function () {
      const { campaignsNativeGaslessClaimV1, erc20Token, protocolRewards } = await this.loadFixture(
        upgradeFixtureCampaignsNativeGaslessClaimV1,
      );
      this.contracts.campaignsNativeGaslessClaimV1 = campaignsNativeGaslessClaimV1;
      this.contracts.erc20Token = erc20Token;
      this.contracts.protocolRewards = protocolRewards;

      await this.contracts.erc20Token.mint(
        this.signers.alice.address,
        parseUnits("100000", await this.contracts.erc20Token.decimals()),
      );
    });

    describe("upgradeProxy", () => {
      it("should upgrade implementation", async function () {
        const currentImplementation = await upgrades.erc1967.getImplementationAddress(
          this.contracts.campaignsNativeGaslessClaimV1.address,
        );
        const campaignsV2: CampaignsNativeGaslessClaim = <CampaignsNativeGaslessClaim>(
          await upgrades.upgradeProxy(
            this.contracts.campaignsNativeGaslessClaimV1.address,
            await ethers.getContractFactory("CampaignsNativeGaslessClaim"),
            { constructorArgs: [this.contracts.protocolRewards.address] },
          )
        );
        const newImplementation = await upgrades.erc1967.getImplementationAddress(campaignsV2.address);
        expect(newImplementation).to.not.eq(currentImplementation);
        expect(this.contracts.campaignsNativeGaslessClaimV1.address).to.eq(campaignsV2.address);
      });

      it("should add new state", async function () {
        const campaignsV2: CampaignsNativeGaslessClaim = <CampaignsNativeGaslessClaim>(
          await upgrades.upgradeProxy(
            this.contracts.campaignsNativeGaslessClaimV1.address,
            await ethers.getContractFactory("CampaignsNativeGaslessClaim"),
            { constructorArgs: [this.contracts.protocolRewards.address] },
          )
        );
        expect(await campaignsV2.sponsoredClaimFee()).to.eq(0);
        expect(await campaignsV2.protocolRewards()).to.eq(this.contracts.protocolRewards.address);
      });

      it("should add sponsoredClaims to struct", async function () {
        const totalAmount = parseEther("300");
        await this.contracts.erc20Token.connect(this.signers.bob).mint(this.signers.bob.address, totalAmount);
        await this.contracts.erc20Token
          .connect(this.signers.bob)
          .approve(this.contracts.campaignsNativeGaslessClaimV1.address, totalAmount);
        await this.contracts.campaignsNativeGaslessClaimV1
          .connect(this.signers.bob)
          .createCampaign(this.contracts.erc20Token.address, 10, parseEther("10"), 0);
        const campaign = await this.contracts.campaignsNativeGaslessClaimV1.campaigns(this.signers.bob.address, 0);
        expect(campaign.tokenAddress).to.eq(this.contracts.erc20Token.address);
        expect(campaign.maxClaims).to.eq(10);
        expect(campaign.noOfClaims).to.eq(0);
        expect(campaign.amountPerClaim).to.eq(parseEther("10"));
        expect(campaign.isInactive).to.eq(0);
        expect(campaign.isGasless).to.eq(0);

        const campaignsV2: CampaignsNativeGaslessClaim = <CampaignsNativeGaslessClaim>(
          await upgrades.upgradeProxy(
            this.contracts.campaignsNativeGaslessClaimV1.address,
            await ethers.getContractFactory("CampaignsNativeGaslessClaim"),
            { constructorArgs: [this.contracts.protocolRewards.address] },
          )
        );

        await campaignsV2
          .connect(this.signers.bob)
          .createCampaign(this.contracts.erc20Token.address, 12, parseEther("12"), 0, 0);
        const newCampaign = await campaignsV2.campaigns(this.signers.bob.address, 1);
        expect(newCampaign.tokenAddress).to.eq(this.contracts.erc20Token.address);
        expect(newCampaign.maxClaims).to.eq(12);
        expect(newCampaign.noOfClaims).to.eq(0);
        expect(newCampaign.amountPerClaim).to.eq(parseEther("12"));
        expect(newCampaign.isInactive).to.eq(0);
        expect(newCampaign.isGasless).to.eq(0);
        expect(newCampaign.noOfSponsoredClaims).to.eq(0);
        expect(newCampaign.maxSponsoredClaims).to.eq(0);
      });

      it("should keep original struct fields intact", async function () {
        const totalAmount = parseEther("20").mul(20);
        await this.contracts.erc20Token.connect(this.signers.bob).mint(this.signers.bob.address, totalAmount);
        await this.contracts.erc20Token
          .connect(this.signers.bob)
          .approve(this.contracts.campaignsNativeGaslessClaimV1.address, totalAmount);
        await this.contracts.campaignsNativeGaslessClaimV1
          .connect(this.signers.bob)
          .createCampaign(this.contracts.erc20Token.address, 10, parseEther("10"), 0);
        const campaign = await this.contracts.campaignsNativeGaslessClaimV1.campaigns(this.signers.bob.address, 0);
        expect(campaign.tokenAddress).to.eq(this.contracts.erc20Token.address);
        expect(campaign.maxClaims).to.eq(10);
        expect(campaign.noOfClaims).to.eq(0);
        expect(campaign.amountPerClaim).to.eq(parseEther("10"));
        expect(campaign.isInactive).to.eq(0);
        expect(campaign.isGasless).to.eq(0);

        const campaignsV2: CampaignsNativeGaslessClaim = <CampaignsNativeGaslessClaim>(
          await upgrades.upgradeProxy(
            this.contracts.campaignsNativeGaslessClaimV1.address,
            await ethers.getContractFactory("CampaignsNativeGaslessClaim"),
            { constructorArgs: [this.contracts.protocolRewards.address] },
          )
        );

        const campaignOnV2 = await campaignsV2.campaigns(this.signers.bob.address, 0);
        expect(campaignOnV2.tokenAddress).to.eq(this.contracts.erc20Token.address);
        expect(campaignOnV2.maxClaims).to.eq(10);
        expect(campaignOnV2.noOfClaims).to.eq(0);
        expect(campaignOnV2.amountPerClaim).to.eq(parseEther("10"));
        expect(campaignOnV2.isInactive).to.eq(0);
        expect(campaignOnV2.isGasless).to.eq(0);
        expect(campaignOnV2.noOfSponsoredClaims).to.eq(0);
        expect(campaignOnV2.maxSponsoredClaims).to.eq(0);

        await campaignsV2
          .connect(this.signers.bob)
          .createCampaign(this.contracts.erc20Token.address, 12, parseEther("12"), 0, 0);
        const newCampaignOnV2 = await campaignsV2.campaigns(this.signers.bob.address, 1);
        expect(newCampaignOnV2.tokenAddress).to.eq(this.contracts.erc20Token.address);
        expect(newCampaignOnV2.maxClaims).to.eq(12);
        expect(newCampaignOnV2.noOfClaims).to.eq(0);
        expect(newCampaignOnV2.amountPerClaim).to.eq(parseEther("12"));
        expect(newCampaignOnV2.isInactive).to.eq(0);
        expect(newCampaignOnV2.isGasless).to.eq(0);
        expect(newCampaignOnV2.noOfSponsoredClaims).to.eq(0);
        expect(newCampaignOnV2.maxSponsoredClaims).to.eq(0);
      });

      it("should support updating sponsoredClaims for prev campaigns after upgrade", async function () {
        const totalAmount = parseEther("20").mul(20);
        await this.contracts.erc20Token.connect(this.signers.bob).mint(this.signers.bob.address, totalAmount);
        await this.contracts.erc20Token
          .connect(this.signers.bob)
          .approve(this.contracts.campaignsNativeGaslessClaimV1.address, totalAmount);
        await this.contracts.campaignsNativeGaslessClaimV1
          .connect(this.signers.bob)
          .createCampaign(this.contracts.erc20Token.address, 10, parseEther("10"), 0);

        const campaignsV2: CampaignsNativeGaslessClaim = <CampaignsNativeGaslessClaim>(
          await upgrades.upgradeProxy(
            this.contracts.campaignsNativeGaslessClaimV1.address,
            await ethers.getContractFactory("CampaignsNativeGaslessClaim"),
            { constructorArgs: [this.contracts.protocolRewards.address] },
          )
        );

        let campaignOnV2 = await campaignsV2.campaigns(this.signers.bob.address, 0);
        expect(campaignOnV2.noOfSponsoredClaims).to.eq(0);
        expect(campaignOnV2.maxSponsoredClaims).to.eq(0);

        await campaignsV2.connect(this.signers.bob).increaseMaxSponsoredClaims(this.signers.bob.address, 0, 6);
        campaignOnV2 = await campaignsV2.campaigns(this.signers.bob.address, 0);
        expect(campaignOnV2.noOfSponsoredClaims).to.eq(0);
        expect(campaignOnV2.maxSponsoredClaims).to.eq(6);
      });
    });
  });
}

import { expect } from "chai";
import { parseEther, parseUnits } from "ethers/lib/utils";
import { ethers, upgrades } from "hardhat";
import { Campaigns } from "../../src/types/contracts/campaigns";
import { upgradeFixtureCampaignsV1 } from "../shared/fixtures";

export function upgradeTestCampaigns(): void {
  describe("Campaigns", function () {
    beforeEach(async function () {
      const { campaignsV1, erc20Token, protocolRewards } = await this.loadFixture(upgradeFixtureCampaignsV1);
      this.contracts.campaignsV1 = campaignsV1;
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
          this.contracts.campaignsV1.address,
        );
        const campaignsV2: Campaigns = <Campaigns>(
          await upgrades.upgradeProxy(
            this.contracts.campaignsV1.address,
            await ethers.getContractFactory("Campaigns"),
            { constructorArgs: [this.contracts.protocolRewards.address] },
          )
        );
        const newImplementation = await upgrades.erc1967.getImplementationAddress(campaignsV2.address);
        expect(newImplementation).to.not.eq(currentImplementation);
        expect(this.contracts.campaignsV1.address).to.eq(campaignsV2.address);
      });

      it("should add new state", async function () {
        const campaignsV2: Campaigns = <Campaigns>(
          await upgrades.upgradeProxy(
            this.contracts.campaignsV1.address,
            await ethers.getContractFactory("Campaigns"),
            { constructorArgs: [this.contracts.protocolRewards.address] },
          )
        );
        expect(await campaignsV2.sponsoredClaimFee()).to.eq(0);
        expect(await campaignsV2.protocolRewards()).to.eq(this.contracts.protocolRewards.address);
      });

      it("should add maxSponsoredClaims to struct", async function () {
        const totalAmount = parseEther("300");
        await this.contracts.erc20Token.connect(this.signers.bob).mint(this.signers.bob.address, totalAmount);
        await this.contracts.erc20Token
          .connect(this.signers.bob)
          .approve(this.contracts.campaignsV1.address, totalAmount);
        await this.contracts.campaignsV1
          .connect(this.signers.bob)
          .createCampaign(this.contracts.erc20Token.address, 10, parseEther("10"));
        const campaign = await this.contracts.campaignsV1.campaigns(this.signers.bob.address, 0);
        expect(campaign.tokenAddress).to.eq(this.contracts.erc20Token.address);
        expect(campaign.maxClaims).to.eq(10);
        expect(campaign.noOfClaims).to.eq(0);
        expect(campaign.amountPerClaim).to.eq(parseEther("10"));
        expect(campaign.isInactive).to.eq(0);

        const campaignsV2: Campaigns = <Campaigns>(
          await upgrades.upgradeProxy(
            this.contracts.campaignsV1.address,
            await ethers.getContractFactory("Campaigns"),
            { constructorArgs: [this.contracts.protocolRewards.address] },
          )
        );

        await campaignsV2
          .connect(this.signers.bob)
          .createCampaign(this.contracts.erc20Token.address, 12, parseEther("12"), 6);
        const newCampaign = await campaignsV2.campaigns(this.signers.bob.address, 1);
        expect(newCampaign.tokenAddress).to.eq(this.contracts.erc20Token.address);
        expect(newCampaign.maxClaims).to.eq(12);
        expect(newCampaign.noOfClaims).to.eq(0);
        expect(newCampaign.amountPerClaim).to.eq(parseEther("12"));
        expect(newCampaign.isInactive).to.eq(0);
        expect(newCampaign.noOfSponsoredClaims).to.eq(0);
        expect(newCampaign.maxSponsoredClaims).to.eq(6);
      });

      it("should keep original struct fields intact", async function () {
        const totalAmount = parseEther("20").mul(20);
        await this.contracts.erc20Token.connect(this.signers.bob).mint(this.signers.bob.address, totalAmount);
        await this.contracts.erc20Token
          .connect(this.signers.bob)
          .approve(this.contracts.campaignsV1.address, totalAmount);
        await this.contracts.campaignsV1
          .connect(this.signers.bob)
          .createCampaign(this.contracts.erc20Token.address, 10, parseEther("10"));
        const campaign = await this.contracts.campaignsV1.campaigns(this.signers.bob.address, 0);
        expect(campaign.tokenAddress).to.eq(this.contracts.erc20Token.address);
        expect(campaign.maxClaims).to.eq(10);
        expect(campaign.noOfClaims).to.eq(0);
        expect(campaign.amountPerClaim).to.eq(parseEther("10"));
        expect(campaign.isInactive).to.eq(0);

        const campaignsV2: Campaigns = <Campaigns>(
          await upgrades.upgradeProxy(
            this.contracts.campaignsV1.address,
            await ethers.getContractFactory("Campaigns"),
            { constructorArgs: [this.contracts.protocolRewards.address] },
          )
        );

        const campaignOnV2 = await campaignsV2.campaigns(this.signers.bob.address, 0);
        expect(campaignOnV2.tokenAddress).to.eq(this.contracts.erc20Token.address);
        expect(campaignOnV2.maxClaims).to.eq(10);
        expect(campaignOnV2.noOfClaims).to.eq(0);
        expect(campaignOnV2.amountPerClaim).to.eq(parseEther("10"));
        expect(campaignOnV2.isInactive).to.eq(0);
        expect(campaignOnV2.noOfSponsoredClaims).to.eq(0);
        expect(campaignOnV2.maxSponsoredClaims).to.eq(0);

        await campaignsV2
          .connect(this.signers.bob)
          .createCampaign(this.contracts.erc20Token.address, 12, parseEther("12"), 6);
        const newCampaignOnV2 = await campaignsV2.campaigns(this.signers.bob.address, 1);
        expect(newCampaignOnV2.tokenAddress).to.eq(this.contracts.erc20Token.address);
        expect(newCampaignOnV2.maxClaims).to.eq(12);
        expect(newCampaignOnV2.noOfClaims).to.eq(0);
        expect(newCampaignOnV2.amountPerClaim).to.eq(parseEther("12"));
        expect(newCampaignOnV2.isInactive).to.eq(0);
        expect(newCampaignOnV2.noOfSponsoredClaims).to.eq(0);
        expect(newCampaignOnV2.maxSponsoredClaims).to.eq(6);
      });

      it("should support updating maxSponsoredClaims for prev campaigns after upgrade", async function () {
        const totalAmount = parseEther("20").mul(20);
        await this.contracts.erc20Token.connect(this.signers.bob).mint(this.signers.bob.address, totalAmount);
        await this.contracts.erc20Token
          .connect(this.signers.bob)
          .approve(this.contracts.campaignsV1.address, totalAmount);
        await this.contracts.campaignsV1
          .connect(this.signers.bob)
          .createCampaign(this.contracts.erc20Token.address, 10, parseEther("10"));

        const campaignsV2: Campaigns = <Campaigns>(
          await upgrades.upgradeProxy(
            this.contracts.campaignsV1.address,
            await ethers.getContractFactory("Campaigns"),
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

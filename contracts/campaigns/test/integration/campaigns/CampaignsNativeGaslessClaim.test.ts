import { AddressZero } from "@ethersproject/constants";
import { expect } from "chai";
import { BigNumber, ethers } from "ethers";
import { parseEther, parseUnits } from "ethers/lib/utils";
import { Campaigns_generateClaimSignature, prepareNativeMetaTxnSignature } from "../../../helpers/eip712";
import { getArgFromEvent } from "../../../helpers/events";
import { deployERC20Token } from "../../shared/deployers";
import { integrationFixtureCampaignsNativeGaslessClaim } from "../../shared/fixtures";
import { BASIS_POINTS, CLAIM_FEE, CREATOR_SHARE, PLATFORM_SHARE, REFERRER_SHARE } from "../../shared/utils";

export function integrationTestCampaignsNativeGaslessClaim(): void {
  describe("CampaignsNativeGaslessClaim", function () {
    beforeEach(async function () {
      const { campaignsNativeGaslessClaim, erc20Token, protocolRewards } = await this.loadFixture(
        integrationFixtureCampaignsNativeGaslessClaim,
      );
      this.contracts.campaignsNativeGaslessClaim = campaignsNativeGaslessClaim;
      this.contracts.erc20Token = erc20Token;
      this.contracts.protocolRewards = protocolRewards;

      await this.contracts.erc20Token.mint(
        this.signers.alice.address,
        parseUnits("100000", await this.contracts.erc20Token.decimals()),
      );
    });

    describe("createCampaign()", function () {
      it("should transfer total required tokens if not ETHAddress", async function () {
        const totalAmount = parseEther("10").mul(10);

        await this.contracts.erc20Token.connect(this.signers.bob).mint(this.signers.bob.address, totalAmount);
        await this.contracts.erc20Token
          .connect(this.signers.bob)
          .approve(this.contracts.campaignsNativeGaslessClaim.address, totalAmount);

        await expect(
          this.contracts.campaignsNativeGaslessClaim
            .connect(this.signers.bob)
            .createCampaign(this.contracts.erc20Token.address, 10, parseEther("10"), 0, 0),
        ).to.changeTokenBalances(
          this.contracts.erc20Token,
          [this.signers.bob, this.contracts.campaignsNativeGaslessClaim],
          [BigNumber.from(0).sub(totalAmount), totalAmount],
        );
      });

      it("Should allow to createCampaign() multiple times and each should have separate valid states", async function () {
        let receipt;
        let campaignId;

        // Assert all Campaigns states before
        // Assert Campaign Bob 0 states
        let campaign = await this.contracts.campaignsNativeGaslessClaim.campaigns(this.signers.bob.address, 0);
        expect(campaign.tokenAddress).to.eq(AddressZero);
        expect(campaign.maxClaims).to.eq(0);
        expect(campaign.noOfClaims).to.eq(0);
        expect(campaign.amountPerClaim).to.eq(0);
        expect(campaign.isInactive).to.eq(0);
        // Assert Campaign Bob 1 states
        campaign = await this.contracts.campaignsNativeGaslessClaim.campaigns(this.signers.bob.address, 1);
        expect(campaign.tokenAddress).to.eq(AddressZero);
        expect(campaign.maxClaims).to.eq(0);
        expect(campaign.noOfClaims).to.eq(0);
        expect(campaign.amountPerClaim).to.eq(0);
        expect(campaign.isInactive).to.eq(0);
        // Assert Campaign Carol 0 states
        campaign = await this.contracts.campaignsNativeGaslessClaim.campaigns(this.signers.carol.address, 0);
        expect(campaign.tokenAddress).to.eq(AddressZero);
        expect(campaign.maxClaims).to.eq(0);
        expect(campaign.noOfClaims).to.eq(0);
        expect(campaign.amountPerClaim).to.eq(0);
        expect(campaign.isInactive).to.eq(0);

        // Campaign Bob 0
        // Create Campaign
        let totalAmount = parseEther("3").mul(3);
        const erc20TokenA = await deployERC20Token(this.signers.alice, "ERC20TokenA", "ERC20A", BigNumber.from(18));
        await erc20TokenA.connect(this.signers.bob).mint(this.signers.bob.address, totalAmount);
        await erc20TokenA
          .connect(this.signers.bob)
          .approve(this.contracts.campaignsNativeGaslessClaim.address, totalAmount);
        const createCampaignBob0 = await this.contracts.campaignsNativeGaslessClaim
          .connect(this.signers.bob)
          .createCampaign(erc20TokenA.address, 3, parseEther("3"), 0, 0);
        receipt = await createCampaignBob0.wait();
        campaignId = getArgFromEvent(
          this.contracts.campaignsNativeGaslessClaim,
          receipt,
          this.contracts.campaignsNativeGaslessClaim.interface.events["CampaignCreated(address,uint256)"].name,
          "campaignId",
        );
        expect(campaignId).to.equal(0);

        // Campaign Bob 1 isGasless
        // Create Campaign
        totalAmount = parseEther("4").mul(4);
        const erc20TokenB = await deployERC20Token(this.signers.alice, "ERC20TokenB", "ERC20B", BigNumber.from(18));
        await erc20TokenB.connect(this.signers.bob).mint(this.signers.bob.address, totalAmount);
        await erc20TokenB
          .connect(this.signers.bob)
          .approve(this.contracts.campaignsNativeGaslessClaim.address, totalAmount);
        const createCampaignBob1 = await this.contracts.campaignsNativeGaslessClaim
          .connect(this.signers.bob)
          .createCampaign(erc20TokenB.address, 4, parseEther("4"), 1, 0);
        receipt = await createCampaignBob1.wait();
        campaignId = getArgFromEvent(
          this.contracts.campaignsNativeGaslessClaim,
          receipt,
          this.contracts.campaignsNativeGaslessClaim.interface.events["CampaignCreated(address,uint256)"].name,
          "campaignId",
        );
        expect(campaignId).to.equal(1);

        // Campaign Carol 0
        // Create Campaign
        totalAmount = parseEther("5").mul(5);
        const erc20TokenC = await deployERC20Token(this.signers.alice, "ERC20TokenC", "ERC20C", BigNumber.from(18));
        await erc20TokenC.connect(this.signers.carol).mint(this.signers.carol.address, totalAmount);
        await erc20TokenC
          .connect(this.signers.carol)
          .approve(this.contracts.campaignsNativeGaslessClaim.address, totalAmount);
        const createCampaignCarol0 = await this.contracts.campaignsNativeGaslessClaim
          .connect(this.signers.carol)
          .createCampaign(erc20TokenC.address, 5, parseEther("5"), 0, 0);
        receipt = await createCampaignCarol0.wait();
        campaignId = getArgFromEvent(
          this.contracts.campaignsNativeGaslessClaim,
          receipt,
          this.contracts.campaignsNativeGaslessClaim.interface.events["CampaignCreated(address,uint256)"].name,
          "campaignId",
        );
        expect(campaignId).to.equal(0);

        // Assert all Campaigns states after
        // Assert Campaign Bob 0 states
        campaign = await this.contracts.campaignsNativeGaslessClaim.campaigns(this.signers.bob.address, 0);
        expect(campaign.tokenAddress).to.eq(erc20TokenA.address);
        expect(campaign.maxClaims).to.eq(3);
        expect(campaign.noOfClaims).to.eq(0);
        expect(campaign.amountPerClaim).to.eq(parseEther("3"));
        expect(campaign.isInactive).to.eq(0);
        expect(campaign.isGasless).to.eq(0);
        // Assert Campaign Bob 1 states
        campaign = await this.contracts.campaignsNativeGaslessClaim.campaigns(this.signers.bob.address, 1);
        expect(campaign.tokenAddress).to.eq(erc20TokenB.address);
        expect(campaign.maxClaims).to.eq(4);
        expect(campaign.noOfClaims).to.eq(0);
        expect(campaign.amountPerClaim).to.eq(parseEther("4"));
        expect(campaign.isInactive).to.eq(0);
        expect(campaign.isGasless).to.eq(1);
        // Assert Campaign Carol 0 states
        campaign = await this.contracts.campaignsNativeGaslessClaim.campaigns(this.signers.carol.address, 0);
        expect(campaign.tokenAddress).to.eq(erc20TokenC.address);
        expect(campaign.maxClaims).to.eq(5);
        expect(campaign.noOfClaims).to.eq(0);
        expect(campaign.amountPerClaim).to.eq(parseEther("5"));
        expect(campaign.isInactive).to.eq(0);
        expect(campaign.isGasless).to.eq(0);

        // Bob claims Carol Campaign 0
        let { v, r, s } = await Campaigns_generateClaimSignature(
          this.contracts.campaignsNativeGaslessClaim,
          "CampaignsNativeGaslessClaim",
          this.signers.carol.address,
          0,
          this.signers.bob.address,
          this.signers.trustedAddress,
        );
        await this.contracts.campaignsNativeGaslessClaim
          .connect(this.signers.bob)
          .claim(this.signers.carol.address, 0, r, s, v, ethers.constants.AddressZero, { value: CLAIM_FEE });
        campaign = await this.contracts.campaignsNativeGaslessClaim.campaigns(this.signers.carol.address, 0);
        expect(campaign.noOfClaims).to.eq(1);

        // David claims Carol Campaign 0
        ({ v, r, s } = await Campaigns_generateClaimSignature(
          this.contracts.campaignsNativeGaslessClaim,
          "CampaignsNativeGaslessClaim",
          this.signers.carol.address,
          0,
          this.signers.david.address,
          this.signers.trustedAddress,
        ));
        await this.contracts.campaignsNativeGaslessClaim
          .connect(this.signers.david)
          .claim(this.signers.carol.address, 0, r, s, v, ethers.constants.AddressZero, { value: CLAIM_FEE });
        campaign = await this.contracts.campaignsNativeGaslessClaim.campaigns(this.signers.carol.address, 0);
        expect(campaign.noOfClaims).to.eq(2);

        // Carol claims Bob Campaign 0
        ({ v, r, s } = await Campaigns_generateClaimSignature(
          this.contracts.campaignsNativeGaslessClaim,
          "CampaignsNativeGaslessClaim",
          this.signers.bob.address,
          0,
          this.signers.carol.address,
          this.signers.trustedAddress,
        ));
        await this.contracts.campaignsNativeGaslessClaim
          .connect(this.signers.carol)
          .claim(this.signers.bob.address, 0, r, s, v, ethers.constants.AddressZero, { value: CLAIM_FEE });
        campaign = await this.contracts.campaignsNativeGaslessClaim.campaigns(this.signers.bob.address, 0);
        expect(campaign.noOfClaims).to.eq(1);

        // Carol claims Bob Campaign 1
        ({ v, r, s } = await Campaigns_generateClaimSignature(
          this.contracts.campaignsNativeGaslessClaim,
          "CampaignsNativeGaslessClaim",
          this.signers.bob.address,
          1,
          this.signers.carol.address,
          this.signers.trustedAddress,
        ));
        await this.contracts.campaignsNativeGaslessClaim
          .connect(this.signers.carol)
          .claim(this.signers.bob.address, 1, r, s, v, ethers.constants.AddressZero);
        campaign = await this.contracts.campaignsNativeGaslessClaim.campaigns(this.signers.bob.address, 1);
        expect(campaign.noOfClaims).to.eq(1);

        // David claims Bob Campaign 1
        ({ v, r, s } = await Campaigns_generateClaimSignature(
          this.contracts.campaignsNativeGaslessClaim,
          "CampaignsNativeGaslessClaim",
          this.signers.bob.address,
          1,
          this.signers.david.address,
          this.signers.trustedAddress,
        ));
        await this.contracts.campaignsNativeGaslessClaim
          .connect(this.signers.david)
          .claim(this.signers.bob.address, 1, r, s, v, ethers.constants.AddressZero);
        campaign = await this.contracts.campaignsNativeGaslessClaim.campaigns(this.signers.bob.address, 1);
        expect(campaign.noOfClaims).to.eq(2);
      });
    });

    describe("claim()", function () {
      it("should transfer amountPerClaim tokens if not ETHAddress", async function () {
        const totalAmount = parseEther("10").mul(10);
        await this.contracts.erc20Token.connect(this.signers.bob).mint(this.signers.bob.address, totalAmount);
        await this.contracts.erc20Token
          .connect(this.signers.bob)
          .approve(this.contracts.campaignsNativeGaslessClaim.address, totalAmount);
        await this.contracts.campaignsNativeGaslessClaim
          .connect(this.signers.bob)
          .createCampaign(this.contracts.erc20Token.address, 10, parseEther("10"), 0, 0);

        const { v, r, s } = await Campaigns_generateClaimSignature(
          this.contracts.campaignsNativeGaslessClaim,
          "CampaignsNativeGaslessClaim",
          this.signers.bob.address,
          0,
          this.signers.carol.address,
          this.signers.trustedAddress,
        );

        // Try claiming with signature from trustedAddress. Shouldn't fail
        await expect(
          this.contracts.campaignsNativeGaslessClaim
            .connect(this.signers.carol) // Carol claims Bob's campaign 0
            .claim(this.signers.bob.address, 0, r, s, v, ethers.constants.AddressZero, { value: CLAIM_FEE }),
        ).to.changeTokenBalances(
          this.contracts.erc20Token,
          [this.contracts.campaignsNativeGaslessClaim, this.signers.carol],
          [BigNumber.from(0).sub(parseEther("10")), parseEther("10")],
        );
      });

      describe("Protocol Rewards", function () {
        it("Should split and deposit rewards - no referrer", async function () {
          const totalAmount = parseEther("10").mul(10);
          await this.contracts.erc20Token.connect(this.signers.bob).mint(this.signers.bob.address, totalAmount);
          await this.contracts.erc20Token
            .connect(this.signers.bob)
            .approve(this.contracts.campaignsNativeGaslessClaim.address, totalAmount);
          await this.contracts.campaignsNativeGaslessClaim
            .connect(this.signers.bob)
            .createCampaign(this.contracts.erc20Token.address, 10, parseEther("10"), 0, 0);

          const { v, r, s } = await Campaigns_generateClaimSignature(
            this.contracts.campaignsNativeGaslessClaim,
            "CampaignsNativeGaslessClaim",
            this.signers.bob.address,
            0,
            this.signers.carol.address,
            this.signers.trustedAddress,
          );
          await this.contracts.campaignsNativeGaslessClaim
            .connect(this.signers.carol) // Carol claims Bob's campaign 0
            .claim(this.signers.bob.address, 0, r, s, v, ethers.constants.AddressZero, { value: CLAIM_FEE });

          const rewardAmount = CLAIM_FEE;
          const expectedPlatformShare = rewardAmount
            .mul(PLATFORM_SHARE)
            .div(BASIS_POINTS)
            .add(rewardAmount.mul(REFERRER_SHARE).div(BASIS_POINTS));
          const expectedCreatorShare = rewardAmount.mul(CREATOR_SHARE).div(BASIS_POINTS);
          const expectedReferrerShare = 0;

          const platform = this.signers.treasury.address;
          const creator = this.signers.bob.address;
          const referrer = ethers.constants.AddressZero;

          expect(await this.contracts.protocolRewards.balanceOf(platform)).to.eq(expectedPlatformShare);
          expect(await this.contracts.protocolRewards.balanceOf(creator)).to.eq(expectedCreatorShare);
          expect(await this.contracts.protocolRewards.balanceOf(referrer)).to.eq(expectedReferrerShare);
        });

        it("Should split and deposit rewards - yes referrer", async function () {
          const totalAmount = parseEther("10").mul(10);
          await this.contracts.erc20Token.connect(this.signers.bob).mint(this.signers.bob.address, totalAmount);
          await this.contracts.erc20Token
            .connect(this.signers.bob)
            .approve(this.contracts.campaignsNativeGaslessClaim.address, totalAmount);
          await this.contracts.campaignsNativeGaslessClaim
            .connect(this.signers.bob)
            .createCampaign(this.contracts.erc20Token.address, 10, parseEther("10"), 0, 0);

          const { v, r, s } = await Campaigns_generateClaimSignature(
            this.contracts.campaignsNativeGaslessClaim,
            "CampaignsNativeGaslessClaim",
            this.signers.bob.address,
            0,
            this.signers.carol.address,
            this.signers.trustedAddress,
          );
          await this.contracts.campaignsNativeGaslessClaim
            .connect(this.signers.carol) // Carol claims Bob's campaign 0
            .claim(this.signers.bob.address, 0, r, s, v, this.signers.referrer.address, { value: CLAIM_FEE });

          const rewardAmount = CLAIM_FEE;
          const platform = this.signers.treasury.address;
          const creator = this.signers.bob.address;
          const referrer = this.signers.referrer.address;
          const expectedPlatformShare = rewardAmount.mul(PLATFORM_SHARE).div(BASIS_POINTS);
          const expectedCreatorShare = rewardAmount.mul(CREATOR_SHARE).div(BASIS_POINTS);
          const expectedReferrerShare = rewardAmount.mul(REFERRER_SHARE).div(BASIS_POINTS);

          expect(await this.contracts.protocolRewards.balanceOf(platform)).to.eq(expectedPlatformShare);
          expect(await this.contracts.protocolRewards.balanceOf(creator)).to.eq(expectedCreatorShare);
          expect(await this.contracts.protocolRewards.balanceOf(referrer)).to.eq(expectedReferrerShare);
        });

        it("Should emit ClaimFeePaid() on claim()", async function () {
          const totalAmount = parseEther("10").mul(10);
          await this.contracts.erc20Token.connect(this.signers.bob).mint(this.signers.bob.address, totalAmount);
          await this.contracts.erc20Token
            .connect(this.signers.bob)
            .approve(this.contracts.campaignsNativeGaslessClaim.address, totalAmount);
          await this.contracts.campaignsNativeGaslessClaim
            .connect(this.signers.bob)
            .createCampaign(this.contracts.erc20Token.address, 10, parseEther("10"), 0, 0);

          const { v, r, s } = await Campaigns_generateClaimSignature(
            this.contracts.campaignsNativeGaslessClaim,
            "CampaignsNativeGaslessClaim",
            this.signers.bob.address,
            0,
            this.signers.carol.address,
            this.signers.trustedAddress,
          );

          await expect(
            this.contracts.campaignsNativeGaslessClaim
              .connect(this.signers.carol) // Carol claims Bob's campaign 0
              .claim(this.signers.bob.address, 0, r, s, v, this.signers.referrer.address, { value: CLAIM_FEE }),
          )
            .to.emit(this.contracts.campaignsNativeGaslessClaim, "ClaimFeePaid")
            .withArgs(
              CLAIM_FEE,
              this.signers.carol.address,
              this.signers.treasury.address,
              this.signers.bob.address,
              0,
              this.signers.referrer.address,
            );
        });

        it("Should not split rewards if sponsored claim", async function () {
          const totalAmount = parseEther("10").mul(10);
          await this.contracts.erc20Token.connect(this.signers.bob).mint(this.signers.bob.address, totalAmount);
          await this.contracts.erc20Token
            .connect(this.signers.bob)
            .approve(this.contracts.campaignsNativeGaslessClaim.address, totalAmount);
          await this.contracts.campaignsNativeGaslessClaim
            .connect(this.signers.bob)
            .createCampaign(this.contracts.erc20Token.address, 10, parseEther("10"), 0, 1);

          const { v, r, s } = await Campaigns_generateClaimSignature(
            this.contracts.campaignsNativeGaslessClaim,
            "CampaignsNativeGaslessClaim",
            this.signers.bob.address,
            0,
            this.signers.carol.address,
            this.signers.trustedAddress,
          );

          await this.contracts.campaignsNativeGaslessClaim
            .connect(this.signers.carol) // Carol claims Bob's campaign 0
            .claim(this.signers.bob.address, 0, r, s, v, this.signers.referrer.address);

          const platform = this.signers.treasury.address;
          const creator = this.signers.bob.address;
          const referrer = this.signers.referrer.address;

          expect(await this.contracts.protocolRewards.balanceOf(platform)).to.eq(0);
          expect(await this.contracts.protocolRewards.balanceOf(creator)).to.eq(0);
          expect(await this.contracts.protocolRewards.balanceOf(referrer)).to.eq(0);
        });

        it("Should not split rewards if isGasless", async function () {
          const totalAmount = parseEther("10").mul(10);
          await this.contracts.erc20Token.connect(this.signers.bob).mint(this.signers.bob.address, totalAmount);
          await this.contracts.erc20Token
            .connect(this.signers.bob)
            .approve(this.contracts.campaignsNativeGaslessClaim.address, totalAmount);
          await this.contracts.campaignsNativeGaslessClaim
            .connect(this.signers.bob)
            .createCampaign(this.contracts.erc20Token.address, 10, parseEther("10"), 1, 0);

          const { v, r, s } = await Campaigns_generateClaimSignature(
            this.contracts.campaignsNativeGaslessClaim,
            "CampaignsNativeGaslessClaim",
            this.signers.bob.address,
            0,
            this.signers.carol.address,
            this.signers.trustedAddress,
          );

          await this.contracts.campaignsNativeGaslessClaim
            .connect(this.signers.carol) // Carol claims Bob's campaign 0
            .claim(this.signers.bob.address, 0, r, s, v, this.signers.referrer.address);

          const platform = this.signers.treasury.address;
          const creator = this.signers.bob.address;
          const referrer = this.signers.referrer.address;

          expect(await this.contracts.protocolRewards.balanceOf(platform)).to.eq(0);
          expect(await this.contracts.protocolRewards.balanceOf(creator)).to.eq(0);
          expect(await this.contracts.protocolRewards.balanceOf(referrer)).to.eq(0);
        });
      });
    });

    describe("withdrawCampaign()", function () {
      it("should transfer remaining tokens if not ETHAddress", async function () {
        const totalAmount = parseEther("10").mul(10);
        await this.contracts.erc20Token.connect(this.signers.bob).mint(this.signers.bob.address, totalAmount);
        await this.contracts.erc20Token
          .connect(this.signers.bob)
          .approve(this.contracts.campaignsNativeGaslessClaim.address, totalAmount);
        await expect(
          this.contracts.campaignsNativeGaslessClaim
            .connect(this.signers.bob)
            .createCampaign(this.contracts.erc20Token.address, 10, parseEther("10"), 0, 0),
        ).to.changeTokenBalances(
          this.contracts.erc20Token,
          [this.signers.bob, this.contracts.campaignsNativeGaslessClaim],
          [BigNumber.from(0).sub(totalAmount), totalAmount],
        );

        const { v, r, s } = await Campaigns_generateClaimSignature(
          this.contracts.campaignsNativeGaslessClaim,
          "CampaignsNativeGaslessClaim",
          this.signers.bob.address,
          0,
          this.signers.carol.address,
          this.signers.trustedAddress,
        );

        // Try claiming with signature from trustedAddress. Shouldn't fail
        await expect(
          this.contracts.campaignsNativeGaslessClaim
            .connect(this.signers.carol) // Carol claims Bob's campaign 0
            .claim(this.signers.bob.address, 0, r, s, v, ethers.constants.AddressZero, { value: CLAIM_FEE }),
        ).to.changeTokenBalances(
          this.contracts.erc20Token,
          [this.contracts.campaignsNativeGaslessClaim, this.signers.carol],
          [BigNumber.from(0).sub(parseEther("10")), parseEther("10")],
        );

        await expect(
          this.contracts.campaignsNativeGaslessClaim.connect(this.signers.bob).withdrawCampaign(0),
        ).to.changeTokenBalances(
          this.contracts.erc20Token,
          [this.contracts.campaignsNativeGaslessClaim, this.signers.bob],
          [BigNumber.from(0).sub(totalAmount.sub(parseEther("10"))), totalAmount.sub(parseEther("10"))],
        );
      });
    });

    describe("Meta Transactions", () => {
      describe("claim()", function () {
        it("should transfer amountPerClaim tokens if not ETHAddress", async function () {
          const totalAmount = parseEther("10").mul(10);
          await this.contracts.erc20Token.connect(this.signers.bob).mint(this.signers.bob.address, totalAmount);
          await this.contracts.erc20Token
            .connect(this.signers.bob)
            .approve(this.contracts.campaignsNativeGaslessClaim.address, totalAmount);
          await this.contracts.campaignsNativeGaslessClaim
            .connect(this.signers.bob)
            .createCampaign(this.contracts.erc20Token.address, 10, parseEther("10"), 1, 0);

          const { v, r, s } = await Campaigns_generateClaimSignature(
            this.contracts.campaignsNativeGaslessClaim,
            "CampaignsNativeGaslessClaim",
            this.signers.bob.address,
            0,
            this.signers.carol.address,
            this.signers.trustedAddress,
          );
          const [functionSignature, { r: metaTxnR, s: metaTxnS, v: metaTxnV }] = await prepareNativeMetaTxnSignature(
            this.contracts.campaignsNativeGaslessClaim,
            this.signers.carol,
            {
              campaignManager: this.signers.bob.address,
              campaignId: 0,
              r,
              s,
              v,
              referrer: ethers.constants.AddressZero,
            },
          );

          // Try claiming with signature from trustedAddress. Shouldn't fail
          await expect(
            this.contracts.campaignsNativeGaslessClaim
              .connect(this.signers.relayer)
              .executeMetaTransaction(this.signers.carol.address, functionSignature, metaTxnR, metaTxnS, metaTxnV),
          ).to.changeTokenBalances(
            this.contracts.erc20Token,
            [this.contracts.campaignsNativeGaslessClaim, this.signers.carol],
            [BigNumber.from(0).sub(parseEther("10")), parseEther("10")],
          );
        });
      });
    });
  });
}

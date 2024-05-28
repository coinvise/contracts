import { AddressZero, HashZero } from "@ethersproject/constants";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { ethers } from "hardhat";
import { ETHAddress } from "../../../helpers/constants";
import { Campaigns_generateClaimSignature } from "../../../helpers/eip712";
import { deployCampaigns } from "../../shared/deployers";
import { unitFixtureCampaigns } from "../../shared/fixtures";
import { CLAIM_FEE, SPONSORED_CLAIM_FEE } from "../../shared/utils";

export function unitTestCampaigns(): void {
  describe("Campaigns", function () {
    beforeEach(async function () {
      const { campaigns, erc20Token, protocolRewards } = await this.loadFixture(unitFixtureCampaigns);
      this.contracts.campaigns = campaigns;
      this.mocks.protocolRewards = protocolRewards;
      this.mocks.erc20Token = erc20Token;
    });

    describe("deploy", function () {
      it("should revert with InvalidAddress() if _trustedAddress is zero address", async function () {
        await expect(
          deployCampaigns(this.signers.alice, AddressZero, CLAIM_FEE, this.mocks.protocolRewards.address),
        ).to.be.revertedWithCustomError(this.contracts.campaigns, "InvalidAddress");
      });

      it("should set state", async function () {
        expect(await this.contracts.campaigns.owner()).to.eq(this.signers.alice.address);
        expect(await this.contracts.campaigns.claimFee()).to.eq(CLAIM_FEE);
        expect(await this.contracts.campaigns.totalClaimFees()).to.eq(0);
        expect(await this.contracts.campaigns.sponsoredClaimFee()).to.eq(0);
        expect(await this.contracts.campaigns.protocolRewards()).to.eq(this.mocks.protocolRewards.address);
      });
    });

    describe("createCampaign()", function () {
      it("should revert with InvalidAddress() if _tokenAddress is zero address", async function () {
        await expect(
          this.contracts.campaigns.createCampaign(AddressZero, 10, parseEther("10"), 0),
        ).to.be.revertedWithCustomError(this.contracts.campaigns, "InvalidAddress");
      });

      it("should revert with InvalidCount() if _maxClaims / _amountPerClaim is zero address", async function () {
        await expect(
          this.contracts.campaigns.createCampaign(this.mocks.erc20Token.address, 0, parseEther("10"), 0),
        ).to.be.revertedWithCustomError(this.contracts.campaigns, "InvalidCount");
        await expect(
          this.contracts.campaigns.createCampaign(this.mocks.erc20Token.address, 10, 0, 0),
        ).to.be.revertedWithCustomError(this.contracts.campaigns, "InvalidCount");
        await expect(
          this.contracts.campaigns.createCampaign(this.mocks.erc20Token.address, 0, 0, 0),
        ).to.be.revertedWithCustomError(this.contracts.campaigns, "InvalidCount");
      });

      it("should revert with ExceedsMaxClaims() if _sponsoredClaims > _maxClaims", async function () {
        await expect(
          this.contracts.campaigns.createCampaign(this.mocks.erc20Token.address, 10, parseEther("10"), 11),
        ).to.be.revertedWithCustomError(this.contracts.campaigns, "ExceedsMaxClaims");
      });

      it("should emit CampaignCreated()", async function () {
        // first campaignId would be 0
        await expect(
          this.contracts.campaigns
            .connect(this.signers.bob)
            .createCampaign(this.mocks.erc20Token.address, 10, parseEther("10"), 0),
        )
          .to.emit(this.contracts.campaigns, "CampaignCreated")
          .withArgs(this.signers.bob.address, 0);
      });

      it("should increment nextCampaignId for caller", async function () {
        // first campaignId would be 0
        await expect(
          this.contracts.campaigns
            .connect(this.signers.bob)
            .createCampaign(this.mocks.erc20Token.address, 10, parseEther("10"), 0),
        )
          .to.emit(this.contracts.campaigns, "CampaignCreated")
          .withArgs(this.signers.bob.address, 0);

        // second campaignId would be 1
        await expect(
          this.contracts.campaigns
            .connect(this.signers.bob)
            .createCampaign(this.mocks.erc20Token.address, 10, parseEther("10"), 0),
        )
          .to.emit(this.contracts.campaigns, "CampaignCreated")
          .withArgs(this.signers.bob.address, 1);
      });

      it("should store new campaign - ERC20 token", async function () {
        let campaign = await this.contracts.campaigns.campaigns(this.signers.bob.address, 0);
        expect(campaign.tokenAddress).to.eq(AddressZero);
        expect(campaign.maxClaims).to.eq(0);
        expect(campaign.noOfClaims).to.eq(0);
        expect(campaign.amountPerClaim).to.eq(0);
        expect(campaign.isInactive).to.eq(0);
        expect(campaign.noOfSponsoredClaims).to.eq(0);
        expect(campaign.maxSponsoredClaims).to.eq(0);

        await this.contracts.campaigns
          .connect(this.signers.bob)
          .createCampaign(this.mocks.erc20Token.address, 10, parseEther("10"), 3);

        campaign = await this.contracts.campaigns.campaigns(this.signers.bob.address, 0);
        expect(campaign.tokenAddress).to.eq(this.mocks.erc20Token.address);
        expect(campaign.maxClaims).to.eq(10);
        expect(campaign.noOfClaims).to.eq(0);
        expect(campaign.amountPerClaim).to.eq(parseEther("10"));
        expect(campaign.isInactive).to.eq(0);
        expect(campaign.noOfSponsoredClaims).to.eq(0);
        expect(campaign.maxSponsoredClaims).to.eq(3);
      });

      it("should store new campaign - ETH", async function () {
        let campaign = await this.contracts.campaigns.campaigns(this.signers.bob.address, 0);
        expect(campaign.tokenAddress).to.eq(AddressZero);
        expect(campaign.maxClaims).to.eq(0);
        expect(campaign.noOfClaims).to.eq(0);
        expect(campaign.amountPerClaim).to.eq(0);
        expect(campaign.isInactive).to.eq(0);
        expect(campaign.noOfSponsoredClaims).to.eq(0);
        expect(campaign.maxSponsoredClaims).to.eq(0);

        await this.contracts.campaigns
          .connect(this.signers.bob)
          .createCampaign(ETHAddress, 10, parseEther("10"), 2, { value: parseEther("10").mul(10) });

        campaign = await this.contracts.campaigns.campaigns(this.signers.bob.address, 0);
        expect(campaign.tokenAddress).to.eq(ETHAddress);
        expect(campaign.maxClaims).to.eq(10);
        expect(campaign.noOfClaims).to.eq(0);
        expect(campaign.amountPerClaim).to.eq(parseEther("10"));
        expect(campaign.isInactive).to.eq(0);
        expect(campaign.noOfSponsoredClaims).to.eq(0);
        expect(campaign.maxSponsoredClaims).to.eq(2);
      });

      it("should transfer total required tokens if not ETHAddress", async function () {
        const totalAmount = parseEther("10").mul(10);
        await this.mocks.erc20Token.mock.transferFrom
          .withArgs(this.signers.bob.address, this.contracts.campaigns.address, totalAmount)
          .returns(true);

        await this.contracts.campaigns
          .connect(this.signers.bob)
          .createCampaign(this.mocks.erc20Token.address, 10, parseEther("10"), 0);

        // cannot assert token transfer with mock
      });

      it("should revert if token transfer failed if not ETHAddress", async function () {
        const totalAmount = parseEther("10").mul(10);
        await this.mocks.erc20Token.mock.transferFrom
          .withArgs(this.signers.bob.address, this.contracts.campaigns.address, totalAmount)
          .returns(false);

        await expect(
          this.contracts.campaigns
            .connect(this.signers.bob)
            .createCampaign(this.mocks.erc20Token.address, 10, parseEther("10"), 0),
        ).to.be.revertedWith("SafeERC20: ERC20 operation did not succeed");
      });

      it("should revert with IncorrectValue() if total ETH required is not transferred if ETHAddress", async function () {
        // no value
        await expect(
          this.contracts.campaigns.connect(this.signers.bob).createCampaign(ETHAddress, 10, parseEther("10"), 0),
        ).to.be.revertedWithCustomError(this.contracts.campaigns, "IncorrectValue");

        // less value
        await expect(
          this.contracts.campaigns
            .connect(this.signers.bob)
            .createCampaign(ETHAddress, 10, parseEther("10"), 0, { value: parseEther("10").mul(10).sub(1) }),
        ).to.be.revertedWithCustomError(this.contracts.campaigns, "IncorrectValue");

        // more value
        await expect(
          this.contracts.campaigns
            .connect(this.signers.bob)
            .createCampaign(ETHAddress, 10, parseEther("10"), 0, { value: parseEther("10").mul(10).add(1) }),
        ).to.be.revertedWithCustomError(this.contracts.campaigns, "IncorrectValue");
      });

      describe("sponsoredClaims", function () {
        beforeEach(async function () {
          await this.contracts.campaigns.connect(this.signers.alice).setSponsoredClaimFee(SPONSORED_CLAIM_FEE);
          await this.contracts.campaigns.connect(this.signers.alice).setTreasury(this.signers.treasury.address);
        });

        it("should revert with IncorrectValue() if sponsored claim fee not paid if ETHAddress", async function () {
          // less value
          // 10 * 10 + 3 * 0.00025 = 100.00075
          // pay only 10 * 10 = 100
          await expect(
            this.contracts.campaigns
              .connect(this.signers.bob)
              .createCampaign(ETHAddress, 10, parseEther("10"), 3, { value: parseEther("10").mul(10) }),
          ).to.be.revertedWithCustomError(this.contracts.campaigns, "IncorrectValue");

          // more value
          // 10 * 10 + 3 * 0.00025 = 100.00075
          // pay 10 * 10 + 1 = 101
          await expect(
            this.contracts.campaigns
              .connect(this.signers.bob)
              .createCampaign(ETHAddress, 10, parseEther("10"), 0, { value: parseEther("10").mul(10).add(1) }),
          ).to.be.revertedWithCustomError(this.contracts.campaigns, "IncorrectValue");
        });

        it("should revert with IncorrectValue() if sponsored claim fee not paid if not ETHAddress", async function () {
          // no value
          await expect(
            this.contracts.campaigns
              .connect(this.signers.bob)
              .createCampaign(this.mocks.erc20Token.address, 10, parseEther("10"), 3),
          ).to.be.revertedWithCustomError(this.contracts.campaigns, "IncorrectValue");

          // less value
          // 3 * 0.00025 = 0.00075
          // pay only 0.00025
          await expect(
            this.contracts.campaigns
              .connect(this.signers.bob)
              .createCampaign(this.mocks.erc20Token.address, 10, parseEther("10"), 3, { value: parseEther("0.00025") }),
          ).to.be.revertedWithCustomError(this.contracts.campaigns, "IncorrectValue");

          // more value
          // 3 * 0.00025 = 0.00075
          // pay 4 * 0.00025 = 0.001
          await expect(
            this.contracts.campaigns
              .connect(this.signers.bob)
              .createCampaign(this.mocks.erc20Token.address, 10, parseEther("10"), 3, { value: parseEther("0.001") }),
          ).to.be.revertedWithCustomError(this.contracts.campaigns, "IncorrectValue");
        });

        it("should not revert if sponsored claim fee paid if not ETHAddress", async function () {
          const totalAmount = parseEther("10").mul(10);
          await this.mocks.erc20Token.mock.transferFrom
            .withArgs(this.signers.bob.address, this.contracts.campaigns.address, totalAmount)
            .returns(true);

          await this.contracts.campaigns
            .connect(this.signers.bob)
            .createCampaign(this.mocks.erc20Token.address, 10, parseEther("10"), 3, {
              value: SPONSORED_CLAIM_FEE.mul(3),
            });
        });

        it("should not revert if sponsored claim fee paid if ETHAddress", async function () {
          await this.contracts.campaigns.connect(this.signers.bob).createCampaign(ETHAddress, 10, parseEther("10"), 3, {
            value: parseEther("10").mul(10).add(SPONSORED_CLAIM_FEE.mul(3)),
          });
        });

        describe("_paySponsoredClaimFees", function () {
          it("should transfer sponsored claims fees to treasury - ETHAddress", async function () {
            const totalSponsoredClaimFee = SPONSORED_CLAIM_FEE.mul(3);
            const totalCampaignAmount = parseEther("10").mul(10);
            const totalAmount = totalCampaignAmount.add(totalSponsoredClaimFee);

            await expect(() =>
              this.contracts.campaigns.connect(this.signers.bob).createCampaign(ETHAddress, 10, parseEther("10"), 3, {
                value: totalAmount,
              }),
            ).to.changeEtherBalances(
              [this.signers.bob, this.contracts.campaigns, this.signers.treasury],
              [BigNumber.from(0).sub(totalAmount), totalCampaignAmount, totalSponsoredClaimFee],
            );
          });

          it("should transfer sponsored claims fees to treasury - not ETHAddress", async function () {
            const totalSponsoredClaimFee = SPONSORED_CLAIM_FEE.mul(3);
            const totalCampaignAmount = parseEther("10").mul(10);
            await this.mocks.erc20Token.mock.transferFrom
              .withArgs(this.signers.bob.address, this.contracts.campaigns.address, totalCampaignAmount)
              .returns(true);

            await expect(() =>
              this.contracts.campaigns
                .connect(this.signers.bob)
                .createCampaign(this.mocks.erc20Token.address, 10, parseEther("10"), 3, {
                  value: totalSponsoredClaimFee,
                }),
            ).to.changeEtherBalances(
              [this.signers.bob, this.signers.treasury],
              [BigNumber.from(0).sub(totalSponsoredClaimFee), totalSponsoredClaimFee],
            );

            // cannot assert token transfer with mock
          });

          it("should emit SponsoredClaimFeesPaid", async function () {
            const totalSponsoredClaimFee = SPONSORED_CLAIM_FEE.mul(3);
            const totalCampaignAmount = parseEther("10").mul(10);
            const totalAmount = totalCampaignAmount.add(totalSponsoredClaimFee);

            await expect(
              this.contracts.campaigns.connect(this.signers.bob).createCampaign(ETHAddress, 10, parseEther("10"), 3, {
                value: totalAmount,
              }),
            )
              .to.emit(this.contracts.campaigns, "SponsoredClaimFeesPaid")
              .withArgs(3, SPONSORED_CLAIM_FEE, this.signers.treasury.address);
          });
        });
      });
    });

    describe("claim()", function () {
      it("should revert with NonExistentCampaign() if campaignId does not exist", async function () {
        // campaign created with campaignId 0, try claim 1
        await this.contracts.campaigns
          .connect(this.signers.bob) // Bob creates 0
          .createCampaign(this.mocks.erc20Token.address, 10, parseEther("10"), 0);

        // Should fail
        await expect(
          this.contracts.campaigns
            .connect(this.signers.carol) // Carol claims Bob's campaign 1
            .claim(this.signers.bob.address, 1, HashZero, HashZero, HashZero, ethers.constants.AddressZero),
        ).to.be.revertedWithCustomError(this.contracts.campaigns, "NonExistentCampaign");

        // campaign created with campaignId 0, 1, try claim 2
        await this.contracts.campaigns
          .connect(this.signers.carol) // Carol creates 0
          .createCampaign(this.mocks.erc20Token.address, 10, parseEther("10"), 0);
        await this.contracts.campaigns
          .connect(this.signers.carol) // Carol creates 1
          .createCampaign(this.mocks.erc20Token.address, 10, parseEther("10"), 0);
        // Should fail
        await expect(
          this.contracts.campaigns
            .connect(this.signers.bob) // Bob claims Carol's non-existent campaign 2
            .claim(this.signers.carol.address, 2, HashZero, HashZero, HashZero, ethers.constants.AddressZero),
        ).to.be.revertedWithCustomError(this.contracts.campaigns, "NonExistentCampaign");

        // campaign not created with campaignId 0, try claim 0, 1
        // Should fail
        await expect(
          this.contracts.campaigns
            .connect(this.signers.carol) // Carol claims David's non-existent campaign 0
            .claim(this.signers.david.address, 0, HashZero, HashZero, HashZero, ethers.constants.AddressZero),
        ).to.be.revertedWithCustomError(this.contracts.campaigns, "NonExistentCampaign");
        await expect(
          this.contracts.campaigns
            .connect(this.signers.carol) // Carol claims David's non-existent campaign 1
            .claim(this.signers.david.address, 1, HashZero, HashZero, HashZero, ethers.constants.AddressZero),
        ).to.be.revertedWithCustomError(this.contracts.campaigns, "NonExistentCampaign");
      });

      it("should revert with InactiveCampaign() if campaign is inactive", async function () {
        // campaign created with campaignId 0, try claim 0
        await this.contracts.campaigns
          .connect(this.signers.bob) // Bob creates 0
          .createCampaign(this.mocks.erc20Token.address, 10, parseEther("10"), 0);

        const { v, r, s } = await Campaigns_generateClaimSignature(
          this.contracts.campaigns,
          "Campaigns",
          this.signers.bob.address,
          0,
          this.signers.carol.address,
          this.signers.trustedAddress,
        );
        // Shouldn't fail
        await this.mocks.erc20Token.mock.transfer.returns(true);
        await this.contracts.campaigns
          .connect(this.signers.carol) // Carol claims Bob's campaign 0
          .claim(this.signers.bob.address, 0, r, s, v, ethers.constants.AddressZero, { value: CLAIM_FEE });

        // Withdraw Campaign
        await this.contracts.campaigns.connect(this.signers.bob).withdrawCampaign(0);

        await expect(
          this.contracts.campaigns
            .connect(this.signers.david) // David claims Bob's inactive campaign
            .claim(this.signers.bob.address, 0, HashZero, HashZero, HashZero, ethers.constants.AddressZero),
        ).to.be.revertedWithCustomError(this.contracts.campaigns, "InactiveCampaign");
      });

      it("should revert with AlreadyClaimed() if user has already claimed", async function () {
        // campaign created with campaignId 0, try claim 0
        await this.contracts.campaigns
          .connect(this.signers.bob) // Bob creates 0
          .createCampaign(this.mocks.erc20Token.address, 10, parseEther("10"), 0);

        const { v, r, s } = await Campaigns_generateClaimSignature(
          this.contracts.campaigns,
          "Campaigns",
          this.signers.bob.address,
          0,
          this.signers.carol.address,
          this.signers.trustedAddress,
        );
        // Shouldn't fail
        await this.mocks.erc20Token.mock.transfer.returns(true);
        await this.contracts.campaigns
          .connect(this.signers.carol) // Carol claims Bob's campaign 0
          .claim(this.signers.bob.address, 0, r, s, v, ethers.constants.AddressZero, { value: CLAIM_FEE });

        // Try claiming again. Should fail
        await expect(
          this.contracts.campaigns
            .connect(this.signers.carol) // Carol claims Bob's campaign 0
            .claim(this.signers.bob.address, 0, HashZero, HashZero, HashZero, ethers.constants.AddressZero, {
              value: CLAIM_FEE,
            }),
        ).to.be.revertedWithCustomError(this.contracts.campaigns, "AlreadyClaimed");
      });

      it("should revert with InvalidAddress() if sender == _referrer", async function () {
        // campaign created with campaignId 0, try claim 0
        await this.contracts.campaigns
          .connect(this.signers.bob) // Bob creates 0
          .createCampaign(this.mocks.erc20Token.address, 10, parseEther("10"), 0);

        const { v, r, s } = await Campaigns_generateClaimSignature(
          this.contracts.campaigns,
          "Campaigns",
          this.signers.bob.address,
          0,
          this.signers.carol.address,
          this.signers.david,
        );

        // Try claiming with wrong signature from david. Should fail
        await expect(
          this.contracts.campaigns
            .connect(this.signers.carol) // Carol claims Bob's campaign 0
            .claim(this.signers.bob.address, 0, r, s, v, this.signers.carol.address, { value: CLAIM_FEE }),
        ).to.be.revertedWithCustomError(this.contracts.campaigns, "InvalidAddress");
      });

      it("should revert with InvalidAddress() if invalid signer", async function () {
        // campaign created with campaignId 0, try claim 0
        await this.contracts.campaigns
          .connect(this.signers.bob) // Bob creates 0
          .createCampaign(this.mocks.erc20Token.address, 10, parseEther("10"), 0);

        const { v, r, s } = await Campaigns_generateClaimSignature(
          this.contracts.campaigns,
          "Campaigns",
          this.signers.bob.address,
          0,
          this.signers.carol.address,
          this.signers.david,
        );

        // Try claiming with wrong signature from david. Should fail
        await expect(
          this.contracts.campaigns
            .connect(this.signers.carol) // Carol claims Bob's campaign 0
            .claim(this.signers.bob.address, 0, r, s, v, ethers.constants.AddressZero, { value: CLAIM_FEE }),
        ).to.be.revertedWithCustomError(this.contracts.campaigns, "InvalidAddress");
      });

      it("should revert with InvalidAddress() if invalid signature", async function () {
        // campaign created with campaignId 0, try claim 0
        await this.contracts.campaigns
          .connect(this.signers.bob) // Bob creates 0
          .createCampaign(this.mocks.erc20Token.address, 10, parseEther("10"), 0);

        const { v, r, s } = await Campaigns_generateClaimSignature(
          this.contracts.campaigns,
          "Campaigns",
          this.signers.bob.address,
          0,
          this.signers.eve.address,
          this.signers.trustedAddress,
        );

        // Try claiming with wrong signature from david. Should fail
        await expect(
          this.contracts.campaigns
            .connect(this.signers.carol) // Carol claims Bob's campaign 0
            .claim(this.signers.bob.address, 0, r, s, v, ethers.constants.AddressZero, { value: CLAIM_FEE }),
        ).to.be.revertedWithCustomError(this.contracts.campaigns, "InvalidAddress");
      });

      it("should not revert with InvalidAddress() if signer is trustedAddress", async function () {
        // campaign created with campaignId 0, try claim 0
        await this.contracts.campaigns
          .connect(this.signers.bob) // Bob creates 0
          .createCampaign(this.mocks.erc20Token.address, 10, parseEther("10"), 0);

        const { v, r, s } = await Campaigns_generateClaimSignature(
          this.contracts.campaigns,
          "Campaigns",
          this.signers.bob.address,
          0,
          this.signers.carol.address,
          this.signers.trustedAddress,
        );

        // Try claiming with signature from trustedAddress. Shouldn't fail
        await this.mocks.erc20Token.mock.transfer.returns(true);
        await this.contracts.campaigns
          .connect(this.signers.carol) // Carol claims Bob's campaign 0
          .claim(this.signers.bob.address, 0, r, s, v, ethers.constants.AddressZero, { value: CLAIM_FEE });
      });

      it("should revert with InvalidFee() if fee not correctly paid", async function () {
        // campaign created with campaignId 0, try claim 0
        await this.contracts.campaigns
          .connect(this.signers.bob) // Bob creates 0
          .createCampaign(this.mocks.erc20Token.address, 10, parseEther("10"), 0);

        const { v, r, s } = await Campaigns_generateClaimSignature(
          this.contracts.campaigns,
          "Campaigns",
          this.signers.bob.address,
          0,
          this.signers.carol.address,
          this.signers.trustedAddress,
        );

        // no fee
        await expect(
          this.contracts.campaigns
            .connect(this.signers.carol) // Carol claims Bob's campaign 0
            .claim(this.signers.bob.address, 0, r, s, v, ethers.constants.AddressZero),
        ).to.be.revertedWithCustomError(this.contracts.campaigns, "InvalidFee");

        // less fee
        await expect(
          this.contracts.campaigns
            .connect(this.signers.carol) // Carol claims Bob's campaign 0
            .claim(this.signers.bob.address, 0, r, s, v, ethers.constants.AddressZero, { value: CLAIM_FEE.sub(1) }),
        ).to.be.revertedWithCustomError(this.contracts.campaigns, "InvalidFee");

        // more fee
        await expect(
          this.contracts.campaigns
            .connect(this.signers.carol) // Carol claims Bob's campaign 0
            .claim(this.signers.bob.address, 0, r, s, v, ethers.constants.AddressZero, { value: CLAIM_FEE.add(1) }),
        ).to.be.revertedWithCustomError(this.contracts.campaigns, "InvalidFee");
      });

      it("should allow claiming without any fee if claimFee = 0", async function () {
        // campaign created with campaignId 0, try claim 0
        await this.contracts.campaigns
          .connect(this.signers.bob) // Bob creates 0
          .createCampaign(this.mocks.erc20Token.address, 10, parseEther("10"), 0);

        const { v, r, s } = await Campaigns_generateClaimSignature(
          this.contracts.campaigns,
          "Campaigns",
          this.signers.bob.address,
          0,
          this.signers.carol.address,
          this.signers.trustedAddress,
        );

        // set claimFee to zero
        await this.contracts.campaigns.connect(this.signers.alice).setClaimFee(0);

        // some fee. should fail
        await expect(
          this.contracts.campaigns
            .connect(this.signers.carol) // Carol claims Bob's campaign 0
            .claim(this.signers.bob.address, 0, r, s, v, ethers.constants.AddressZero, { value: CLAIM_FEE }),
        ).to.be.revertedWithCustomError(this.contracts.campaigns, "InvalidFee");

        // no fee. shouldn't fail
        await this.mocks.erc20Token.mock.transfer.returns(true);
        await this.contracts.campaigns
          .connect(this.signers.carol) // Carol claims Bob's campaign 0
          .claim(this.signers.bob.address, 0, r, s, v, ethers.constants.AddressZero);
      });

      it("should revert with ExceedsMaxClaims() if campaign fully claimed", async function () {
        // campaign created with campaignId 0, try claim 0
        await this.contracts.campaigns
          .connect(this.signers.bob) // Bob creates 0
          .createCampaign(this.mocks.erc20Token.address, 3, parseEther("10"), 0);

        await this.mocks.erc20Token.mock.transfer.returns(true);
        // Carol claims
        let { v, r, s } = await Campaigns_generateClaimSignature(
          this.contracts.campaigns,
          "Campaigns",
          this.signers.bob.address,
          0,
          this.signers.carol.address,
          this.signers.trustedAddress,
        );
        await this.contracts.campaigns
          .connect(this.signers.carol) // Carol claims Bob's campaign 0
          .claim(this.signers.bob.address, 0, r, s, v, ethers.constants.AddressZero, { value: CLAIM_FEE });

        // David claims
        ({ v, r, s } = await Campaigns_generateClaimSignature(
          this.contracts.campaigns,
          "Campaigns",
          this.signers.bob.address,
          0,
          this.signers.david.address,
          this.signers.trustedAddress,
        ));
        await this.contracts.campaigns
          .connect(this.signers.david) // David claims Bob's campaign 0
          .claim(this.signers.bob.address, 0, r, s, v, ethers.constants.AddressZero, { value: CLAIM_FEE });

        // Eve claims
        ({ v, r, s } = await Campaigns_generateClaimSignature(
          this.contracts.campaigns,
          "Campaigns",
          this.signers.bob.address,
          0,
          this.signers.eve.address,
          this.signers.trustedAddress,
        ));
        await this.contracts.campaigns
          .connect(this.signers.eve) // Eve claims Bob's campaign 0
          .claim(this.signers.bob.address, 0, r, s, v, ethers.constants.AddressZero, { value: CLAIM_FEE });

        // Alice tries to claim. Should fail
        ({ v, r, s } = await Campaigns_generateClaimSignature(
          this.contracts.campaigns,
          "Campaigns",
          this.signers.bob.address,
          0,
          this.signers.alice.address,
          this.signers.trustedAddress,
        ));
        await expect(
          this.contracts.campaigns
            .connect(this.signers.alice) // Alice claims Bob's campaign 0
            .claim(this.signers.bob.address, 0, r, s, v, ethers.constants.AddressZero, { value: CLAIM_FEE }),
        ).to.be.revertedWithCustomError(this.contracts.campaigns, "ExceedsMaxClaims");
      });

      it("should transfer amountPerClaim ether if ETHAddress", async function () {
        // campaign created with campaignId 0, try claim 0
        await this.contracts.campaigns
          .connect(this.signers.bob) // Bob creates 0
          .createCampaign(ETHAddress, 10, parseEther("10"), 0, { value: parseEther("10").mul(10) });

        const { v, r, s } = await Campaigns_generateClaimSignature(
          this.contracts.campaigns,
          "Campaigns",
          this.signers.bob.address,
          0,
          this.signers.carol.address,
          this.signers.trustedAddress,
        );

        // Try claiming with signature from trustedAddress. Shouldn't fail
        await expect(
          this.contracts.campaigns
            .connect(this.signers.carol) // Carol claims Bob's campaign 0
            .claim(this.signers.bob.address, 0, r, s, v, ethers.constants.AddressZero, { value: CLAIM_FEE }),
        ).to.changeEtherBalances(
          [this.contracts.campaigns, this.signers.carol],
          [BigNumber.from(0).sub(parseEther("10")), parseEther("10").sub(CLAIM_FEE)],
        );
      });

      it("should transfer amountPerClaim tokens if not ETHAddress", async function () {
        const totalAmount = parseEther("10").mul(10);
        await this.mocks.erc20Token.mock.transferFrom
          .withArgs(this.signers.bob.address, this.contracts.campaigns.address, totalAmount)
          .returns(true);

        await this.contracts.campaigns
          .connect(this.signers.bob)
          .createCampaign(this.mocks.erc20Token.address, 10, parseEther("10"), 0);
        // cannot assert token transfer with mock

        const { v, r, s } = await Campaigns_generateClaimSignature(
          this.contracts.campaigns,
          "Campaigns",
          this.signers.bob.address,
          0,
          this.signers.carol.address,
          this.signers.trustedAddress,
        );

        // Try claiming with signature from trustedAddress. Shouldn't fail
        await this.mocks.erc20Token.mock.transfer.withArgs(this.signers.carol.address, parseEther("10")).returns(true);
        await this.contracts.campaigns
          .connect(this.signers.carol) // Carol claims Bob's campaign 0
          .claim(this.signers.bob.address, 0, r, s, v, ethers.constants.AddressZero, { value: CLAIM_FEE });
        // cannot assert token transfer with mock
      });

      it("should emit CampaignClaimed() - ETHAddress", async function () {
        // campaign created with campaignId 0, try claim 0
        await this.contracts.campaigns
          .connect(this.signers.bob) // Bob creates 0
          .createCampaign(ETHAddress, 10, parseEther("10"), 0, { value: parseEther("10").mul(10) });

        const { v, r, s } = await Campaigns_generateClaimSignature(
          this.contracts.campaigns,
          "Campaigns",
          this.signers.bob.address,
          0,
          this.signers.carol.address,
          this.signers.trustedAddress,
        );

        // Try claiming with signature from trustedAddress. Shouldn't fail
        await expect(
          this.contracts.campaigns
            .connect(this.signers.carol) // Carol claims Bob's campaign 0
            .claim(this.signers.bob.address, 0, r, s, v, ethers.constants.AddressZero, { value: CLAIM_FEE }),
        )
          .to.emit(this.contracts.campaigns, "CampaignClaimed")
          .withArgs(this.signers.bob.address, 0, this.signers.carol.address, ETHAddress, parseEther("10"));
      });

      it("should emit CampaignClaimed() - ERC20", async function () {
        const totalAmount = parseEther("10").mul(10);
        await this.mocks.erc20Token.mock.transferFrom
          .withArgs(this.signers.bob.address, this.contracts.campaigns.address, totalAmount)
          .returns(true);

        await this.contracts.campaigns
          .connect(this.signers.bob)
          .createCampaign(this.mocks.erc20Token.address, 10, parseEther("10"), 0);
        // cannot assert token transfer with mock

        const { v, r, s } = await Campaigns_generateClaimSignature(
          this.contracts.campaigns,
          "Campaigns",
          this.signers.bob.address,
          0,
          this.signers.carol.address,
          this.signers.trustedAddress,
        );

        // Try claiming with signature from trustedAddress. Shouldn't fail
        await this.mocks.erc20Token.mock.transfer.withArgs(this.signers.carol.address, parseEther("10")).returns(true);
        await expect(
          this.contracts.campaigns
            .connect(this.signers.carol) // Carol claims Bob's campaign 0
            .claim(this.signers.bob.address, 0, r, s, v, ethers.constants.AddressZero, { value: CLAIM_FEE }),
        )
          .to.emit(this.contracts.campaigns, "CampaignClaimed")
          .withArgs(
            this.signers.bob.address,
            0,
            this.signers.carol.address,
            this.mocks.erc20Token.address,
            parseEther("10"),
          );
        // cannot assert token transfer with mock
      });

      it("Should revert if transfer failed if ETHAddress", async function () {
        const RevertOnReceiveEther = await ethers.getContractFactory("RevertOnReceiveEther");
        const revertOnReceiveEther = await RevertOnReceiveEther.deploy();

        // campaign created with campaignId 0, try claim 0
        await this.contracts.campaigns
          .connect(this.signers.bob) // Bob creates 0
          .createCampaign(ETHAddress, 10, parseEther("10"), 0, { value: parseEther("10").mul(10) });

        const { v, r, s } = await Campaigns_generateClaimSignature(
          this.contracts.campaigns,
          "Campaigns",
          this.signers.bob.address,
          0,
          revertOnReceiveEther.address,
          this.signers.trustedAddress,
        );

        await expect(
          revertOnReceiveEther.claim(this.contracts.campaigns.address, this.signers.bob.address, 0, r, s, v, {
            value: CLAIM_FEE,
          }),
        ).to.be.revertedWithCustomError(this.contracts.campaigns, "TransferFailed");
      });

      it("should update Campaign state & increment totalClaimFees", async function () {
        // campaign created with campaignId 0, try claim 0
        await this.contracts.campaigns
          .connect(this.signers.bob) // Bob creates 0
          .createCampaign(ETHAddress, 10, parseEther("10"), 0, { value: parseEther("10").mul(10) });

        // Assert state before claim
        let _campaign = await this.contracts.campaigns.campaigns(this.signers.bob.address, 0);
        expect(_campaign.noOfClaims).to.equal(0);
        let _hasClaimed = await this.contracts.campaigns.hasClaimed(
          ethers.utils.solidityKeccak256(
            ["bytes"],
            [
              ethers.utils.defaultAbiCoder.encode(
                ["address", "uint256", "address"],
                [this.signers.bob.address, 0, this.signers.carol.address],
              ),
            ],
          ),
        );
        expect(_hasClaimed).to.eq(0);
        expect(Boolean(Number(_hasClaimed))).to.eq(false);
        expect(await this.contracts.campaigns.totalClaimFees()).to.eq(0);

        const { v, r, s } = await Campaigns_generateClaimSignature(
          this.contracts.campaigns,
          "Campaigns",
          this.signers.bob.address,
          0,
          this.signers.carol.address,
          this.signers.trustedAddress,
        );

        // Try claiming with signature from trustedAddress. Shouldn't fail
        await expect(
          this.contracts.campaigns
            .connect(this.signers.carol) // Carol claims Bob's campaign 0
            .claim(this.signers.bob.address, 0, r, s, v, ethers.constants.AddressZero, { value: CLAIM_FEE }),
        ).to.changeEtherBalances(
          [this.contracts.campaigns, this.signers.carol],
          [BigNumber.from(0).sub(parseEther("10")), parseEther("10").sub(CLAIM_FEE)],
        );

        // Assert state after claim
        _campaign = await this.contracts.campaigns.campaigns(this.signers.bob.address, 0);
        expect(_campaign.noOfClaims).to.equal(1);
        _hasClaimed = await this.contracts.campaigns.hasClaimed(
          ethers.utils.solidityKeccak256(
            ["bytes"],
            [
              ethers.utils.defaultAbiCoder.encode(
                ["address", "uint256", "address"],
                [this.signers.bob.address, 0, this.signers.carol.address],
              ),
            ],
          ),
        );
        expect(_hasClaimed).to.eq(1);
        expect(Boolean(Number(_hasClaimed))).to.eq(true);
        expect(await this.contracts.campaigns.totalClaimFees()).to.eq(CLAIM_FEE);
      });

      describe("sponsoredClaims", function () {
        beforeEach(async function () {
          await this.contracts.campaigns.connect(this.signers.alice).setSponsoredClaimFee(SPONSORED_CLAIM_FEE);
          await this.contracts.campaigns.connect(this.signers.alice).setTreasury(this.signers.treasury.address);
        });

        describe("ETHAddress", function () {
          it("should not charge claim fee if sponsored claims are available", async function () {
            // campaign created with campaignId 0, try claim 0
            const totalSponsoredClaimFee = SPONSORED_CLAIM_FEE.mul(3);
            const totalCampaignAmount = parseEther("10").mul(10);
            const totalAmount = totalCampaignAmount.add(totalSponsoredClaimFee);
            await this.contracts.campaigns
              .connect(this.signers.bob) // Bob creates 0
              .createCampaign(ETHAddress, 10, parseEther("10"), 3, { value: totalAmount });

            const { v, r, s } = await Campaigns_generateClaimSignature(
              this.contracts.campaigns,
              "Campaigns",
              this.signers.bob.address,
              0,
              this.signers.carol.address,
              this.signers.trustedAddress,
            );

            let campaign = await this.contracts.campaigns.campaigns(this.signers.bob.address, 0);
            expect(campaign.noOfSponsoredClaims).to.eq(0);
            expect(campaign.maxSponsoredClaims).to.eq(3);
            // Try claiming with signature from trustedAddress
            // Not passing claim fee. Shouldn't fail
            await expect(
              this.contracts.campaigns
                .connect(this.signers.carol) // Carol claims Bob's campaign 0
                .claim(this.signers.bob.address, 0, r, s, v, ethers.constants.AddressZero),
            ).to.changeEtherBalances(
              [this.contracts.campaigns, this.signers.carol],
              [BigNumber.from(0).sub(parseEther("10")), parseEther("10")],
            );
            campaign = await this.contracts.campaigns.campaigns(this.signers.bob.address, 0);
            expect(campaign.noOfSponsoredClaims).to.eq(1);
            expect(campaign.maxSponsoredClaims).to.eq(3);
          });

          it("should charge claim fee if sponsored claims are used", async function () {
            // campaign created with campaignId 0, try claim 0
            const totalSponsoredClaimFee = SPONSORED_CLAIM_FEE.mul(1);
            const totalCampaignAmount = parseEther("10").mul(10);
            const totalAmount = totalCampaignAmount.add(totalSponsoredClaimFee);
            await this.contracts.campaigns
              .connect(this.signers.bob) // Bob creates 0
              .createCampaign(ETHAddress, 10, parseEther("10"), 1, { value: totalAmount });

            let { v, r, s } = await Campaigns_generateClaimSignature(
              this.contracts.campaigns,
              "Campaigns",
              this.signers.bob.address,
              0,
              this.signers.carol.address,
              this.signers.trustedAddress,
            );

            let campaign = await this.contracts.campaigns.campaigns(this.signers.bob.address, 0);
            expect(campaign.noOfSponsoredClaims).to.eq(0);
            expect(campaign.maxSponsoredClaims).to.eq(1);
            // Try claiming with signature from trustedAddress
            // Not passing claim fee. Shouldn't fail
            await expect(
              this.contracts.campaigns
                .connect(this.signers.carol) // Carol claims Bob's campaign 0
                .claim(this.signers.bob.address, 0, r, s, v, ethers.constants.AddressZero),
            ).to.changeEtherBalances(
              [this.contracts.campaigns, this.signers.carol],
              [BigNumber.from(0).sub(parseEther("10")), parseEther("10")],
            );
            campaign = await this.contracts.campaigns.campaigns(this.signers.bob.address, 0);
            expect(campaign.noOfSponsoredClaims).to.eq(1);
            expect(campaign.maxSponsoredClaims).to.eq(1);

            ({ v, r, s } = await Campaigns_generateClaimSignature(
              this.contracts.campaigns,
              "Campaigns",
              this.signers.bob.address,
              0,
              this.signers.david.address,
              this.signers.trustedAddress,
            ));

            // Not passing claim fee. Should fail because sponsored claims are used
            await expect(
              this.contracts.campaigns
                .connect(this.signers.david) // David claims Bob's campaign 0
                .claim(this.signers.bob.address, 0, r, s, v, ethers.constants.AddressZero),
            ).to.be.revertedWithCustomError(this.contracts.campaigns, "InvalidFee");

            campaign = await this.contracts.campaigns.campaigns(this.signers.bob.address, 0);
            expect(campaign.noOfSponsoredClaims).to.eq(1);
            expect(campaign.maxSponsoredClaims).to.eq(1);
            // passing claim fee. Shouldn't fail
            await expect(
              this.contracts.campaigns
                .connect(this.signers.david) // David claims Bob's campaign 0
                .claim(this.signers.bob.address, 0, r, s, v, ethers.constants.AddressZero, { value: CLAIM_FEE }),
            ).to.changeEtherBalances(
              [this.contracts.campaigns, this.signers.david],
              [BigNumber.from(0).sub(parseEther("10")), parseEther("10").sub(CLAIM_FEE)],
            );
            campaign = await this.contracts.campaigns.campaigns(this.signers.bob.address, 0);
            expect(campaign.noOfSponsoredClaims).to.eq(1);
            expect(campaign.maxSponsoredClaims).to.eq(1);
          });

          it("should charge claim fee if sponsored claims are zero", async function () {
            // campaign created with campaignId 0, try claim 0
            const totalSponsoredClaimFee = SPONSORED_CLAIM_FEE.mul(0);
            const totalCampaignAmount = parseEther("10").mul(10);
            const totalAmount = totalCampaignAmount.add(totalSponsoredClaimFee);
            await this.contracts.campaigns
              .connect(this.signers.bob) // Bob creates 0
              .createCampaign(ETHAddress, 10, parseEther("10"), 0, { value: totalAmount });

            const { v, r, s } = await Campaigns_generateClaimSignature(
              this.contracts.campaigns,
              "Campaigns",
              this.signers.bob.address,
              0,
              this.signers.carol.address,
              this.signers.trustedAddress,
            );

            let campaign = await this.contracts.campaigns.campaigns(this.signers.bob.address, 0);
            expect(campaign.noOfSponsoredClaims).to.eq(0);
            expect(campaign.maxSponsoredClaims).to.eq(0);
            // Try claiming with signature from trustedAddress
            // Not passing claim fee. Should fail because sponsored claims are zero
            await expect(
              this.contracts.campaigns
                .connect(this.signers.carol) // Carol claims Bob's campaign 0
                .claim(this.signers.bob.address, 0, r, s, v, ethers.constants.AddressZero),
            ).to.be.revertedWithCustomError(this.contracts.campaigns, "InvalidFee");

            // passing claim fee. Shouldn't fail
            await expect(
              this.contracts.campaigns
                .connect(this.signers.carol) // Carol claims Bob's campaign 0
                .claim(this.signers.bob.address, 0, r, s, v, ethers.constants.AddressZero, { value: CLAIM_FEE }),
            ).to.changeEtherBalances(
              [this.contracts.campaigns, this.signers.carol],
              [BigNumber.from(0).sub(parseEther("10")), parseEther("10").sub(CLAIM_FEE)],
            );
            campaign = await this.contracts.campaigns.campaigns(this.signers.bob.address, 0);
            expect(campaign.noOfSponsoredClaims).to.eq(0);
            expect(campaign.maxSponsoredClaims).to.eq(0);
          });

          it("should revert if value passed even for sponsored claim", async function () {
            // campaign created with campaignId 0, try claim 0
            const totalSponsoredClaimFee = SPONSORED_CLAIM_FEE.mul(3);
            const totalCampaignAmount = parseEther("10").mul(10);
            const totalAmount = totalCampaignAmount.add(totalSponsoredClaimFee);
            await this.contracts.campaigns
              .connect(this.signers.bob) // Bob creates 0
              .createCampaign(ETHAddress, 10, parseEther("10"), 3, { value: totalAmount });

            const { v, r, s } = await Campaigns_generateClaimSignature(
              this.contracts.campaigns,
              "Campaigns",
              this.signers.bob.address,
              0,
              this.signers.carol.address,
              this.signers.trustedAddress,
            );

            // Try claiming with signature from trustedAddress
            // Passing claim fee. Should fail
            await expect(
              this.contracts.campaigns
                .connect(this.signers.carol) // Carol claims Bob's campaign 0
                .claim(this.signers.bob.address, 0, r, s, v, ethers.constants.AddressZero, {
                  value: CLAIM_FEE,
                }),
            ).to.be.revertedWithCustomError(this.contracts.campaigns, "InvalidFee");
          });
        });

        describe("ERC20", function () {
          it("should not charge claim fee if sponsored claims are available", async function () {
            const totalSponsoredClaimFee = SPONSORED_CLAIM_FEE.mul(3);
            const totalCampaignAmount = parseEther("10").mul(10);
            await this.mocks.erc20Token.mock.transferFrom
              .withArgs(this.signers.bob.address, this.contracts.campaigns.address, totalCampaignAmount)
              .returns(true);

            // campaign created with campaignId 0, try claim 0
            await this.contracts.campaigns
              .connect(this.signers.bob) // Bob creates 0
              .createCampaign(this.mocks.erc20Token.address, 10, parseEther("10"), 3, {
                value: totalSponsoredClaimFee,
              });

            const { v, r, s } = await Campaigns_generateClaimSignature(
              this.contracts.campaigns,
              "Campaigns",
              this.signers.bob.address,
              0,
              this.signers.carol.address,
              this.signers.trustedAddress,
            );

            let campaign = await this.contracts.campaigns.campaigns(this.signers.bob.address, 0);
            expect(campaign.noOfSponsoredClaims).to.eq(0);
            expect(campaign.maxSponsoredClaims).to.eq(3);

            // Try claiming with signature from trustedAddress
            // Not passing claim fee. Shouldn't fail
            await this.mocks.erc20Token.mock.transfer
              .withArgs(this.signers.carol.address, parseEther("10"))
              .returns(true);
            await this.contracts.campaigns
              .connect(this.signers.carol) // Carol claims Bob's campaign 0
              .claim(this.signers.bob.address, 0, r, s, v, ethers.constants.AddressZero);

            campaign = await this.contracts.campaigns.campaigns(this.signers.bob.address, 0);
            expect(campaign.noOfSponsoredClaims).to.eq(1);
            expect(campaign.maxSponsoredClaims).to.eq(3);
          });

          it("should charge claim fee if sponsored claims are used", async function () {
            const totalSponsoredClaimFee = SPONSORED_CLAIM_FEE.mul(1);
            const totalCampaignAmount = parseEther("10").mul(10);
            await this.mocks.erc20Token.mock.transferFrom
              .withArgs(this.signers.bob.address, this.contracts.campaigns.address, totalCampaignAmount)
              .returns(true);

            // campaign created with campaignId 0, try claim 0
            await this.contracts.campaigns
              .connect(this.signers.bob) // Bob creates 0
              .createCampaign(this.mocks.erc20Token.address, 10, parseEther("10"), 1, {
                value: totalSponsoredClaimFee,
              });

            let { v, r, s } = await Campaigns_generateClaimSignature(
              this.contracts.campaigns,
              "Campaigns",
              this.signers.bob.address,
              0,
              this.signers.carol.address,
              this.signers.trustedAddress,
            );

            let campaign = await this.contracts.campaigns.campaigns(this.signers.bob.address, 0);
            expect(campaign.noOfSponsoredClaims).to.eq(0);
            expect(campaign.maxSponsoredClaims).to.eq(1);

            // Try claiming with signature from trustedAddress
            // Not passing claim fee. Shouldn't fail
            await this.mocks.erc20Token.mock.transfer
              .withArgs(this.signers.carol.address, parseEther("10"))
              .returns(true);
            await this.contracts.campaigns
              .connect(this.signers.carol) // Carol claims Bob's campaign 0
              .claim(this.signers.bob.address, 0, r, s, v, ethers.constants.AddressZero);
            campaign = await this.contracts.campaigns.campaigns(this.signers.bob.address, 0);
            expect(campaign.noOfSponsoredClaims).to.eq(1);
            expect(campaign.maxSponsoredClaims).to.eq(1);

            ({ v, r, s } = await Campaigns_generateClaimSignature(
              this.contracts.campaigns,
              "Campaigns",
              this.signers.bob.address,
              0,
              this.signers.david.address,
              this.signers.trustedAddress,
            ));

            // Not passing claim fee. Should fail because sponsored claims are used
            await expect(
              this.contracts.campaigns
                .connect(this.signers.david) // David claims Bob's campaign 0
                .claim(this.signers.bob.address, 0, r, s, v, ethers.constants.AddressZero),
            ).to.be.revertedWithCustomError(this.contracts.campaigns, "InvalidFee");

            campaign = await this.contracts.campaigns.campaigns(this.signers.bob.address, 0);
            expect(campaign.noOfSponsoredClaims).to.eq(1);
            expect(campaign.maxSponsoredClaims).to.eq(1);
            // passing claim fee. Shouldn't fail
            await this.mocks.erc20Token.mock.transfer
              .withArgs(this.signers.david.address, parseEther("10"))
              .returns(true);
            await this.contracts.campaigns
              .connect(this.signers.david) // David claims Bob's campaign 0
              .claim(this.signers.bob.address, 0, r, s, v, ethers.constants.AddressZero, { value: CLAIM_FEE });
            campaign = await this.contracts.campaigns.campaigns(this.signers.bob.address, 0);
            expect(campaign.noOfSponsoredClaims).to.eq(1);
            expect(campaign.maxSponsoredClaims).to.eq(1);
          });

          it("should charge claim fee if sponsored claims are zero", async function () {
            const totalCampaignAmount = parseEther("10").mul(10);
            await this.mocks.erc20Token.mock.transferFrom
              .withArgs(this.signers.bob.address, this.contracts.campaigns.address, totalCampaignAmount)
              .returns(true);

            // campaign created with campaignId 0, try claim 0
            await this.contracts.campaigns
              .connect(this.signers.bob) // Bob creates 0
              .createCampaign(this.mocks.erc20Token.address, 10, parseEther("10"), 0);

            const { v, r, s } = await Campaigns_generateClaimSignature(
              this.contracts.campaigns,
              "Campaigns",
              this.signers.bob.address,
              0,
              this.signers.carol.address,
              this.signers.trustedAddress,
            );

            let campaign = await this.contracts.campaigns.campaigns(this.signers.bob.address, 0);
            expect(campaign.noOfSponsoredClaims).to.eq(0);
            expect(campaign.maxSponsoredClaims).to.eq(0);
            // Try claiming with signature from trustedAddress
            // Not passing claim fee. Should fail because sponsored claims are zero
            await expect(
              this.contracts.campaigns
                .connect(this.signers.carol) // Carol claims Bob's campaign 0
                .claim(this.signers.bob.address, 0, r, s, v, ethers.constants.AddressZero),
            ).to.be.revertedWithCustomError(this.contracts.campaigns, "InvalidFee");

            // passing claim fee. Shouldn't fail
            await this.mocks.erc20Token.mock.transfer
              .withArgs(this.signers.carol.address, parseEther("10"))
              .returns(true);
            await this.contracts.campaigns
              .connect(this.signers.carol) // Carol claims Bob's campaign 0
              .claim(this.signers.bob.address, 0, r, s, v, ethers.constants.AddressZero, { value: CLAIM_FEE });
            campaign = await this.contracts.campaigns.campaigns(this.signers.bob.address, 0);
            expect(campaign.noOfSponsoredClaims).to.eq(0);
            expect(campaign.maxSponsoredClaims).to.eq(0);
          });

          it("should revert if value passed even for sponsored claim", async function () {
            const totalSponsoredClaimFee = SPONSORED_CLAIM_FEE.mul(1);
            const totalCampaignAmount = parseEther("10").mul(10);
            await this.mocks.erc20Token.mock.transferFrom
              .withArgs(this.signers.bob.address, this.contracts.campaigns.address, totalCampaignAmount)
              .returns(true);

            // campaign created with campaignId 0, try claim 0
            await this.contracts.campaigns
              .connect(this.signers.bob) // Bob creates 0
              .createCampaign(this.mocks.erc20Token.address, 10, parseEther("10"), 1, {
                value: totalSponsoredClaimFee,
              });

            const { v, r, s } = await Campaigns_generateClaimSignature(
              this.contracts.campaigns,
              "Campaigns",
              this.signers.bob.address,
              0,
              this.signers.carol.address,
              this.signers.trustedAddress,
            );

            // Try claiming with signature from trustedAddress
            // Passing claim fee. Should fail
            await this.mocks.erc20Token.mock.transfer
              .withArgs(this.signers.carol.address, parseEther("10"))
              .returns(true);
            await expect(
              this.contracts.campaigns
                .connect(this.signers.carol) // David claims Bob's campaign 0
                .claim(this.signers.bob.address, 0, r, s, v, ethers.constants.AddressZero, { value: CLAIM_FEE }),
            ).to.be.revertedWithCustomError(this.contracts.campaigns, "InvalidFee");
          });
        });
      });
    });

    describe("withdrawCampaign()", function () {
      it("should revert with NonExistentCampaign() if campaignId does not exist", async function () {
        await this.mocks.erc20Token.mock.transfer.returns(true);
        // campaign created with campaignId 0, try withdrawing 1
        await this.contracts.campaigns
          .connect(this.signers.bob) // Bob creates 0
          .createCampaign(this.mocks.erc20Token.address, 10, parseEther("10"), 0);

        // Should fail
        await expect(
          this.contracts.campaigns
            .connect(this.signers.bob) // Bob withdraws Bob's campaign 1
            .withdrawCampaign(1),
        ).to.be.revertedWithCustomError(this.contracts.campaigns, "NonExistentCampaign");

        // campaign created with campaignId 0, 1, try withdrawing 2
        await this.contracts.campaigns
          .connect(this.signers.carol) // Carol creates 0
          .createCampaign(this.mocks.erc20Token.address, 10, parseEther("10"), 0);
        await this.contracts.campaigns
          .connect(this.signers.carol) // Carol creates 1
          .createCampaign(this.mocks.erc20Token.address, 10, parseEther("10"), 0);
        // Should fail
        await expect(
          this.contracts.campaigns
            .connect(this.signers.carol) // Carol withdraws Carol's non-existent campaign 2
            .withdrawCampaign(2),
        ).to.be.revertedWithCustomError(this.contracts.campaigns, "NonExistentCampaign");

        // campaign not created with campaignId 0, try withdrawing 0, 1
        // Should fail
        await expect(
          this.contracts.campaigns
            .connect(this.signers.david) // David withdraws David's non-existent campaign 0
            .withdrawCampaign(0),
        ).to.be.revertedWithCustomError(this.contracts.campaigns, "NonExistentCampaign");
        await expect(
          this.contracts.campaigns
            .connect(this.signers.david) // David withdraws David's non-existent campaign 1
            .withdrawCampaign(1),
        ).to.be.revertedWithCustomError(this.contracts.campaigns, "NonExistentCampaign");
      });

      it("should revert with InactiveCampaign() if campaign is inactive", async function () {
        // campaign created with campaignId 0, try claim 0
        await this.mocks.erc20Token.mock.transferFrom.returns(true);
        await this.contracts.campaigns
          .connect(this.signers.bob) // Bob creates 0
          .createCampaign(this.mocks.erc20Token.address, 10, parseEther("10"), 0);

        const { v, r, s } = await Campaigns_generateClaimSignature(
          this.contracts.campaigns,
          "Campaigns",
          this.signers.bob.address,
          0,
          this.signers.carol.address,
          this.signers.trustedAddress,
        );
        // Shouldn't fail
        await this.mocks.erc20Token.mock.transfer.withArgs(this.signers.carol.address, parseEther("10")).returns(true);
        await this.contracts.campaigns
          .connect(this.signers.carol) // Carol claims Bob's campaign 0
          .claim(this.signers.bob.address, 0, r, s, v, ethers.constants.AddressZero, { value: CLAIM_FEE });

        // Withdraw Campaign
        await this.mocks.erc20Token.mock.transfer
          .withArgs(this.signers.bob.address, parseEther("10").mul("9"))
          .returns(true);
        await this.contracts.campaigns.connect(this.signers.bob).withdrawCampaign(0);

        // Try withdrawing again
        await expect(
          this.contracts.campaigns.connect(this.signers.bob).withdrawCampaign(0),
        ).to.be.revertedWithCustomError(this.contracts.campaigns, "InactiveCampaign");
      });

      it("should mark campaign as inactive", async function () {
        // campaign created with campaignId 0, try claim 0
        await this.mocks.erc20Token.mock.transferFrom.returns(true);
        await this.contracts.campaigns
          .connect(this.signers.bob) // Bob creates 0
          .createCampaign(this.mocks.erc20Token.address, 10, parseEther("10"), 0);

        let _campaign = await this.contracts.campaigns.campaigns(this.signers.bob.address, 0);
        expect(_campaign.isInactive).to.equal(0);

        // Withdraw Campaign
        await this.mocks.erc20Token.mock.transfer
          .withArgs(this.signers.bob.address, parseEther("10").mul(10))
          .returns(true);
        await this.contracts.campaigns.connect(this.signers.bob).withdrawCampaign(0);

        _campaign = await this.contracts.campaigns.campaigns(this.signers.bob.address, 0);
        expect(_campaign.isInactive).to.equal(1);
      });

      it("should transfer remaining ether if ETHAddress", async function () {
        // campaign created with campaignId 0, try claim 0
        await this.mocks.erc20Token.mock.transferFrom.returns(true);
        await this.contracts.campaigns
          .connect(this.signers.bob) // Bob creates 0
          .createCampaign(ETHAddress, 10, parseEther("10"), 0, { value: parseEther("10").mul(10) });

        const { v, r, s } = await Campaigns_generateClaimSignature(
          this.contracts.campaigns,
          "Campaigns",
          this.signers.bob.address,
          0,
          this.signers.carol.address,
          this.signers.trustedAddress,
        );

        // Try claiming with signature from trustedAddress. Shouldn't fail
        await expect(
          this.contracts.campaigns
            .connect(this.signers.carol) // Carol claims Bob's campaign 0
            .claim(this.signers.bob.address, 0, r, s, v, ethers.constants.AddressZero, { value: CLAIM_FEE }),
        ).to.changeEtherBalances(
          [this.contracts.campaigns, this.signers.carol],
          [BigNumber.from(0).sub(parseEther("10")), parseEther("10").sub(CLAIM_FEE)],
        );

        await expect(this.contracts.campaigns.connect(this.signers.bob).withdrawCampaign(0)).to.changeEtherBalances(
          [this.contracts.campaigns, this.signers.bob],
          [BigNumber.from(0).sub(parseEther("10")).mul(9), parseEther("10").mul(9)],
        );
      });

      it("should transfer remaining tokens if not ETHAddress", async function () {
        const totalAmount = parseEther("10").mul(10);
        await this.mocks.erc20Token.mock.transferFrom
          .withArgs(this.signers.bob.address, this.contracts.campaigns.address, totalAmount)
          .returns(true);

        await this.contracts.campaigns
          .connect(this.signers.bob)
          .createCampaign(this.mocks.erc20Token.address, 10, parseEther("10"), 0);
        // cannot assert token transfer with mock

        const { v, r, s } = await Campaigns_generateClaimSignature(
          this.contracts.campaigns,
          "Campaigns",
          this.signers.bob.address,
          0,
          this.signers.carol.address,
          this.signers.trustedAddress,
        );

        // Try claiming with signature from trustedAddress. Shouldn't fail
        await this.mocks.erc20Token.mock.transfer.withArgs(this.signers.carol.address, parseEther("10")).returns(true);
        await this.contracts.campaigns
          .connect(this.signers.carol) // Carol claims Bob's campaign 0
          .claim(this.signers.bob.address, 0, r, s, v, ethers.constants.AddressZero, { value: CLAIM_FEE });
        // cannot assert token transfer with mock

        await this.mocks.erc20Token.mock.transfer
          .withArgs(this.signers.bob.address, parseEther("10").mul(9))
          .returns(true);
        await this.contracts.campaigns.connect(this.signers.bob).withdrawCampaign(0);
        // cannot assert token transfer with mock
      });

      it("should emit CampaignWithdrawn()", async function () {
        const totalAmount = parseEther("10").mul(10);
        await this.mocks.erc20Token.mock.transferFrom
          .withArgs(this.signers.bob.address, this.contracts.campaigns.address, totalAmount)
          .returns(true);

        await this.contracts.campaigns
          .connect(this.signers.bob)
          .createCampaign(this.mocks.erc20Token.address, 10, parseEther("10"), 0);
        // cannot assert token transfer with mock

        const { v, r, s } = await Campaigns_generateClaimSignature(
          this.contracts.campaigns,
          "Campaigns",
          this.signers.bob.address,
          0,
          this.signers.carol.address,
          this.signers.trustedAddress,
        );

        // Try claiming with signature from trustedAddress. Shouldn't fail
        await this.mocks.erc20Token.mock.transfer.withArgs(this.signers.carol.address, parseEther("10")).returns(true);
        await this.contracts.campaigns
          .connect(this.signers.carol) // Carol claims Bob's campaign 0
          .claim(this.signers.bob.address, 0, r, s, v, ethers.constants.AddressZero, { value: CLAIM_FEE });
        // cannot assert token transfer with mock

        await this.mocks.erc20Token.mock.transfer
          .withArgs(this.signers.bob.address, parseEther("10").mul(9))
          .returns(true);
        // cannot assert token transfer with mock

        await expect(this.contracts.campaigns.connect(this.signers.bob).withdrawCampaign(0))
          .to.emit(this.contracts.campaigns, "CampaignWithdrawn")
          .withArgs(this.signers.bob.address, 0);
      });
    });

    describe("withdrawTotalClaimFees()", function () {
      it("should revert if non-owner tries to withdraw", async function () {
        // withdraw as bob
        await expect(
          this.contracts.campaigns.connect(this.signers.bob).withdrawTotalClaimFees(this.signers.david.address),
        ).to.be.revertedWith("Ownable: caller is not the owner");
      });

      it("Should revert if transfer failed", async function () {
        const RevertOnReceiveEther = await ethers.getContractFactory("RevertOnReceiveEther");
        const revertOnReceiveEther = await RevertOnReceiveEther.deploy();

        // campaign created with campaignId 0, try claim 0
        await this.contracts.campaigns
          .connect(this.signers.bob) // Bob creates 0
          .createCampaign(ETHAddress, 10, parseEther("10"), 0, { value: parseEther("10").mul(10) });

        const { v, r, s } = await Campaigns_generateClaimSignature(
          this.contracts.campaigns,
          "Campaigns",
          this.signers.bob.address,
          0,
          this.signers.carol.address,
          this.signers.trustedAddress,
        );

        // Try claiming with signature from trustedAddress. Shouldn't fail
        await expect(
          this.contracts.campaigns
            .connect(this.signers.carol) // Carol claims Bob's campaign 0
            .claim(this.signers.bob.address, 0, r, s, v, ethers.constants.AddressZero, { value: CLAIM_FEE }),
        ).to.changeEtherBalances(
          [this.contracts.campaigns, this.signers.carol],
          [BigNumber.from(0).sub(parseEther("10")), parseEther("10").sub(CLAIM_FEE)],
        );
        expect(await this.contracts.campaigns.totalClaimFees()).to.equal(CLAIM_FEE);

        // withdrawTotalClaimFees() as owner to RevertOnReceiveEther
        await expect(
          this.contracts.campaigns.connect(this.signers.alice).withdrawTotalClaimFees(revertOnReceiveEther.address),
        ).to.be.revertedWithCustomError(this.contracts.campaigns, "TransferFailed");
      });

      it("should withdraw and reset totalClaimFees", async function () {
        // campaign created with campaignId 0, try claim 0
        await this.contracts.campaigns
          .connect(this.signers.bob) // Bob creates 0
          .createCampaign(ETHAddress, 10, parseEther("10"), 0, { value: parseEther("10").mul(10) });

        const { v, r, s } = await Campaigns_generateClaimSignature(
          this.contracts.campaigns,
          "Campaigns",
          this.signers.bob.address,
          0,
          this.signers.carol.address,
          this.signers.trustedAddress,
        );

        // Try claiming with signature from trustedAddress. Shouldn't fail
        await expect(
          this.contracts.campaigns
            .connect(this.signers.carol) // Carol claims Bob's campaign 0
            .claim(this.signers.bob.address, 0, r, s, v, ethers.constants.AddressZero, { value: CLAIM_FEE }),
        ).to.changeEtherBalances(
          [this.contracts.campaigns, this.signers.carol],
          [BigNumber.from(0).sub(parseEther("10")), parseEther("10").sub(CLAIM_FEE)],
        );
        expect(await this.contracts.campaigns.totalClaimFees()).to.equal(CLAIM_FEE);

        // withdrawTotalClaimFees() as owner
        await expect(() =>
          this.contracts.campaigns.connect(this.signers.alice).withdrawTotalClaimFees(this.signers.david.address),
        ).to.changeEtherBalances(
          [this.contracts.campaigns, this.signers.david.address],
          [BigNumber.from(0).sub(CLAIM_FEE), CLAIM_FEE],
        );

        expect(await this.contracts.campaigns.totalClaimFees()).to.equal(0);
      });

      it("should not transfer anything if withdrawable not > 0", async function () {
        expect(await this.contracts.campaigns.totalClaimFees()).to.equal(0);

        await expect(() =>
          this.contracts.campaigns.connect(this.signers.alice).withdrawTotalClaimFees(this.signers.alice.address),
        ).to.changeEtherBalances([this.contracts.campaigns, this.signers.alice], [0, 0]);
      });

      it("should emit Withdrawal()", async function () {
        // campaign created with campaignId 0, try claim 0
        await this.contracts.campaigns
          .connect(this.signers.bob) // Bob creates 0
          .createCampaign(ETHAddress, 10, parseEther("10"), 0, { value: parseEther("10").mul(10) });

        const { v, r, s } = await Campaigns_generateClaimSignature(
          this.contracts.campaigns,
          "Campaigns",
          this.signers.bob.address,
          0,
          this.signers.carol.address,
          this.signers.trustedAddress,
        );

        // Try claiming with signature from trustedAddress. Shouldn't fail
        await expect(
          this.contracts.campaigns
            .connect(this.signers.carol) // Carol claims Bob's campaign 0
            .claim(this.signers.bob.address, 0, r, s, v, ethers.constants.AddressZero, { value: CLAIM_FEE }),
        ).to.changeEtherBalances(
          [this.contracts.campaigns, this.signers.carol],
          [BigNumber.from(0).sub(parseEther("10")), parseEther("10").sub(CLAIM_FEE)],
        );
        expect(await this.contracts.campaigns.totalClaimFees()).to.equal(CLAIM_FEE);

        // withdrawTotalClaimFees() as owner
        await expect(
          this.contracts.campaigns.connect(this.signers.alice).withdrawTotalClaimFees(this.signers.david.address),
        )
          .to.emit(this.contracts.campaigns, "Withdrawal")
          .withArgs(CLAIM_FEE, this.signers.david.address);

        expect(await this.contracts.campaigns.totalClaimFees()).to.equal(0);
      });
    });

    describe("increaseMaxSponsoredClaims()", function () {
      beforeEach(async function () {
        await this.contracts.campaigns.connect(this.signers.alice).setSponsoredClaimFee(SPONSORED_CLAIM_FEE);
        await this.contracts.campaigns.connect(this.signers.alice).setTreasury(this.signers.treasury.address);
      });

      it("should revert if sponsoredClaims > maxSupply", async function () {
        await this.contracts.campaigns
          .connect(this.signers.bob)
          .createCampaign(this.mocks.erc20Token.address, 10, parseEther("10"), 3, {
            value: SPONSORED_CLAIM_FEE.mul(3),
          });

        const campaign = await this.contracts.campaigns.campaigns(this.signers.bob.address, 0);
        expect(campaign.noOfSponsoredClaims).to.eq(0);
        expect(campaign.maxSponsoredClaims).to.eq(3);

        await expect(
          this.contracts.campaigns
            .connect(this.signers.bob)
            .increaseMaxSponsoredClaims(this.signers.bob.address, 0, 8, {
              value: SPONSORED_CLAIM_FEE.mul(8),
            }),
        ).to.be.revertedWithCustomError(this.contracts.campaigns, "ExceedsMaxClaims");
      });

      it("should increase sponsoredClaims", async function () {
        await this.contracts.campaigns
          .connect(this.signers.bob)
          .createCampaign(this.mocks.erc20Token.address, 10, parseEther("10"), 3, {
            value: SPONSORED_CLAIM_FEE.mul(3),
          });

        const campaign = await this.contracts.campaigns.campaigns(this.signers.bob.address, 0);
        expect(campaign.noOfSponsoredClaims).to.eq(0);
        expect(campaign.maxSponsoredClaims).to.eq(3);

        await this.contracts.campaigns
          .connect(this.signers.bob)
          .increaseMaxSponsoredClaims(this.signers.bob.address, 0, 2, {
            value: SPONSORED_CLAIM_FEE.mul(2),
          });

        const updatedCampaign = await this.contracts.campaigns.campaigns(this.signers.bob.address, 0);
        expect(updatedCampaign.noOfSponsoredClaims).to.eq(0);
        expect(updatedCampaign.maxSponsoredClaims).to.eq(5);
      });

      it("should emit SponsoredClaimFeesPaid()", async function () {
        await this.contracts.campaigns
          .connect(this.signers.bob)
          .createCampaign(this.mocks.erc20Token.address, 10, parseEther("10"), 3, {
            value: SPONSORED_CLAIM_FEE.mul(3),
          });

        await expect(
          this.contracts.campaigns
            .connect(this.signers.bob)
            .increaseMaxSponsoredClaims(this.signers.bob.address, 0, 2, {
              value: SPONSORED_CLAIM_FEE.mul(2),
            }),
        )
          .to.emit(this.contracts.campaigns, "SponsoredClaimFeesPaid")
          .withArgs(2, SPONSORED_CLAIM_FEE, this.signers.treasury.address);
      });

      it("should transfer sponsoredClaims fee", async function () {
        await this.contracts.campaigns
          .connect(this.signers.bob)
          .createCampaign(this.mocks.erc20Token.address, 10, parseEther("10"), 3, {
            value: SPONSORED_CLAIM_FEE.mul(3),
          });

        await expect(() =>
          this.contracts.campaigns
            .connect(this.signers.bob)
            .increaseMaxSponsoredClaims(this.signers.bob.address, 0, 2, {
              value: SPONSORED_CLAIM_FEE.mul(2),
            }),
        ).to.changeEtherBalances(
          [this.signers.bob, this.signers.treasury],
          [BigNumber.from(0).sub(SPONSORED_CLAIM_FEE.mul(2)), SPONSORED_CLAIM_FEE.mul(2)],
        );
      });
    });

    describe("setTrustedAddress()", function () {
      it("should revert with InvalidAddress() if _trustedAddress is zero address", async function () {
        await expect(
          this.contracts.campaigns.connect(this.signers.alice).setTrustedAddress(AddressZero),
        ).to.be.revertedWithCustomError(this.contracts.campaigns, "InvalidAddress");
      });

      it("should revert if non-owner tries to setTrustedAddress()", async function () {
        await expect(
          this.contracts.campaigns.connect(this.signers.bob).setTrustedAddress(AddressZero),
        ).to.be.revertedWith("Ownable: caller is not the owner");
      });

      it("should change trustedAddress", async function () {
        // campaign created with campaignId 0, try claim 0
        await this.contracts.campaigns
          .connect(this.signers.bob) // Bob creates 0
          .createCampaign(ETHAddress, 10, parseEther("10"), 0, { value: parseEther("10").mul(10) });

        let { v, r, s } = await Campaigns_generateClaimSignature(
          this.contracts.campaigns,
          "Campaigns",
          this.signers.bob.address,
          0,
          this.signers.carol.address,
          this.signers.trustedAddress,
        );

        // Try claiming with signature from trustedAddress. Shouldn't fail
        await expect(
          this.contracts.campaigns
            .connect(this.signers.carol) // Carol claims Bob's campaign 0
            .claim(this.signers.bob.address, 0, r, s, v, ethers.constants.AddressZero, { value: CLAIM_FEE }),
        ).to.changeEtherBalances(
          [this.contracts.campaigns, this.signers.carol],
          [BigNumber.from(0).sub(parseEther("10")), parseEther("10").sub(CLAIM_FEE)],
        );

        // change trustedAddress to david
        await this.contracts.campaigns.connect(this.signers.alice).setTrustedAddress(this.signers.david.address);

        // eve tries claiming with signature from trustedAddress
        ({ v, r, s } = await Campaigns_generateClaimSignature(
          this.contracts.campaigns,
          "Campaigns",
          this.signers.bob.address,
          0,
          this.signers.eve.address,
          this.signers.trustedAddress,
        ));
        // Try claiming with signature from trustedAddress. Should fail
        await expect(
          this.contracts.campaigns
            .connect(this.signers.eve) // Eve claims Bob's campaign 0
            .claim(this.signers.bob.address, 0, r, s, v, ethers.constants.AddressZero, { value: CLAIM_FEE }),
        ).to.be.revertedWithCustomError(this.contracts.campaigns, "InvalidAddress");

        // eve tries claiming with signature from david
        ({ v, r, s } = await Campaigns_generateClaimSignature(
          this.contracts.campaigns,
          "Campaigns",
          this.signers.bob.address,
          0,
          this.signers.eve.address,
          this.signers.david,
        ));
        // Try claiming with signature from david. Shouldn't fail
        await expect(
          this.contracts.campaigns
            .connect(this.signers.eve) // Eve claims Bob's campaign 0
            .claim(this.signers.bob.address, 0, r, s, v, ethers.constants.AddressZero, { value: CLAIM_FEE }),
        ).to.changeEtherBalances(
          [this.contracts.campaigns, this.signers.eve],
          [BigNumber.from(0).sub(parseEther("10")), parseEther("10").sub(CLAIM_FEE)],
        );
      });
    });

    describe("setTreasury()", function () {
      it("should revert with InvalidAddress() if _treasury is zero address", async function () {
        await expect(
          this.contracts.campaigns.connect(this.signers.alice).setTreasury(AddressZero),
        ).to.be.revertedWithCustomError(this.contracts.campaigns, "InvalidAddress");
      });

      it("should revert if non-owner tries to setTreasury()", async function () {
        await expect(this.contracts.campaigns.connect(this.signers.bob).setTreasury(AddressZero)).to.be.revertedWith(
          "Ownable: caller is not the owner",
        );
      });

      it("should change treasury", async function () {
        // change treasury to david
        await this.contracts.campaigns.connect(this.signers.alice).setTreasury(this.signers.david.address);

        // check treasury
        expect(await this.contracts.campaigns.treasury()).to.equal(this.signers.david.address);

        // change treasury to bob
        await this.contracts.campaigns.connect(this.signers.alice).setTreasury(this.signers.bob.address);

        // check treasury
        expect(await this.contracts.campaigns.treasury()).to.equal(this.signers.bob.address);
      });
    });

    describe("setClaimFee()", function () {
      it("should revert if non-owner tries to setClaimFee()", async function () {
        await expect(this.contracts.campaigns.connect(this.signers.bob).setClaimFee(0)).to.be.revertedWith(
          "Ownable: caller is not the owner",
        );
      });

      it("should change claimFee", async function () {
        expect(await this.contracts.campaigns.claimFee()).to.eq(CLAIM_FEE);

        await this.contracts.campaigns.connect(this.signers.alice).setClaimFee(parseEther("0.75"));

        expect(await this.contracts.campaigns.claimFee()).to.eq(parseEther("0.75"));
      });
    });

    describe("setSponsoredClaimFee()", function () {
      it("should revert if non-owner tries to setSponsoredClaimFee()", async function () {
        await expect(this.contracts.campaigns.connect(this.signers.bob).setSponsoredClaimFee(0)).to.be.revertedWith(
          "Ownable: caller is not the owner",
        );
      });

      it("should change sponsoredClaimFee", async function () {
        expect(await this.contracts.campaigns.sponsoredClaimFee()).to.eq(0);

        await this.contracts.campaigns.connect(this.signers.alice).setSponsoredClaimFee(SPONSORED_CLAIM_FEE);

        expect(await this.contracts.campaigns.sponsoredClaimFee()).to.eq(SPONSORED_CLAIM_FEE);
      });
    });
  });
}

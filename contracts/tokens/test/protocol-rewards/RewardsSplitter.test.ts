import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import {
  ERC721RS,
  ERC721RS__factory,
  ProtocolRewards,
  ProtocolRewards__factory,
} from "../../typechain";

export const PLATFORM_SHARE = 6000;
export const CREATOR_SHARE = 3000;
export const REFERRER_SHARE = 1000;
export const BASIS_POINTS = 10000;

describe("RewardsSplitter", () => {
  let ProtocolRewards: ProtocolRewards__factory;
  let protocolRewards: ProtocolRewards;
  let ERC721RS: ERC721RS__factory;
  let rewardsSplitter: ERC721RS;
  let owner: SignerWithAddress,
    platform: SignerWithAddress,
    creator: SignerWithAddress,
    referrer: SignerWithAddress;

  beforeEach(async () => {
    ProtocolRewards = await ethers.getContractFactory("ProtocolRewards");
    ERC721RS = await ethers.getContractFactory("ERC721RS");

    protocolRewards = await ProtocolRewards.deploy();
    rewardsSplitter = await ERC721RS.deploy(
      "ERC721RS",
      "ERC721RS",
      protocolRewards.address
    );

    [owner, platform, creator, referrer] = await ethers.getSigners();
  });

  describe("deploy", () => {
    it("Should init state", async function () {
      expect(await rewardsSplitter.protocolRewards()).to.equal(
        protocolRewards.address
      );
    });
  });

  describe("splitRewards()", () => {
    it("should revert if platform address is zero", async () => {
      await expect(
        rewardsSplitter.splitRewards(
          ethers.utils.parseEther("1"),
          ethers.constants.AddressZero,
          creator.address,
          referrer.address
        )
      ).to.be.revertedWith("InvalidAddress");
    });

    it("should revert if creator address is zero", async () => {
      await expect(
        rewardsSplitter.splitRewards(
          ethers.utils.parseEther("1"),
          platform.address,
          ethers.constants.AddressZero,
          referrer.address
        )
      ).to.be.revertedWith("InvalidAddress");
    });

    it("should revert if referrer == creator", async () => {
      await expect(
        rewardsSplitter.splitRewards(
          ethers.utils.parseEther("1"),
          platform.address,
          creator.address,
          creator.address
        )
      ).to.be.revertedWith("InvalidAddress");
    });

    it("should calculate rewards shares correctly", async () => {
      const rewardAmount = ethers.utils.parseEther("1");
      const expectedPlatformShare = rewardAmount
        .mul(PLATFORM_SHARE)
        .div(BASIS_POINTS);
      const expectedCreatorShare = rewardAmount
        .mul(CREATOR_SHARE)
        .div(BASIS_POINTS);
      const expectedReferrerShare = rewardAmount
        .mul(REFERRER_SHARE)
        .div(BASIS_POINTS);

      const [platformShare, creatorShare, referrerShare] =
        await rewardsSplitter.splitRewards(
          rewardAmount,
          platform.address,
          creator.address,
          referrer.address
        );

      expect(platformShare).to.equal(expectedPlatformShare);
      expect(creatorShare).to.equal(expectedCreatorShare);
      expect(referrerShare).to.equal(expectedReferrerShare);
    });

    it("should add referrer share to platform if referrer address is zero", async () => {
      const rewardAmount = ethers.utils.parseEther("1");
      const _referrerShare = rewardAmount.mul(REFERRER_SHARE).div(BASIS_POINTS);
      const expectedPlatformShare = rewardAmount
        .mul(PLATFORM_SHARE)
        .div(BASIS_POINTS)
        .add(_referrerShare);
      const expectedCreatorShare = rewardAmount
        .mul(CREATOR_SHARE)
        .div(BASIS_POINTS);
      const expectedReferrerShare = ethers.constants.Zero;

      const [platformShare, creatorShare, referrerShare] =
        await rewardsSplitter.splitRewards(
          rewardAmount,
          platform.address,
          creator.address,
          ethers.constants.AddressZero
        );

      expect(platformShare).to.equal(expectedPlatformShare);
      expect(creatorShare).to.equal(expectedCreatorShare);
      expect(referrerShare).to.equal(expectedReferrerShare);
    });
  });

  describe("splitAndDepositRewards()", () => {
    it("should deposit to ProtocolRewards", async () => {
      let rewardAmount = ethers.utils.parseEther("1");
      let expectedPlatformShare = rewardAmount
        .mul(PLATFORM_SHARE)
        .div(BASIS_POINTS);
      let expectedCreatorShare = rewardAmount
        .mul(CREATOR_SHARE)
        .div(BASIS_POINTS);
      let expectedReferrerShare = rewardAmount
        .mul(REFERRER_SHARE)
        .div(BASIS_POINTS);

      await expect(() =>
        rewardsSplitter.splitAndDepositRewards(
          rewardAmount,
          platform.address,
          creator.address,
          referrer.address,
          { value: rewardAmount }
        )
      ).to.changeEtherBalances(
        [owner, protocolRewards],
        [rewardAmount.mul(-1), rewardAmount]
      );

      expect(await protocolRewards.balanceOf(platform.address)).to.equal(
        expectedPlatformShare
      );
      expect(await protocolRewards.balanceOf(creator.address)).to.equal(
        expectedCreatorShare
      );
      expect(await protocolRewards.balanceOf(referrer.address)).to.equal(
        expectedReferrerShare
      );

      rewardAmount = ethers.utils.parseEther("3");
      expectedPlatformShare = expectedPlatformShare.add(
        rewardAmount.mul(PLATFORM_SHARE).div(BASIS_POINTS)
      );
      expectedCreatorShare = expectedCreatorShare.add(
        rewardAmount.mul(CREATOR_SHARE).div(BASIS_POINTS)
      );
      expectedReferrerShare = expectedReferrerShare.add(
        rewardAmount.mul(REFERRER_SHARE).div(BASIS_POINTS)
      );

      await expect(() =>
        rewardsSplitter.splitAndDepositRewards(
          rewardAmount,
          platform.address,
          creator.address,
          referrer.address,
          { value: rewardAmount }
        )
      ).to.changeEtherBalances(
        [owner, protocolRewards],
        [rewardAmount.mul(-1), rewardAmount]
      );

      expect(await protocolRewards.balanceOf(platform.address)).to.equal(
        expectedPlatformShare
      );
      expect(await protocolRewards.balanceOf(creator.address)).to.equal(
        expectedCreatorShare
      );
      expect(await protocolRewards.balanceOf(referrer.address)).to.equal(
        expectedReferrerShare
      );
    });
  });
});

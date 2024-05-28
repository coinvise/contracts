import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { ProtocolRewards, ProtocolRewards__factory } from "../../typechain";

describe("ProtocolRewards", () => {
  let ProtocolRewards: ProtocolRewards__factory;
  let protocolRewards: ProtocolRewards;
  let owner: SignerWithAddress,
    platform: SignerWithAddress,
    creator: SignerWithAddress,
    referrer: SignerWithAddress;

  beforeEach(async () => {
    ProtocolRewards = await ethers.getContractFactory("ProtocolRewards");
    [owner, platform, creator, referrer] = await ethers.getSigners();

    protocolRewards = await ProtocolRewards.deploy();
  });

  describe("depositRewards()", () => {
    it("should revert if total rewards doesn't add up", async () => {
      await expect(
        protocolRewards.depositRewards(
          platform.address,
          ethers.utils.parseEther("1"),
          creator.address,
          ethers.utils.parseEther("1"),
          referrer.address,
          ethers.utils.parseEther("1"),
          { value: ethers.utils.parseEther("1") }
        )
      ).to.be.revertedWith("InvalidAmount");
    });

    it("should update balances", async () => {
      await protocolRewards.depositRewards(
        platform.address,
        ethers.utils.parseEther("1"),
        creator.address,
        ethers.utils.parseEther("1"),
        referrer.address,
        ethers.utils.parseEther("1"),
        { value: ethers.utils.parseEther("3") }
      );

      expect(await protocolRewards.balanceOf(platform.address)).to.equal(
        ethers.utils.parseEther("1")
      );
      expect(await protocolRewards.balanceOf(creator.address)).to.equal(
        ethers.utils.parseEther("1")
      );
      expect(await protocolRewards.balanceOf(referrer.address)).to.equal(
        ethers.utils.parseEther("1")
      );

      await protocolRewards.depositRewards(
        platform.address,
        ethers.utils.parseEther("0.25"),
        creator.address,
        ethers.utils.parseEther("0.5"),
        referrer.address,
        ethers.utils.parseEther("1.25"),
        { value: ethers.utils.parseEther("2") }
      );

      expect(await protocolRewards.balanceOf(platform.address)).to.equal(
        ethers.utils.parseEther("1.25")
      );
      expect(await protocolRewards.balanceOf(creator.address)).to.equal(
        ethers.utils.parseEther("1.5")
      );
      expect(await protocolRewards.balanceOf(referrer.address)).to.equal(
        ethers.utils.parseEther("2.25")
      );
    });

    it("should not update balances if address is zero", async () => {
      await protocolRewards.depositRewards(
        ethers.constants.AddressZero,
        ethers.utils.parseEther("1"),
        creator.address,
        ethers.utils.parseEther("1"),
        referrer.address,
        ethers.utils.parseEther("1"),
        { value: ethers.utils.parseEther("3") }
      );

      expect(await protocolRewards.balanceOf(platform.address)).to.equal(
        ethers.utils.parseEther("0")
      );
      expect(await protocolRewards.balanceOf(creator.address)).to.equal(
        ethers.utils.parseEther("1")
      );
      expect(await protocolRewards.balanceOf(referrer.address)).to.equal(
        ethers.utils.parseEther("1")
      );

      await protocolRewards.depositRewards(
        platform.address,
        ethers.utils.parseEther("1"),
        ethers.constants.AddressZero,
        ethers.utils.parseEther("1"),
        referrer.address,
        ethers.utils.parseEther("1"),
        { value: ethers.utils.parseEther("3") }
      );

      expect(await protocolRewards.balanceOf(platform.address)).to.equal(
        ethers.utils.parseEther("1")
      );
      expect(await protocolRewards.balanceOf(creator.address)).to.equal(
        ethers.utils.parseEther("1")
      );
      expect(await protocolRewards.balanceOf(referrer.address)).to.equal(
        ethers.utils.parseEther("2")
      );

      await protocolRewards.depositRewards(
        platform.address,
        ethers.utils.parseEther("1"),
        creator.address,
        ethers.utils.parseEther("1"),
        ethers.constants.AddressZero,
        ethers.utils.parseEther("1"),
        { value: ethers.utils.parseEther("3") }
      );

      expect(await protocolRewards.balanceOf(platform.address)).to.equal(
        ethers.utils.parseEther("2")
      );
      expect(await protocolRewards.balanceOf(creator.address)).to.equal(
        ethers.utils.parseEther("2")
      );
      expect(await protocolRewards.balanceOf(referrer.address)).to.equal(
        ethers.utils.parseEther("2")
      );
    });

    it("should not update balances if reward amount is zero", async () => {
      await protocolRewards.depositRewards(
        platform.address,
        ethers.utils.parseEther("0"),
        creator.address,
        ethers.utils.parseEther("1"),
        referrer.address,
        ethers.utils.parseEther("1"),
        { value: ethers.utils.parseEther("2") }
      );

      expect(await protocolRewards.balanceOf(platform.address)).to.equal(
        ethers.utils.parseEther("0")
      );
      expect(await protocolRewards.balanceOf(creator.address)).to.equal(
        ethers.utils.parseEther("1")
      );
      expect(await protocolRewards.balanceOf(referrer.address)).to.equal(
        ethers.utils.parseEther("1")
      );

      await protocolRewards.depositRewards(
        platform.address,
        ethers.utils.parseEther("1"),
        creator.address,
        ethers.utils.parseEther("0"),
        referrer.address,
        ethers.utils.parseEther("1"),
        { value: ethers.utils.parseEther("2") }
      );

      expect(await protocolRewards.balanceOf(platform.address)).to.equal(
        ethers.utils.parseEther("1")
      );
      expect(await protocolRewards.balanceOf(creator.address)).to.equal(
        ethers.utils.parseEther("1")
      );
      expect(await protocolRewards.balanceOf(referrer.address)).to.equal(
        ethers.utils.parseEther("2")
      );

      await protocolRewards.depositRewards(
        platform.address,
        ethers.utils.parseEther("1"),
        creator.address,
        ethers.utils.parseEther("1"),
        referrer.address,
        ethers.utils.parseEther("0"),
        { value: ethers.utils.parseEther("2") }
      );

      expect(await protocolRewards.balanceOf(platform.address)).to.equal(
        ethers.utils.parseEther("2")
      );
      expect(await protocolRewards.balanceOf(creator.address)).to.equal(
        ethers.utils.parseEther("2")
      );
      expect(await protocolRewards.balanceOf(referrer.address)).to.equal(
        ethers.utils.parseEther("2")
      );
    });

    it("should emit RewardsDeposited", async () => {
      await expect(
        protocolRewards.depositRewards(
          platform.address,
          ethers.utils.parseEther("1"),
          creator.address,
          ethers.utils.parseEther("1"),
          referrer.address,
          ethers.utils.parseEther("1"),
          { value: ethers.utils.parseEther("3") }
        )
      )
        .to.emit(protocolRewards, "RewardsDeposited")
        .withArgs(
          owner.address,
          platform.address,
          ethers.utils.parseEther("1"),
          creator.address,
          ethers.utils.parseEther("1"),
          referrer.address,
          ethers.utils.parseEther("1")
        );
    });
  });

  describe("withdrawRewards()", () => {
    it("should not transfer anything if balance is zero", async () => {
      await expect(() =>
        protocolRewards.withdrawRewards(platform.address)
      ).to.changeEtherBalances([platform, protocolRewards], [0, 0]);

      await expect(() =>
        protocolRewards.withdrawRewards(creator.address)
      ).to.changeEtherBalances([creator, protocolRewards], [0, 0]);

      await expect(() =>
        protocolRewards.withdrawRewards(referrer.address)
      ).to.changeEtherBalances([referrer, protocolRewards], [0, 0]);
    });

    it("should withdraw all rewards", async () => {
      await protocolRewards.depositRewards(
        platform.address,
        ethers.utils.parseEther("1"),
        creator.address,
        ethers.utils.parseEther("1"),
        referrer.address,
        ethers.utils.parseEther("1"),
        { value: ethers.utils.parseEther("3") }
      );

      await expect(() =>
        protocolRewards.withdrawRewards(platform.address)
      ).to.changeEtherBalances(
        [platform, protocolRewards],
        [ethers.utils.parseEther("1"), ethers.utils.parseEther("-1")]
      );
      expect(await protocolRewards.balanceOf(platform.address)).to.equal(
        ethers.utils.parseEther("0")
      );

      await expect(() =>
        protocolRewards.withdrawRewards(creator.address)
      ).to.changeEtherBalances(
        [creator, protocolRewards],
        [ethers.utils.parseEther("1"), ethers.utils.parseEther("-1")]
      );
      expect(await protocolRewards.balanceOf(creator.address)).to.equal(
        ethers.utils.parseEther("0")
      );

      await expect(() =>
        protocolRewards.withdrawRewards(referrer.address)
      ).to.changeEtherBalances(
        [referrer, protocolRewards],
        [ethers.utils.parseEther("1"), ethers.utils.parseEther("-1")]
      );
      expect(await protocolRewards.balanceOf(referrer.address)).to.equal(
        ethers.utils.parseEther("0")
      );
    });

    it("should emit Withdrawal", async () => {
      await protocolRewards.depositRewards(
        platform.address,
        ethers.utils.parseEther("1"),
        creator.address,
        ethers.utils.parseEther("1"),
        referrer.address,
        ethers.utils.parseEther("1"),
        { value: ethers.utils.parseEther("3") }
      );

      await expect(protocolRewards.withdrawRewards(platform.address))
        .to.emit(protocolRewards, "Withdrawal")
        .withArgs(platform.address, ethers.utils.parseEther("1"));

      await expect(protocolRewards.withdrawRewards(creator.address))
        .to.emit(protocolRewards, "Withdrawal")
        .withArgs(creator.address, ethers.utils.parseEther("1"));

      await expect(protocolRewards.withdrawRewards(referrer.address))
        .to.emit(protocolRewards, "Withdrawal")
        .withArgs(referrer.address, ethers.utils.parseEther("1"));
    });
  });
});

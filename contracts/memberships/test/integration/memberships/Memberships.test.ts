import { AddressZero } from "@ethersproject/constants";
import { expect } from "chai";
import { parseEther, parseUnits } from "ethers/lib/utils";
import hre, { artifacts, ethers } from "hardhat";
import {
  MEMBERSHIPS_NAME,
  MEMBERSHIPS_SYMBOL,
  MEMBERSHIPS_CONTRACT_URI,
  MEMBERSHIPS_BASE_URI,
  FEE_BPS,
  FEE_TREASURY,
  SECONDS_PER_DAY,
  ETH_ADDRESS,
} from "../../../helpers/constants";
import { Memberships } from "../../../src/types/Memberships";
import { RevertOnReceiveEther } from "../../../src/types/RevertOnReceiveEther";
import { integrationFixture } from "../../shared/fixtures";
import { BigNumber, VoidSigner } from "ethers";
import { Artifact } from "hardhat/types";
import { deployContract } from "ethereum-waffle";
import { INTERFACE_IDS } from "../../../helpers/erc165";
import { timeTravel } from "../../shared/helpers";
import { getArgFromEvent } from "../../../helpers/events";

export function integrationTestMemberships(): void {
  describe("Memberships", function () {
    beforeEach(async function () {
      const { membershipsMetadataRegistry, memberships, membershipsFactory, erc20Token, erc20PaymentToken } =
        await this.loadFixture(integrationFixture);
      this.contracts.membershipsMetadataRegistry = membershipsMetadataRegistry;
      this.contracts.memberships = memberships;
      this.contracts.membershipsFactory = membershipsFactory;
      this.contracts.erc20Token = erc20Token;
      this.contracts.erc20PaymentToken = erc20PaymentToken;

      // Set version 2 Memberships implementation
      await this.contracts.membershipsFactory.setMembershipsImplAddress(2, this.contracts.memberships.address);

      await this.contracts.erc20Token.mint(
        this.signers.alice.address,
        parseUnits("10000000", await this.contracts.erc20Token.decimals()),
      );

      // Approve alice's tokens for the MembershipsFactory contract
      await this.contracts.erc20Token
        .connect(this.signers.alice)
        .approve(this.contracts.membershipsFactory.address, parseEther("100").mul(10));

      this.membership = {
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
          this.membership,
        );
      const receipt = await deployMemberships.wait();
      const membershipsProxyAddress = getArgFromEvent(
        this.contracts.membershipsFactory,
        receipt,
        this.contracts.membershipsFactory.interface.events["MembershipsDeployed(address,address,address)"].name,
        "membershipsProxy",
      );

      this.contracts.membershipsProxy = (await ethers.getContractAt(
        "Memberships",
        membershipsProxyAddress,
      )) as Memberships;

      // ERC20 Payment Token Memberships
      // Mint Payment token for Bob purchaser
      await this.contracts.erc20PaymentToken.mint(
        this.signers.bob.address,
        parseUnits("10000000", await this.contracts.erc20PaymentToken.decimals()),
      );

      // Deploy Memberships
      // Approve alice's tokens for the MembershipsFactory contract
      await this.contracts.erc20Token
        .connect(this.signers.alice)
        .approve(this.contracts.membershipsFactory.address, parseEther("100").mul(10));
      this.membership_ERC20 = {
        tokenAddress: this.contracts.erc20PaymentToken.address,
        price: parseEther("0.1"),
        validity: Math.floor(90 * SECONDS_PER_DAY), // 90 days or ~3 months from now
        cap: 10,
        airdropToken: this.contracts.erc20Token.address,
        airdropAmount: parseEther("100"),
      };
      const deployMemberships_ERC20 = await this.contracts.membershipsFactory
        .connect(this.signers.alice)
        .deployMemberships(
          this.signers.alice.address,
          this.signers.alice.address,
          MEMBERSHIPS_NAME,
          MEMBERSHIPS_SYMBOL,
          MEMBERSHIPS_CONTRACT_URI,
          MEMBERSHIPS_BASE_URI,
          this.membership_ERC20,
        );

      const receipt_ERC20 = await deployMemberships_ERC20.wait();
      const membershipsProxyAddress_ERC20 = getArgFromEvent(
        this.contracts.membershipsFactory,
        receipt_ERC20,
        this.contracts.membershipsFactory.interface.events["MembershipsDeployed(address,address,address)"].name,
        "membershipsProxy",
      );

      this.contracts.membershipsProxy_ERC20 = (await ethers.getContractAt(
        "Memberships",
        membershipsProxyAddress_ERC20,
      )) as Memberships;
    });

    describe("pause()", function () {
      it("should revert if non-owner tries to pause()", async function () {
        await expect(this.contracts.membershipsProxy.connect(this.signers.bob).pause()).to.be.revertedWith(
          "Ownable: caller is not the owner",
        );
      });

      it("should pause", async function () {
        await this.contracts.membershipsProxy.connect(this.signers.alice).pause();
        expect(await this.contracts.membershipsProxy.paused()).to.equal(true);
      });
    });

    describe("unpause()", function () {
      it("should revert if non-owner tries to unpause()", async function () {
        await expect(this.contracts.membershipsProxy.connect(this.signers.bob).unpause()).to.be.revertedWith(
          "Ownable: caller is not the owner",
        );
      });

      it("should unpause", async function () {
        // Pause first
        await this.contracts.membershipsProxy.connect(this.signers.alice).pause();
        // Then try unpause()
        await this.contracts.membershipsProxy.connect(this.signers.alice).unpause();
        expect(await this.contracts.membershipsProxy.paused()).to.equal(false);
      });
    });

    describe("purchase()", function () {
      it("should revert if contract is paused", async function () {
        // Pause first
        await this.contracts.membershipsProxy.connect(this.signers.alice).pause();

        await expect(
          this.contracts.membershipsProxy
            .connect(this.signers.bob)
            .purchase(this.signers.bob.address, { value: this.membership.price }),
        ).to.be.revertedWith("Pausable: paused");
      });

      describe("_mintMembership()", function () {
        describe("_mintMembershipToken()", function () {
          it("should increase totalSupply", async function () {
            const totalSupplyBeforePurchase = await this.contracts.membershipsProxy.totalSupply();
            expect(totalSupplyBeforePurchase).to.equal(0);

            await this.contracts.membershipsProxy
              .connect(this.signers.bob)
              .purchase(this.signers.bob.address, { value: this.membership.price });

            const totalSupplyAfterPurchase = await this.contracts.membershipsProxy.totalSupply();
            expect(totalSupplyAfterPurchase).to.equal(totalSupplyBeforePurchase.add(1));
          });

          it("should revert with SaleComplete() if cap is reached", async function () {
            const totalSupplyBeforePurchase = await this.contracts.membershipsProxy.totalSupply();
            expect(totalSupplyBeforePurchase).to.equal(0);

            const nonce = await this.signers.bob.getTransactionCount();
            const purchasePromises = [...Array(this.membership.cap).keys()].map(index => {
              return this.contracts.membershipsProxy
                .connect(this.signers.bob)
                .purchase(this.signers.bob.address, { value: this.membership.price, nonce: nonce + index });
            });
            await Promise.all(purchasePromises);

            const totalSupplyAfterPurchase = await this.contracts.membershipsProxy.totalSupply();
            expect(totalSupplyAfterPurchase).to.equal(totalSupplyBeforePurchase.add(this.membership.cap));

            // try purchasing after cap reached
            await expect(
              this.contracts.membershipsProxy
                .connect(this.signers.bob)
                .purchase(this.signers.bob.address, { value: this.membership.price }),
            ).to.be.revertedWith("SaleComplete");
          });

          it("should mint Membership NFT", async function () {
            await expect(() =>
              this.contracts.membershipsProxy
                .connect(this.signers.bob)
                .purchase(this.signers.bob.address, { value: this.membership.price }),
            ).to.changeTokenBalance(this.contracts.membershipsProxy, this.signers.bob, 1);

            // Test Transfer() event
            await expect(
              this.contracts.membershipsProxy
                .connect(this.signers.bob)
                .purchase(this.signers.bob.address, { value: this.membership.price }),
            )
              .to.emit(this.contracts.membershipsProxy, "Transfer")
              .withArgs(AddressZero, this.signers.bob.address, 2);
          });
        });
        it("should set _expirationTimestamps for token - lifetime validity", async function () {
          // Approve alice's tokens for the MembershipsFactory contract
          await this.contracts.erc20Token
            .connect(this.signers.alice)
            .approve(this.contracts.membershipsFactory.address, parseEther("100").mul(10));

          const membership = {
            tokenAddress: ETH_ADDRESS,
            price: parseEther("0.1"),
            validity: ethers.constants.MaxUint256,
            cap: 10,
            airdropToken: AddressZero,
            airdropAmount: 0,
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

          const membershipsProxy = (await ethers.getContractAt("Memberships", membershipsProxyAddress)) as Memberships;

          await membershipsProxy
            .connect(this.signers.bob)
            .purchase(this.signers.bob.address, { value: this.membership.price });

          const expirationTimestampAfterPurchase = await membershipsProxy.expirationTimestampOf(1);
          expect(expirationTimestampAfterPurchase).to.equal(ethers.constants.MaxUint256);
        });

        it("should set _expirationTimestamps for token", async function () {
          await expect(this.contracts.membershipsProxy.expirationTimestampOf(1)).to.be.revertedWith("NonExistentToken");

          await this.contracts.membershipsProxy
            .connect(this.signers.bob)
            .purchase(this.signers.bob.address, { value: this.membership.price });

          const latestBlockTimestamp = (await ethers.provider.getBlock("latest")).timestamp;

          const expirationTimestampAfterPurchase = await this.contracts.membershipsProxy.expirationTimestampOf(1);
          expect(expirationTimestampAfterPurchase).to.equal(latestBlockTimestamp + this.membership.validity);
        });

        it("should transfer airdrop tokens", async function () {
          const negativeAirdropTokens = BigNumber.from(`-${this.membership.airdropAmount.toString()}`);

          await expect(() =>
            this.contracts.membershipsProxy
              .connect(this.signers.bob)
              .purchase(this.signers.bob.address, { value: this.membership.price }),
          ).to.changeTokenBalances(
            this.contracts.erc20Token,
            [this.contracts.membershipsProxy, this.signers.bob],
            [negativeAirdropTokens, this.membership.airdropAmount],
          );

          // Test Transfer() event
          await expect(
            this.contracts.membershipsProxy
              .connect(this.signers.bob)
              .purchase(this.signers.bob.address, { value: this.membership.price }),
          )
            .to.emit(this.contracts.erc20Token, "Transfer")
            .withArgs(this.contracts.membershipsProxy.address, this.signers.bob.address, this.membership.airdropAmount);
        });

        it("should not transfer any tokens if membership has no airdrop", async function () {
          // Approve alice's tokens for the MembershipsFactory contract
          await this.contracts.erc20Token
            .connect(this.signers.alice)
            .approve(this.contracts.membershipsFactory.address, parseEther("100").mul(10));

          const membership = {
            tokenAddress: ETH_ADDRESS,
            price: parseEther("0.1"),
            validity: Math.floor(90 * SECONDS_PER_DAY), // 90 days or ~3 months from now
            cap: 10,
            airdropToken: AddressZero,
            airdropAmount: 0,
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

          const membershipsProxy = (await ethers.getContractAt("Memberships", membershipsProxyAddress)) as Memberships;

          await membershipsProxy
            .connect(this.signers.bob)
            .purchase(this.signers.bob.address, { value: this.membership.price });

          // Nothing much to test other than the transaction passing without reverting
        });
      });

      it("should emit MembershipPurchased()", async function () {
        await expect(
          this.contracts.membershipsProxy
            .connect(this.signers.bob)
            .purchase(this.signers.bob.address, { value: this.membership.price }),
        )
          .to.emit(this.contracts.membershipsProxy, "MembershipPurchased")
          .withArgs(
            1,
            this.signers.bob.address,
            (await ethers.provider.getBlock("latest")).timestamp + this.membership.validity,
          );
      });

      it("should transfer ERC20 payment token from purchaser - ERC20 payment", async function () {
        // Purchase
        // Approve bob's tokens for the MembershipsFactory contract
        await this.contracts.erc20PaymentToken
          .connect(this.signers.bob)
          .approve(this.contracts.membershipsProxy_ERC20.address, this.membership_ERC20.price);

        const negativePaymentTokens = BigNumber.from(`-${this.membership_ERC20.price.toString()}`);

        await expect(() =>
          this.contracts.membershipsProxy_ERC20.connect(this.signers.bob).purchase(this.signers.bob.address),
        ).to.changeTokenBalances(
          this.contracts.erc20PaymentToken,
          [this.signers.bob, this.contracts.membershipsProxy_ERC20],
          [negativePaymentTokens, this.membership_ERC20.price],
        );
      });

      it("should revert with IncorrectValue() if msg.value != price - ETH payment", async function () {
        await expect(
          this.contracts.membershipsProxy.connect(this.signers.bob).purchase(this.signers.bob.address),
        ).to.be.revertedWith("IncorrectValue");
      });
    });

    describe("mint()", function () {
      it("should revert if non-owner tries to mint()", async function () {
        await expect(
          this.contracts.membershipsProxy.connect(this.signers.bob).mint(this.signers.bob.address),
        ).to.be.revertedWith("Ownable: caller is not the owner");
      });

      it("should emit MembershipMinted()", async function () {
        await expect(this.contracts.membershipsProxy.connect(this.signers.alice).mint(this.signers.bob.address))
          .to.emit(this.contracts.membershipsProxy, "MembershipMinted")
          .withArgs(
            1,
            this.signers.bob.address,
            (await ethers.provider.getBlock("latest")).timestamp + this.membership.validity,
          );
      });
    });

    describe("renew()", function () {
      it("should revert if contract is paused", async function () {
        // Pause first
        await this.contracts.membershipsProxy.connect(this.signers.alice).pause();

        await expect(
          this.contracts.membershipsProxy.connect(this.signers.bob).renew(1, { value: this.membership.price }),
        ).to.be.revertedWith("Pausable: paused");
      });

      describe("_extendExpiration()", function () {
        it("should revert with NonExistentToken() for non-existent token", async function () {
          await expect(
            this.contracts.membershipsProxy.connect(this.signers.bob).renew(1, { value: this.membership.price }),
          ).to.be.revertedWith("NonExistentToken");
        });

        it("should revert with InvalidRenewal() if lifetime validity", async function () {
          // Approve alice's tokens for the MembershipsFactory contract
          await this.contracts.erc20Token
            .connect(this.signers.alice)
            .approve(this.contracts.membershipsFactory.address, parseEther("100").mul(10));

          const membership = {
            tokenAddress: ETH_ADDRESS,
            price: parseEther("0.1"),
            validity: ethers.constants.MaxUint256,
            cap: 10,
            airdropToken: AddressZero,
            airdropAmount: 0,
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

          const membershipsProxy = (await ethers.getContractAt("Memberships", membershipsProxyAddress)) as Memberships;

          // Purchase
          await membershipsProxy
            .connect(this.signers.bob)
            .purchase(this.signers.bob.address, { value: this.membership.price });

          await expect(
            membershipsProxy.connect(this.signers.bob).renew(1, { value: this.membership.price }),
          ).to.be.revertedWith("InvalidRenewal");
        });

        it("should update _expirationTimestamps for token - non-expired token", async function () {
          // Purchase
          await this.contracts.membershipsProxy
            .connect(this.signers.bob)
            .purchase(this.signers.bob.address, { value: this.membership.price });

          const expirationTimestampBeforePurchase = await this.contracts.membershipsProxy.expirationTimestampOf(1);

          await this.contracts.membershipsProxy.connect(this.signers.bob).renew(1, { value: this.membership.price });

          const expirationTimestampAfterPurchase = await this.contracts.membershipsProxy.expirationTimestampOf(1);
          expect(expirationTimestampAfterPurchase).to.equal(
            expirationTimestampBeforePurchase.toNumber() + this.membership.validity,
          );
        });

        it("should update _expirationTimestamps for token - expired token", async function () {
          // Purchase
          await this.contracts.membershipsProxy
            .connect(this.signers.bob)
            .purchase(this.signers.bob.address, { value: this.membership.price });

          const expirationTimestampBeforePurchase = await this.contracts.membershipsProxy.expirationTimestampOf(1);

          // Time travel to one day after expiry - 1
          await timeTravel(expirationTimestampBeforePurchase.toNumber() + SECONDS_PER_DAY - 1);

          // block.timestamp in this call would be one day after expiry i.e, one second after the prev time traveled block
          await this.contracts.membershipsProxy.connect(this.signers.bob).renew(1, { value: this.membership.price });

          const expirationTimestampAfterPurchase = await this.contracts.membershipsProxy.expirationTimestampOf(1);
          expect(expirationTimestampAfterPurchase).to.equal(
            expirationTimestampBeforePurchase.toNumber() + SECONDS_PER_DAY + this.membership.validity,
          );
        });
      });

      it("should emit MembershipRenewed()", async function () {
        // Purchase
        await this.contracts.membershipsProxy
          .connect(this.signers.bob)
          .purchase(this.signers.bob.address, { value: this.membership.price });

        const expirationTimestampBeforePurchase = await this.contracts.membershipsProxy.expirationTimestampOf(1);

        await expect(
          this.contracts.membershipsProxy.connect(this.signers.bob).renew(1, { value: this.membership.price }),
        )
          .to.emit(this.contracts.membershipsProxy, "MembershipRenewed")
          .withArgs(1, expirationTimestampBeforePurchase.toNumber() + this.membership.validity);
      });

      it("should transfer ERC20 payment token from renewer - ERC20 payment", async function () {
        // Purchase
        // Approve bob's tokens for the MembershipsFactory contract
        await this.contracts.erc20PaymentToken
          .connect(this.signers.bob)
          .approve(this.contracts.membershipsProxy_ERC20.address, this.membership_ERC20.price);
        await this.contracts.membershipsProxy_ERC20.connect(this.signers.bob).purchase(this.signers.bob.address);

        // Renew
        const negativePaymentTokens = BigNumber.from(`-${this.membership_ERC20.price.toString()}`);

        await this.contracts.erc20PaymentToken
          .connect(this.signers.bob)
          .approve(this.contracts.membershipsProxy_ERC20.address, this.membership_ERC20.price);
        await expect(() =>
          this.contracts.membershipsProxy_ERC20.connect(this.signers.bob).renew(1),
        ).to.changeTokenBalances(
          this.contracts.erc20PaymentToken,
          [this.signers.bob, this.contracts.membershipsProxy_ERC20],
          [negativePaymentTokens, this.membership_ERC20.price],
        );
      });

      it("should revert with IncorrectValue() if msg.value != price", async function () {
        // Purchase
        await this.contracts.membershipsProxy
          .connect(this.signers.bob)
          .purchase(this.signers.bob.address, { value: this.membership.price });

        await expect(this.contracts.membershipsProxy.connect(this.signers.bob).renew(1)).to.be.revertedWith(
          "IncorrectValue",
        );
      });
    });

    describe("withdraw()", function () {
      it("should revert if non-owner tries to withdraw()", async function () {
        await expect(this.contracts.membershipsProxy.connect(this.signers.bob).withdraw()).to.be.revertedWith(
          "Ownable: caller is not the owner",
        );
      });

      it("should transfer sales funds and fees - ETH payment", async function () {
        // Purchase one membership to generate sales fund
        const balanceBeforePurchase = await ethers.provider.getBalance(this.contracts.membershipsProxy.address);
        expect(balanceBeforePurchase).to.be.equal(0);

        await this.contracts.membershipsProxy
          .connect(this.signers.bob)
          .purchase(this.signers.bob.address, { value: this.membership.price });

        const balanceAfterPurchase = await ethers.provider.getBalance(this.contracts.membershipsProxy.address);
        expect(balanceAfterPurchase).to.be.equal(balanceBeforePurchase.add(this.membership.price));

        const fee = balanceAfterPurchase.mul(FEE_BPS).div(10_000);
        expect(fee.gt(0)).to.equal(true);

        const negativeBalanceAfterPurchase = BigNumber.from(`-${balanceAfterPurchase.toString()}`);
        await expect(() =>
          this.contracts.membershipsProxy.connect(this.signers.alice).withdraw(),
        ).to.changeEtherBalances(
          [this.contracts.membershipsProxy, new VoidSigner(FEE_TREASURY, ethers.provider), this.signers.alice],
          [negativeBalanceAfterPurchase, fee, balanceAfterPurchase.sub(fee)],
        );
      });

      it("should transfer sales funds and fees - zero fees - ETH payment", async function () {
        // Set fees to 0
        await this.contracts.membershipsFactory.connect(this.signers.alice).setFeeBPS(0);

        // Purchase one membership to generate sales fund
        const balanceBeforePurchase = await ethers.provider.getBalance(this.contracts.membershipsProxy.address);
        expect(balanceBeforePurchase).to.be.equal(0);

        await this.contracts.membershipsProxy
          .connect(this.signers.bob)
          .purchase(this.signers.bob.address, { value: this.membership.price });

        const balanceAfterPurchase = await ethers.provider.getBalance(this.contracts.membershipsProxy.address);
        expect(balanceAfterPurchase).to.be.equal(balanceBeforePurchase.add(this.membership.price));

        const negativeBalanceAfterPurchase = BigNumber.from(`-${balanceAfterPurchase.toString()}`);
        await expect(() =>
          this.contracts.membershipsProxy.connect(this.signers.alice).withdraw(),
        ).to.changeEtherBalances(
          [this.contracts.membershipsProxy, new VoidSigner(FEE_TREASURY, ethers.provider), this.signers.alice],
          [negativeBalanceAfterPurchase, 0, balanceAfterPurchase],
        );
      });

      it("should transfer sales funds and fees - ERC20 payment", async function () {
        // Purchase one membership to generate sales fund
        const balanceBeforePurchase = await this.contracts.erc20PaymentToken.balanceOf(
          this.contracts.membershipsProxy_ERC20.address,
        );
        expect(balanceBeforePurchase).to.be.equal(0);

        // Approve bob's tokens for the MembershipsFactory contract
        await this.contracts.erc20PaymentToken
          .connect(this.signers.bob)
          .approve(this.contracts.membershipsProxy_ERC20.address, this.membership_ERC20.price);
        await this.contracts.membershipsProxy_ERC20.connect(this.signers.bob).purchase(this.signers.bob.address);

        const balanceAfterPurchase = await this.contracts.erc20PaymentToken.balanceOf(
          this.contracts.membershipsProxy_ERC20.address,
        );
        expect(balanceAfterPurchase).to.be.equal(balanceBeforePurchase.add(this.membership_ERC20.price));

        const fee = balanceAfterPurchase.mul(FEE_BPS).div(10_000);
        expect(fee.gt(0)).to.equal(true);

        const negativeBalanceAfterPurchase = BigNumber.from(`-${balanceAfterPurchase.toString()}`);

        await expect(() =>
          this.contracts.membershipsProxy_ERC20.connect(this.signers.alice).withdraw(),
        ).to.changeTokenBalances(
          this.contracts.erc20PaymentToken,
          [this.contracts.membershipsProxy_ERC20, new VoidSigner(FEE_TREASURY, ethers.provider), this.signers.alice],
          [negativeBalanceAfterPurchase, fee, balanceAfterPurchase.sub(fee)],
        );
      });

      it("should transfer sales funds and fees - zero fees - ERC20 payment", async function () {
        // Set fees to 0
        await this.contracts.membershipsFactory.connect(this.signers.alice).setFeeBPS(0);

        // Purchase one membership to generate sales fund
        const balanceBeforePurchase = await this.contracts.erc20PaymentToken.balanceOf(
          this.contracts.membershipsProxy_ERC20.address,
        );
        expect(balanceBeforePurchase).to.be.equal(0);
        await this.contracts.erc20PaymentToken
          .connect(this.signers.bob)
          .approve(this.contracts.membershipsProxy_ERC20.address, this.membership_ERC20.price);
        await this.contracts.membershipsProxy_ERC20.connect(this.signers.bob).purchase(this.signers.bob.address);

        const balanceAfterPurchase = await this.contracts.erc20PaymentToken.balanceOf(
          this.contracts.membershipsProxy_ERC20.address,
        );
        expect(balanceAfterPurchase).to.be.equal(balanceBeforePurchase.add(this.membership.price));

        const negativeBalanceAfterPurchase = BigNumber.from(`-${balanceAfterPurchase.toString()}`);
        await expect(() =>
          this.contracts.membershipsProxy_ERC20.connect(this.signers.alice).withdraw(),
        ).to.changeTokenBalances(
          this.contracts.erc20PaymentToken,
          [this.contracts.membershipsProxy_ERC20, new VoidSigner(FEE_TREASURY, ethers.provider), this.signers.alice],
          [negativeBalanceAfterPurchase, 0, balanceAfterPurchase],
        );
      });

      it("should emit Withdrawal()", async function () {
        // Purchase one membership to generate sales fund
        const balanceBeforePurchase = await ethers.provider.getBalance(this.contracts.membershipsProxy.address);
        expect(balanceBeforePurchase).to.be.equal(0);

        await this.contracts.membershipsProxy
          .connect(this.signers.bob)
          .purchase(this.signers.bob.address, { value: this.membership.price });

        const balanceAfterPurchase = await ethers.provider.getBalance(this.contracts.membershipsProxy.address);
        expect(balanceAfterPurchase).to.be.equal(balanceBeforePurchase.add(this.membership.price));

        const fee = balanceAfterPurchase.mul(FEE_BPS).div(10_000);
        expect(fee.gt(0)).to.equal(true);

        await expect(this.contracts.membershipsProxy.connect(this.signers.alice).withdraw())
          .to.emit(this.contracts.membershipsProxy, "Withdrawal")
          .withArgs(balanceAfterPurchase.sub(fee), this.signers.alice.address, fee, FEE_TREASURY);
      });

      describe("_transferFunds()", function () {
        it("should revert with InsufficientBalance()", async function () {
          // Set fees to 110% to fail the fee transfer
          await this.contracts.membershipsFactory.connect(this.signers.alice).setFeeBPS(110_00);

          // Purchase one membership to generate sales fund
          await this.contracts.membershipsProxy
            .connect(this.signers.bob)
            .purchase(this.signers.bob.address, { value: this.membership.price });

          await expect(this.contracts.membershipsProxy.connect(this.signers.alice).withdraw()).to.be.revertedWith(
            "InsufficientBalance",
          );
        });

        it("should revert with TransferFailed()", async function () {
          const revertOnReceiveEtherArtifact: Artifact = await artifacts.readArtifact("RevertOnReceiveEther");
          const revertOnReceiveEther: RevertOnReceiveEther = <RevertOnReceiveEther>(
            await deployContract(this.signers.alice, revertOnReceiveEtherArtifact)
          );

          await this.contracts.membershipsProxy
            .connect(this.signers.bob)
            .purchase(this.signers.bob.address, { value: this.membership.price });

          // Set fee treasury to reverting contract to fail the fee transfer
          await this.contracts.membershipsFactory
            .connect(this.signers.alice)
            .setFeeTreasury(revertOnReceiveEther.address);

          await expect(this.contracts.membershipsProxy.connect(this.signers.alice).withdraw()).to.be.revertedWith(
            "TransferFailed",
          );
        });
      });
    });

    describe("changeBaseTokenURI()", function () {
      it("should revert if non-owner tries to changeBaseTokenURI()", async function () {
        await expect(this.contracts.membershipsProxy.connect(this.signers.bob).changeBaseTokenURI()).to.be.revertedWith(
          "Ownable: caller is not the owner",
        );
      });

      it("should change _baseTokenURI", async function () {
        // Purchase
        await this.contracts.membershipsProxy
          .connect(this.signers.bob)
          .purchase(this.signers.bob.address, { value: this.membership.price });

        const tokenURIBeforeChange = await this.contracts.membershipsProxy.tokenURI(1);
        expect(tokenURIBeforeChange).to.equal(`${MEMBERSHIPS_BASE_URI}1`);

        // Set baseTokenURI for the proxy in MembershipsMetadata
        await this.contracts.membershipsMetadataRegistry
          .connect(this.signers.alice)
          .setBaseTokenURI(this.contracts.membershipsProxy.address, "ipfs://newBaseTokenURI/");

        await this.contracts.membershipsProxy.connect(this.signers.alice).changeBaseTokenURI();

        const tokenURIAfterChange = await this.contracts.membershipsProxy.tokenURI(1);
        expect(tokenURIAfterChange).to.equal(`ipfs://newBaseTokenURI/1`);
      });

      it("should revert with InvalidBaseTokenURI() if baseURI not set in MembershipsMetadataRegistry", async function () {
        await expect(
          this.contracts.membershipsProxy.connect(this.signers.alice).changeBaseTokenURI(),
        ).to.be.revertedWith("InvalidBaseTokenURI");
      });

      it("should revert when called more than once", async function () {
        // Purchase
        await this.contracts.membershipsProxy
          .connect(this.signers.bob)
          .purchase(this.signers.bob.address, { value: this.membership.price });

        const tokenURIBeforeChange = await this.contracts.membershipsProxy.tokenURI(1);
        expect(tokenURIBeforeChange).to.equal(`${MEMBERSHIPS_BASE_URI}1`);

        // Set baseTokenURI for the proxy in MembershipsMetadata
        await this.contracts.membershipsMetadataRegistry
          .connect(this.signers.alice)
          .setBaseTokenURI(this.contracts.membershipsProxy.address, "ipfs://newBaseTokenURI/");

        await this.contracts.membershipsProxy.connect(this.signers.alice).changeBaseTokenURI();

        const tokenURIAfterChange = await this.contracts.membershipsProxy.tokenURI(1);
        expect(tokenURIAfterChange).to.equal(`ipfs://newBaseTokenURI/1`);

        // Try changeBaseTokenURI() again
        await expect(
          this.contracts.membershipsProxy.connect(this.signers.alice).changeBaseTokenURI(),
        ).to.be.revertedWith("Initializable: contract is already initialized");
      });
    });

    describe("expirationTimestampOf()", function () {
      it("should return correct expiration timestamp for token", async function () {
        await this.contracts.membershipsProxy
          .connect(this.signers.bob)
          .purchase(this.signers.bob.address, { value: this.membership.price });

        const latestBlockTimestamp = (await ethers.provider.getBlock("latest")).timestamp;

        const expirationTimestampAfterPurchase = await this.contracts.membershipsProxy.expirationTimestampOf(1);
        expect(expirationTimestampAfterPurchase).to.equal(latestBlockTimestamp + this.membership.validity);
      });

      it("should revert with NonExistentToken() for non-existent token", async function () {
        await expect(this.contracts.membershipsProxy.expirationTimestampOf(0)).to.be.revertedWith("NonExistentToken");

        await this.contracts.membershipsProxy
          .connect(this.signers.bob)
          .purchase(this.signers.bob.address, { value: this.membership.price });

        const latestBlockTimestamp = (await ethers.provider.getBlock("latest")).timestamp;

        const expirationTimestampAfterPurchase = await this.contracts.membershipsProxy.expirationTimestampOf(1);
        expect(expirationTimestampAfterPurchase).to.equal(latestBlockTimestamp + this.membership.validity);

        await expect(this.contracts.membershipsProxy.expirationTimestampOf(2)).to.be.revertedWith("NonExistentToken");
      });
    });

    describe("isValid()", function () {
      it("should return true if expiration timestamp > now", async function () {
        // Purchase
        await this.contracts.membershipsProxy
          .connect(this.signers.bob)
          .purchase(this.signers.bob.address, { value: this.membership.price });

        const latestBlockTimestamp = (await ethers.provider.getBlock("latest")).timestamp;

        const expirationTimestampAfterPurchase = await this.contracts.membershipsProxy.expirationTimestampOf(1);
        expect(expirationTimestampAfterPurchase).to.equal(latestBlockTimestamp + this.membership.validity);

        expect(await this.contracts.membershipsProxy.isValid(1)).to.equal(true);
      });

      it("should return false if expiration !(timestamp > now)", async function () {
        // Purchase
        await this.contracts.membershipsProxy
          .connect(this.signers.bob)
          .purchase(this.signers.bob.address, { value: this.membership.price });

        const latestBlockTimestamp = (await ethers.provider.getBlock("latest")).timestamp;

        const expirationTimestampAfterPurchase = await this.contracts.membershipsProxy.expirationTimestampOf(1);
        expect(expirationTimestampAfterPurchase).to.equal(latestBlockTimestamp + this.membership.validity);

        expect(await this.contracts.membershipsProxy.isValid(1)).to.equal(true);

        // Time travel to 1 second before expiry
        await timeTravel(expirationTimestampAfterPurchase.toNumber() - 1);
        expect(await this.contracts.membershipsProxy.isValid(1)).to.equal(true);

        // Time travel to expiry
        await timeTravel(expirationTimestampAfterPurchase.toNumber());
        expect(await this.contracts.membershipsProxy.isValid(1)).to.equal(false);
      });

      it("should revert with NonExistentToken() for non-existent token", async function () {
        await expect(this.contracts.membershipsProxy.isValid(1)).to.be.revertedWith("NonExistentToken");
      });
    });

    describe("hasValidToken()", function () {
      it("should return false if owner has no balance", async function () {
        expect(await this.contracts.membershipsProxy.hasValidToken(this.signers.bob.address)).to.equal(false);
      });

      it("should return true if owner has 1 valid token", async function () {
        // Purchase
        await this.contracts.membershipsProxy
          .connect(this.signers.bob)
          .purchase(this.signers.bob.address, { value: this.membership.price });

        expect(await this.contracts.membershipsProxy.hasValidToken(this.signers.bob.address)).to.equal(true);
      });

      it("should return true if owner has multiple valid token", async function () {
        // Purchase 1
        await this.contracts.membershipsProxy
          .connect(this.signers.bob)
          .purchase(this.signers.bob.address, { value: this.membership.price });
        expect(await this.contracts.membershipsProxy.hasValidToken(this.signers.bob.address)).to.equal(true);

        // Purchase 2
        await this.contracts.membershipsProxy
          .connect(this.signers.bob)
          .purchase(this.signers.bob.address, { value: this.membership.price });
        expect(await this.contracts.membershipsProxy.hasValidToken(this.signers.bob.address)).to.equal(true);
      });

      it("should return false if owner has 1 expired token", async function () {
        // Purchase
        await this.contracts.membershipsProxy
          .connect(this.signers.bob)
          .purchase(this.signers.bob.address, { value: this.membership.price });

        expect(await this.contracts.membershipsProxy.hasValidToken(this.signers.bob.address)).to.equal(true);

        // Time travel to 1 second before expiry
        const expirationTimestampAfterPurchase = await this.contracts.membershipsProxy.expirationTimestampOf(1);
        await timeTravel(expirationTimestampAfterPurchase.toNumber() - 1);
        expect(await this.contracts.membershipsProxy.isValid(1)).to.equal(true);

        expect(await this.contracts.membershipsProxy.hasValidToken(this.signers.bob.address)).to.equal(true);

        // Time travel to expiry
        await timeTravel(expirationTimestampAfterPurchase.toNumber());
        expect(await this.contracts.membershipsProxy.isValid(1)).to.equal(false);

        expect(await this.contracts.membershipsProxy.hasValidToken(this.signers.bob.address)).to.equal(false);
      });

      it("should return correct at different times if owner has multiple expired token", async function () {
        // Purchase 1
        await this.contracts.membershipsProxy
          .connect(this.signers.bob)
          .purchase(this.signers.bob.address, { value: this.membership.price });
        expect(await this.contracts.membershipsProxy.hasValidToken(this.signers.bob.address)).to.equal(true);

        // mine a block to push one second
        await hre.network.provider.send("evm_mine");

        // Purchase 2
        await this.contracts.membershipsProxy
          .connect(this.signers.bob)
          .purchase(this.signers.bob.address, { value: this.membership.price });
        expect(await this.contracts.membershipsProxy.hasValidToken(this.signers.bob.address)).to.equal(true);

        // Time travel to 1 second before expiry of first token
        const expirationTimestamp_1_AfterPurchase = await this.contracts.membershipsProxy.expirationTimestampOf(1);
        await timeTravel(expirationTimestamp_1_AfterPurchase.toNumber() - 1);
        expect(await this.contracts.membershipsProxy.isValid(1)).to.equal(true);

        expect(await this.contracts.membershipsProxy.hasValidToken(this.signers.bob.address)).to.equal(true);

        // Time travel to expiry of first token
        await timeTravel(expirationTimestamp_1_AfterPurchase.toNumber());
        expect(await this.contracts.membershipsProxy.isValid(1)).to.equal(false);

        // Should still have the second valid token -- so must be true
        expect(await this.contracts.membershipsProxy.hasValidToken(this.signers.bob.address)).to.equal(true);

        // Time travel to 1 second before expiry of second token
        const expirationTimestamp_2_AfterPurchase = await this.contracts.membershipsProxy.expirationTimestampOf(2);
        await timeTravel(expirationTimestamp_2_AfterPurchase.toNumber() - 1);
        expect(await this.contracts.membershipsProxy.isValid(2)).to.equal(true);

        expect(await this.contracts.membershipsProxy.hasValidToken(this.signers.bob.address)).to.equal(true);

        // Time travel to expiry of second token
        await timeTravel(expirationTimestamp_2_AfterPurchase.toNumber());
        expect(await this.contracts.membershipsProxy.isValid(2)).to.equal(false);

        // All valid tokens are expired
        expect(await this.contracts.membershipsProxy.hasValidToken(this.signers.bob.address)).to.equal(false);
      });
    });

    describe("setDefaultRoyalty()", function () {
      it("should revert if non-owner tries to setDefaultRoyalty()", async function () {
        const newRoyaltyReceiver = this.signers.bob.address; // change royalty info to bob
        const newRoyaltyFeeNumerator = 5000; // change royalty info to 50%

        await expect(
          this.contracts.membershipsProxy
            .connect(this.signers.bob)
            .setDefaultRoyalty(newRoyaltyReceiver, newRoyaltyFeeNumerator),
        ).to.be.revertedWith("Ownable: caller is not the owner");
      });

      it("should change defaultRoyalty", async function () {
        expect((await this.contracts.membershipsProxy.royaltyInfo(1, this.membership.price))[0]).to.equal(
          this.signers.alice.address,
        );
        expect((await this.contracts.membershipsProxy.royaltyInfo(1, this.membership.price))[1]).to.equal(
          parseEther(((0.1 * 1000) / 10000).toString()), // royaltyAmount = (_salePrice * royalty.royaltyFraction) / _feeDenominator() : ERC2981Upgradeable)
        );

        const newRoyaltyReceiver = this.signers.bob.address; // change royalty info to bob
        const newRoyaltyFeeNumerator = 5000; // change royalty info to 50%

        await this.contracts.membershipsProxy
          .connect(this.signers.alice)
          .setDefaultRoyalty(newRoyaltyReceiver, newRoyaltyFeeNumerator);

        expect((await this.contracts.membershipsProxy.royaltyInfo(1, this.membership.price))[0]).to.equal(
          this.signers.bob.address,
        );
        expect((await this.contracts.membershipsProxy.royaltyInfo(1, this.membership.price))[1]).to.equal(
          parseEther(((0.5 * 1000) / 10000).toString()), // royaltyAmount = (_salePrice * royalty.royaltyFraction) / _feeDenominator() : ERC2981Upgradeable)
        );
      });
    });

    describe("supportsInterface()", function () {
      it("should return true for correct interfaces", async function () {
        const interfaces = ["ERC165", "ERC721", "ERC721Metadata", "ERC2981"];

        for (const k of interfaces) {
          const interfaceId = INTERFACE_IDS[k];
          expect(await this.contracts.membershipsProxy.supportsInterface(interfaceId)).to.equal(true);
        }
      });
    });
  });
}

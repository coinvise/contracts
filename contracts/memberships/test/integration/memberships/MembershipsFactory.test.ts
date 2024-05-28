import { expect } from "chai";
import { BigNumber } from "ethers";
import { AddressZero } from "@ethersproject/constants";
import { parseEther, parseUnits, getContractAddress } from "ethers/lib/utils";
import {
  MEMBERSHIPS_NAME,
  MEMBERSHIPS_SYMBOL,
  MEMBERSHIPS_CONTRACT_URI,
  MEMBERSHIPS_BASE_URI,
  SECONDS_PER_DAY,
  ETH_ADDRESS,
} from "../../../helpers/constants";
import { Memberships__factory as MembershipsV1__factory } from "../../../src/v1/types/factories/Memberships__factory";
import { Memberships as MembershipsV1 } from "../../../src/v1/types/Memberships";
import { Memberships } from "../../../src/types/Memberships";
import { integrationFixture, upgradesFixture } from "../../shared/fixtures";
import { ethers } from "hardhat";
import { getArgFromEvent } from "../../../helpers/events";
import { deployTestMembershipsV2, deployTestMembershipsV3 } from "../../shared/deployers";
import { MembershipsProxy } from "../../../src/types/MembershipsProxy";
import { TestMembershipsV2 } from "../../../src/types/TestMembershipsV2";
import { TestMembershipsV3 } from "../../../src/types/TestMembershipsV3";

export function integrationTestMembershipsFactory(): void {
  describe("MembershipsFactory", function () {
    beforeEach(async function () {
      const { membershipsMetadataRegistry, memberships, membershipsFactory, erc20Token } = await this.loadFixture(
        integrationFixture,
      );
      this.contracts.membershipsMetadataRegistry = membershipsMetadataRegistry;
      this.contracts.memberships = memberships;
      this.contracts.membershipsFactory = membershipsFactory;
      this.contracts.erc20Token = erc20Token;

      // Set version 2 Memberships implementation
      await this.contracts.membershipsFactory.setMembershipsImplAddress(2, this.contracts.memberships.address);

      await this.contracts.erc20Token.mint(
        this.signers.alice.address,
        parseUnits("100000", await this.contracts.erc20Token.decimals()),
      );
    });

    describe("deployMemberships()", function () {
      describe("deployMembershipsAtVersion()", function () {
        it("should revert with InvalidMemberships() if _version implementation is not set", async function () {
          const membership = {
            tokenAddress: ETH_ADDRESS,
            price: parseEther("0.1"),
            validity: Math.floor(90 * SECONDS_PER_DAY), // 90 days or ~3 months from now
            cap: 0,
            airdropToken: this.contracts.erc20Token.address,
            airdropAmount: parseEther("100"),
          };
          await expect(
            this.contracts.membershipsFactory.connect(this.signers.alice).deployMembershipsAtVersion(
              0, // version 0
              this.signers.alice.address,
              this.signers.alice.address,
              MEMBERSHIPS_NAME,
              MEMBERSHIPS_SYMBOL,
              MEMBERSHIPS_CONTRACT_URI,
              MEMBERSHIPS_BASE_URI,
              membership,
            ),
          ).to.be.revertedWith("InvalidMemberships()");
          await expect(
            this.contracts.membershipsFactory.connect(this.signers.alice).deployMembershipsAtVersion(
              3, // version 3
              this.signers.alice.address,
              this.signers.alice.address,
              MEMBERSHIPS_NAME,
              MEMBERSHIPS_SYMBOL,
              MEMBERSHIPS_CONTRACT_URI,
              MEMBERSHIPS_BASE_URI,
              membership,
            ),
          ).to.be.revertedWith("InvalidMemberships()");
        });

        it("should revert with 'Invalid Cap' if cap <= 0", async function () {
          const membership = {
            tokenAddress: ETH_ADDRESS,
            price: parseEther("0.1"),
            validity: Math.floor(90 * SECONDS_PER_DAY), // 90 days or ~3 months from now
            cap: 0,
            airdropToken: this.contracts.erc20Token.address,
            airdropAmount: parseEther("100"),
          };
          await expect(
            this.contracts.membershipsFactory
              .connect(this.signers.alice)
              .deployMemberships(
                this.signers.alice.address,
                this.signers.alice.address,
                MEMBERSHIPS_NAME,
                MEMBERSHIPS_SYMBOL,
                MEMBERSHIPS_CONTRACT_URI,
                MEMBERSHIPS_BASE_URI,
                membership,
              ),
          ).to.be.revertedWith("Invalid Cap");
        });

        it("should deploy and initialize Memberships proxy - no airdrop", async function () {
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

          expect(await membershipsProxy.airdropToken()).to.equal(AddressZero);
          expect(await membershipsProxy.airdropAmount()).to.equal(0);
        });

        it("should transfer airdrop tokens from caller to proxy", async function () {
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
          const totalAirdropTokens = membership.airdropAmount.mul(membership.cap);
          const negativeTotalAirdropTokens = BigNumber.from(`-${totalAirdropTokens.toString()}`);

          const membershipsFactoryNoncePlusOne = await ethers.provider.getTransactionCount(
            this.contracts.membershipsFactory.address,
          );
          const membershipsProxyAddress = getContractAddress({
            from: this.contracts.membershipsFactory.address,
            nonce: membershipsFactoryNoncePlusOne,
          });
          const membershipsProxy = (await ethers.getContractAt("Memberships", membershipsProxyAddress)) as Memberships;

          await expect(() =>
            this.contracts.membershipsFactory
              .connect(this.signers.alice)
              .deployMemberships(
                this.signers.alice.address,
                this.signers.alice.address,
                MEMBERSHIPS_NAME,
                MEMBERSHIPS_SYMBOL,
                MEMBERSHIPS_CONTRACT_URI,
                MEMBERSHIPS_BASE_URI,
                membership,
              ),
          ).to.changeTokenBalances(
            this.contracts.erc20Token,
            [this.signers.alice, membershipsProxy],
            [negativeTotalAirdropTokens, totalAirdropTokens],
          );
        });

        it("should emit MembershipsDeployed()", async function () {
          // Approve alice's tokens for the MembershipsFactory contract
          await this.contracts.erc20Token
            .connect(this.signers.alice)
            .approve(this.contracts.membershipsFactory.address, parseEther("100").mul(10));

          const membershipsFactoryNoncePlusOne = await ethers.provider.getTransactionCount(
            this.contracts.membershipsFactory.address,
          );
          const membershipsProxyAddress = getContractAddress({
            from: this.contracts.membershipsFactory.address,
            nonce: membershipsFactoryNoncePlusOne,
          });

          await expect(
            this.contracts.membershipsFactory
              .connect(this.signers.alice)
              .deployMemberships(
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
                  airdropToken: this.contracts.erc20Token.address,
                  airdropAmount: parseEther("100"),
                },
              ),
          )
            .to.emit(this.contracts.membershipsFactory, "MembershipsDeployed")
            .withArgs(membershipsProxyAddress, this.signers.alice.address, this.contracts.memberships.address);
        });

        it("should deploy and initialize Memberships proxy at specific versions", async function () {
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
          let deployMembershipsTxn = await this.contracts.membershipsFactory
            .connect(this.signers.alice)
            .deployMembershipsAtVersion(
              2,
              this.signers.alice.address,
              this.signers.alice.address,
              MEMBERSHIPS_NAME,
              MEMBERSHIPS_SYMBOL,
              MEMBERSHIPS_CONTRACT_URI,
              MEMBERSHIPS_BASE_URI,
              membership,
            );
          let receipt = await deployMembershipsTxn.wait();
          let membershipsProxyAddress = getArgFromEvent(
            this.contracts.membershipsFactory,
            receipt,
            this.contracts.membershipsFactory.interface.events["MembershipsDeployed(address,address,address)"].name,
            "membershipsProxy",
          );

          let membershipsProxy_Proxy = (await ethers.getContractAt(
            "MembershipsProxy",
            membershipsProxyAddress,
          )) as MembershipsProxy;

          expect(await membershipsProxy_Proxy.memberships()).to.equal(this.contracts.memberships.address);
          expect(await membershipsProxy_Proxy.memberships()).to.equal(
            await this.contracts.membershipsFactory.membershipsImpls(2), // version 2
          );

          const membershipsProxy = (await ethers.getContractAt("Memberships", membershipsProxyAddress)) as Memberships;

          expect(await membershipsProxy.owner()).to.equal(this.signers.alice.address);
          expect(await membershipsProxy.factory()).to.equal(this.contracts.membershipsFactory.address);
          expect(await membershipsProxy.treasury()).to.equal(this.signers.alice.address);
          expect(await membershipsProxy.name()).to.equal(MEMBERSHIPS_NAME);
          expect(await membershipsProxy.symbol()).to.equal(MEMBERSHIPS_SYMBOL);
          expect(await membershipsProxy.contractURI()).to.equal(MEMBERSHIPS_CONTRACT_URI);
          // Mint token to test tokenURI
          await membershipsProxy.mint(this.signers.alice.address);
          expect(await membershipsProxy.tokenURI(1)).to.equal(MEMBERSHIPS_BASE_URI + 1);
          expect(await membershipsProxy.tokenAddress()).to.equal(membership.tokenAddress);
          expect(await membershipsProxy.price()).to.equal(membership.price);
          expect(await membershipsProxy.validity()).to.equal(membership.validity);
          expect(await membershipsProxy.cap()).to.equal(membership.cap);
          expect(await membershipsProxy.airdropToken()).to.equal(membership.airdropToken);
          expect(await membershipsProxy.airdropAmount()).to.equal(membership.airdropAmount);
          expect((await membershipsProxy.royaltyInfo(1, membership.price))[0]).to.equal(this.signers.alice.address);
          expect((await membershipsProxy.royaltyInfo(1, membership.price))[1]).to.equal(
            parseEther(((0.1 * 1000) / 10000).toString()), // royaltyAmount = (_salePrice * royalty.royaltyFraction) / _feeDenominator() : ERC2981Upgradeable)
          );

          // Deploy new Memberships implementation contract
          const testMembershipsV2 = await deployTestMembershipsV2(
            this.signers.alice,
            this.contracts.membershipsMetadataRegistry.address,
          );
          // Set version 2 memberships implementation address on MembershipsFactory
          await this.contracts.membershipsFactory
            .connect(this.signers.alice)
            .setMembershipsImplAddress(2, testMembershipsV2.address);

          // Approve alice's tokens for the MembershipsFactory contract
          await this.contracts.erc20Token
            .connect(this.signers.alice)
            .approve(this.contracts.membershipsFactory.address, parseEther("100").mul(10));

          deployMembershipsTxn = await this.contracts.membershipsFactory
            .connect(this.signers.alice)
            .deployMembershipsAtVersion(
              2,
              this.signers.alice.address,
              this.signers.alice.address,
              MEMBERSHIPS_NAME,
              MEMBERSHIPS_SYMBOL,
              MEMBERSHIPS_CONTRACT_URI,
              MEMBERSHIPS_BASE_URI,
              membership,
            );
          receipt = await deployMembershipsTxn.wait();
          membershipsProxyAddress = getArgFromEvent(
            this.contracts.membershipsFactory,
            receipt,
            this.contracts.membershipsFactory.interface.events["MembershipsDeployed(address,address,address)"].name,
            "membershipsProxy",
          );

          membershipsProxy_Proxy = (await ethers.getContractAt(
            "MembershipsProxy",
            membershipsProxyAddress,
          )) as MembershipsProxy;

          expect(await membershipsProxy_Proxy.memberships()).to.equal(testMembershipsV2.address);
          expect(await membershipsProxy_Proxy.memberships()).to.equal(
            await this.contracts.membershipsFactory.membershipsImpls(2), // version 2
          );

          const testMembershipsV2Proxy = (await ethers.getContractAt(
            "TestMembershipsV2",
            membershipsProxyAddress,
          )) as TestMembershipsV2;

          // check TestMembershipsV2 state & functions
          expect(await testMembershipsV2Proxy.v2PublicStateVar()).to.equal(AddressZero);
          expect(await testMembershipsV2Proxy.isETHAddress(this.signers.alice.address)).to.equal(false);
          expect(await testMembershipsV2Proxy.v2InternalStateVar()).to.equal(0);
          await testMembershipsV2Proxy.setV2InternalStateVar(256);
          expect(await testMembershipsV2Proxy.v2InternalStateVar()).to.equal(256);
          await testMembershipsV2Proxy.setV2PublicStateVar(this.signers.bob.address);
          expect(await testMembershipsV2Proxy.v2PublicStateVar()).to.equal(this.signers.bob.address);

          expect(await testMembershipsV2Proxy.owner()).to.equal(this.signers.alice.address);
          expect(await testMembershipsV2Proxy.factory()).to.equal(this.contracts.membershipsFactory.address);
          expect(await testMembershipsV2Proxy.treasury()).to.equal(this.signers.alice.address);
          expect(await testMembershipsV2Proxy.name()).to.equal(MEMBERSHIPS_NAME);
          expect(await testMembershipsV2Proxy.symbol()).to.equal(MEMBERSHIPS_SYMBOL);
          expect(await testMembershipsV2Proxy.contractURI()).to.equal(MEMBERSHIPS_CONTRACT_URI);
          // Mint token to test tokenURI
          await testMembershipsV2Proxy.mint(this.signers.alice.address);
          expect(await testMembershipsV2Proxy.tokenURI(1)).to.equal(MEMBERSHIPS_BASE_URI + 1);
          expect(await testMembershipsV2Proxy.tokenAddress()).to.equal(membership.tokenAddress);
          expect(await testMembershipsV2Proxy.price()).to.equal(membership.price);
          expect(await testMembershipsV2Proxy.validity()).to.equal(membership.validity);
          expect(await testMembershipsV2Proxy.cap()).to.equal(membership.cap);
          expect(await testMembershipsV2Proxy.airdropToken()).to.equal(membership.airdropToken);
          expect(await testMembershipsV2Proxy.airdropAmount()).to.equal(membership.airdropAmount);
          expect((await testMembershipsV2Proxy.royaltyInfo(1, membership.price))[0]).to.equal(
            this.signers.alice.address,
          );
          expect((await testMembershipsV2Proxy.royaltyInfo(1, membership.price))[1]).to.equal(
            parseEther(((0.1 * 1000) / 10000).toString()), // royaltyAmount = (_salePrice * royalty.royaltyFraction) / _feeDenominator() : ERC2981Upgradeable)
          );
        });
      });

      it("should deploy and initialize Memberships proxy at latest version", async function () {
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
        let deployMembershipsTxn = await this.contracts.membershipsFactory
          .connect(this.signers.alice)
          .deployMembershipsAtVersion(
            2,
            this.signers.alice.address,
            this.signers.alice.address,
            MEMBERSHIPS_NAME,
            MEMBERSHIPS_SYMBOL,
            MEMBERSHIPS_CONTRACT_URI,
            MEMBERSHIPS_BASE_URI,
            membership,
          );
        let receipt = await deployMembershipsTxn.wait();
        let membershipsProxyAddress = getArgFromEvent(
          this.contracts.membershipsFactory,
          receipt,
          this.contracts.membershipsFactory.interface.events["MembershipsDeployed(address,address,address)"].name,
          "membershipsProxy",
        );

        let membershipsProxy_Proxy = (await ethers.getContractAt(
          "MembershipsProxy",
          membershipsProxyAddress,
        )) as MembershipsProxy;

        expect(await membershipsProxy_Proxy.memberships()).to.equal(this.contracts.memberships.address);
        expect(await membershipsProxy_Proxy.memberships()).to.equal(
          await this.contracts.membershipsFactory.membershipsImpls(
            await this.contracts.membershipsFactory.membershipsLatestVersion(), // latest version
          ),
        );

        const membershipsProxy = (await ethers.getContractAt("Memberships", membershipsProxyAddress)) as Memberships;

        expect(await membershipsProxy.owner()).to.equal(this.signers.alice.address);
        expect(await membershipsProxy.factory()).to.equal(this.contracts.membershipsFactory.address);
        expect(await membershipsProxy.treasury()).to.equal(this.signers.alice.address);
        expect(await membershipsProxy.name()).to.equal(MEMBERSHIPS_NAME);
        expect(await membershipsProxy.symbol()).to.equal(MEMBERSHIPS_SYMBOL);
        expect(await membershipsProxy.contractURI()).to.equal(MEMBERSHIPS_CONTRACT_URI);
        // Mint token to test tokenURI
        await membershipsProxy.mint(this.signers.alice.address);
        expect(await membershipsProxy.tokenURI(1)).to.equal(MEMBERSHIPS_BASE_URI + 1);
        expect(await membershipsProxy.tokenAddress()).to.equal(membership.tokenAddress);
        expect(await membershipsProxy.price()).to.equal(membership.price);
        expect(await membershipsProxy.validity()).to.equal(membership.validity);
        expect(await membershipsProxy.cap()).to.equal(membership.cap);
        expect(await membershipsProxy.airdropToken()).to.equal(membership.airdropToken);
        expect(await membershipsProxy.airdropAmount()).to.equal(membership.airdropAmount);
        expect((await membershipsProxy.royaltyInfo(1, membership.price))[0]).to.equal(this.signers.alice.address);
        expect((await membershipsProxy.royaltyInfo(1, membership.price))[1]).to.equal(
          parseEther(((0.1 * 1000) / 10000).toString()), // royaltyAmount = (_salePrice * royalty.royaltyFraction) / _feeDenominator() : ERC2981Upgradeable)
        );

        // Deploy new Memberships implementation contract
        const testMembershipsV2 = await deployTestMembershipsV2(
          this.signers.alice,
          this.contracts.membershipsMetadataRegistry.address,
        );
        // Set version 2 memberships implementation address on MembershipsFactory
        await this.contracts.membershipsFactory
          .connect(this.signers.alice)
          .setMembershipsImplAddress(2, testMembershipsV2.address);

        // Approve alice's tokens for the MembershipsFactory contract
        await this.contracts.erc20Token
          .connect(this.signers.alice)
          .approve(this.contracts.membershipsFactory.address, parseEther("100").mul(10));

        deployMembershipsTxn = await this.contracts.membershipsFactory
          .connect(this.signers.alice)
          .deployMembershipsAtVersion(
            2,
            this.signers.alice.address,
            this.signers.alice.address,
            MEMBERSHIPS_NAME,
            MEMBERSHIPS_SYMBOL,
            MEMBERSHIPS_CONTRACT_URI,
            MEMBERSHIPS_BASE_URI,
            membership,
          );
        receipt = await deployMembershipsTxn.wait();
        membershipsProxyAddress = getArgFromEvent(
          this.contracts.membershipsFactory,
          receipt,
          this.contracts.membershipsFactory.interface.events["MembershipsDeployed(address,address,address)"].name,
          "membershipsProxy",
        );

        membershipsProxy_Proxy = (await ethers.getContractAt(
          "MembershipsProxy",
          membershipsProxyAddress,
        )) as MembershipsProxy;

        expect(await membershipsProxy_Proxy.memberships()).to.equal(testMembershipsV2.address);
        expect(await membershipsProxy_Proxy.memberships()).to.equal(
          await this.contracts.membershipsFactory.membershipsImpls(
            await this.contracts.membershipsFactory.membershipsLatestVersion(), // latest version
          ),
        );

        const testMembershipsV2Proxy = (await ethers.getContractAt(
          "TestMembershipsV2",
          membershipsProxyAddress,
        )) as TestMembershipsV2;

        // check TestMembershipsV2 state & functions
        expect(await testMembershipsV2Proxy.v2PublicStateVar()).to.equal(AddressZero);
        expect(await testMembershipsV2Proxy.isETHAddress(this.signers.alice.address)).to.equal(false);
        expect(await testMembershipsV2Proxy.v2InternalStateVar()).to.equal(0);
        await testMembershipsV2Proxy.setV2InternalStateVar(256);
        expect(await testMembershipsV2Proxy.v2InternalStateVar()).to.equal(256);
        await testMembershipsV2Proxy.setV2PublicStateVar(this.signers.bob.address);
        expect(await testMembershipsV2Proxy.v2PublicStateVar()).to.equal(this.signers.bob.address);

        expect(await membershipsProxy.owner()).to.equal(this.signers.alice.address);
        expect(await membershipsProxy.factory()).to.equal(this.contracts.membershipsFactory.address);
        expect(await membershipsProxy.treasury()).to.equal(this.signers.alice.address);
        expect(await membershipsProxy.name()).to.equal(MEMBERSHIPS_NAME);
        expect(await membershipsProxy.symbol()).to.equal(MEMBERSHIPS_SYMBOL);
        expect(await membershipsProxy.contractURI()).to.equal(MEMBERSHIPS_CONTRACT_URI);
        // Mint token to test tokenURI
        await membershipsProxy.mint(this.signers.alice.address);
        expect(await membershipsProxy.tokenURI(1)).to.equal(MEMBERSHIPS_BASE_URI + 1);
        expect(await membershipsProxy.tokenAddress()).to.equal(membership.tokenAddress);
        expect(await membershipsProxy.price()).to.equal(membership.price);
        expect(await membershipsProxy.validity()).to.equal(membership.validity);
        expect(await membershipsProxy.cap()).to.equal(membership.cap);
        expect(await membershipsProxy.airdropToken()).to.equal(membership.airdropToken);
        expect(await membershipsProxy.airdropAmount()).to.equal(membership.airdropAmount);
        expect((await membershipsProxy.royaltyInfo(1, membership.price))[0]).to.equal(this.signers.alice.address);
        expect((await membershipsProxy.royaltyInfo(1, membership.price))[1]).to.equal(
          parseEther(((0.1 * 1000) / 10000).toString()), // royaltyAmount = (_salePrice * royalty.royaltyFraction) / _feeDenominator() : ERC2981Upgradeable)
        );
      });
    });

    describe("upgradeProxy()", function () {
      beforeEach(async function () {
        const { memberships, membershipsFactory, erc20Token } = await this.loadFixture(integrationFixture);
        this.contracts.memberships = memberships;
        this.contracts.membershipsFactory = membershipsFactory;
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
      });

      it("should revert with Unauthorized() if called by non-proxy-owner", async function () {
        await expect(
          this.contracts.membershipsFactory
            .connect(this.signers.bob)
            // version doesn't matter here
            .upgradeProxy(1, this.contracts.membershipsProxy.address),
        ).to.be.revertedWith("Unauthorized()");
      });

      it("should revert with InvalidUpgrade() if _version <= currentVersion", async function () {
        const currentVersion = await this.contracts.memberships.version(); // 2
        const _version = 0;
        const membershipsLatestVersion = await this.contracts.membershipsFactory.membershipsLatestVersion(); // 2

        await expect(
          this.contracts.membershipsFactory
            .connect(this.signers.alice)
            .upgradeProxy(_version, this.contracts.membershipsProxy.address),
        ).to.be.revertedWith(`InvalidUpgrade(${currentVersion}, ${_version}, ${membershipsLatestVersion}`);
      });

      it("should revert with InvalidUpgrade() if _version > membershipsLatestVersion", async function () {
        const currentVersion = await this.contracts.memberships.version(); // 2
        const _version = 3;
        const membershipsLatestVersion = await this.contracts.membershipsFactory.membershipsLatestVersion(); // 2

        await expect(
          this.contracts.membershipsFactory
            .connect(this.signers.alice)
            .upgradeProxy(_version, this.contracts.membershipsProxy.address),
        ).to.be.revertedWith(`InvalidUpgrade(${currentVersion}, ${_version}, ${membershipsLatestVersion}`);
      });

      it("should upgrade proxy and keep previous state", async function () {
        this.membershipsProxy_Proxy = (await ethers.getContractAt(
          "MembershipsProxy",
          this.contracts.membershipsProxy.address,
        )) as MembershipsProxy;

        expect(await this.membershipsProxy_Proxy.memberships()).to.equal(this.contracts.memberships.address);

        // Check current state
        expect(await this.contracts.membershipsProxy.owner()).to.equal(this.signers.alice.address);
        expect(await this.contracts.membershipsProxy.factory()).to.equal(this.contracts.membershipsFactory.address);
        expect(await this.contracts.membershipsProxy.treasury()).to.equal(this.signers.alice.address);
        expect(await this.contracts.membershipsProxy.name()).to.equal(MEMBERSHIPS_NAME);
        expect(await this.contracts.membershipsProxy.symbol()).to.equal(MEMBERSHIPS_SYMBOL);
        expect(await this.contracts.membershipsProxy.contractURI()).to.equal(MEMBERSHIPS_CONTRACT_URI);
        // Mint token to test tokenURI
        await this.contracts.membershipsProxy.mint(this.signers.alice.address);
        expect(await this.contracts.membershipsProxy.tokenURI(1)).to.equal(MEMBERSHIPS_BASE_URI + 1);
        expect(await this.contracts.membershipsProxy.tokenAddress()).to.equal(this.membership.tokenAddress);
        expect(await this.contracts.membershipsProxy.price()).to.equal(this.membership.price);
        expect(await this.contracts.membershipsProxy.validity()).to.equal(this.membership.validity);
        expect(await this.contracts.membershipsProxy.cap()).to.equal(this.membership.cap);
        expect(await this.contracts.membershipsProxy.airdropToken()).to.equal(this.membership.airdropToken);
        expect(await this.contracts.membershipsProxy.airdropAmount()).to.equal(this.membership.airdropAmount);
        expect((await this.contracts.membershipsProxy.royaltyInfo(1, this.membership.price))[0]).to.equal(
          this.signers.alice.address,
        );
        expect((await this.contracts.membershipsProxy.royaltyInfo(1, this.membership.price))[1]).to.equal(
          parseEther(((0.1 * 1000) / 10000).toString()), // royaltyAmount = (_salePrice * royalty.royaltyFraction) / _feeDenominator() : ERC2981Upgradeable)
        );

        // Deploy new Memberships implementation contract
        const testMembershipsV2 = await deployTestMembershipsV2(
          this.signers.alice,
          this.contracts.membershipsMetadataRegistry.address,
        );
        // Set version 3 memberships implementation address on MembershipsFactory
        await this.contracts.membershipsFactory
          .connect(this.signers.alice)
          .setMembershipsImplAddress(3, testMembershipsV2.address);

        // Call MembershipsProxy.upgradeMemberships() via MembershipsFactory.upgradeProxy()
        await this.contracts.membershipsFactory.upgradeProxy(3, this.membershipsProxy_Proxy.address);

        expect(await this.membershipsProxy_Proxy.memberships()).to.equal(testMembershipsV2.address);

        const testMembershipsV2Proxy = (await ethers.getContractAt(
          "TestMembershipsV2",
          this.contracts.membershipsProxy.address,
        )) as TestMembershipsV2;

        // check TestMembershipsV2 state & functions
        expect(await testMembershipsV2Proxy.v2PublicStateVar()).to.equal(AddressZero);
        expect(await testMembershipsV2Proxy.isETHAddress(this.signers.alice.address)).to.equal(false);
        expect(await testMembershipsV2Proxy.v2InternalStateVar()).to.equal(0);
        await testMembershipsV2Proxy.setV2InternalStateVar(256);
        expect(await testMembershipsV2Proxy.v2InternalStateVar()).to.equal(256);
        await testMembershipsV2Proxy.setV2PublicStateVar(this.signers.bob.address);
        expect(await testMembershipsV2Proxy.v2PublicStateVar()).to.equal(this.signers.bob.address);

        // Check new state
        expect(await this.contracts.membershipsProxy.owner()).to.equal(this.signers.alice.address);
        expect(await this.contracts.membershipsProxy.factory()).to.equal(this.contracts.membershipsFactory.address);
        expect(await this.contracts.membershipsProxy.treasury()).to.equal(this.signers.alice.address);
        expect(await this.contracts.membershipsProxy.name()).to.equal(MEMBERSHIPS_NAME);
        expect(await this.contracts.membershipsProxy.symbol()).to.equal(MEMBERSHIPS_SYMBOL);
        expect(await this.contracts.membershipsProxy.contractURI()).to.equal(MEMBERSHIPS_CONTRACT_URI);

        expect(await this.contracts.membershipsProxy.tokenURI(1)).to.equal(MEMBERSHIPS_BASE_URI + 1);
        expect(await this.contracts.membershipsProxy.tokenAddress()).to.equal(this.membership.tokenAddress);
        expect(await this.contracts.membershipsProxy.price()).to.equal(this.membership.price);
        expect(await this.contracts.membershipsProxy.validity()).to.equal(this.membership.validity);
        expect(await this.contracts.membershipsProxy.cap()).to.equal(this.membership.cap);
        expect(await this.contracts.membershipsProxy.airdropToken()).to.equal(this.membership.airdropToken);
        expect(await this.contracts.membershipsProxy.airdropAmount()).to.equal(this.membership.airdropAmount);
        expect((await this.contracts.membershipsProxy.royaltyInfo(1, this.membership.price))[0]).to.equal(
          this.signers.alice.address,
        );
        expect((await this.contracts.membershipsProxy.royaltyInfo(1, this.membership.price))[1]).to.equal(
          parseEther(((0.1 * 1000) / 10000).toString()), // royaltyAmount = (_salePrice * royalty.royaltyFraction) / _feeDenominator() : ERC2981Upgradeable)
        );
      });

      it("should upgrade proxy skipping intermediate versions and keep proper state", async function () {
        this.membershipsProxy_Proxy = (await ethers.getContractAt(
          "MembershipsProxy",
          this.contracts.membershipsProxy.address,
        )) as MembershipsProxy;

        expect(await this.membershipsProxy_Proxy.memberships()).to.equal(this.contracts.memberships.address);

        // Check current state
        expect(await this.contracts.membershipsProxy.owner()).to.equal(this.signers.alice.address);
        expect(await this.contracts.membershipsProxy.factory()).to.equal(this.contracts.membershipsFactory.address);
        expect(await this.contracts.membershipsProxy.treasury()).to.equal(this.signers.alice.address);
        expect(await this.contracts.membershipsProxy.name()).to.equal(MEMBERSHIPS_NAME);
        expect(await this.contracts.membershipsProxy.symbol()).to.equal(MEMBERSHIPS_SYMBOL);
        expect(await this.contracts.membershipsProxy.contractURI()).to.equal(MEMBERSHIPS_CONTRACT_URI);
        // Mint token to test tokenURI
        await this.contracts.membershipsProxy.mint(this.signers.alice.address);
        expect(await this.contracts.membershipsProxy.tokenURI(1)).to.equal(MEMBERSHIPS_BASE_URI + 1);
        expect(await this.contracts.membershipsProxy.tokenAddress()).to.equal(this.membership.tokenAddress);
        expect(await this.contracts.membershipsProxy.price()).to.equal(this.membership.price);
        expect(await this.contracts.membershipsProxy.validity()).to.equal(this.membership.validity);
        expect(await this.contracts.membershipsProxy.cap()).to.equal(this.membership.cap);
        expect(await this.contracts.membershipsProxy.airdropToken()).to.equal(this.membership.airdropToken);
        expect(await this.contracts.membershipsProxy.airdropAmount()).to.equal(this.membership.airdropAmount);
        expect((await this.contracts.membershipsProxy.royaltyInfo(1, this.membership.price))[0]).to.equal(
          this.signers.alice.address,
        );
        expect((await this.contracts.membershipsProxy.royaltyInfo(1, this.membership.price))[1]).to.equal(
          parseEther(((0.1 * 1000) / 10000).toString()), // royaltyAmount = (_salePrice * royalty.royaltyFraction) / _feeDenominator() : ERC2981Upgradeable)
        );

        // Deploy new Memberships implementation contract
        const testMembershipsV2 = await deployTestMembershipsV2(
          this.signers.alice,
          this.contracts.membershipsMetadataRegistry.address,
        );
        // Set version 2 memberships implementation address on MembershipsFactory
        await this.contracts.membershipsFactory
          .connect(this.signers.alice)
          .setMembershipsImplAddress(2, testMembershipsV2.address);

        // Deploy new Memberships implementation contract
        const testMembershipsV3 = await deployTestMembershipsV3(
          this.signers.alice,
          this.contracts.membershipsMetadataRegistry.address,
        );
        // Set version 3 memberships implementation address on MembershipsFactory
        await this.contracts.membershipsFactory
          .connect(this.signers.alice)
          .setMembershipsImplAddress(3, testMembershipsV3.address);

        // Call MembershipsProxy.upgradeMemberships() via MembershipsFactory.upgradeProxy()
        await this.contracts.membershipsFactory.upgradeProxy(3, this.membershipsProxy_Proxy.address);

        const testMembershipsV3Proxy = (await ethers.getContractAt(
          "TestMembershipsV3",
          this.contracts.membershipsProxy.address,
        )) as TestMembershipsV3;

        // check TestMembershipsV2 state & functions
        expect(await testMembershipsV3Proxy.v2PublicStateVar()).to.equal(AddressZero);
        expect(await testMembershipsV3Proxy.isETHAddress(this.signers.alice.address)).to.equal(false); // should be false
        expect(await testMembershipsV3Proxy.v2InternalStateVar()).to.equal(0);
        await testMembershipsV3Proxy.setV2InternalStateVar(128);
        expect(await testMembershipsV3Proxy.v2InternalStateVar()).to.equal(128);
        await testMembershipsV3Proxy.setV2PublicStateVar(this.signers.bob.address);
        expect(await testMembershipsV3Proxy.v2PublicStateVar()).to.equal(this.signers.bob.address);

        // check TestMembershipsV3 state & functions
        expect(await testMembershipsV3Proxy.v3PublicStateVar()).to.equal(AddressZero);
        expect(await testMembershipsV3Proxy.isETHAddressV3(this.signers.alice.address)).to.equal(true); // should be true because logic
        expect(await testMembershipsV3Proxy.v3InternalStateVar()).to.equal(0);
        await testMembershipsV3Proxy.setV3InternalStateVar(256);
        expect(await testMembershipsV3Proxy.v3InternalStateVar()).to.equal(256);
        await testMembershipsV3Proxy.setV3PublicStateVar(this.signers.bob.address);
        expect(await testMembershipsV3Proxy.v3PublicStateVar()).to.equal(this.signers.bob.address);

        expect(await this.membershipsProxy_Proxy.memberships()).to.equal(testMembershipsV3.address);

        // Check new state
        expect(await this.contracts.membershipsProxy.owner()).to.equal(this.signers.alice.address);
        expect(await this.contracts.membershipsProxy.factory()).to.equal(this.contracts.membershipsFactory.address);
        expect(await this.contracts.membershipsProxy.treasury()).to.equal(this.signers.alice.address);
        expect(await this.contracts.membershipsProxy.name()).to.equal(MEMBERSHIPS_NAME);
        expect(await this.contracts.membershipsProxy.symbol()).to.equal(MEMBERSHIPS_SYMBOL);
        expect(await this.contracts.membershipsProxy.contractURI()).to.equal(MEMBERSHIPS_CONTRACT_URI);

        expect(await this.contracts.membershipsProxy.tokenURI(1)).to.equal(MEMBERSHIPS_BASE_URI + 1);
        expect(await this.contracts.membershipsProxy.tokenAddress()).to.equal(this.membership.tokenAddress);
        expect(await this.contracts.membershipsProxy.price()).to.equal(this.membership.price);
        expect(await this.contracts.membershipsProxy.validity()).to.equal(this.membership.validity);
        expect(await this.contracts.membershipsProxy.cap()).to.equal(this.membership.cap);
        expect(await this.contracts.membershipsProxy.airdropToken()).to.equal(this.membership.airdropToken);
        expect(await this.contracts.membershipsProxy.airdropAmount()).to.equal(this.membership.airdropAmount);
        expect((await this.contracts.membershipsProxy.royaltyInfo(1, this.membership.price))[0]).to.equal(
          this.signers.alice.address,
        );
        expect((await this.contracts.membershipsProxy.royaltyInfo(1, this.membership.price))[1]).to.equal(
          parseEther(((0.1 * 1000) / 10000).toString()), // royaltyAmount = (_salePrice * royalty.royaltyFraction) / _feeDenominator() : ERC2981Upgradeable)
        );
      });
    });
  });

  describe("Upgrades", function () {
    beforeEach(async function () {
      const { membershipsMetadataRegistry, membershipsV1, memberships, membershipsFactory, erc20Token } =
        await this.loadFixture(upgradesFixture);
      this.contracts.membershipsMetadataRegistry = membershipsMetadataRegistry;
      this.contracts.membershipsV1 = membershipsV1;
      this.contracts.memberships = memberships;
      this.contracts.membershipsFactory = membershipsFactory;
      this.contracts.erc20Token = erc20Token;

      // Version 1
      // Set version 1 Memberships implementation
      await this.contracts.membershipsFactory.setMembershipsImplAddress(1, this.contracts.membershipsV1.address);

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

      // Version 1 instance of the same contract
      this.contracts.membershipsV1Proxy = (await ethers.getContractAt(
        MembershipsV1__factory.abi,
        membershipsProxyAddress,
      )) as MembershipsV1;

      // Version 2
      // Set version 2 Memberships implementation
      await this.contracts.membershipsFactory.setMembershipsImplAddress(2, this.contracts.memberships.address);

      // Version 2 instance of the same contract
      this.contracts.membershipsProxy = (await ethers.getContractAt(
        "Memberships",
        membershipsProxyAddress,
      )) as Memberships;
    });

    describe("v1 → v2", function () {
      it("should upgrade proxy and keep previous state", async function () {
        this.membershipsV1Proxy_Proxy = (await ethers.getContractAt(
          "MembershipsProxy",
          this.contracts.membershipsV1Proxy.address,
        )) as MembershipsProxy;

        expect(await this.membershipsV1Proxy_Proxy.memberships()).to.equal(this.contracts.membershipsV1.address);

        // Check current state
        expect(await this.contracts.membershipsV1Proxy.owner()).to.equal(this.signers.alice.address);
        expect(await this.contracts.membershipsV1Proxy.factory()).to.equal(this.contracts.membershipsFactory.address);
        expect(await this.contracts.membershipsV1Proxy.treasury()).to.equal(this.signers.alice.address);
        expect(await this.contracts.membershipsV1Proxy.name()).to.equal(MEMBERSHIPS_NAME);
        expect(await this.contracts.membershipsV1Proxy.symbol()).to.equal(MEMBERSHIPS_SYMBOL);
        expect(await this.contracts.membershipsV1Proxy.contractURI()).to.equal(MEMBERSHIPS_CONTRACT_URI);
        // Mint token to test tokenURI
        await this.contracts.membershipsV1Proxy.mint(this.signers.alice.address);
        expect(await this.contracts.membershipsV1Proxy.tokenURI(1)).to.equal(MEMBERSHIPS_BASE_URI + 1);
        expect(await this.contracts.membershipsV1Proxy.tokenAddress()).to.equal(this.membership.tokenAddress);
        expect(await this.contracts.membershipsV1Proxy.price()).to.equal(this.membership.price);
        expect(await this.contracts.membershipsV1Proxy.validity()).to.equal(this.membership.validity);
        expect(await this.contracts.membershipsV1Proxy.cap()).to.equal(this.membership.cap);
        expect(await this.contracts.membershipsV1Proxy.airdropToken()).to.equal(this.membership.airdropToken);
        expect(await this.contracts.membershipsV1Proxy.airdropAmount()).to.equal(this.membership.airdropAmount);
        expect((await this.contracts.membershipsV1Proxy.royaltyInfo(1, this.membership.price))[0]).to.equal(
          this.signers.alice.address,
        );
        expect((await this.contracts.membershipsV1Proxy.royaltyInfo(1, this.membership.price))[1]).to.equal(
          parseEther(((0.1 * 1000) / 10000).toString()), // royaltyAmount = (_salePrice * royalty.royaltyFraction) / _feeDenominator() : ERC2981Upgradeable)
        );

        // Call MembershipsProxy.upgradeMemberships() via MembershipsFactory.upgradeProxy()
        await this.contracts.membershipsFactory.upgradeProxy(2, this.membershipsV1Proxy_Proxy.address);

        expect(await this.membershipsV1Proxy_Proxy.memberships()).to.equal(this.contracts.memberships.address);

        // Check new state
        expect(await this.contracts.membershipsProxy.owner()).to.equal(this.signers.alice.address);
        expect(await this.contracts.membershipsProxy.factory()).to.equal(this.contracts.membershipsFactory.address);
        expect(await this.contracts.membershipsProxy.treasury()).to.equal(this.signers.alice.address);
        expect(await this.contracts.membershipsProxy.name()).to.equal(MEMBERSHIPS_NAME);
        expect(await this.contracts.membershipsProxy.symbol()).to.equal(MEMBERSHIPS_SYMBOL);
        expect(await this.contracts.membershipsProxy.contractURI()).to.equal(MEMBERSHIPS_CONTRACT_URI);

        expect(await this.contracts.membershipsProxy.tokenURI(1)).to.equal(MEMBERSHIPS_BASE_URI + 1);
        expect(await this.contracts.membershipsProxy.tokenAddress()).to.equal(this.membership.tokenAddress);
        expect(await this.contracts.membershipsProxy.price()).to.equal(this.membership.price);
        expect(await this.contracts.membershipsProxy.validity()).to.equal(this.membership.validity);
        expect(await this.contracts.membershipsProxy.cap()).to.equal(this.membership.cap);
        expect(await this.contracts.membershipsProxy.airdropToken()).to.equal(this.membership.airdropToken);
        expect(await this.contracts.membershipsProxy.airdropAmount()).to.equal(this.membership.airdropAmount);
        expect((await this.contracts.membershipsProxy.royaltyInfo(1, this.membership.price))[0]).to.equal(
          this.signers.alice.address,
        );
        expect((await this.contracts.membershipsProxy.royaltyInfo(1, this.membership.price))[1]).to.equal(
          parseEther(((0.1 * 1000) / 10000).toString()), // royaltyAmount = (_salePrice * royalty.royaltyFraction) / _feeDenominator() : ERC2981Upgradeable)
        );
      });

      describe("changeBaseTokenURI()", function () {
        beforeEach(async function () {
          // Upgrade to v2 before each
          // Call MembershipsProxy.upgradeMemberships() via MembershipsFactory.upgradeProxy()
          await this.contracts.membershipsFactory.upgradeProxy(2, this.membershipsV1Proxy_Proxy.address);
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
    });
  });
}

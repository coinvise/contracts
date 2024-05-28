import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { VoidSigner } from "ethers";
import hre, { ethers } from "hardhat";
import {
  prepareNativeMetaTxnSignature,
  prepareNativeMetaTxnSignatureWithReferrer,
} from "../../../../scripts/utils";
import {
  ERC721SoulboundTokenImpl,
  ERC721SoulboundTokenImpl__factory,
  ERC721SoulboundTokenNativeGaslessMintImpl,
  ERC721SoulboundTokenNativeGaslessMintImpl__factory,
  ERC721TokenImpl,
  ERC721TokenImpl__factory,
  ERC721TokenNativeGaslessMintFactory,
  ERC721TokenNativeGaslessMintImpl,
  ERC721TokenNativeGaslessMintImpl__factory,
  ProtocolRewards,
  ProtocolRewards__factory,
  ReenterMintWithReferrer__factory,
  ReenterMint__factory,
} from "../../../../typechain/index";
import {
  BASIS_POINTS,
  CREATOR_SHARE,
  PLATFORM_SHARE,
  REFERRER_SHARE,
} from "../../../protocol-rewards/RewardsSplitter.test";
import {
  ERC721_generateSignature,
  MINT_FEE,
  MINT_FEE_RECIPIENT,
  SPONSORED_MINT_FEE,
  TokenType,
  ZERO_ADDRESS,
  encodeInitializationData,
  encodeInitializationDataWithSponsoredMints,
  getArgFromEvent,
  getEIP712TypedData,
} from "../../../test-utils";

describe("ERC721TokenNativeGaslessMintFactory", () => {
  let ProtocolRewards: ProtocolRewards__factory;
  let protocolRewards: ProtocolRewards;

  /* ERC721Token */
  let ERC721: ERC721TokenImpl__factory;
  let erc721: ERC721TokenImpl;
  let erc721Logic: ERC721TokenImpl;

  /* ERC721SoulboundToken */
  let ERC721Soulbound: ERC721SoulboundTokenImpl__factory;
  let erc721Soulbound: ERC721SoulboundTokenImpl;
  let erc721SoulboundLogic: ERC721SoulboundTokenImpl;

  /* ERC721TokenNativeGaslessMint */
  let ERC721TokenNativeGaslessMint: ERC721TokenNativeGaslessMintImpl__factory;
  let erc721TokenNativeGaslessMint: ERC721TokenNativeGaslessMintImpl;
  let erc721TokenNativeGaslessMintLogic: ERC721TokenNativeGaslessMintImpl;

  /* ERC721SoulboundTokenNativeGaslessMint */
  let ERC721SoulboundTokenNativeGaslessMint: ERC721SoulboundTokenNativeGaslessMintImpl__factory;
  let erc721SoulboundTokenNativeGaslessMint: ERC721SoulboundTokenNativeGaslessMintImpl;
  let erc721SoulboundTokenNativeGaslessMintLogic: ERC721SoulboundTokenNativeGaslessMintImpl;

  /* ERC721TokenNativeGaslessMintFactory */
  let erc721TokenFactory: ERC721TokenNativeGaslessMintFactory;

  let owner: SignerWithAddress,
    trustedAddress: SignerWithAddress,
    alice: SignerWithAddress,
    bob: SignerWithAddress,
    charlie: SignerWithAddress,
    relayer: SignerWithAddress,
    david: SignerWithAddress,
    eve: SignerWithAddress,
    referrer: SignerWithAddress,
    frank: SignerWithAddress,
    george: SignerWithAddress,
    harry: SignerWithAddress;

  beforeEach(async () => {
    ProtocolRewards = await ethers.getContractFactory("ProtocolRewards");
    ERC721 = await ethers.getContractFactory("ERC721TokenImpl");
    ERC721Soulbound = await ethers.getContractFactory(
      "ERC721SoulboundTokenImpl"
    );
    ERC721TokenNativeGaslessMint = await ethers.getContractFactory(
      "ERC721TokenNativeGaslessMintImpl"
    );
    ERC721SoulboundTokenNativeGaslessMint = await ethers.getContractFactory(
      "ERC721SoulboundTokenNativeGaslessMintImpl"
    );
    [
      owner,
      trustedAddress,
      alice,
      bob,
      charlie,
      relayer,
      david,
      eve,
      referrer,
      frank,
      george,
      harry,
    ] = await ethers.getSigners();

    protocolRewards = await ProtocolRewards.deploy();

    // Deploy ERC721TokenImpl logic contract
    erc721Logic = await ERC721.deploy(
      MINT_FEE,
      SPONSORED_MINT_FEE,
      MINT_FEE_RECIPIENT,
      protocolRewards.address
    );
    // Deploy ERC721SoulboundTokenImpl logic contract
    erc721SoulboundLogic = await ERC721Soulbound.deploy(
      MINT_FEE,
      SPONSORED_MINT_FEE,
      MINT_FEE_RECIPIENT,
      protocolRewards.address
    );
    // Deploy ERC721TokenNativeGaslessMint logic contract
    erc721TokenNativeGaslessMintLogic =
      await ERC721TokenNativeGaslessMint.deploy();
    // Deploy ERC721SoulboundTokenNativeGaslessMintImpl logic contract
    erc721SoulboundTokenNativeGaslessMintLogic =
      await ERC721SoulboundTokenNativeGaslessMint.deploy();

    // Deploy ERC721TokenNativeGaslessMintFactory
    const ERC721TokenNativeGaslessMintFactory = await ethers.getContractFactory(
      "ERC721TokenNativeGaslessMintFactory"
    );
    erc721TokenFactory = await ERC721TokenNativeGaslessMintFactory.connect(
      owner
    ).deploy(
      erc721Logic.address,
      erc721SoulboundLogic.address,
      erc721TokenNativeGaslessMintLogic.address,
      erc721SoulboundTokenNativeGaslessMintLogic.address
    );

    // Deploy new ERC721Token via ERC721TokenNativeGaslessMintFactory
    const deployERC721Token = await erc721TokenFactory
      .connect(alice)
      .deployERC721Token(
        TokenType.ERC721Token,
        encodeInitializationDataWithSponsoredMints([
          "TestToken",
          "TEST",
          "https://example.com/contractURI",
          "https://example.com",
          alice.address,
          trustedAddress.address,
          10,
          0,
        ]),
        +new Date(),
        { value: SPONSORED_MINT_FEE.mul(0) }
      );

    let receipt = await deployERC721Token.wait();

    const tokenType_erc721 = getArgFromEvent(
      erc721TokenFactory,
      receipt,
      erc721TokenFactory.interface.events[
        "ERC721TokenDeployed(uint8,address,address,address)"
      ].name,
      "_tokenType"
    );
    expect(tokenType_erc721).to.equal(TokenType.ERC721Token);

    const erc721TokenImpl = getArgFromEvent(
      erc721TokenFactory,
      receipt,
      erc721TokenFactory.interface.events[
        "ERC721TokenDeployed(uint8,address,address,address)"
      ].name,
      "_erc721TokenImpl"
    );
    expect(erc721TokenImpl).to.equal(erc721Logic.address);

    const erc721TokenCloneAddress = getArgFromEvent(
      erc721TokenFactory,
      receipt,
      erc721TokenFactory.interface.events[
        "ERC721TokenDeployed(uint8,address,address,address)"
      ].name,
      "_erc721TokenClone"
    );
    erc721 = await ethers.getContractAt(
      "ERC721TokenImpl",
      erc721TokenCloneAddress
    );

    // Deploy new ERC721SoulboundToken via ERC721TokenNativeGaslessMintFactory
    const deployERC721SoulboundToken = await erc721TokenFactory
      .connect(alice)
      .deployERC721Token(
        TokenType.ERC721SoulboundToken,
        encodeInitializationDataWithSponsoredMints([
          "TestToken",
          "TEST",
          "https://example.com/contractURI",
          "https://example.com",
          alice.address,
          trustedAddress.address,
          10,
          0,
        ]),
        +new Date()
      );

    receipt = await deployERC721SoulboundToken.wait();

    const tokenType_erc721Soulbound = getArgFromEvent(
      erc721TokenFactory,
      receipt,
      erc721TokenFactory.interface.events[
        "ERC721TokenDeployed(uint8,address,address,address)"
      ].name,
      "_tokenType"
    );
    expect(tokenType_erc721Soulbound).to.equal(TokenType.ERC721SoulboundToken);

    const erc721SoulboundTokenImpl = getArgFromEvent(
      erc721TokenFactory,
      receipt,
      erc721TokenFactory.interface.events[
        "ERC721TokenDeployed(uint8,address,address,address)"
      ].name,
      "_erc721TokenImpl"
    );
    expect(erc721SoulboundTokenImpl).to.equal(erc721SoulboundLogic.address);

    const erc721SoulboundTokenCloneAddress = getArgFromEvent(
      erc721TokenFactory,
      receipt,
      erc721TokenFactory.interface.events[
        "ERC721TokenDeployed(uint8,address,address,address)"
      ].name,
      "_erc721TokenClone"
    );
    erc721Soulbound = await ethers.getContractAt(
      "ERC721SoulboundTokenImpl",
      erc721SoulboundTokenCloneAddress
    );

    // Deploy new ERC721TokenNativeGaslessMint via ERC721TokenNativeGaslessMintFactory
    const deployERC721TokenNativeGaslessMint = await erc721TokenFactory
      .connect(alice)
      .deployERC721Token(
        TokenType.ERC721TokenNativeGaslessMint,
        encodeInitializationData([
          "TestToken",
          "TEST",
          "https://example.com/contractURI",
          "https://example.com",
          alice.address,
          trustedAddress.address,
          10,
        ]),
        +new Date()
      );

    receipt = await deployERC721TokenNativeGaslessMint.wait();

    const tokenType_erc721Gasless = getArgFromEvent(
      erc721TokenFactory,
      receipt,
      erc721TokenFactory.interface.events[
        "ERC721TokenDeployed(uint8,address,address,address)"
      ].name,
      "_tokenType"
    );
    expect(tokenType_erc721Gasless).to.equal(
      TokenType.ERC721TokenNativeGaslessMint
    );

    const erc721TokenNativeGaslessMintImpl = getArgFromEvent(
      erc721TokenFactory,
      receipt,
      erc721TokenFactory.interface.events[
        "ERC721TokenDeployed(uint8,address,address,address)"
      ].name,
      "_erc721TokenImpl"
    );
    expect(erc721TokenNativeGaslessMintImpl).to.equal(
      erc721TokenNativeGaslessMintLogic.address
    );

    const erc721TokenNativeGaslessMintCloneAddress = getArgFromEvent(
      erc721TokenFactory,
      receipt,
      erc721TokenFactory.interface.events[
        "ERC721TokenDeployed(uint8,address,address,address)"
      ].name,
      "_erc721TokenClone"
    );
    erc721TokenNativeGaslessMint = await ethers.getContractAt(
      "ERC721TokenNativeGaslessMintImpl",
      erc721TokenNativeGaslessMintCloneAddress
    );

    // Deploy new ERC721SoulboundTokenNativeGaslessMint via ERC721TokenNativeGaslessMintFactory
    const deploySoulboundTokenNativeGaslessMint = await erc721TokenFactory
      .connect(alice)
      .deployERC721Token(
        TokenType.ERC721SoulboundTokenNativeGaslessMint,
        encodeInitializationData([
          "TestToken",
          "TEST",
          "https://example.com/contractURI",
          "https://example.com",
          alice.address,
          trustedAddress.address,
          10,
        ]),
        +new Date()
      );

    receipt = await deploySoulboundTokenNativeGaslessMint.wait();

    const tokenType_erc721SoulboundGasless = getArgFromEvent(
      erc721TokenFactory,
      receipt,
      erc721TokenFactory.interface.events[
        "ERC721TokenDeployed(uint8,address,address,address)"
      ].name,
      "_tokenType"
    );
    expect(tokenType_erc721SoulboundGasless).to.equal(
      TokenType.ERC721SoulboundTokenNativeGaslessMint
    );

    const erc721SoulboundTokenNativeGaslessMintImpl = getArgFromEvent(
      erc721TokenFactory,
      receipt,
      erc721TokenFactory.interface.events[
        "ERC721TokenDeployed(uint8,address,address,address)"
      ].name,
      "_erc721TokenImpl"
    );
    expect(erc721SoulboundTokenNativeGaslessMintImpl).to.equal(
      erc721SoulboundTokenNativeGaslessMintLogic.address
    );

    const erc721SoulboundTokenNativeGaslessMintCloneAddress = getArgFromEvent(
      erc721TokenFactory,
      receipt,
      erc721TokenFactory.interface.events[
        "ERC721TokenDeployed(uint8,address,address,address)"
      ].name,
      "_erc721TokenClone"
    );
    erc721SoulboundTokenNativeGaslessMint = await ethers.getContractAt(
      "ERC721SoulboundTokenNativeGaslessMintImpl",
      erc721SoulboundTokenNativeGaslessMintCloneAddress
    );
  });

  describe("ERC721TokenNativeGaslessMintFactory", () => {
    describe("deploy", () => {
      it("Should deploy ERC721TokenNativeGaslessMintFactory", async function () {
        // Deploy ERC721TokenImpl logic contract
        const ERC721TokenImpl = await ethers.getContractFactory(
          "ERC721TokenImpl"
        );
        erc721Logic = await ERC721TokenImpl.deploy(
          MINT_FEE,
          SPONSORED_MINT_FEE,
          MINT_FEE_RECIPIENT,
          protocolRewards.address
        );

        // Deploy ERC721TokenNativeGaslessMintFactory
        const ERC721TokenNativeGaslessMintFactory =
          await ethers.getContractFactory(
            "ERC721TokenNativeGaslessMintFactory"
          );
        let erc721TokenFactory =
          await ERC721TokenNativeGaslessMintFactory.connect(owner).deploy(
            erc721Logic.address,
            erc721SoulboundLogic.address,
            erc721TokenNativeGaslessMintLogic.address,
            erc721SoulboundTokenNativeGaslessMintLogic.address
          );

        expect(await erc721TokenFactory.erc721TokenImpl()).to.equal(
          erc721Logic.address
        );
        expect(await erc721TokenFactory.erc721SoulboundTokenImpl()).to.equal(
          erc721SoulboundLogic.address
        );
        expect(
          await erc721TokenFactory.erc721TokenNativeGaslessMintImpl()
        ).to.equal(erc721TokenNativeGaslessMintLogic.address);
        expect(
          await erc721TokenFactory.erc721SoulboundTokenNativeGaslessMintImpl()
        ).to.equal(erc721SoulboundTokenNativeGaslessMintLogic.address);
      });

      it("Should revert on deploy if erc721TokenImpl logic address is zero address", async function () {
        // Deploy ERC721TokenNativeGaslessMintFactory
        const ERC721TokenNativeGaslessMintFactory =
          await ethers.getContractFactory(
            "ERC721TokenNativeGaslessMintFactory"
          );
        await expect(
          ERC721TokenNativeGaslessMintFactory.connect(owner).deploy(
            ZERO_ADDRESS,
            erc721SoulboundLogic.address,
            erc721TokenNativeGaslessMintLogic.address,
            erc721SoulboundTokenNativeGaslessMintLogic.address
          )
        ).to.be.revertedWith("InvalidAddress");
      });

      it("Should revert on deploy if erc721SoulboundTokenImpl logic address is zero address", async function () {
        // Deploy ERC721TokenNativeGaslessMintFactory
        const ERC721TokenNativeGaslessMintFactory =
          await ethers.getContractFactory(
            "ERC721TokenNativeGaslessMintFactory"
          );
        await expect(
          ERC721TokenNativeGaslessMintFactory.connect(owner).deploy(
            erc721Logic.address,
            ZERO_ADDRESS,
            erc721TokenNativeGaslessMintLogic.address,
            erc721SoulboundTokenNativeGaslessMintLogic.address
          )
        ).to.be.revertedWith("InvalidAddress");
      });

      it("Should revert on deploy if erc721TokenNativeGaslessMintImpl logic address is zero address", async function () {
        // Deploy ERC721TokenNativeGaslessMintFactory
        const ERC721TokenNativeGaslessMintFactory =
          await ethers.getContractFactory(
            "ERC721TokenNativeGaslessMintFactory"
          );
        await expect(
          ERC721TokenNativeGaslessMintFactory.connect(owner).deploy(
            erc721Logic.address,
            erc721SoulboundLogic.address,
            ZERO_ADDRESS,
            erc721SoulboundTokenNativeGaslessMintLogic.address
          )
        ).to.be.revertedWith("InvalidAddress");
      });

      it("Should revert on deploy if erc721SoulboundTokenNativeGaslessMintImpl logic address is zero address", async function () {
        // Deploy ERC721TokenNativeGaslessMintFactory
        const ERC721TokenNativeGaslessMintFactory =
          await ethers.getContractFactory(
            "ERC721TokenNativeGaslessMintFactory"
          );
        await expect(
          ERC721TokenNativeGaslessMintFactory.connect(owner).deploy(
            erc721Logic.address,
            erc721SoulboundLogic.address,
            erc721TokenNativeGaslessMintLogic.address,
            ZERO_ADDRESS
          )
        ).to.be.revertedWith("InvalidAddress");
      });
    });

    describe("deployERC721Token()", () => {
      // Deploy a ERC721TokenImpl clone via ERC721TokenNativeGaslessMintFactory
      it("Should allow to deployERC721Token() - ERC721Token", async function () {
        // Deploy ERC721TokenImpl clone
        const deployERC721Token = await erc721TokenFactory
          .connect(alice)
          .deployERC721Token(
            TokenType.ERC721Token,
            encodeInitializationDataWithSponsoredMints([
              "TestToken",
              "TEST",
              "https://example.com/contractURI",
              "https://example.com",
              alice.address,
              trustedAddress.address,
              10,
              0,
            ]),
            +new Date()
          );

        // Assert event emitted
        const receipt = await deployERC721Token.wait();

        const tokenType_erc721 = getArgFromEvent(
          erc721TokenFactory,
          receipt,
          erc721TokenFactory.interface.events[
            "ERC721TokenDeployed(uint8,address,address,address)"
          ].name,
          "_tokenType"
        );
        expect(tokenType_erc721).to.equal(TokenType.ERC721Token);

        const erc721TokenImplAddress = getArgFromEvent(
          erc721TokenFactory,
          receipt,
          erc721TokenFactory.interface.events[
            "ERC721TokenDeployed(uint8,address,address,address)"
          ].name,
          "_erc721TokenImpl"
        );
        expect(erc721TokenImplAddress).to.equal(erc721Logic.address);

        const creator = getArgFromEvent(
          erc721TokenFactory,
          receipt,
          erc721TokenFactory.interface.events[
            "ERC721TokenDeployed(uint8,address,address,address)"
          ].name,
          "_creator"
        );
        expect(creator).to.equal(alice.address);

        const erc721TokenCloneAddress = getArgFromEvent(
          erc721TokenFactory,
          receipt,
          erc721TokenFactory.interface.events[
            "ERC721TokenDeployed(uint8,address,address,address)"
          ].name,
          "_erc721TokenClone"
        );

        // Assert initialized state variables in ERC721TokenImpl clone
        let erc721TokenImpl = await ethers.getContractAt(
          "ERC721TokenImpl",
          erc721TokenCloneAddress
        );

        expect(await erc721TokenImpl.MINT_FEE()).to.equal(MINT_FEE);
        expect(await erc721TokenImpl.MINT_FEE_RECIPIENT()).to.equal(
          MINT_FEE_RECIPIENT
        );
        expect(await erc721TokenImpl.name()).to.equal("TestToken");
        expect(await erc721TokenImpl.symbol()).to.equal("TEST");
        expect(await erc721TokenImpl.maxSupply()).to.equal(10);
        expect(await erc721TokenImpl.contractURI()).to.eq(
          "https://example.com/contractURI"
        );
        expect(await erc721TokenImpl.tokenURI(1)).to.eq("https://example.com");
        expect(await erc721TokenImpl.nextTokenId()).to.eq(1);
        expect(await erc721TokenImpl.owner()).to.equal(alice.address);
      });

      it("Should allow to deployERC721Token() - ERC721SoulboundToken", async function () {
        // Deploy ERC721SoulboundTokenImpl clone
        const deployERC721SoulboundToken = await erc721TokenFactory
          .connect(alice)
          .deployERC721Token(
            TokenType.ERC721SoulboundToken,
            encodeInitializationDataWithSponsoredMints([
              "TestToken",
              "TEST",
              "https://example.com/contractURI",
              "https://example.com",
              alice.address,
              trustedAddress.address,
              10,
              0,
            ]),
            +new Date()
          );

        // Assert event emitted
        const receipt = await deployERC721SoulboundToken.wait();

        const tokenType_erc721Soulbound = getArgFromEvent(
          erc721TokenFactory,
          receipt,
          erc721TokenFactory.interface.events[
            "ERC721TokenDeployed(uint8,address,address,address)"
          ].name,
          "_tokenType"
        );
        expect(tokenType_erc721Soulbound).to.equal(
          TokenType.ERC721SoulboundToken
        );

        const erc721SoulboundTokenImplAddress = getArgFromEvent(
          erc721TokenFactory,
          receipt,
          erc721TokenFactory.interface.events[
            "ERC721TokenDeployed(uint8,address,address,address)"
          ].name,
          "_erc721TokenImpl"
        );
        expect(erc721SoulboundTokenImplAddress).to.equal(
          erc721SoulboundLogic.address
        );

        const creator = getArgFromEvent(
          erc721TokenFactory,
          receipt,
          erc721TokenFactory.interface.events[
            "ERC721TokenDeployed(uint8,address,address,address)"
          ].name,
          "_creator"
        );
        expect(creator).to.equal(alice.address);

        const erc721TokenCloneAddress = getArgFromEvent(
          erc721TokenFactory,
          receipt,
          erc721TokenFactory.interface.events[
            "ERC721TokenDeployed(uint8,address,address,address)"
          ].name,
          "_erc721TokenClone"
        );

        // Assert initialized state variables in ERC721TokenImpl clone
        let erc721SoulboundTokenImpl = await ethers.getContractAt(
          "ERC721SoulboundTokenImpl",
          erc721TokenCloneAddress
        );

        expect(await erc721SoulboundTokenImpl.MINT_FEE()).to.equal(MINT_FEE);
        expect(await erc721SoulboundTokenImpl.MINT_FEE_RECIPIENT()).to.equal(
          MINT_FEE_RECIPIENT
        );
        expect(await erc721SoulboundTokenImpl.name()).to.equal("TestToken");
        expect(await erc721SoulboundTokenImpl.symbol()).to.equal("TEST");
        expect(await erc721SoulboundTokenImpl.maxSupply()).to.equal(10);
        expect(await erc721SoulboundTokenImpl.owner()).to.equal(alice.address);
        expect(await erc721SoulboundTokenImpl.contractURI()).to.eq(
          "https://example.com/contractURI"
        );
        expect(await erc721SoulboundTokenImpl.tokenURI(1)).to.eq(
          "https://example.com"
        );
        expect(await erc721SoulboundTokenImpl.nextTokenId()).to.eq(1);
        await expect(
          erc721SoulboundTokenImpl.transferFrom(alice.address, bob.address, 1)
        ).to.be.revertedWith("Soulbound");
      });

      it("Should allow to deployERC721Token() - ERC721TokenNativeGaslessMint", async function () {
        // Deploy ERC721TokenNativeGaslessMintImpl clone
        const deployERC721Token = await erc721TokenFactory
          .connect(alice)
          .deployERC721Token(
            TokenType.ERC721TokenNativeGaslessMint,
            encodeInitializationData([
              "TestToken",
              "TEST",
              "https://example.com/contractURI",
              "https://example.com",
              alice.address,
              trustedAddress.address,
              10,
            ]),
            +new Date()
          );

        // Assert event emitted
        const receipt = await deployERC721Token.wait();

        const tokenType_erc721Gasless = getArgFromEvent(
          erc721TokenFactory,
          receipt,
          erc721TokenFactory.interface.events[
            "ERC721TokenDeployed(uint8,address,address,address)"
          ].name,
          "_tokenType"
        );
        expect(tokenType_erc721Gasless).to.equal(
          TokenType.ERC721TokenNativeGaslessMint
        );

        const erc721TokenNativeGaslessMintImpl = getArgFromEvent(
          erc721TokenFactory,
          receipt,
          erc721TokenFactory.interface.events[
            "ERC721TokenDeployed(uint8,address,address,address)"
          ].name,
          "_erc721TokenImpl"
        );
        expect(erc721TokenNativeGaslessMintImpl).to.equal(
          erc721TokenNativeGaslessMintLogic.address
        );

        const creator = getArgFromEvent(
          erc721TokenFactory,
          receipt,
          erc721TokenFactory.interface.events[
            "ERC721TokenDeployed(uint8,address,address,address)"
          ].name,
          "_creator"
        );
        expect(creator).to.equal(alice.address);

        const erc721TokenNativeGaslessMintCloneAddress = getArgFromEvent(
          erc721TokenFactory,
          receipt,
          erc721TokenFactory.interface.events[
            "ERC721TokenDeployed(uint8,address,address,address)"
          ].name,
          "_erc721TokenClone"
        );

        // Assert initialized state variables in ERC721TokenNativeGaslessMintImpl clone
        let erc721TokenNativeGaslessMint = await ethers.getContractAt(
          "ERC721TokenNativeGaslessMintImpl",
          erc721TokenNativeGaslessMintCloneAddress
        );

        expect(await erc721TokenNativeGaslessMint.name()).to.equal("TestToken");
        expect(await erc721TokenNativeGaslessMint.symbol()).to.equal("TEST");
        expect(await erc721TokenNativeGaslessMint.maxSupply()).to.equal(10);
        expect(await erc721TokenNativeGaslessMint.contractURI()).to.eq(
          "https://example.com/contractURI"
        );
        expect(await erc721TokenNativeGaslessMint.tokenURI(1)).to.eq(
          "https://example.com"
        );
        expect(await erc721TokenNativeGaslessMint.nextTokenId()).to.eq(1);
        expect(await erc721TokenNativeGaslessMint.owner()).to.equal(
          alice.address
        );
        expect(
          await erc721TokenNativeGaslessMint.getNonce(bob.address)
        ).to.equal(0);
      });

      it("Should allow to deployERC721Token() - ERC721SoulboundTokenNativeGaslessMint", async function () {
        // Deploy ERC721SoulboundTokenNativeGaslessMintImpl clone
        const deployERC721SoulboundToken = await erc721TokenFactory
          .connect(alice)
          .deployERC721Token(
            TokenType.ERC721SoulboundTokenNativeGaslessMint,
            encodeInitializationData([
              "TestToken",
              "TEST",
              "https://example.com/contractURI",
              "https://example.com",
              alice.address,
              trustedAddress.address,
              10,
            ]),
            +new Date()
          );

        // Assert event emitted
        const receipt = await deployERC721SoulboundToken.wait();

        const tokenType_erc721SoulboundGasless = getArgFromEvent(
          erc721TokenFactory,
          receipt,
          erc721TokenFactory.interface.events[
            "ERC721TokenDeployed(uint8,address,address,address)"
          ].name,
          "_tokenType"
        );
        expect(tokenType_erc721SoulboundGasless).to.equal(
          TokenType.ERC721SoulboundTokenNativeGaslessMint
        );

        const erc721SoulboundTokenNativeGaslessMintImpl = getArgFromEvent(
          erc721TokenFactory,
          receipt,
          erc721TokenFactory.interface.events[
            "ERC721TokenDeployed(uint8,address,address,address)"
          ].name,
          "_erc721TokenImpl"
        );
        expect(erc721SoulboundTokenNativeGaslessMintImpl).to.equal(
          erc721SoulboundTokenNativeGaslessMintLogic.address
        );

        const creator = getArgFromEvent(
          erc721TokenFactory,
          receipt,
          erc721TokenFactory.interface.events[
            "ERC721TokenDeployed(uint8,address,address,address)"
          ].name,
          "_creator"
        );
        expect(creator).to.equal(alice.address);

        const erc721SoulboundTokenNativeGaslessMintCloneAddress =
          getArgFromEvent(
            erc721TokenFactory,
            receipt,
            erc721TokenFactory.interface.events[
              "ERC721TokenDeployed(uint8,address,address,address)"
            ].name,
            "_erc721TokenClone"
          );

        // Assert initialized state variables in ERC721TokenImpl clone
        let erc721SoulboundTokenNativeGaslessMint = await ethers.getContractAt(
          "ERC721SoulboundTokenNativeGaslessMintImpl",
          erc721SoulboundTokenNativeGaslessMintCloneAddress
        );

        expect(await erc721SoulboundTokenNativeGaslessMint.name()).to.equal(
          "TestToken"
        );
        expect(await erc721SoulboundTokenNativeGaslessMint.symbol()).to.equal(
          "TEST"
        );
        expect(
          await erc721SoulboundTokenNativeGaslessMint.maxSupply()
        ).to.equal(10);
        expect(await erc721SoulboundTokenNativeGaslessMint.contractURI()).to.eq(
          "https://example.com/contractURI"
        );
        expect(await erc721SoulboundTokenNativeGaslessMint.tokenURI(1)).to.eq(
          "https://example.com"
        );
        expect(await erc721SoulboundTokenNativeGaslessMint.nextTokenId()).to.eq(
          1
        );
        expect(await erc721SoulboundTokenNativeGaslessMint.owner()).to.equal(
          alice.address
        );
        await expect(
          erc721SoulboundTokenNativeGaslessMint.transferFrom(
            alice.address,
            bob.address,
            1
          )
        ).to.be.revertedWith("Soulbound");
        expect(
          await erc721SoulboundTokenNativeGaslessMint.getNonce(bob.address)
        ).to.equal(0);
      });

      it("Should allow to deployERC721Token() multiple times and each should have separate valid states", async function () {
        let receipt;
        let erc721TokenDeployedEvent;
        let tokenType;
        let creator;
        /* ERC721Token */
        let erc721TokenImplAddress;
        let erc721TokenCloneAddress;
        /* ERC721SoulboundToken */
        let erc721SoulboundTokenImplAddress;
        let erc721SoulboundTokenCloneAddress;
        /* ERC721TokenNativeGaslessMint */
        let erc721TokenNativeGaslessMintImplAddress;
        let erc721TokenNativeGaslessMintCloneAddress;
        /* ERC721SoulboundTokenNativeGaslessMint */
        let erc721SoulboundTokenNativeGaslessMintImplAddress;
        let erc721SoulboundTokenNativeGaslessMintCloneAddress;

        // ERC721TokenImpl A
        // Deploy ERC721TokenImpl clone
        const deployERC721TokenA = await erc721TokenFactory
          .connect(alice)
          .deployERC721Token(
            TokenType.ERC721Token,
            encodeInitializationDataWithSponsoredMints([
              "ERC721TokenA",
              "ERC721a",
              "https://example.com/contractURI",
              "https://example.com",
              alice.address,
              trustedAddress.address,
              10,
              0,
            ]),
            +new Date()
          );

        // Assert event emitted
        receipt = await deployERC721TokenA.wait();

        tokenType = getArgFromEvent(
          erc721TokenFactory,
          receipt,
          erc721TokenFactory.interface.events[
            "ERC721TokenDeployed(uint8,address,address,address)"
          ].name,
          "_tokenType"
        );
        expect(tokenType).to.equal(TokenType.ERC721Token);

        erc721TokenImplAddress = getArgFromEvent(
          erc721TokenFactory,
          receipt,
          erc721TokenFactory.interface.events[
            "ERC721TokenDeployed(uint8,address,address,address)"
          ].name,
          "_erc721TokenImpl"
        );
        expect(erc721TokenImplAddress).to.equal(erc721Logic.address);

        creator = getArgFromEvent(
          erc721TokenFactory,
          receipt,
          erc721TokenFactory.interface.events[
            "ERC721TokenDeployed(uint8,address,address,address)"
          ].name,
          "_creator"
        );
        expect(creator).to.equal(alice.address);

        erc721TokenCloneAddress = getArgFromEvent(
          erc721TokenFactory,
          receipt,
          erc721TokenFactory.interface.events[
            "ERC721TokenDeployed(uint8,address,address,address)"
          ].name,
          "_erc721TokenClone"
        );

        let erc721TokenA = await ethers.getContractAt(
          "ERC721TokenImpl",
          erc721TokenCloneAddress
        );

        // ERC721TokenImpl B
        // Deploy ERC721TokenImpl clone
        const deployERC721TokenB = await erc721TokenFactory
          .connect(bob)
          .deployERC721Token(
            TokenType.ERC721Token,
            encodeInitializationDataWithSponsoredMints([
              "ERC721TokenB",
              "ERC721b",
              "https://example.com/contractURI",
              "https://example.com",
              bob.address,
              trustedAddress.address,
              10,
              5,
            ]),
            +new Date(),
            { value: SPONSORED_MINT_FEE.mul(5) }
          );

        // Assert event emitted
        receipt = await deployERC721TokenB.wait();

        tokenType = getArgFromEvent(
          erc721TokenFactory,
          receipt,
          erc721TokenFactory.interface.events[
            "ERC721TokenDeployed(uint8,address,address,address)"
          ].name,
          "_tokenType"
        );
        expect(tokenType).to.equal(TokenType.ERC721Token);

        erc721TokenImplAddress = getArgFromEvent(
          erc721TokenFactory,
          receipt,
          erc721TokenFactory.interface.events[
            "ERC721TokenDeployed(uint8,address,address,address)"
          ].name,
          "_erc721TokenImpl"
        );
        expect(erc721TokenImplAddress).to.equal(erc721Logic.address);

        creator = getArgFromEvent(
          erc721TokenFactory,
          receipt,
          erc721TokenFactory.interface.events[
            "ERC721TokenDeployed(uint8,address,address,address)"
          ].name,
          "_creator"
        );
        expect(creator).to.equal(bob.address);

        erc721TokenCloneAddress = getArgFromEvent(
          erc721TokenFactory,
          receipt,
          erc721TokenFactory.interface.events[
            "ERC721TokenDeployed(uint8,address,address,address)"
          ].name,
          "_erc721TokenClone"
        );

        let erc721TokenB = await ethers.getContractAt(
          "ERC721TokenImpl",
          erc721TokenCloneAddress
        );

        // ERC721TokenImpl C
        // Deploy ERC721TokenImpl clone
        const deployERC721TokenC = await erc721TokenFactory
          .connect(charlie)
          .deployERC721Token(
            TokenType.ERC721Token,
            encodeInitializationDataWithSponsoredMints([
              "ERC721TokenC",
              "ERC721c",
              "https://example.com/contractURI",
              "https://example.com",
              charlie.address,
              trustedAddress.address,
              10,
              3,
            ]),
            +new Date(),
            { value: SPONSORED_MINT_FEE.mul(3) }
          );

        // Assert event emitted
        receipt = await deployERC721TokenC.wait();

        tokenType = getArgFromEvent(
          erc721TokenFactory,
          receipt,
          erc721TokenFactory.interface.events[
            "ERC721TokenDeployed(uint8,address,address,address)"
          ].name,
          "_tokenType"
        );
        expect(tokenType).to.equal(TokenType.ERC721Token);

        erc721TokenImplAddress = getArgFromEvent(
          erc721TokenFactory,
          receipt,
          erc721TokenFactory.interface.events[
            "ERC721TokenDeployed(uint8,address,address,address)"
          ].name,
          "_erc721TokenImpl"
        );
        expect(erc721TokenImplAddress).to.equal(erc721Logic.address);

        creator = getArgFromEvent(
          erc721TokenFactory,
          receipt,
          erc721TokenFactory.interface.events[
            "ERC721TokenDeployed(uint8,address,address,address)"
          ].name,
          "_creator"
        );
        expect(creator).to.equal(charlie.address);

        erc721TokenCloneAddress = getArgFromEvent(
          erc721TokenFactory,
          receipt,
          erc721TokenFactory.interface.events[
            "ERC721TokenDeployed(uint8,address,address,address)"
          ].name,
          "_erc721TokenClone"
        );

        let erc721TokenC = await ethers.getContractAt(
          "ERC721TokenImpl",
          erc721TokenCloneAddress
        );

        // Assert all ERC721TokenImpl states
        // Assert ERC721TokenImpl A states
        expect(await erc721TokenA.MINT_FEE()).to.equal(MINT_FEE);
        expect(await erc721TokenA.MINT_FEE_RECIPIENT()).to.equal(
          MINT_FEE_RECIPIENT
        );
        expect(await erc721TokenA.name()).to.equal("ERC721TokenA");
        expect(await erc721TokenA.symbol()).to.equal("ERC721a");
        expect(await erc721TokenA.maxSupply()).to.equal(10);
        expect(await erc721TokenA.sponsoredMints()).to.eq(0);
        expect(await erc721TokenA.maxSponsoredMints()).to.eq(0);
        expect(await erc721TokenA.contractURI()).to.eq(
          "https://example.com/contractURI"
        );
        expect(await erc721TokenA.tokenURI(1)).to.eq("https://example.com");
        expect(await erc721TokenA.owner()).to.equal(alice.address);
        expect(await erc721TokenA.nextTokenId()).to.eq(1);

        // Assert ERC721TokenImpl B states
        expect(await erc721TokenB.MINT_FEE()).to.equal(MINT_FEE);
        expect(await erc721TokenB.MINT_FEE_RECIPIENT()).to.equal(
          MINT_FEE_RECIPIENT
        );
        expect(await erc721TokenB.name()).to.equal("ERC721TokenB");
        expect(await erc721TokenB.symbol()).to.equal("ERC721b");
        expect(await erc721TokenB.maxSupply()).to.equal(10);
        expect(await erc721TokenB.sponsoredMints()).to.eq(0);
        expect(await erc721TokenB.maxSponsoredMints()).to.eq(5);
        expect(await erc721TokenB.contractURI()).to.eq(
          "https://example.com/contractURI"
        );
        expect(await erc721TokenB.tokenURI(1)).to.eq("https://example.com");
        expect(await erc721TokenB.nextTokenId()).to.eq(1);
        expect(await erc721TokenB.owner()).to.equal(bob.address);

        // Assert ERC721TokenImpl C states
        expect(await erc721TokenC.MINT_FEE()).to.equal(MINT_FEE);
        expect(await erc721TokenC.MINT_FEE_RECIPIENT()).to.equal(
          MINT_FEE_RECIPIENT
        );
        expect(await erc721TokenC.name()).to.equal("ERC721TokenC");
        expect(await erc721TokenC.symbol()).to.equal("ERC721c");
        expect(await erc721TokenC.maxSupply()).to.equal(10);
        expect(await erc721TokenC.sponsoredMints()).to.eq(0);
        expect(await erc721TokenC.maxSponsoredMints()).to.eq(3);
        expect(await erc721TokenC.contractURI()).to.eq(
          "https://example.com/contractURI"
        );
        expect(await erc721TokenC.tokenURI(1)).to.eq("https://example.com");
        expect(await erc721TokenC.nextTokenId()).to.eq(1);
        expect(await erc721TokenC.owner()).to.equal(charlie.address);

        // ERC721SoulboundTokenImpl A
        // Deploy ERC721SoulboundTokenImpl clone
        const deployERC721SoulboundTokenA = await erc721TokenFactory
          .connect(alice)
          .deployERC721Token(
            TokenType.ERC721SoulboundToken,
            encodeInitializationDataWithSponsoredMints([
              "ERC721SoulboundTokenA",
              "ERC721SBa",
              "https://example.com/contractURI",
              "https://example.com",
              alice.address,
              trustedAddress.address,
              10,
              5,
            ]),
            +new Date(),
            { value: SPONSORED_MINT_FEE.mul(5) }
          );

        // Assert event emitted
        receipt = await deployERC721SoulboundTokenA.wait();

        tokenType = getArgFromEvent(
          erc721TokenFactory,
          receipt,
          erc721TokenFactory.interface.events[
            "ERC721TokenDeployed(uint8,address,address,address)"
          ].name,
          "_tokenType"
        );
        expect(tokenType).to.equal(TokenType.ERC721SoulboundToken);

        erc721SoulboundTokenImplAddress = getArgFromEvent(
          erc721TokenFactory,
          receipt,
          erc721TokenFactory.interface.events[
            "ERC721TokenDeployed(uint8,address,address,address)"
          ].name,
          "_erc721TokenImpl"
        );
        expect(erc721SoulboundTokenImplAddress).to.equal(
          erc721SoulboundLogic.address
        );

        creator = getArgFromEvent(
          erc721TokenFactory,
          receipt,
          erc721TokenFactory.interface.events[
            "ERC721TokenDeployed(uint8,address,address,address)"
          ].name,
          "_creator"
        );
        expect(creator).to.equal(alice.address);

        erc721SoulboundTokenCloneAddress = getArgFromEvent(
          erc721TokenFactory,
          receipt,
          erc721TokenFactory.interface.events[
            "ERC721TokenDeployed(uint8,address,address,address)"
          ].name,
          "_erc721TokenClone"
        );

        let erc721SoulboundTokenA = await ethers.getContractAt(
          "ERC721SoulboundTokenImpl",
          erc721SoulboundTokenCloneAddress
        );

        // ERC721SoulboundTokenImpl B
        // Deploy ERC721SoulboundTokenImpl clone
        const deployERC721SoulboundTokenB = await erc721TokenFactory
          .connect(bob)
          .deployERC721Token(
            TokenType.ERC721SoulboundToken,
            encodeInitializationDataWithSponsoredMints([
              "ERC721SoulboundTokenB",
              "ERC721SBb",
              "https://example.com/contractURI",
              "https://example.com",
              bob.address,
              trustedAddress.address,
              10,
              3,
            ]),
            +new Date(),
            { value: SPONSORED_MINT_FEE.mul(3) }
          );

        // Assert event emitted
        receipt = await deployERC721SoulboundTokenB.wait();

        tokenType = getArgFromEvent(
          erc721TokenFactory,
          receipt,
          erc721TokenFactory.interface.events[
            "ERC721TokenDeployed(uint8,address,address,address)"
          ].name,
          "_tokenType"
        );
        expect(tokenType).to.equal(TokenType.ERC721SoulboundToken);

        erc721SoulboundTokenImplAddress = getArgFromEvent(
          erc721TokenFactory,
          receipt,
          erc721TokenFactory.interface.events[
            "ERC721TokenDeployed(uint8,address,address,address)"
          ].name,
          "_erc721TokenImpl"
        );
        expect(erc721SoulboundTokenImplAddress).to.equal(
          erc721SoulboundLogic.address
        );

        creator = getArgFromEvent(
          erc721TokenFactory,
          receipt,
          erc721TokenFactory.interface.events[
            "ERC721TokenDeployed(uint8,address,address,address)"
          ].name,
          "_creator"
        );
        expect(creator).to.equal(bob.address);

        erc721SoulboundTokenCloneAddress = getArgFromEvent(
          erc721TokenFactory,
          receipt,
          erc721TokenFactory.interface.events[
            "ERC721TokenDeployed(uint8,address,address,address)"
          ].name,
          "_erc721TokenClone"
        );

        let erc721SoulboundTokenB = await ethers.getContractAt(
          "ERC721SoulboundTokenImpl",
          erc721SoulboundTokenCloneAddress
        );

        // Assert all ERC721SoulboundTokenImpl states
        // Assert ERC721SoulboundTokenImpl A states
        expect(await erc721SoulboundTokenA.MINT_FEE()).to.equal(MINT_FEE);
        expect(await erc721SoulboundTokenA.MINT_FEE_RECIPIENT()).to.equal(
          MINT_FEE_RECIPIENT
        );
        expect(await erc721SoulboundTokenA.name()).to.equal(
          "ERC721SoulboundTokenA"
        );
        expect(await erc721SoulboundTokenA.symbol()).to.equal("ERC721SBa");
        expect(await erc721SoulboundTokenA.maxSupply()).to.equal(10);
        expect(await erc721SoulboundTokenA.maxSponsoredMints()).to.equal(5);
        expect(await erc721SoulboundTokenA.contractURI()).to.eq(
          "https://example.com/contractURI"
        );
        expect(await erc721SoulboundTokenA.tokenURI(1)).to.eq(
          "https://example.com"
        );
        expect(await erc721SoulboundTokenA.nextTokenId()).to.eq(1);
        expect(await erc721SoulboundTokenA.owner()).to.equal(alice.address);
        await expect(
          erc721SoulboundTokenA.transferFrom(alice.address, bob.address, 1)
        ).to.be.revertedWith("Soulbound");

        // Assert ERC721SoulboundTokenImpl B states
        expect(await erc721SoulboundTokenB.MINT_FEE()).to.equal(MINT_FEE);
        expect(await erc721SoulboundTokenB.MINT_FEE_RECIPIENT()).to.equal(
          MINT_FEE_RECIPIENT
        );
        expect(await erc721SoulboundTokenB.name()).to.equal(
          "ERC721SoulboundTokenB"
        );
        expect(await erc721SoulboundTokenB.symbol()).to.equal("ERC721SBb");
        expect(await erc721SoulboundTokenB.maxSupply()).to.equal(10);
        expect(await erc721SoulboundTokenB.maxSponsoredMints()).to.equal(3);
        expect(await erc721SoulboundTokenB.contractURI()).to.eq(
          "https://example.com/contractURI"
        );
        expect(await erc721SoulboundTokenB.tokenURI(1)).to.eq(
          "https://example.com"
        );
        expect(await erc721SoulboundTokenB.nextTokenId()).to.eq(1);
        expect(await erc721SoulboundTokenB.owner()).to.equal(bob.address);
        await expect(
          erc721SoulboundTokenB.transferFrom(alice.address, bob.address, 1)
        ).to.be.revertedWith("Soulbound");

        // ERC721TokenNativeGaslessMintImpl A
        // Deploy ERC721TokenNativeGaslessMintImpl clone
        const deployERC721TokenNativeGaslessMintA = await erc721TokenFactory
          .connect(alice)
          .deployERC721Token(
            TokenType.ERC721TokenNativeGaslessMint,
            encodeInitializationData([
              "ERC721TokenA",
              "ERC721a",
              "https://example.com/contractURI",
              "https://example.com",
              alice.address,
              trustedAddress.address,
              10,
            ]),
            +new Date()
          );

        // Assert event emitted
        receipt = await deployERC721TokenNativeGaslessMintA.wait();

        tokenType = getArgFromEvent(
          erc721TokenFactory,
          receipt,
          erc721TokenFactory.interface.events[
            "ERC721TokenDeployed(uint8,address,address,address)"
          ].name,
          "_tokenType"
        );
        expect(tokenType).to.equal(TokenType.ERC721TokenNativeGaslessMint);

        erc721TokenNativeGaslessMintImplAddress = getArgFromEvent(
          erc721TokenFactory,
          receipt,
          erc721TokenFactory.interface.events[
            "ERC721TokenDeployed(uint8,address,address,address)"
          ].name,
          "_erc721TokenImpl"
        );
        expect(erc721TokenNativeGaslessMintImplAddress).to.equal(
          erc721TokenNativeGaslessMintLogic.address
        );

        creator = getArgFromEvent(
          erc721TokenFactory,
          receipt,
          erc721TokenFactory.interface.events[
            "ERC721TokenDeployed(uint8,address,address,address)"
          ].name,
          "_creator"
        );
        expect(creator).to.equal(alice.address);

        erc721TokenNativeGaslessMintCloneAddress = getArgFromEvent(
          erc721TokenFactory,
          receipt,
          erc721TokenFactory.interface.events[
            "ERC721TokenDeployed(uint8,address,address,address)"
          ].name,
          "_erc721TokenClone"
        );

        let erc721TokenNativeGaslessMintA = await ethers.getContractAt(
          "ERC721TokenNativeGaslessMintImpl",
          erc721TokenNativeGaslessMintCloneAddress
        );

        // ERC721TokenNativeGaslessMintImpl B
        // Deploy ERC721TokenNativeGaslessMintImpl clone
        const deployERC721TokenNativeGaslessMintB = await erc721TokenFactory
          .connect(bob)
          .deployERC721Token(
            TokenType.ERC721TokenNativeGaslessMint,
            encodeInitializationData([
              "ERC721TokenB",
              "ERC721b",
              "https://example.com/contractURI",
              "https://example.com",
              bob.address,
              trustedAddress.address,
              10,
            ]),
            +new Date()
          );

        // Assert event emitted
        receipt = await deployERC721TokenNativeGaslessMintB.wait();

        tokenType = getArgFromEvent(
          erc721TokenFactory,
          receipt,
          erc721TokenFactory.interface.events[
            "ERC721TokenDeployed(uint8,address,address,address)"
          ].name,
          "_tokenType"
        );
        expect(tokenType).to.equal(TokenType.ERC721TokenNativeGaslessMint);

        erc721TokenNativeGaslessMintImplAddress = getArgFromEvent(
          erc721TokenFactory,
          receipt,
          erc721TokenFactory.interface.events[
            "ERC721TokenDeployed(uint8,address,address,address)"
          ].name,
          "_erc721TokenImpl"
        );
        expect(erc721TokenNativeGaslessMintImplAddress).to.equal(
          erc721TokenNativeGaslessMintLogic.address
        );

        creator = getArgFromEvent(
          erc721TokenFactory,
          receipt,
          erc721TokenFactory.interface.events[
            "ERC721TokenDeployed(uint8,address,address,address)"
          ].name,
          "_creator"
        );
        expect(creator).to.equal(bob.address);

        erc721TokenNativeGaslessMintCloneAddress = getArgFromEvent(
          erc721TokenFactory,
          receipt,
          erc721TokenFactory.interface.events[
            "ERC721TokenDeployed(uint8,address,address,address)"
          ].name,
          "_erc721TokenClone"
        );

        let erc721TokenNativeGaslessMintB = await ethers.getContractAt(
          "ERC721TokenNativeGaslessMintImpl",
          erc721TokenNativeGaslessMintCloneAddress
        );

        // ERC721TokenNativeGaslessMintImpl C
        // Deploy ERC721TokenNativeGaslessMintImpl clone
        const deployERC721TokenNativeGaslessMintC = await erc721TokenFactory
          .connect(charlie)
          .deployERC721Token(
            TokenType.ERC721TokenNativeGaslessMint,
            encodeInitializationData([
              "ERC721TokenC",
              "ERC721c",
              "https://example.com/contractURI",
              "https://example.com",
              charlie.address,
              trustedAddress.address,
              10,
            ]),
            +new Date()
          );

        // Assert event emitted
        receipt = await deployERC721TokenNativeGaslessMintC.wait();

        tokenType = getArgFromEvent(
          erc721TokenFactory,
          receipt,
          erc721TokenFactory.interface.events[
            "ERC721TokenDeployed(uint8,address,address,address)"
          ].name,
          "_tokenType"
        );
        expect(tokenType).to.equal(TokenType.ERC721TokenNativeGaslessMint);

        erc721TokenNativeGaslessMintImplAddress = getArgFromEvent(
          erc721TokenFactory,
          receipt,
          erc721TokenFactory.interface.events[
            "ERC721TokenDeployed(uint8,address,address,address)"
          ].name,
          "_erc721TokenImpl"
        );
        expect(erc721TokenNativeGaslessMintImplAddress).to.equal(
          erc721TokenNativeGaslessMintLogic.address
        );

        creator = getArgFromEvent(
          erc721TokenFactory,
          receipt,
          erc721TokenFactory.interface.events[
            "ERC721TokenDeployed(uint8,address,address,address)"
          ].name,
          "_creator"
        );
        expect(creator).to.equal(charlie.address);

        erc721TokenNativeGaslessMintCloneAddress = getArgFromEvent(
          erc721TokenFactory,
          receipt,
          erc721TokenFactory.interface.events[
            "ERC721TokenDeployed(uint8,address,address,address)"
          ].name,
          "_erc721TokenClone"
        );

        let erc721TokenNativeGaslessMintC = await ethers.getContractAt(
          "ERC721TokenNativeGaslessMintImpl",
          erc721TokenNativeGaslessMintCloneAddress
        );

        // Assert all ERC721TokenNativeGaslessMintImpl states
        // Assert ERC721TokenNativeGaslessMintImpl A states
        expect(await erc721TokenNativeGaslessMintA.name()).to.equal(
          "ERC721TokenA"
        );
        expect(await erc721TokenNativeGaslessMintA.symbol()).to.equal(
          "ERC721a"
        );
        expect(await erc721TokenNativeGaslessMintA.maxSupply()).to.equal(10);
        expect(await erc721TokenNativeGaslessMintA.contractURI()).to.eq(
          "https://example.com/contractURI"
        );
        expect(await erc721TokenNativeGaslessMintA.tokenURI(1)).to.eq(
          "https://example.com"
        );
        expect(await erc721TokenNativeGaslessMintA.nextTokenId()).to.eq(1);
        expect(await erc721TokenNativeGaslessMintA.owner()).to.equal(
          alice.address
        );
        expect(
          await erc721TokenNativeGaslessMintA.getNonce(bob.address)
        ).to.equal(0);

        // Assert ERC721TokenNativeGaslessMintImpl B states
        expect(await erc721TokenNativeGaslessMintB.name()).to.equal(
          "ERC721TokenB"
        );
        expect(await erc721TokenNativeGaslessMintB.symbol()).to.equal(
          "ERC721b"
        );
        expect(await erc721TokenNativeGaslessMintB.maxSupply()).to.equal(10);
        expect(await erc721TokenNativeGaslessMintB.contractURI()).to.eq(
          "https://example.com/contractURI"
        );
        expect(await erc721TokenNativeGaslessMintB.tokenURI(1)).to.eq(
          "https://example.com"
        );
        expect(await erc721TokenNativeGaslessMintB.nextTokenId()).to.eq(1);
        expect(await erc721TokenNativeGaslessMintB.owner()).to.equal(
          bob.address
        );
        expect(
          await erc721TokenNativeGaslessMintB.getNonce(bob.address)
        ).to.equal(0);

        // Assert ERC721TokenNativeGaslessMintImpl C states
        expect(await erc721TokenNativeGaslessMintC.name()).to.equal(
          "ERC721TokenC"
        );
        expect(await erc721TokenNativeGaslessMintC.symbol()).to.equal(
          "ERC721c"
        );
        expect(await erc721TokenNativeGaslessMintC.maxSupply()).to.equal(10);
        expect(await erc721TokenNativeGaslessMintC.contractURI()).to.eq(
          "https://example.com/contractURI"
        );
        expect(await erc721TokenNativeGaslessMintC.tokenURI(1)).to.eq(
          "https://example.com"
        );
        expect(await erc721TokenNativeGaslessMintC.nextTokenId()).to.eq(1);
        expect(await erc721TokenNativeGaslessMintC.owner()).to.equal(
          charlie.address
        );
        expect(
          await erc721TokenNativeGaslessMintC.getNonce(bob.address)
        ).to.equal(0);

        // ERC721SoulboundTokenNativeGaslessMintImpl A
        // Deploy ERC721SoulboundTokenNativeGaslessMintImpl clone
        const deployERC721SoulboundTokenNativeGaslessMintA =
          await erc721TokenFactory
            .connect(alice)
            .deployERC721Token(
              TokenType.ERC721SoulboundTokenNativeGaslessMint,
              encodeInitializationData([
                "ERC721SoulboundTokenA",
                "ERC721SBa",
                "https://example.com/contractURI",
                "https://example.com",
                alice.address,
                trustedAddress.address,
                10,
              ]),
              +new Date()
            );

        // Assert event emitted
        receipt = await deployERC721SoulboundTokenNativeGaslessMintA.wait();

        tokenType = getArgFromEvent(
          erc721TokenFactory,
          receipt,
          erc721TokenFactory.interface.events[
            "ERC721TokenDeployed(uint8,address,address,address)"
          ].name,
          "_tokenType"
        );
        expect(tokenType).to.equal(
          TokenType.ERC721SoulboundTokenNativeGaslessMint
        );

        erc721SoulboundTokenNativeGaslessMintImplAddress = getArgFromEvent(
          erc721TokenFactory,
          receipt,
          erc721TokenFactory.interface.events[
            "ERC721TokenDeployed(uint8,address,address,address)"
          ].name,
          "_erc721TokenImpl"
        );
        expect(erc721SoulboundTokenNativeGaslessMintImplAddress).to.equal(
          erc721SoulboundTokenNativeGaslessMintLogic.address
        );

        creator = getArgFromEvent(
          erc721TokenFactory,
          receipt,
          erc721TokenFactory.interface.events[
            "ERC721TokenDeployed(uint8,address,address,address)"
          ].name,
          "_creator"
        );
        expect(creator).to.equal(alice.address);

        erc721SoulboundTokenNativeGaslessMintCloneAddress = getArgFromEvent(
          erc721TokenFactory,
          receipt,
          erc721TokenFactory.interface.events[
            "ERC721TokenDeployed(uint8,address,address,address)"
          ].name,
          "_erc721TokenClone"
        );

        let erc721SoulboundTokenNativeGaslessMintA = await ethers.getContractAt(
          "ERC721SoulboundTokenNativeGaslessMint",
          erc721SoulboundTokenNativeGaslessMintCloneAddress
        );

        // ERC721SoulboundTokenNativeGaslessMintImpl B
        // Deploy ERC721SoulboundTokenNativeGaslessMintImpl clone
        const deployERC721SoulboundTokenNativeGaslessMintB =
          await erc721TokenFactory
            .connect(bob)
            .deployERC721Token(
              TokenType.ERC721SoulboundTokenNativeGaslessMint,
              encodeInitializationData([
                "ERC721SoulboundTokenB",
                "ERC721SBb",
                "https://example.com/contractURI",
                "https://example.com",
                bob.address,
                trustedAddress.address,
                10,
              ]),
              +new Date()
            );

        // Assert event emitted
        receipt = await deployERC721SoulboundTokenNativeGaslessMintB.wait();

        tokenType = getArgFromEvent(
          erc721TokenFactory,
          receipt,
          erc721TokenFactory.interface.events[
            "ERC721TokenDeployed(uint8,address,address,address)"
          ].name,
          "_tokenType"
        );
        expect(tokenType).to.equal(
          TokenType.ERC721SoulboundTokenNativeGaslessMint
        );

        erc721SoulboundTokenNativeGaslessMintImplAddress = getArgFromEvent(
          erc721TokenFactory,
          receipt,
          erc721TokenFactory.interface.events[
            "ERC721TokenDeployed(uint8,address,address,address)"
          ].name,
          "_erc721TokenImpl"
        );
        expect(erc721SoulboundTokenNativeGaslessMintImplAddress).to.equal(
          erc721SoulboundTokenNativeGaslessMintLogic.address
        );

        creator = getArgFromEvent(
          erc721TokenFactory,
          receipt,
          erc721TokenFactory.interface.events[
            "ERC721TokenDeployed(uint8,address,address,address)"
          ].name,
          "_creator"
        );
        expect(creator).to.equal(bob.address);

        erc721SoulboundTokenNativeGaslessMintCloneAddress = getArgFromEvent(
          erc721TokenFactory,
          receipt,
          erc721TokenFactory.interface.events[
            "ERC721TokenDeployed(uint8,address,address,address)"
          ].name,
          "_erc721TokenClone"
        );

        let erc721SoulboundTokenNativeGaslessMintB = await ethers.getContractAt(
          "ERC721SoulboundTokenNativeGaslessMintImpl",
          erc721SoulboundTokenNativeGaslessMintCloneAddress
        );

        // Assert all ERC721SoulboundTokenNativeGaslessMintImpl states
        // Assert ERC721SoulboundTokenNativeGaslessMintImpl A states
        expect(await erc721SoulboundTokenNativeGaslessMintA.name()).to.equal(
          "ERC721SoulboundTokenA"
        );
        expect(await erc721SoulboundTokenNativeGaslessMintA.symbol()).to.equal(
          "ERC721SBa"
        );
        expect(
          await erc721SoulboundTokenNativeGaslessMintA.maxSupply()
        ).to.equal(10);
        expect(
          await erc721SoulboundTokenNativeGaslessMintA.contractURI()
        ).to.eq("https://example.com/contractURI");
        expect(await erc721SoulboundTokenNativeGaslessMintA.tokenURI(1)).to.eq(
          "https://example.com"
        );
        expect(
          await erc721SoulboundTokenNativeGaslessMintA.nextTokenId()
        ).to.eq(1);
        expect(await erc721SoulboundTokenNativeGaslessMintA.owner()).to.equal(
          alice.address
        );
        await expect(
          erc721SoulboundTokenNativeGaslessMintA.transferFrom(
            alice.address,
            bob.address,
            1
          )
        ).to.be.revertedWith("Soulbound");
        expect(
          await erc721SoulboundTokenNativeGaslessMintA.getNonce(bob.address)
        ).to.equal(0);

        // Assert ERC721SoulboundTokenNativeGaslessMintImpl B states
        expect(await erc721SoulboundTokenNativeGaslessMintB.name()).to.equal(
          "ERC721SoulboundTokenB"
        );
        expect(await erc721SoulboundTokenNativeGaslessMintB.symbol()).to.equal(
          "ERC721SBb"
        );
        expect(
          await erc721SoulboundTokenNativeGaslessMintB.maxSupply()
        ).to.equal(10);
        expect(
          await erc721SoulboundTokenNativeGaslessMintB.contractURI()
        ).to.eq("https://example.com/contractURI");
        expect(await erc721SoulboundTokenNativeGaslessMintB.tokenURI(1)).to.eq(
          "https://example.com"
        );
        expect(
          await erc721SoulboundTokenNativeGaslessMintB.nextTokenId()
        ).to.eq(1);
        expect(await erc721SoulboundTokenNativeGaslessMintB.owner()).to.equal(
          bob.address
        );
        await expect(
          erc721SoulboundTokenNativeGaslessMintB.transferFrom(
            alice.address,
            bob.address,
            1
          )
        ).to.be.revertedWith("Soulbound");
        expect(
          await erc721SoulboundTokenNativeGaslessMintB.getNonce(bob.address)
        ).to.equal(0);
      });

      it("Should return correct clone address on staticcall, replacing predictDeterministicAddress()", async function () {
        // staticall deployERC721Token()
        const erc721Token_A = {
          _tokenType: TokenType.ERC721Token,
          _name: "TestToken",
          _symbol: "TEST",
          contractURI_: "https://example.com/contractURI",
          tokenURI_: "https://example.com",
          _trustedAddress: trustedAddress.address,
          _maxSupply: 10,
          _sponsoredMints: 0,
          _saltNonce: 1337,
        };
        const predictedERC721TokenCloneAddress_A = await erc721TokenFactory
          .connect(alice)
          .callStatic.deployERC721Token(
            erc721Token_A._tokenType,
            encodeInitializationDataWithSponsoredMints([
              erc721Token_A._name,
              erc721Token_A._symbol,
              erc721Token_A.contractURI_,
              erc721Token_A.tokenURI_,
              alice.address,
              erc721Token_A._trustedAddress,
              erc721Token_A._maxSupply,
              erc721Token_A._sponsoredMints,
            ]),
            erc721Token_A._saltNonce,
            { value: SPONSORED_MINT_FEE.mul(erc721Token_A._sponsoredMints) }
          );

        const erc721Token_B = {
          _tokenType: TokenType.ERC721Token,
          _name: "TestToken",
          _symbol: "TEST",
          contractURI_: "https://example.com/contractURI",
          tokenURI_: "https://example.com",
          _trustedAddress: trustedAddress.address,
          _maxSupply: 10,
          _sponsoredMints: 5,
          _saltNonce: 2337,
        };
        const predictedERC721TokenCloneAddress_B = await erc721TokenFactory
          .connect(alice)
          .callStatic.deployERC721Token(
            erc721Token_B._tokenType,
            encodeInitializationDataWithSponsoredMints([
              erc721Token_B._name,
              erc721Token_B._symbol,
              erc721Token_B.contractURI_,
              erc721Token_B.tokenURI_,
              alice.address,
              erc721Token_B._trustedAddress,
              erc721Token_B._maxSupply,
              erc721Token_B._sponsoredMints,
            ]),
            erc721Token_B._saltNonce,
            { value: SPONSORED_MINT_FEE.mul(erc721Token_B._sponsoredMints) }
          );

        const erc721SoulboundToken_A = {
          _tokenType: TokenType.ERC721SoulboundToken,
          _name: "TestToken",
          _symbol: "TEST",
          contractURI_: "https://example.com/contractURI",
          tokenURI_: "https://example.com",
          _trustedAddress: trustedAddress.address,
          _maxSupply: 10,
          _sponsoredMints: 5,
          _saltNonce: 1337,
        };
        const predictedERC721SoulboundTokenCloneAddress_A =
          await erc721TokenFactory
            .connect(alice)
            .callStatic.deployERC721Token(
              erc721SoulboundToken_A._tokenType,
              encodeInitializationDataWithSponsoredMints([
                erc721SoulboundToken_A._name,
                erc721SoulboundToken_A._symbol,
                erc721SoulboundToken_A.contractURI_,
                erc721SoulboundToken_A.tokenURI_,
                alice.address,
                erc721SoulboundToken_A._trustedAddress,
                erc721SoulboundToken_A._maxSupply,
                erc721SoulboundToken_A._sponsoredMints,
              ]),
              erc721SoulboundToken_A._saltNonce,
              {
                value: SPONSORED_MINT_FEE.mul(
                  erc721SoulboundToken_A._sponsoredMints
                ),
              }
            );

        const erc721SoulboundToken_B = {
          _tokenType: TokenType.ERC721SoulboundToken,
          _name: "TestToken",
          _symbol: "TEST",
          contractURI_: "https://example.com/contractURI",
          tokenURI_: "https://example.com",
          _trustedAddress: trustedAddress.address,
          _maxSupply: 10,
          _sponsoredMints: 3,
          _saltNonce: 2337,
        };
        const predictedERC721SoulboundTokenCloneAddress_B =
          await erc721TokenFactory
            .connect(alice)
            .callStatic.deployERC721Token(
              erc721SoulboundToken_B._tokenType,
              encodeInitializationDataWithSponsoredMints([
                erc721SoulboundToken_B._name,
                erc721SoulboundToken_B._symbol,
                erc721SoulboundToken_B.contractURI_,
                erc721SoulboundToken_B.tokenURI_,
                alice.address,
                erc721SoulboundToken_B._trustedAddress,
                erc721SoulboundToken_B._maxSupply,
                erc721SoulboundToken_B._sponsoredMints,
              ]),
              erc721SoulboundToken_B._saltNonce,
              {
                value: SPONSORED_MINT_FEE.mul(
                  erc721SoulboundToken_B._sponsoredMints
                ),
              }
            );

        // Deploy ERC721TokenImpl clone
        const deployERC721Token_A = await erc721TokenFactory
          .connect(alice)
          .deployERC721Token(
            erc721Token_A._tokenType,
            encodeInitializationDataWithSponsoredMints([
              erc721Token_A._name,
              erc721Token_A._symbol,
              erc721Token_A.contractURI_,
              erc721Token_A.tokenURI_,
              alice.address,
              erc721Token_A._trustedAddress,
              erc721Token_A._maxSupply,
              erc721Token_A._sponsoredMints,
            ]),
            erc721Token_A._saltNonce,
            { value: SPONSORED_MINT_FEE.mul(erc721Token_A._sponsoredMints) }
          );
        let receipt = await deployERC721Token_A.wait();
        const erc721TokenCloneAddress_A = getArgFromEvent(
          erc721TokenFactory,
          receipt,
          erc721TokenFactory.interface.events[
            "ERC721TokenDeployed(uint8,address,address,address)"
          ].name,
          "_erc721TokenClone"
        );
        const deployERC721Token_B = await erc721TokenFactory
          .connect(alice)
          .deployERC721Token(
            erc721Token_B._tokenType,
            encodeInitializationDataWithSponsoredMints([
              erc721Token_B._name,
              erc721Token_B._symbol,
              erc721Token_B.contractURI_,
              erc721Token_B.tokenURI_,
              alice.address,
              erc721Token_B._trustedAddress,
              erc721Token_B._maxSupply,
              erc721Token_B._sponsoredMints,
            ]),
            erc721Token_B._saltNonce,
            { value: SPONSORED_MINT_FEE.mul(erc721Token_B._sponsoredMints) }
          );
        receipt = await deployERC721Token_B.wait();
        const erc721TokenCloneAddress_B = getArgFromEvent(
          erc721TokenFactory,
          receipt,
          erc721TokenFactory.interface.events[
            "ERC721TokenDeployed(uint8,address,address,address)"
          ].name,
          "_erc721TokenClone"
        );

        const deployERC721SoulboundToken_A = await erc721TokenFactory
          .connect(alice)
          .deployERC721Token(
            erc721SoulboundToken_A._tokenType,
            encodeInitializationDataWithSponsoredMints([
              erc721SoulboundToken_A._name,
              erc721SoulboundToken_A._symbol,
              erc721SoulboundToken_A.contractURI_,
              erc721SoulboundToken_A.tokenURI_,
              alice.address,
              erc721SoulboundToken_A._trustedAddress,
              erc721SoulboundToken_A._maxSupply,
              erc721SoulboundToken_A._sponsoredMints,
            ]),
            erc721SoulboundToken_A._saltNonce,
            {
              value: SPONSORED_MINT_FEE.mul(
                erc721SoulboundToken_A._sponsoredMints
              ),
            }
          );
        receipt = await deployERC721SoulboundToken_A.wait();
        const erc721SoulboundTokenCloneAddress_A = getArgFromEvent(
          erc721TokenFactory,
          receipt,
          erc721TokenFactory.interface.events[
            "ERC721TokenDeployed(uint8,address,address,address)"
          ].name,
          "_erc721TokenClone"
        );
        const deployERC721SoulboundToken_B = await erc721TokenFactory
          .connect(alice)
          .deployERC721Token(
            erc721SoulboundToken_B._tokenType,
            encodeInitializationDataWithSponsoredMints([
              erc721SoulboundToken_B._name,
              erc721SoulboundToken_B._symbol,
              erc721SoulboundToken_B.contractURI_,
              erc721SoulboundToken_B.tokenURI_,
              alice.address,
              erc721SoulboundToken_B._trustedAddress,
              erc721SoulboundToken_B._maxSupply,
              erc721SoulboundToken_B._sponsoredMints,
            ]),
            erc721SoulboundToken_B._saltNonce,
            {
              value: SPONSORED_MINT_FEE.mul(
                erc721SoulboundToken_B._sponsoredMints
              ),
            }
          );
        receipt = await deployERC721SoulboundToken_B.wait();
        const erc721SoulboundTokenCloneAddress_B = getArgFromEvent(
          erc721TokenFactory,
          receipt,
          erc721TokenFactory.interface.events[
            "ERC721TokenDeployed(uint8,address,address,address)"
          ].name,
          "_erc721TokenClone"
        );

        const erc721TokenNativeGaslessMint_A = {
          _tokenType: TokenType.ERC721TokenNativeGaslessMint,
          _name: "TestToken",
          _symbol: "TEST",
          contractURI_: "https://example.com/contractURI",
          tokenURI_: "https://example.com",
          _trustedAddress: trustedAddress.address,
          _maxSupply: 10,
          _saltNonce: 1337,
        };
        const predictedERC721TokenNativeGaslessMintCloneAddress_A =
          await erc721TokenFactory
            .connect(alice)
            .callStatic.deployERC721Token(
              erc721TokenNativeGaslessMint_A._tokenType,
              encodeInitializationData([
                erc721TokenNativeGaslessMint_A._name,
                erc721TokenNativeGaslessMint_A._symbol,
                erc721TokenNativeGaslessMint_A.contractURI_,
                erc721TokenNativeGaslessMint_A.tokenURI_,
                alice.address,
                erc721TokenNativeGaslessMint_A._trustedAddress,
                erc721TokenNativeGaslessMint_A._maxSupply,
              ]),
              erc721TokenNativeGaslessMint_A._saltNonce
            );

        const erc721TokenNativeGaslessMint_B = {
          _tokenType: TokenType.ERC721TokenNativeGaslessMint,
          _name: "TestToken",
          _symbol: "TEST",
          contractURI_: "https://example.com/contractURI",
          tokenURI_: "https://example.com",
          _trustedAddress: trustedAddress.address,
          _maxSupply: 10,
          _saltNonce: 2337,
        };
        const predictedERC721TokenNativeGaslessMintCloneAddress_B =
          await erc721TokenFactory
            .connect(alice)
            .callStatic.deployERC721Token(
              erc721TokenNativeGaslessMint_B._tokenType,
              encodeInitializationData([
                erc721TokenNativeGaslessMint_B._name,
                erc721TokenNativeGaslessMint_B._symbol,
                erc721TokenNativeGaslessMint_B.contractURI_,
                erc721TokenNativeGaslessMint_B.tokenURI_,
                alice.address,
                erc721TokenNativeGaslessMint_B._trustedAddress,
                erc721TokenNativeGaslessMint_B._maxSupply,
              ]),
              erc721TokenNativeGaslessMint_B._saltNonce
            );

        const erc721SoulboundTokenNativeGaslessMint_A = {
          _tokenType: TokenType.ERC721SoulboundTokenNativeGaslessMint,
          _name: "TestToken",
          _symbol: "TEST",
          contractURI_: "https://example.com/contractURI",
          tokenURI_: "https://example.com",
          _trustedAddress: trustedAddress.address,
          _maxSupply: 10,
          _saltNonce: 1337,
        };
        const predictedERC721SoulboundTokenNativeGaslessMintCloneAddress_A =
          await erc721TokenFactory
            .connect(alice)
            .callStatic.deployERC721Token(
              erc721SoulboundTokenNativeGaslessMint_A._tokenType,
              encodeInitializationData([
                erc721SoulboundTokenNativeGaslessMint_A._name,
                erc721SoulboundTokenNativeGaslessMint_A._symbol,
                erc721SoulboundTokenNativeGaslessMint_A.contractURI_,
                erc721SoulboundTokenNativeGaslessMint_A.tokenURI_,
                alice.address,
                erc721SoulboundTokenNativeGaslessMint_A._trustedAddress,
                erc721SoulboundTokenNativeGaslessMint_A._maxSupply,
              ]),
              erc721SoulboundTokenNativeGaslessMint_A._saltNonce
            );

        const erc721SoulboundTokenNativeGaslessMint_B = {
          _tokenType: TokenType.ERC721SoulboundTokenNativeGaslessMint,
          _name: "TestToken",
          _symbol: "TEST",
          contractURI_: "https://example.com/contractURI",
          tokenURI_: "https://example.com",
          _trustedAddress: trustedAddress.address,
          _maxSupply: 10,
          _saltNonce: 2337,
        };
        const predictedERC721SoulboundTokenNativeGaslessMintCloneAddress_B =
          await erc721TokenFactory
            .connect(alice)
            .callStatic.deployERC721Token(
              erc721SoulboundTokenNativeGaslessMint_B._tokenType,
              encodeInitializationData([
                erc721SoulboundTokenNativeGaslessMint_B._name,
                erc721SoulboundTokenNativeGaslessMint_B._symbol,
                erc721SoulboundTokenNativeGaslessMint_B.contractURI_,
                erc721SoulboundTokenNativeGaslessMint_B.tokenURI_,
                alice.address,
                erc721SoulboundTokenNativeGaslessMint_B._trustedAddress,
                erc721SoulboundTokenNativeGaslessMint_B._maxSupply,
              ]),
              erc721SoulboundTokenNativeGaslessMint_B._saltNonce
            );

        // Deploy ERC721TokenImpl clone
        const deployERC721TokenNativeGaslessMint_A = await erc721TokenFactory
          .connect(alice)
          .deployERC721Token(
            erc721TokenNativeGaslessMint_A._tokenType,
            encodeInitializationData([
              erc721TokenNativeGaslessMint_A._name,
              erc721TokenNativeGaslessMint_A._symbol,
              erc721TokenNativeGaslessMint_A.contractURI_,
              erc721TokenNativeGaslessMint_A.tokenURI_,
              alice.address,
              erc721TokenNativeGaslessMint_A._trustedAddress,
              erc721TokenNativeGaslessMint_A._maxSupply,
            ]),
            erc721TokenNativeGaslessMint_A._saltNonce
          );
        receipt = await deployERC721TokenNativeGaslessMint_A.wait();
        const erc721TokenNativeGaslessMintCloneAddress_A = getArgFromEvent(
          erc721TokenFactory,
          receipt,
          erc721TokenFactory.interface.events[
            "ERC721TokenDeployed(uint8,address,address,address)"
          ].name,
          "_erc721TokenClone"
        );
        const deployERC721TokenNativeGaslessMint_B = await erc721TokenFactory
          .connect(alice)
          .deployERC721Token(
            erc721TokenNativeGaslessMint_B._tokenType,
            encodeInitializationData([
              erc721TokenNativeGaslessMint_B._name,
              erc721TokenNativeGaslessMint_B._symbol,
              erc721TokenNativeGaslessMint_B.contractURI_,
              erc721TokenNativeGaslessMint_B.tokenURI_,
              alice.address,
              erc721TokenNativeGaslessMint_B._trustedAddress,
              erc721TokenNativeGaslessMint_B._maxSupply,
            ]),
            erc721TokenNativeGaslessMint_B._saltNonce
          );
        receipt = await deployERC721TokenNativeGaslessMint_B.wait();
        const erc721TokenNativeGaslessMintCloneAddress_B = getArgFromEvent(
          erc721TokenFactory,
          receipt,
          erc721TokenFactory.interface.events[
            "ERC721TokenDeployed(uint8,address,address,address)"
          ].name,
          "_erc721TokenClone"
        );

        const deployERC721SoulboundTokenNativeGaslessMint_A =
          await erc721TokenFactory
            .connect(alice)
            .deployERC721Token(
              erc721SoulboundTokenNativeGaslessMint_A._tokenType,
              encodeInitializationData([
                erc721SoulboundTokenNativeGaslessMint_A._name,
                erc721SoulboundTokenNativeGaslessMint_A._symbol,
                erc721SoulboundTokenNativeGaslessMint_A.contractURI_,
                erc721SoulboundTokenNativeGaslessMint_A.tokenURI_,
                alice.address,
                erc721SoulboundTokenNativeGaslessMint_A._trustedAddress,
                erc721SoulboundTokenNativeGaslessMint_A._maxSupply,
              ]),
              erc721SoulboundTokenNativeGaslessMint_A._saltNonce
            );
        receipt = await deployERC721SoulboundTokenNativeGaslessMint_A.wait();
        const erc721SoulboundTokenNativeGaslessMintCloneAddress_A =
          getArgFromEvent(
            erc721TokenFactory,
            receipt,
            erc721TokenFactory.interface.events[
              "ERC721TokenDeployed(uint8,address,address,address)"
            ].name,
            "_erc721TokenClone"
          );
        const deployERC721SoulboundTokenNativeGaslessMint_B =
          await erc721TokenFactory
            .connect(alice)
            .deployERC721Token(
              erc721SoulboundTokenNativeGaslessMint_B._tokenType,
              encodeInitializationData([
                erc721SoulboundTokenNativeGaslessMint_B._name,
                erc721SoulboundTokenNativeGaslessMint_B._symbol,
                erc721SoulboundTokenNativeGaslessMint_B.contractURI_,
                erc721SoulboundTokenNativeGaslessMint_B.tokenURI_,
                alice.address,
                erc721SoulboundTokenNativeGaslessMint_B._trustedAddress,
                erc721SoulboundTokenNativeGaslessMint_B._maxSupply,
              ]),
              erc721SoulboundTokenNativeGaslessMint_B._saltNonce
            );
        receipt = await deployERC721SoulboundTokenNativeGaslessMint_B.wait();
        const erc721SoulboundTokenNativeGaslessMintCloneAddress_B =
          getArgFromEvent(
            erc721TokenFactory,
            receipt,
            erc721TokenFactory.interface.events[
              "ERC721TokenDeployed(uint8,address,address,address)"
            ].name,
            "_erc721TokenClone"
          );

        expect(predictedERC721TokenCloneAddress_A).to.eq(
          erc721TokenCloneAddress_A
        );
        expect(predictedERC721TokenCloneAddress_B).to.eq(
          erc721TokenCloneAddress_B
        );

        expect(predictedERC721SoulboundTokenCloneAddress_A).to.eq(
          erc721SoulboundTokenCloneAddress_A
        );
        expect(predictedERC721SoulboundTokenCloneAddress_B).to.eq(
          erc721SoulboundTokenCloneAddress_B
        );

        expect(predictedERC721TokenNativeGaslessMintCloneAddress_A).to.eq(
          erc721TokenNativeGaslessMintCloneAddress_A
        );
        expect(predictedERC721TokenNativeGaslessMintCloneAddress_B).to.eq(
          erc721TokenNativeGaslessMintCloneAddress_B
        );

        expect(
          predictedERC721SoulboundTokenNativeGaslessMintCloneAddress_A
        ).to.eq(erc721SoulboundTokenNativeGaslessMintCloneAddress_A);
        expect(
          predictedERC721SoulboundTokenNativeGaslessMintCloneAddress_B
        ).to.eq(erc721SoulboundTokenNativeGaslessMintCloneAddress_B);
      });
    });

    describe("setERC721TokenImplAddress()", () => {
      it("Should allow ERC721TokenNativeGaslessMintFactory owner to setERC721TokenImplAddress()", async function () {
        // Deploy a new ERC721TokenImpl logic contract
        const ERC721TokenImpl = await ethers.getContractFactory(
          "ERC721TokenImpl"
        );
        let newERC721TokenImpl = await ERC721TokenImpl.deploy(
          MINT_FEE,
          SPONSORED_MINT_FEE,
          MINT_FEE_RECIPIENT,
          protocolRewards.address
        );

        // Change erc721TokenImpl impl address
        await erc721TokenFactory.setERC721TokenImplAddress(
          newERC721TokenImpl.address
        );

        expect(await erc721TokenFactory.erc721TokenImpl()).to.equal(
          newERC721TokenImpl.address
        );
      });

      it("Should emit ERC721TokenImplSet() on setERC721TokenImplAddress()", async function () {
        const erc721TokenImplBefore =
          await erc721TokenFactory.erc721TokenImpl();

        // Deploy a new ERC721TokenImpl logic contract
        const ERC721TokenImpl = await ethers.getContractFactory(
          "ERC721TokenImpl"
        );
        let newERC721TokenImpl = await ERC721TokenImpl.deploy(
          MINT_FEE,
          SPONSORED_MINT_FEE,
          MINT_FEE_RECIPIENT,
          protocolRewards.address
        );

        await expect(
          erc721TokenFactory.setERC721TokenImplAddress(
            newERC721TokenImpl.address
          )
        )
          .to.emit(erc721TokenFactory, "ERC721TokenImplSet")
          .withArgs(erc721TokenImplBefore, newERC721TokenImpl.address);
      });

      it("Should revert if non-ERC721TokenNativeGaslessMintFactory-owner tries to setERC721TokenImplAddress()", async function () {
        // Deploy a new ERC721TokenImpl logic contract
        const ERC721TokenImpl = await ethers.getContractFactory(
          "ERC721TokenImpl"
        );
        let newERC721TokenImpl = await ERC721TokenImpl.deploy(
          MINT_FEE,
          SPONSORED_MINT_FEE,
          MINT_FEE_RECIPIENT,
          protocolRewards.address
        );

        // Try to change erc721TokenImpl impl address as user
        await expect(
          erc721TokenFactory
            .connect(alice)
            .setERC721TokenImplAddress(newERC721TokenImpl.address)
        ).to.be.revertedWith("Ownable: caller is not the owner");
      });

      it("Should revert if ERC721TokenNativeGaslessMintFactory owner tries to setERC721TokenImplAddress() to zero address", async function () {
        // Try to change erc721TokenImpl impl address to zero address
        await expect(
          erc721TokenFactory.setERC721TokenImplAddress(ZERO_ADDRESS)
        ).to.be.revertedWith("InvalidAddress");
      });
    });

    describe("setERC721SoulboundTokenImplAddress()", () => {
      it("Should allow ERC721TokenNativeGaslessMintFactory owner to setERC721SoulboundTokenImplAddress()", async function () {
        // Deploy a new ERC721SoulboundTokenImpl logic contract
        const ERC721SoulboundTokenImpl = await ethers.getContractFactory(
          "ERC721SoulboundTokenImpl"
        );
        let newERC721SoulboundTokenImpl = await ERC721SoulboundTokenImpl.deploy(
          MINT_FEE,
          SPONSORED_MINT_FEE,
          MINT_FEE_RECIPIENT,
          protocolRewards.address
        );

        // Change erc721SoulboundTokenImpl impl address
        await erc721TokenFactory.setERC721SoulboundTokenImplAddress(
          newERC721SoulboundTokenImpl.address
        );

        expect(await erc721TokenFactory.erc721SoulboundTokenImpl()).to.equal(
          newERC721SoulboundTokenImpl.address
        );
      });

      it("Should emit ERC721SoulboundTokenImplSet() on setERC721SoulboundTokenImplAddress()", async function () {
        const erc721TokenImplBefore =
          await erc721TokenFactory.erc721SoulboundTokenImpl();

        // Deploy a new ERC721SoulboundTokenImpl logic contract
        const ERC721SoulboundTokenImpl = await ethers.getContractFactory(
          "ERC721SoulboundTokenImpl"
        );
        let newERC721SoulboundTokenImpl = await ERC721SoulboundTokenImpl.deploy(
          MINT_FEE,
          SPONSORED_MINT_FEE,
          MINT_FEE_RECIPIENT,
          protocolRewards.address
        );

        await expect(
          erc721TokenFactory.setERC721SoulboundTokenImplAddress(
            newERC721SoulboundTokenImpl.address
          )
        )
          .to.emit(erc721TokenFactory, "ERC721SoulboundTokenImplSet")
          .withArgs(erc721TokenImplBefore, newERC721SoulboundTokenImpl.address);
      });

      it("Should revert if non-ERC721TokenNativeGaslessMintFactory-owner tries to setERC721SoulboundTokenImplAddress()", async function () {
        // Deploy a new ERC721SoulboundTokenImpl logic contract
        const ERC721SoulboundTokenImpl = await ethers.getContractFactory(
          "ERC721SoulboundTokenImpl"
        );
        let newERC721SoulboundTokenImpl = await ERC721SoulboundTokenImpl.deploy(
          MINT_FEE,
          SPONSORED_MINT_FEE,
          MINT_FEE_RECIPIENT,
          protocolRewards.address
        );

        // Try to change erc721SoulboundTokenImpl impl address as user
        await expect(
          erc721TokenFactory
            .connect(alice)
            .setERC721SoulboundTokenImplAddress(
              newERC721SoulboundTokenImpl.address
            )
        ).to.be.revertedWith("Ownable: caller is not the owner");
      });

      it("Should revert if ERC721TokenNativeGaslessMintFactory owner tries to setERC721SoulboundTokenImplAddress() to zero address", async function () {
        // Try to change erc721SoulboundTokenImpl impl address to zero address
        await expect(
          erc721TokenFactory.setERC721SoulboundTokenImplAddress(ZERO_ADDRESS)
        ).to.be.revertedWith("InvalidAddress");
      });
    });

    describe("setERC721TokenNativeGaslessMintImplAddress()", () => {
      it("Should allow ERC721TokenNativeGaslessMintFactory owner to setERC721TokenNativeGaslessMintImplAddress()", async function () {
        // Deploy a new ERC721TokenNativeGaslessMintImpl logic contract
        const ERC721TokenNativeGaslessMintImpl =
          await ethers.getContractFactory("ERC721TokenNativeGaslessMintImpl");
        let newERC721TokenNativeGaslessMint =
          await ERC721TokenNativeGaslessMintImpl.deploy();

        // Change erc721TokenNativeGaslessMintImpl impl address
        await erc721TokenFactory.setERC721TokenNativeGaslessMintImplAddress(
          newERC721TokenNativeGaslessMint.address
        );

        expect(
          await erc721TokenFactory.erc721TokenNativeGaslessMintImpl()
        ).to.equal(newERC721TokenNativeGaslessMint.address);
      });

      it("Should emit ERC721TokenNativeGaslessMintSet() on setERC721TokenNativeGaslessMintImplAddress()", async function () {
        const erc721TokenNativeGaslessMintImplBefore =
          await erc721TokenFactory.erc721TokenNativeGaslessMintImpl();

        // Deploy a new ERC721TokenNativeGaslessMintImpl logic contract
        const ERC721TokenNativeGaslessMintImpl =
          await ethers.getContractFactory("ERC721TokenNativeGaslessMintImpl");
        let newERC721TokenNativeGaslessMint =
          await ERC721TokenNativeGaslessMintImpl.deploy();

        await expect(
          erc721TokenFactory.setERC721TokenNativeGaslessMintImplAddress(
            newERC721TokenNativeGaslessMint.address
          )
        )
          .to.emit(erc721TokenFactory, "ERC721TokenNativeGaslessMintImplSet")
          .withArgs(
            erc721TokenNativeGaslessMintImplBefore,
            newERC721TokenNativeGaslessMint.address
          );
      });

      it("Should revert if non-ERC721TokenNativeGaslessMintFactory-owner tries to setERC721TokenNativeGaslessMintImplAddress()", async function () {
        // Deploy a new ERC721TokenNativeGaslessMintImpl logic contract
        const ERC721TokenNativeGaslessMintImpl =
          await ethers.getContractFactory("ERC721TokenNativeGaslessMintImpl");
        let newERC721TokenNativeGaslessMint =
          await ERC721TokenNativeGaslessMintImpl.deploy();

        // Try to change erc721TokenNativeGaslessMintImpl impl address as user
        await expect(
          erc721TokenFactory
            .connect(alice)
            .setERC721TokenNativeGaslessMintImplAddress(
              newERC721TokenNativeGaslessMint.address
            )
        ).to.be.revertedWith("Ownable: caller is not the owner");
      });

      it("Should revert if ERC721TokenNativeGaslessMintFactory owner tries to setERC721TokenNativeGaslessMintImplAddress() to zero address", async function () {
        // Try to change erc721TokenNativeGaslessMintImpl impl address to zero address
        await expect(
          erc721TokenFactory.setERC721TokenNativeGaslessMintImplAddress(
            ZERO_ADDRESS
          )
        ).to.be.revertedWith("InvalidAddress");
      });
    });

    describe("setERC721SoulboundTokenNativeGaslessMintImplAddress()", () => {
      it("Should allow ERC721TokenNativeGaslessMintFactory owner to setERC721SoulboundTokenNativeGaslessMintImplAddress()", async function () {
        // Deploy a new ERC721SoulboundTokenNativeGaslessMintImpl logic contract
        const ERC721SoulboundTokenNativeGaslessMintImpl =
          await ethers.getContractFactory(
            "ERC721SoulboundTokenNativeGaslessMintImpl"
          );
        let newERC721SoulboundTokenNativeGaslessMintImpl =
          await ERC721SoulboundTokenNativeGaslessMintImpl.deploy();

        // Change erc721SoulboundTokenNativeGaslessMintImpl impl address
        await erc721TokenFactory.setERC721SoulboundTokenNativeGaslessMintImplAddress(
          newERC721SoulboundTokenNativeGaslessMintImpl.address
        );

        expect(
          await erc721TokenFactory.erc721SoulboundTokenNativeGaslessMintImpl()
        ).to.equal(newERC721SoulboundTokenNativeGaslessMintImpl.address);
      });

      it("Should emit ERC721SoulboundTokenNativeGaslessMintImplSet() on setERC721SoulboundTokenNativeGaslessMintImplAddress()", async function () {
        const erc721SoulboundTokenNativeGaslessMintImplBefore =
          await erc721TokenFactory.erc721SoulboundTokenNativeGaslessMintImpl();

        // Deploy a new ERC721SoulboundTokenNativeGaslessMintImpl logic contract
        const ERC721SoulboundTokenNativeGaslessMintImpl =
          await ethers.getContractFactory(
            "ERC721SoulboundTokenNativeGaslessMintImpl"
          );
        let newERC721SoulboundTokenNativeGaslessMintImpl =
          await ERC721SoulboundTokenNativeGaslessMintImpl.deploy();

        await expect(
          erc721TokenFactory.setERC721SoulboundTokenNativeGaslessMintImplAddress(
            newERC721SoulboundTokenNativeGaslessMintImpl.address
          )
        )
          .to.emit(
            erc721TokenFactory,
            "ERC721SoulboundTokenNativeGaslessMintImplSet"
          )
          .withArgs(
            erc721SoulboundTokenNativeGaslessMintImplBefore,
            newERC721SoulboundTokenNativeGaslessMintImpl.address
          );
      });

      it("Should revert if non-ERC721TokenNativeGaslessMintFactory-owner tries to setERC721SoulboundTokenNativeGaslessMintImplAddress()", async function () {
        // Deploy a new ERC721SoulboundTokenNativeGaslessMintImpl logic contract
        const ERC721SoulboundTokenNativeGaslessMintImpl =
          await ethers.getContractFactory(
            "ERC721SoulboundTokenNativeGaslessMintImpl"
          );
        let newERC721SoulboundTokenNativeGaslessMintImpl =
          await ERC721SoulboundTokenNativeGaslessMintImpl.deploy();

        // Try to change erc721SoulboundTokenNativeGaslessMintImpl impl address as user
        await expect(
          erc721TokenFactory
            .connect(alice)
            .setERC721SoulboundTokenNativeGaslessMintImplAddress(
              newERC721SoulboundTokenNativeGaslessMintImpl.address
            )
        ).to.be.revertedWith("Ownable: caller is not the owner");
      });

      it("Should revert if ERC721TokenNativeGaslessMintFactory owner tries to setERC721SoulboundTokenNativeGaslessMintImplAddress() to zero address", async function () {
        // Try to change erc721SoulboundTokenNativeGaslessMintImpl impl address to zero address
        await expect(
          erc721TokenFactory.setERC721SoulboundTokenNativeGaslessMintImplAddress(
            ZERO_ADDRESS
          )
        ).to.be.revertedWith("InvalidAddress");
      });
    });
  });

  describe("ERC721TokenImpl", async function () {
    describe("deploy", async function () {
      it("Should deploy ERC721TokenImpl logic contract", async function () {
        // Deploy ERC721TokenImpl logic contract
        const ERC721TokenImpl = await ethers.getContractFactory(
          "ERC721TokenImpl"
        );
        await ERC721TokenImpl.deploy(
          MINT_FEE,
          SPONSORED_MINT_FEE,
          MINT_FEE_RECIPIENT,
          protocolRewards.address
        );
      });
    });

    describe("initialize()", async function () {
      it("Should revert if anyone tries to initialize() after deployment", async function () {
        // Deploy ERC721TokenImpl logic contract
        const ERC721TokenImpl = await ethers.getContractFactory(
          "ERC721TokenImpl"
        );
        let erc721TokenImpl = await ERC721TokenImpl.deploy(
          MINT_FEE,
          SPONSORED_MINT_FEE,
          MINT_FEE_RECIPIENT,
          protocolRewards.address
        );

        // Try calling initialize
        await expect(
          erc721TokenImpl.initialize(
            encodeInitializationDataWithSponsoredMints([
              "TestToken",
              "TEST",
              "https://example.com/contractURI",
              "https://example.com",
              owner.address,
              trustedAddress.address,
              10,
              0,
            ])
          )
        ).to.be.revertedWith("Initializable: contract is already initialized");
      });

      it("should initialize with custom name and symbol", async () => {
        expect(await erc721.MINT_FEE()).to.eq(MINT_FEE);
        expect(await erc721.MINT_FEE_RECIPIENT()).to.eq(MINT_FEE_RECIPIENT);
        expect(await erc721.name()).to.eq("TestToken");
        expect(await erc721.symbol()).to.eq("TEST");
        expect(await erc721.maxSupply()).to.eq(10);
        expect(await erc721.sponsoredMints()).to.eq(0);
        expect(await erc721.maxSponsoredMints()).to.eq(0);
        expect(await erc721.contractURI()).to.eq(
          "https://example.com/contractURI"
        );
        expect(await erc721.tokenURI(1)).to.eq("https://example.com");
        expect(await erc721.nextTokenId()).to.eq(1);
        expect(await erc721.owner()).to.eq(alice.address);
      });

      it("should not allow initializing with empty trusted address", async () => {
        await expect(
          erc721TokenFactory.deployERC721Token(
            TokenType.ERC721Token,
            encodeInitializationDataWithSponsoredMints([
              "TestToken",
              "TEST",
              "https://example.com/contractURI",
              "https://example.com",
              alice.address,
              ZERO_ADDRESS,
              10,
              0,
            ]),
            +new Date()
          )
        ).to.be.revertedWith("InvalidAddress");
      });

      describe("sponsoredMints", () => {
        it("Should revert if sponsoredMints > maxSupply", async function () {
          // Deploy new ERC721Token via ERC721TokenFactory
          await expect(
            erc721TokenFactory
              .connect(alice)
              .deployERC721Token(
                TokenType.ERC721Token,
                encodeInitializationDataWithSponsoredMints([
                  "TestToken",
                  "TEST",
                  "https://example.com/contractURI",
                  "https://example.com",
                  alice.address,
                  trustedAddress.address,
                  10,
                  11,
                ]),
                +new Date()
              )
          ).to.be.revertedWith("ExceedsMaxSupply");
        });

        it("Should revert if sponsoredMints fee is not paid", async function () {
          // Deploy new ERC721Token via ERC721TokenFactory
          await expect(
            erc721TokenFactory
              .connect(alice)
              .deployERC721Token(
                TokenType.ERC721Token,
                encodeInitializationDataWithSponsoredMints([
                  "TestToken",
                  "TEST",
                  "https://example.com/contractURI",
                  "https://example.com",
                  alice.address,
                  trustedAddress.address,
                  10,
                  5,
                ]),
                +new Date()
              )
          ).to.be.revertedWith("InvalidFee");
        });

        it("Should transfer sponsoredMints fee", async function () {
          await expect(() =>
            erc721TokenFactory
              .connect(alice)
              .deployERC721Token(
                TokenType.ERC721Token,
                encodeInitializationDataWithSponsoredMints([
                  "TestToken",
                  "TEST",
                  "https://example.com/contractURI",
                  "https://example.com",
                  alice.address,
                  trustedAddress.address,
                  10,
                  5,
                ]),
                +new Date(),
                { value: SPONSORED_MINT_FEE.mul(5) }
              )
          ).to.changeEtherBalances(
            [alice, new VoidSigner(MINT_FEE_RECIPIENT, ethers.provider)],
            [SPONSORED_MINT_FEE.mul(5).mul(-1), SPONSORED_MINT_FEE.mul(5)]
          );
        });

        it("Should not transfer sponsoredMints fee if its 0", async function () {
          await expect(() =>
            erc721TokenFactory
              .connect(alice)
              .deployERC721Token(
                TokenType.ERC721Token,
                encodeInitializationDataWithSponsoredMints([
                  "TestToken",
                  "TEST",
                  "https://example.com/contractURI",
                  "https://example.com",
                  alice.address,
                  trustedAddress.address,
                  10,
                  0,
                ]),
                +new Date()
              )
          ).to.changeEtherBalances(
            [alice, new VoidSigner(MINT_FEE_RECIPIENT, ethers.provider)],
            [0, 0]
          );
        });

        it("Should emit SponsoredMintFeesPaid()", async function () {
          const _saltNonce = +new Date();
          const erc721Address = await erc721TokenFactory
            .connect(alice)
            .callStatic.deployERC721Token(
              TokenType.ERC721Token,
              encodeInitializationDataWithSponsoredMints([
                "TestToken",
                "TEST",
                "https://example.com/contractURI",
                "https://example.com",
                alice.address,
                trustedAddress.address,
                10,
                5,
              ]),
              _saltNonce,
              { value: SPONSORED_MINT_FEE.mul(5) }
            );
          await expect(
            erc721TokenFactory
              .connect(alice)
              .deployERC721Token(
                TokenType.ERC721Token,
                encodeInitializationDataWithSponsoredMints([
                  "TestToken",
                  "TEST",
                  "https://example.com/contractURI",
                  "https://example.com",
                  alice.address,
                  trustedAddress.address,
                  10,
                  5,
                ]),
                _saltNonce,
                { value: SPONSORED_MINT_FEE.mul(5) }
              )
          )
            .to.emit(
              ERC721TokenImpl__factory.connect(erc721Address, alice),
              "SponsoredMintFeesPaid"
            )
            .withArgs(5, SPONSORED_MINT_FEE, MINT_FEE_RECIPIENT);
        });

        it("Should revert with TransferFailed() if sponsored mint fees payment fails", async () => {
          // Deploy RevertOnReceiveEther
          const RevertOnReceiveEther = await ethers.getContractFactory(
            "RevertOnReceiveEther"
          );
          const revertOnReceiveEther = await RevertOnReceiveEther.deploy();

          // Deploy factory, logics with RevertOnReceiveEther as MINT_FEE_RECIPIENT
          // Deploy ERC721TokenImpl logic contract
          const erc721Logic = await ERC721.deploy(
            MINT_FEE,
            SPONSORED_MINT_FEE,
            revertOnReceiveEther.address,
            protocolRewards.address
          );
          // Deploy ERC721SoulboundTokenImpl logic contract
          const erc721SoulboundLogic = await ERC721Soulbound.deploy(
            MINT_FEE,
            SPONSORED_MINT_FEE,
            revertOnReceiveEther.address,
            protocolRewards.address
          );
          const ERC721TokenFactory = await ethers.getContractFactory(
            "ERC721TokenNativeGaslessMintFactory"
          );
          const erc721TokenFactory = await ERC721TokenFactory.connect(
            owner
          ).deploy(
            erc721Logic.address,
            erc721SoulboundLogic.address,
            erc721TokenNativeGaslessMintLogic.address,
            erc721SoulboundTokenNativeGaslessMintLogic.address
          );
          // Deploy new ERC721Token via ERC721TokenFactory
          await expect(
            erc721TokenFactory
              .connect(alice)
              .deployERC721Token(
                TokenType.ERC721Token,
                encodeInitializationDataWithSponsoredMints([
                  "TestToken",
                  "TEST",
                  "https://example.com/contractURI",
                  "https://example.com",
                  alice.address,
                  trustedAddress.address,
                  10,
                  5,
                ]),
                +new Date(),
                { value: SPONSORED_MINT_FEE.mul(5) }
              )
          ).to.be.revertedWith("TransferFailed");
        });
      });
    });

    describe("mint()", async function () {
      describe("signature", async function () {
        it("should allow minting with a trusted address - msg.sender == to", async () => {
          const { v, r, s } = await ERC721_generateSignature(
            erc721,
            trustedAddress,
            bob.address
          );

          expect((await erc721.balanceOf(bob.address)).toNumber()).to.eq(0);
          expect(await erc721.nextTokenId()).to.eq(1);
          await expect(erc721.ownerOf(1)).to.be.revertedWith(
            "ERC721: invalid token ID"
          );
          expect(await erc721.claims(bob.address)).to.eq(0);

          await erc721
            .connect(bob)
            .mint(bob.address, r, s, v, ethers.constants.AddressZero, {
              value: MINT_FEE,
            });

          expect((await erc721.balanceOf(bob.address)).toNumber()).to.eq(1);
          expect(await erc721.nextTokenId()).to.eq(2);
          expect(await erc721.ownerOf(1)).to.eq(bob.address);
          expect(await erc721.claims(bob.address)).to.eq(1);
        });

        it("should allow minting with a trusted address - msg.sender != to", async () => {
          const { v, r, s } = await ERC721_generateSignature(
            erc721,
            trustedAddress,
            charlie.address // signature for charlie
          );

          expect((await erc721.balanceOf(charlie.address)).toNumber()).to.eq(0);
          expect(await erc721.nextTokenId()).to.eq(1);
          await expect(erc721.ownerOf(1)).to.be.revertedWith(
            "ERC721: invalid token ID"
          );
          expect(await erc721.claims(charlie.address)).to.eq(0);

          // bob mints for charlie
          await erc721
            .connect(bob)
            .mint(charlie.address, r, s, v, ethers.constants.AddressZero, {
              value: MINT_FEE,
            });

          // nft transferred to charlie, not bob
          expect((await erc721.balanceOf(bob.address)).toNumber()).to.eq(0);
          expect((await erc721.balanceOf(charlie.address)).toNumber()).to.eq(1);
          expect(await erc721.nextTokenId()).to.eq(2);
          expect(await erc721.ownerOf(1)).to.eq(charlie.address);
          // claimer should still be charlie, not bob
          expect(await erc721.claims(charlie.address)).to.eq(1);
          expect(await erc721.claims(bob.address)).to.eq(0);
        });

        it("should revert if signature is not for `to` - msg.sender == to", async () => {
          const { v, r, s } = await ERC721_generateSignature(
            erc721,
            trustedAddress,
            charlie.address // signature for charlie
          );

          expect((await erc721.balanceOf(bob.address)).toNumber()).to.eq(0);
          expect(await erc721.nextTokenId()).to.eq(1);
          await expect(erc721.ownerOf(1)).to.be.revertedWith(
            "ERC721: invalid token ID"
          );
          expect(await erc721.claims(bob.address)).to.eq(0);
          expect(await erc721.getNonce(bob.address)).to.eq(0);

          // bob mints for bob
          await expect(
            erc721
              .connect(bob)
              .mint(bob.address, r, s, v, ethers.constants.AddressZero)
          ).to.be.reverted;
        });

        it("should revert if signature is not for `to` - msg.sender != to", async () => {
          const { v, r, s } = await ERC721_generateSignature(
            erc721,
            trustedAddress,
            bob.address // signature for bob
          );

          expect((await erc721.balanceOf(bob.address)).toNumber()).to.eq(0);
          expect(await erc721.nextTokenId()).to.eq(1);
          await expect(erc721.ownerOf(1)).to.be.revertedWith(
            "ERC721: invalid token ID"
          );
          expect(await erc721.claims(bob.address)).to.eq(0);
          expect(await erc721.getNonce(bob.address)).to.eq(0);

          // bob mints for charlie

          await expect(
            erc721
              .connect(bob)
              .mint(charlie.address, r, s, v, ethers.constants.AddressZero)
          ).to.be.reverted;
        });

        it("should reject on invalid signer - wrong trustedAddress", async () => {
          const { domain, types, value } = getEIP712TypedData({
            to: bob.address,
            contractAddress: erc721.address,
            chainId: hre.network.config.chainId as number,
            domainName: await erc721.name(),
            domainVersion: "1.0",
          });
          const rawSignature: string = await bob._signTypedData(
            domain,
            types,
            value
          );
          const { v, r, s } = ethers.utils.splitSignature(rawSignature);

          const sb = erc721.connect(bob);

          await expect(
            sb.mint(bob.address, r, s, v, ethers.constants.AddressZero, {
              value: MINT_FEE,
            })
          ).to.be.revertedWith("InvalidAddress");
          // try minting to another address
          await expect(
            sb.mint(charlie.address, r, s, v, ethers.constants.AddressZero, {
              value: MINT_FEE,
            })
          ).to.be.revertedWith("InvalidAddress");
        });

        it("should reject on signature used by someone else", async () => {
          const { domain, types, value } = getEIP712TypedData({
            to: bob.address, // signature meant to be used by `user`
            contractAddress: erc721.address,
            chainId: hre.network.config.chainId as number,
            domainName: await erc721.name(),
            domainVersion: "1.0",
          });
          const rawSignature: string = await trustedAddress._signTypedData(
            domain,
            types,
            value
          );
          const { v, r, s } = ethers.utils.splitSignature(rawSignature);

          // charlie tries minting to charlie with signature for `bob`
          const sb = erc721.connect(charlie);
          await expect(
            sb.mint(charlie.address, r, s, v, ethers.constants.AddressZero, {
              value: MINT_FEE,
            })
          ).to.be.revertedWith("InvalidAddress");
          // charlie tries minting to alice with signature for `bob`
          await expect(
            sb.mint(alice.address, r, s, v, ethers.constants.AddressZero, {
              value: MINT_FEE,
            })
          ).to.be.revertedWith("InvalidAddress");

          // charlie tries minting to bob with signature for `bob`, which should work
          // try minting to another address
          await sb.mint(bob.address, r, s, v, ethers.constants.AddressZero, {
            value: MINT_FEE,
          });
          // nft transferred to bob, not charlie
          expect((await erc721.balanceOf(charlie.address)).toNumber()).to.eq(0);
          expect((await erc721.balanceOf(bob.address)).toNumber()).to.eq(1);
          expect(await erc721.nextTokenId()).to.eq(2);
          expect(await erc721.ownerOf(1)).to.eq(bob.address);
          // claimer should be charlie, not bob
          expect(await erc721.claims(bob.address)).to.eq(1);
          expect(await erc721.claims(charlie.address)).to.eq(0);
          expect(await erc721.getNonce(charlie.address)).to.eq(0);
          expect(await erc721.getNonce(bob.address)).to.eq(0);
        });

        it("should revert on signature replay", async () => {
          // mint token 1 on contract A
          const deployERC721Token_A =
            await erc721TokenFactory.deployERC721Token(
              TokenType.ERC721Token,
              encodeInitializationDataWithSponsoredMints([
                "ERC721_A",
                "ERC721_A",
                "https://example.com/contractURI",
                "https://example.com",
                alice.address,
                trustedAddress.address,
                10,
                0,
              ]),
              +new Date()
            );
          const receipt_A = await deployERC721Token_A.wait();
          const erc721TokenCloneAddress_A = getArgFromEvent(
            erc721TokenFactory,
            receipt_A,
            erc721TokenFactory.interface.events[
              "ERC721TokenDeployed(uint8,address,address,address)"
            ].name,
            "_erc721TokenClone"
          );
          const erc721_A = await ethers.getContractAt(
            "ERC721TokenImpl",
            erc721TokenCloneAddress_A
          );
          const { domain, types, value } = getEIP712TypedData({
            to: bob.address,
            contractAddress: erc721_A.address,
            chainId: hre.network.config.chainId as number,
            domainName: "ERC721_A", // contract A name
            domainVersion: "1.0",
          });
          const rawSignature: string = await trustedAddress._signTypedData(
            domain,
            types,
            value
          );
          const { v, r, s } = ethers.utils.splitSignature(rawSignature);
          await erc721_A
            .connect(bob)
            .mint(bob.address, r, s, v, ethers.constants.AddressZero, {
              value: MINT_FEE,
            });

          // replay signature from contract A to mint from contract B
          const deployERC721Token_B =
            await erc721TokenFactory.deployERC721Token(
              TokenType.ERC721Token,
              encodeInitializationDataWithSponsoredMints([
                "ERC721_B",
                "ERC721_B",
                "https://example.com/contractURI",
                "https://example.com",
                alice.address,
                trustedAddress.address,
                10,
                0,
              ]),
              +new Date()
            );
          const receipt_B = await deployERC721Token_B.wait();
          const erc721TokenCloneAddress_B = getArgFromEvent(
            erc721TokenFactory,
            receipt_B,
            erc721TokenFactory.interface.events[
              "ERC721TokenDeployed(uint8,address,address,address)"
            ].name,
            "_erc721TokenClone"
          );
          const erc721_B = await ethers.getContractAt(
            "ERC721TokenImpl",
            erc721TokenCloneAddress_B
          );
          await expect(
            erc721_B
              .connect(bob)
              .mint(bob.address, r, s, v, ethers.constants.AddressZero, {
                value: MINT_FEE,
              })
          ).to.be.reverted;
          // try minting to another address
          await expect(
            erc721_B
              .connect(bob)
              .mint(charlie.address, r, s, v, ethers.constants.AddressZero, {
                value: MINT_FEE,
              })
          ).to.be.reverted;
        });
      });

      describe("mintFee", async function () {
        it("Should revert on mint() if correct fee not paid", async function () {
          const { v, r, s } = await ERC721_generateSignature(
            erc721,
            trustedAddress,
            bob.address
          );

          // zero fees
          await expect(
            erc721
              .connect(bob)
              .mint(bob.address, r, s, v, ethers.constants.AddressZero)
          ).to.be.revertedWith("InvalidFee");

          // less fees
          await expect(
            erc721
              .connect(bob)
              .mint(bob.address, r, s, v, ethers.constants.AddressZero, {
                value: MINT_FEE.sub(1),
              })
          ).to.be.revertedWith("InvalidFee");

          // more fees
          await expect(
            erc721
              .connect(bob)
              .mint(bob.address, r, s, v, ethers.constants.AddressZero, {
                value: MINT_FEE.add(1),
              })
          ).to.be.revertedWith("InvalidFee");
        });

        it("Should split and deposit rewards - no referrer", async () => {
          const { v, r, s } = await ERC721_generateSignature(
            erc721,
            trustedAddress,
            bob.address
          );

          await erc721
            .connect(bob)
            .mint(bob.address, r, s, v, ethers.constants.AddressZero, {
              value: MINT_FEE,
            });

          const rewardAmount = MINT_FEE;
          const expectedPlatformShare = rewardAmount
            .mul(PLATFORM_SHARE)
            .div(BASIS_POINTS)
            .add(rewardAmount.mul(REFERRER_SHARE).div(BASIS_POINTS));
          const expectedCreatorShare = rewardAmount
            .mul(CREATOR_SHARE)
            .div(BASIS_POINTS);
          const expectedReferrerShare = 0;

          const platform = MINT_FEE_RECIPIENT;
          const creator = await erc721.owner();
          const referrer = ethers.constants.AddressZero;

          expect(await protocolRewards.balanceOf(platform)).to.eq(
            expectedPlatformShare
          );
          expect(await protocolRewards.balanceOf(creator)).to.eq(
            expectedCreatorShare
          );
          expect(await protocolRewards.balanceOf(referrer)).to.eq(
            expectedReferrerShare
          );
        });

        it("Should split and deposit rewards - yes referrer", async () => {
          const { v, r, s } = await ERC721_generateSignature(
            erc721,
            trustedAddress,
            bob.address
          );

          await erc721
            .connect(bob)
            .mint(bob.address, r, s, v, referrer.address, {
              value: MINT_FEE,
            });

          const rewardAmount = MINT_FEE;
          const platform = MINT_FEE_RECIPIENT;
          const creator = await erc721.owner();
          const expectedPlatformShare = rewardAmount
            .mul(PLATFORM_SHARE)
            .div(BASIS_POINTS);
          const expectedCreatorShare = rewardAmount
            .mul(CREATOR_SHARE)
            .div(BASIS_POINTS);
          const expectedReferrerShare = rewardAmount
            .mul(REFERRER_SHARE)
            .div(BASIS_POINTS);

          expect(await protocolRewards.balanceOf(platform)).to.eq(
            expectedPlatformShare
          );
          expect(await protocolRewards.balanceOf(creator)).to.eq(
            expectedCreatorShare
          );
          expect(await protocolRewards.balanceOf(referrer.address)).to.eq(
            expectedReferrerShare
          );
        });

        it("Should emit MintFeePaid() on mint()", async () => {
          const { v, r, s } = await ERC721_generateSignature(
            erc721,
            trustedAddress,
            bob.address
          );

          await expect(
            erc721
              .connect(bob)
              .mint(bob.address, r, s, v, ethers.constants.AddressZero, {
                value: MINT_FEE,
              })
          )
            .to.emit(erc721, "MintFeePaid")
            .withArgs(
              MINT_FEE,
              bob.address,
              MINT_FEE_RECIPIENT,
              await erc721.owner(),
              ethers.constants.AddressZero
            );
        });
      });

      describe("sponsoredMints", () => {
        beforeEach(async () => {
          // Deploy new ERC721Token via ERC721TokenFactory
          const deployERC721Token = await erc721TokenFactory
            .connect(alice)
            .deployERC721Token(
              TokenType.ERC721Token,
              encodeInitializationDataWithSponsoredMints([
                "TestToken",
                "TEST",
                "https://example.com/contractURI",
                "https://example.com",
                alice.address,
                trustedAddress.address,
                10,
                3,
              ]),
              +new Date(),
              { value: SPONSORED_MINT_FEE.mul(3) }
            );
          const receipt = await deployERC721Token.wait();
          const erc721TokenCloneAddress = getArgFromEvent(
            erc721TokenFactory,
            receipt,
            erc721TokenFactory.interface.events[
              "ERC721TokenDeployed(uint8,address,address,address)"
            ].name,
            "_erc721TokenClone"
          );
          erc721 = await ethers.getContractAt(
            "ERC721TokenImpl",
            erc721TokenCloneAddress
          );
        });

        it("should charge mint fee for any mints if maxSponsoredMints = 0 ", async () => {
          // Deploy new ERC721Token via ERC721TokenFactory
          const deployERC721Token = await erc721TokenFactory
            .connect(alice)
            .deployERC721Token(
              TokenType.ERC721Token,
              encodeInitializationDataWithSponsoredMints([
                "TestToken",
                "TEST",
                "https://example.com/contractURI",
                "https://example.com",
                alice.address,
                trustedAddress.address,
                10,
                0,
              ]),
              +new Date()
            );
          const receipt = await deployERC721Token.wait();
          const erc721TokenCloneAddress = getArgFromEvent(
            erc721TokenFactory,
            receipt,
            erc721TokenFactory.interface.events[
              "ERC721TokenDeployed(uint8,address,address,address)"
            ].name,
            "_erc721TokenClone"
          );
          erc721 = await ethers.getContractAt(
            "ERC721TokenImpl",
            erc721TokenCloneAddress
          );

          const { v, r, s } = await ERC721_generateSignature(
            erc721,
            trustedAddress,
            bob.address
          );

          expect(await erc721.sponsoredMints()).to.eq(0);
          await erc721
            .connect(bob)
            .mint(bob.address, r, s, v, ethers.constants.AddressZero, {
              value: MINT_FEE,
            });
          expect(await erc721.sponsoredMints()).to.eq(0);

          const platform = MINT_FEE_RECIPIENT;
          const creator = await erc721.owner();
          const referrer = ethers.constants.AddressZero;

          const rewardAmount = MINT_FEE;
          const expectedPlatformShare = rewardAmount
            .mul(PLATFORM_SHARE)
            .div(BASIS_POINTS)
            .add(rewardAmount.mul(REFERRER_SHARE).div(BASIS_POINTS));
          const expectedCreatorShare = rewardAmount
            .mul(CREATOR_SHARE)
            .div(BASIS_POINTS);
          const expectedReferrerShare = 0;

          expect(await protocolRewards.balanceOf(platform)).to.eq(
            expectedPlatformShare
          );
          expect(await protocolRewards.balanceOf(creator)).to.eq(
            expectedCreatorShare
          );
          expect(await protocolRewards.balanceOf(referrer)).to.eq(
            expectedReferrerShare
          );
        });

        it("Should not charge mint fee sponsoredMints < maxSponsoredMints", async function () {
          const mint = async (user: SignerWithAddress, mintFee = true) => {
            const { v, r, s } = await ERC721_generateSignature(
              erc721,
              trustedAddress,
              user.address
            );
            return await erc721
              .connect(user)
              .mint(user.address, r, s, v, ethers.constants.AddressZero, {
                value: mintFee ? MINT_FEE : 0,
              });
          };

          const platform = MINT_FEE_RECIPIENT;
          const creator = await erc721.owner();
          const referrer = ethers.constants.AddressZero;

          expect(await erc721.sponsoredMints()).to.eq(0);
          await mint(bob, false);
          expect(await erc721.sponsoredMints()).to.eq(1);
          expect(await protocolRewards.balanceOf(platform)).to.eq(0);
          expect(await protocolRewards.balanceOf(creator)).to.eq(0);
          expect(await protocolRewards.balanceOf(referrer)).to.eq(0);

          await mint(charlie, false);
          expect(await erc721.sponsoredMints()).to.eq(2);
          expect(await protocolRewards.balanceOf(platform)).to.eq(0);
          expect(await protocolRewards.balanceOf(creator)).to.eq(0);
          expect(await protocolRewards.balanceOf(referrer)).to.eq(0);

          await mint(david, false);
          expect(await erc721.sponsoredMints()).to.eq(3);
          expect(await protocolRewards.balanceOf(platform)).to.eq(0);
          expect(await protocolRewards.balanceOf(creator)).to.eq(0);
          expect(await protocolRewards.balanceOf(referrer)).to.eq(0);

          const rewardAmount = MINT_FEE;
          const expectedPlatformShare = rewardAmount
            .mul(PLATFORM_SHARE)
            .div(BASIS_POINTS)
            .add(rewardAmount.mul(REFERRER_SHARE).div(BASIS_POINTS));
          const expectedCreatorShare = rewardAmount
            .mul(CREATOR_SHARE)
            .div(BASIS_POINTS);
          const expectedReferrerShare = 0;

          await mint(eve, true);
          expect(await erc721.sponsoredMints()).to.eq(3);
          expect(await protocolRewards.balanceOf(platform)).to.eq(
            expectedPlatformShare
          );
          expect(await protocolRewards.balanceOf(creator)).to.eq(
            expectedCreatorShare
          );
          expect(await protocolRewards.balanceOf(referrer)).to.eq(
            expectedReferrerShare
          );
        });

        it("should revert if mint fee is paid even for sponsored mint", async () => {
          const { v, r, s } = await ERC721_generateSignature(
            erc721,
            trustedAddress,
            bob.address
          );

          await expect(
            erc721
              .connect(bob)
              .mint(bob.address, r, s, v, ethers.constants.AddressZero, {
                value: MINT_FEE,
              })
          ).to.be.revertedWith("InvalidFee");
        });
      });

      it("should revert if to == referrer", async () => {
        const { v, r, s } = await ERC721_generateSignature(
          erc721,
          trustedAddress,
          bob.address
        );

        await expect(
          erc721
            .connect(bob)
            .mint(bob.address, r, s, v, bob.address, { value: MINT_FEE })
        ).to.be.revertedWith("InvalidAddress");
      });

      it("should throw an error if minted past max supply", async () => {
        const deployERC721Token = await erc721TokenFactory.deployERC721Token(
          TokenType.ERC721Token,
          encodeInitializationDataWithSponsoredMints([
            "TestToken",
            "TEST",
            "https://example.com/contractURI",
            "https://example.com",
            alice.address,
            trustedAddress.address,
            1,
            0,
          ]), // only 1 maxSupply
          +new Date()
        );
        const receipt = await deployERC721Token.wait();
        const erc721TokenCloneAddress = getArgFromEvent(
          erc721TokenFactory,
          receipt,
          erc721TokenFactory.interface.events[
            "ERC721TokenDeployed(uint8,address,address,address)"
          ].name,
          "_erc721TokenClone"
        );
        erc721 = await ethers.getContractAt(
          "ERC721TokenImpl",
          erc721TokenCloneAddress
        );

        const mint = async (user: SignerWithAddress) => {
          const { v, r, s } = await ERC721_generateSignature(
            erc721,
            trustedAddress,
            user.address
          );
          await erc721
            .connect(user)
            .mint(user.address, r, s, v, ethers.constants.AddressZero, {
              value: MINT_FEE,
            });
        };
        await mint(bob);
        await expect(mint(charlie)).to.revertedWith("ExceedsMaxSupply");
      });

      it("should not allow claiming again", async () => {
        let { v, r, s } = await ERC721_generateSignature(
          erc721,
          trustedAddress,
          bob.address // signature for bob
        );

        // bob mints for bob
        const sb = erc721.connect(bob);
        await sb.mint(bob.address, r, s, v, ethers.constants.AddressZero, {
          value: MINT_FEE,
        });
        await expect(
          sb.mint(bob.address, r, s, v, ethers.constants.AddressZero, {
            value: MINT_FEE,
          })
        ).to.be.revertedWith("AlreadyClaimed");
        // charlie mints for bob
        const sb_charlie = erc721.connect(charlie);
        await expect(
          sb_charlie.mint(bob.address, r, s, v, ethers.constants.AddressZero)
        ).to.be.revertedWith("AlreadyClaimed");

        // Try latest signature
        ({ v, r, s } = await ERC721_generateSignature(
          erc721,
          trustedAddress,
          bob.address
        ));
        // bob mints for bob
        await expect(
          sb.mint(bob.address, r, s, v, ethers.constants.AddressZero, {
            value: MINT_FEE,
          })
        ).to.be.revertedWith("AlreadyClaimed");
        // charlie mints for bob
        await expect(
          sb_charlie.mint(bob.address, r, s, v, ethers.constants.AddressZero)
        ).to.be.revertedWith("AlreadyClaimed");
      });

      it("should prevent re-entrancy", async () => {
        const ReenterMint: ReenterMintWithReferrer__factory =
          await ethers.getContractFactory("ReenterMintWithReferrer");

        const reenterMint = await ReenterMint.deploy();
        let { v, r, s } = await ERC721_generateSignature(
          erc721,
          trustedAddress,
          reenterMint.address
        );

        // Since tokenId is not part of signature, no need to request signature from backend multiple times
        // And instead use the signature first generated
        // But it would still fail since it will try to mint the same tokenId
        // which is prohibited in ERC721
        // After moving the _safeMint() for CEI, it should now revert with AlreadyClaimed
        await expect(
          reenterMint.attack(erc721.address, r, s, v, { value: MINT_FEE })
        ).to.be.revertedWith("ReentrancyGuard: reentrant call");
      });
    });

    describe("increaseMaxSponsoredMints()", () => {
      beforeEach(async () => {
        // Deploy new ERC721Token via ERC721TokenFactory
        const deployERC721Token = await erc721TokenFactory
          .connect(alice)
          .deployERC721Token(
            TokenType.ERC721Token,
            encodeInitializationDataWithSponsoredMints([
              "TestToken",
              "TEST",
              "https://example.com/contractURI",
              "https://example.com",
              alice.address,
              trustedAddress.address,
              10,
              3,
            ]),
            +new Date(),
            { value: SPONSORED_MINT_FEE.mul(3) }
          );
        const receipt = await deployERC721Token.wait();
        const erc721TokenCloneAddress = getArgFromEvent(
          erc721TokenFactory,
          receipt,
          erc721TokenFactory.interface.events[
            "ERC721TokenDeployed(uint8,address,address,address)"
          ].name,
          "_erc721TokenClone"
        );
        erc721 = await ethers.getContractAt(
          "ERC721TokenImpl",
          erc721TokenCloneAddress
        );
      });

      it("should revert if maxSponsoredMints > maxSupply", async () => {
        await expect(
          erc721.connect(alice).increaseMaxSponsoredMints(8, {
            value: SPONSORED_MINT_FEE.mul(8),
          }) // 3 + 8 = 11 > 10
        ).to.be.revertedWith("ExceedsMaxSupply");
      });

      it("should increase maxSponsoredMints", async () => {
        expect(await erc721.sponsoredMints()).to.eq(0);
        expect(await erc721.maxSponsoredMints()).to.eq(3);
        await erc721.connect(alice).increaseMaxSponsoredMints(2, {
          value: SPONSORED_MINT_FEE.mul(2),
        });
        expect(await erc721.sponsoredMints()).to.eq(0);
        expect(await erc721.maxSponsoredMints()).to.eq(5);
      });

      it("should emit SponsoredMintFeesPaid()", async () => {
        await expect(
          erc721
            .connect(alice)
            .increaseMaxSponsoredMints(2, { value: SPONSORED_MINT_FEE.mul(2) })
        )
          .to.emit(erc721, "SponsoredMintFeesPaid")
          .withArgs(2, SPONSORED_MINT_FEE, MINT_FEE_RECIPIENT);
      });

      it("should transfer sponsoredMints fee", async () => {
        await expect(() =>
          erc721
            .connect(alice)
            .increaseMaxSponsoredMints(2, { value: SPONSORED_MINT_FEE.mul(2) })
        ).to.changeEtherBalances(
          [alice, new VoidSigner(MINT_FEE_RECIPIENT, ethers.provider)],
          [SPONSORED_MINT_FEE.mul(2).mul(-1), SPONSORED_MINT_FEE.mul(2)]
        );
      });

      it("should allow increasing maxSponsoredMints in between mints", async () => {
        const mint = async (user: SignerWithAddress, mintFee = true) => {
          const { v, r, s } = await ERC721_generateSignature(
            erc721,
            trustedAddress,
            user.address
          );
          return await erc721
            .connect(user)
            .mint(user.address, r, s, v, ethers.constants.AddressZero, {
              value: mintFee ? MINT_FEE : 0,
            });
        };

        await mint(bob, false);
        await mint(charlie, false);
        await mint(david, false);
        expect(await erc721.sponsoredMints()).to.eq(3);
        expect(await erc721.maxSponsoredMints()).to.eq(3);

        await mint(eve, true);
        expect(await erc721.sponsoredMints()).to.eq(3);
        expect(await erc721.maxSponsoredMints()).to.eq(3);

        await erc721.connect(alice).increaseMaxSponsoredMints(2, {
          value: SPONSORED_MINT_FEE.mul(2),
        });

        await mint(frank, false);
        expect(await erc721.sponsoredMints()).to.eq(4);
        expect(await erc721.maxSponsoredMints()).to.eq(5);

        await mint(george, false);
        expect(await erc721.sponsoredMints()).to.eq(5);
        expect(await erc721.maxSponsoredMints()).to.eq(5);

        await mint(harry, true);
        expect(await erc721.sponsoredMints()).to.eq(5);
        expect(await erc721.maxSponsoredMints()).to.eq(5);
      });
    });

    it("should be compatible with ERC165, ERC721 and ERC721Metadata", async () => {
      for (const id of ["0x01ffc9a7", "0x80ac58cd", "0x5b5e139f"]) {
        expect(await erc721.supportsInterface(id)).to.eq(true);
      }
    });

    describe("Meta Transactions", () => {
      describe("mint()", async function () {
        describe("signature", async function () {
          it("should allow minting with a trusted address - msgSender() == to", async () => {
            const { v, r, s } = await ERC721_generateSignature(
              erc721,
              trustedAddress,
              bob.address
            );

            expect((await erc721.balanceOf(bob.address)).toNumber()).to.eq(0);
            expect(await erc721.nextTokenId()).to.eq(1);
            await expect(erc721.ownerOf(1)).to.be.revertedWith(
              "ERC721: invalid token ID"
            );
            expect(await erc721.claims(bob.address)).to.eq(0);

            const [
              functionSignature,
              { r: metaTxnR, s: metaTxnS, v: metaTxnV },
            ] = await prepareNativeMetaTxnSignatureWithReferrer(erc721, bob, {
              to: bob.address,
              r,
              s,
              v,
              referrer: ethers.constants.AddressZero,
            });

            await erc721
              .connect(relayer)
              .executeMetaTransaction(
                bob.address,
                functionSignature,
                metaTxnR,
                metaTxnS,
                metaTxnV,
                { value: MINT_FEE }
              );

            expect((await erc721.balanceOf(bob.address)).toNumber()).to.eq(1);
            expect(await erc721.nextTokenId()).to.eq(2);
            expect(await erc721.ownerOf(1)).to.eq(bob.address);
            expect(await erc721.claims(bob.address)).to.eq(1);
          });

          it("should allow minting with a trusted address - msgSender() != to", async () => {
            const { v, r, s } = await ERC721_generateSignature(
              erc721,
              trustedAddress,
              charlie.address // signature for charlie
            );

            expect((await erc721.balanceOf(charlie.address)).toNumber()).to.eq(
              0
            );
            expect(await erc721.nextTokenId()).to.eq(1);
            await expect(erc721.ownerOf(1)).to.be.revertedWith(
              "ERC721: invalid token ID"
            );
            expect(await erc721.claims(charlie.address)).to.eq(0);

            // bob mints for charlie
            const [
              functionSignature,
              { r: metaTxnR, s: metaTxnS, v: metaTxnV },
            ] = await prepareNativeMetaTxnSignatureWithReferrer(erc721, bob, {
              to: charlie.address,
              r,
              s,
              v,
              referrer: ethers.constants.AddressZero,
            });

            await erc721
              .connect(relayer)
              .executeMetaTransaction(
                bob.address,
                functionSignature,
                metaTxnR,
                metaTxnS,
                metaTxnV,
                { value: MINT_FEE }
              );

            // nft transferred to charlie, not bob
            expect((await erc721.balanceOf(bob.address)).toNumber()).to.eq(0);
            expect((await erc721.balanceOf(charlie.address)).toNumber()).to.eq(
              1
            );
            expect(await erc721.nextTokenId()).to.eq(2);
            expect(await erc721.ownerOf(1)).to.eq(charlie.address);
            // claimer should still be charlie, not bob
            expect(await erc721.claims(charlie.address)).to.eq(1);
            expect(await erc721.claims(bob.address)).to.eq(0);
          });

          it("should revert if signature is not for `to` - msgSender() == to", async () => {
            const { v, r, s } = await ERC721_generateSignature(
              erc721,
              trustedAddress,
              charlie.address // signature for charlie
            );

            expect((await erc721.balanceOf(bob.address)).toNumber()).to.eq(0);
            expect(await erc721.nextTokenId()).to.eq(1);
            await expect(erc721.ownerOf(1)).to.be.revertedWith(
              "ERC721: invalid token ID"
            );
            expect(await erc721.claims(bob.address)).to.eq(0);
            expect(await erc721.getNonce(bob.address)).to.eq(0);

            // bob mints for bob
            const [
              functionSignature,
              { r: metaTxnR, s: metaTxnS, v: metaTxnV },
            ] = await prepareNativeMetaTxnSignatureWithReferrer(erc721, bob, {
              to: bob.address,
              r,
              s,
              v,
              referrer: ethers.constants.AddressZero,
            });
            await expect(
              erc721
                .connect(relayer)
                .executeMetaTransaction(
                  bob.address,
                  functionSignature,
                  metaTxnR,
                  metaTxnS,
                  metaTxnV
                )
            ).to.be.reverted;
          });

          it("should revert if signature is not for `to` - msgSender() != to", async () => {
            const { v, r, s } = await ERC721_generateSignature(
              erc721,
              trustedAddress,
              bob.address // signature for bob
            );

            expect((await erc721.balanceOf(bob.address)).toNumber()).to.eq(0);
            expect(await erc721.nextTokenId()).to.eq(1);
            await expect(erc721.ownerOf(1)).to.be.revertedWith(
              "ERC721: invalid token ID"
            );
            expect(await erc721.claims(bob.address)).to.eq(0);
            expect(await erc721.getNonce(bob.address)).to.eq(0);

            // bob mints for charlie
            const [
              functionSignature,
              { r: metaTxnR, s: metaTxnS, v: metaTxnV },
            ] = await prepareNativeMetaTxnSignatureWithReferrer(erc721, bob, {
              to: charlie.address,
              r,
              s,
              v,
              referrer: ethers.constants.AddressZero,
            });
            await expect(
              erc721
                .connect(relayer)
                .executeMetaTransaction(
                  bob.address,
                  functionSignature,
                  metaTxnR,
                  metaTxnS,
                  metaTxnV
                )
            ).to.be.reverted;
          });

          it("should reject on invalid signer - wrong trustedAddress", async () => {
            const { domain, types, value } = getEIP712TypedData({
              to: bob.address,
              contractAddress: erc721.address,
              chainId: hre.network.config.chainId as number,
              domainName: await erc721.name(),
              domainVersion: "1.0",
            });
            const rawSignature: string = await bob._signTypedData(
              domain,
              types,
              value
            );
            const { v, r, s } = ethers.utils.splitSignature(rawSignature);

            let [functionSignature, { r: metaTxnR, s: metaTxnS, v: metaTxnV }] =
              await prepareNativeMetaTxnSignatureWithReferrer(erc721, bob, {
                to: bob.address,
                r,
                s,
                v,
                referrer: ethers.constants.AddressZero,
              });

            await expect(
              erc721
                .connect(relayer)
                .executeMetaTransaction(
                  bob.address,
                  functionSignature,
                  metaTxnR,
                  metaTxnS,
                  metaTxnV,
                  { value: MINT_FEE }
                )
            ).to.be.reverted;

            // try minting to another address
            [functionSignature, { r: metaTxnR, s: metaTxnS, v: metaTxnV }] =
              await prepareNativeMetaTxnSignatureWithReferrer(erc721, bob, {
                to: charlie.address,
                r,
                s,
                v,
                referrer: ethers.constants.AddressZero,
              });

            await expect(
              erc721
                .connect(relayer)
                .executeMetaTransaction(
                  bob.address,
                  functionSignature,
                  metaTxnR,
                  metaTxnS,
                  metaTxnV,
                  { value: MINT_FEE }
                )
            ).to.be.reverted;
          });

          it("should reject on signature used by someone else", async () => {
            const { domain, types, value } = getEIP712TypedData({
              to: bob.address, // signature meant to be used by `user`
              contractAddress: erc721.address,
              chainId: hre.network.config.chainId as number,
              domainName: await erc721.name(),
              domainVersion: "1.0",
            });
            const rawSignature: string = await trustedAddress._signTypedData(
              domain,
              types,
              value
            );
            const { v, r, s } = ethers.utils.splitSignature(rawSignature);

            // charlie tries minting to charlie with signature for `bob`
            let [functionSignature, { r: metaTxnR, s: metaTxnS, v: metaTxnV }] =
              await prepareNativeMetaTxnSignatureWithReferrer(erc721, charlie, {
                to: charlie.address,
                r,
                s,
                v,
                referrer: ethers.constants.AddressZero,
              });

            await expect(
              erc721
                .connect(relayer)
                .executeMetaTransaction(
                  charlie.address,
                  functionSignature,
                  metaTxnR,
                  metaTxnS,
                  metaTxnV,
                  { value: MINT_FEE }
                )
            ).to.be.reverted;

            // charlie tries minting to alice with signature for `bob`
            [functionSignature, { r: metaTxnR, s: metaTxnS, v: metaTxnV }] =
              await prepareNativeMetaTxnSignatureWithReferrer(erc721, bob, {
                to: alice.address,
                r,
                s,
                v,
                referrer: ethers.constants.AddressZero,
              });
            await expect(
              erc721
                .connect(relayer)
                .executeMetaTransaction(
                  charlie.address,
                  functionSignature,
                  metaTxnR,
                  metaTxnS,
                  metaTxnV,
                  { value: MINT_FEE }
                )
            ).to.be.reverted;

            // charlie tries minting to bob with signature for `bob`, which should work
            [functionSignature, { r: metaTxnR, s: metaTxnS, v: metaTxnV }] =
              await prepareNativeMetaTxnSignatureWithReferrer(erc721, charlie, {
                to: bob.address,
                r,
                s,
                v,
                referrer: ethers.constants.AddressZero,
              });

            await erc721
              .connect(relayer)
              .executeMetaTransaction(
                charlie.address,
                functionSignature,
                metaTxnR,
                metaTxnS,
                metaTxnV,
                { value: MINT_FEE }
              );

            // nft transferred to bob, not charlie
            expect((await erc721.balanceOf(charlie.address)).toNumber()).to.eq(
              0
            );
            expect((await erc721.balanceOf(bob.address)).toNumber()).to.eq(1);
            expect(await erc721.nextTokenId()).to.eq(2);
            expect(await erc721.ownerOf(1)).to.eq(bob.address);
            expect(await erc721.claims(bob.address)).to.eq(1);
            expect(await erc721.getNonce(charlie.address)).to.eq(1);
          });

          it("should revert on signature replay", async () => {
            // mint token 1 on contract A
            const deployERC721Token_A =
              await erc721TokenFactory.deployERC721Token(
                TokenType.ERC721Token,
                encodeInitializationDataWithSponsoredMints([
                  "ERC721_A",
                  "ERC721_A",
                  "https://example.com/contractURI",
                  "https://example.com",
                  alice.address,
                  trustedAddress.address,
                  10,
                  0,
                ]),
                +new Date()
              );
            const receipt_A = await deployERC721Token_A.wait();
            const erc721TokenCloneAddress_A = getArgFromEvent(
              erc721TokenFactory,
              receipt_A,
              erc721TokenFactory.interface.events[
                "ERC721TokenDeployed(uint8,address,address,address)"
              ].name,
              "_erc721TokenClone"
            );
            const erc721_A = await ethers.getContractAt(
              "ERC721TokenImpl",
              erc721TokenCloneAddress_A
            );
            const { domain, types, value } = getEIP712TypedData({
              to: bob.address,
              contractAddress: erc721_A.address,
              chainId: hre.network.config.chainId as number,
              domainName: "ERC721_A", // contract A name
              domainVersion: "1.0",
            });
            const rawSignature: string = await trustedAddress._signTypedData(
              domain,
              types,
              value
            );
            const { v, r, s } = ethers.utils.splitSignature(rawSignature);
            let [functionSignature, { r: metaTxnR, s: metaTxnS, v: metaTxnV }] =
              await prepareNativeMetaTxnSignatureWithReferrer(erc721_A, bob, {
                to: bob.address,
                r,
                s,
                v,
                referrer: ethers.constants.AddressZero,
              });

            await erc721_A
              .connect(relayer)
              .executeMetaTransaction(
                bob.address,
                functionSignature,
                metaTxnR,
                metaTxnS,
                metaTxnV,
                { value: MINT_FEE }
              );

            // replay signature from contract A to mint from contract B
            const deployERC721Token_B =
              await erc721TokenFactory.deployERC721Token(
                TokenType.ERC721Token,
                encodeInitializationDataWithSponsoredMints([
                  "ERC721_B",
                  "ERC721_B",
                  "https://example.com/contractURI",
                  "https://example.com",
                  alice.address,
                  trustedAddress.address,
                  10,
                  0,
                ]),
                +new Date()
              );
            const receipt_B = await deployERC721Token_B.wait();
            const erc721TokenCloneAddress_B = getArgFromEvent(
              erc721TokenFactory,
              receipt_B,
              erc721TokenFactory.interface.events[
                "ERC721TokenDeployed(uint8,address,address,address)"
              ].name,
              "_erc721TokenClone"
            );
            const erc721_B = await ethers.getContractAt(
              "ERC721TokenImpl",
              erc721TokenCloneAddress_B
            );
            await expect(
              erc721_B
                .connect(relayer)
                .executeMetaTransaction(
                  bob.address,
                  functionSignature,
                  metaTxnR,
                  metaTxnS,
                  metaTxnV,
                  { value: MINT_FEE }
                )
            ).to.be.reverted;

            // try minting to another address
            [functionSignature] =
              await prepareNativeMetaTxnSignatureWithReferrer(erc721_A, bob, {
                to: charlie.address,
                r,
                s,
                v,
                referrer: ethers.constants.AddressZero,
              });
            await expect(
              erc721_B
                .connect(relayer)
                .executeMetaTransaction(
                  bob.address,
                  functionSignature,
                  metaTxnR,
                  metaTxnS,
                  metaTxnV,
                  { value: MINT_FEE }
                )
            ).to.be.reverted;
          });
        });

        describe("mintFee", async function () {
          it("Should revert on mint() if correct fee not paid", async function () {
            const { v, r, s } = await ERC721_generateSignature(
              erc721,
              trustedAddress,
              bob.address
            );
            const [
              functionSignature,
              { r: metaTxnR, s: metaTxnS, v: metaTxnV },
            ] = await prepareNativeMetaTxnSignatureWithReferrer(erc721, bob, {
              to: bob.address,
              r,
              s,
              v,
              referrer: ethers.constants.AddressZero,
            });

            // zero fees
            await expect(
              erc721
                .connect(relayer)
                .executeMetaTransaction(
                  bob.address,
                  functionSignature,
                  metaTxnR,
                  metaTxnS,
                  metaTxnV
                )
            ).to.be.reverted;

            // less fees
            await expect(
              erc721
                .connect(relayer)
                .executeMetaTransaction(
                  bob.address,
                  functionSignature,
                  metaTxnR,
                  metaTxnS,
                  metaTxnV,
                  { value: MINT_FEE.sub(1) }
                )
            ).to.be.reverted;

            // more fees
            await expect(
              erc721
                .connect(relayer)
                .executeMetaTransaction(
                  bob.address,
                  functionSignature,
                  metaTxnR,
                  metaTxnS,
                  metaTxnV,
                  { value: MINT_FEE.add(1) }
                )
            ).to.be.reverted;
          });

          it("Should split and deposit rewards - no referrer", async () => {
            const { v, r, s } = await ERC721_generateSignature(
              erc721,
              trustedAddress,
              bob.address
            );
            const [
              functionSignature,
              { r: metaTxnR, s: metaTxnS, v: metaTxnV },
            ] = await prepareNativeMetaTxnSignatureWithReferrer(erc721, bob, {
              to: bob.address,
              r,
              s,
              v,
              referrer: ethers.constants.AddressZero,
            });

            await erc721
              .connect(relayer)
              .executeMetaTransaction(
                bob.address,
                functionSignature,
                metaTxnR,
                metaTxnS,
                metaTxnV,
                { value: MINT_FEE }
              );

            const rewardAmount = MINT_FEE;
            const expectedPlatformShare = rewardAmount
              .mul(PLATFORM_SHARE)
              .div(BASIS_POINTS)
              .add(rewardAmount.mul(REFERRER_SHARE).div(BASIS_POINTS));
            const expectedCreatorShare = rewardAmount
              .mul(CREATOR_SHARE)
              .div(BASIS_POINTS);
            const expectedReferrerShare = 0;

            const platform = MINT_FEE_RECIPIENT;
            const creator = await erc721.owner();
            const referrer = ethers.constants.AddressZero;

            expect(await protocolRewards.balanceOf(platform)).to.eq(
              expectedPlatformShare
            );
            expect(await protocolRewards.balanceOf(creator)).to.eq(
              expectedCreatorShare
            );
            expect(await protocolRewards.balanceOf(referrer)).to.eq(
              expectedReferrerShare
            );
          });

          it("Should split and deposit rewards - yes referrer", async () => {
            const { v, r, s } = await ERC721_generateSignature(
              erc721,
              trustedAddress,
              bob.address
            );
            const [
              functionSignature,
              { r: metaTxnR, s: metaTxnS, v: metaTxnV },
            ] = await prepareNativeMetaTxnSignatureWithReferrer(erc721, bob, {
              to: bob.address,
              r,
              s,
              v,
              referrer: referrer.address,
            });

            await erc721
              .connect(relayer)
              .executeMetaTransaction(
                bob.address,
                functionSignature,
                metaTxnR,
                metaTxnS,
                metaTxnV,
                { value: MINT_FEE }
              );

            const rewardAmount = MINT_FEE;
            const platform = MINT_FEE_RECIPIENT;
            const creator = await erc721.owner();
            const expectedPlatformShare = rewardAmount
              .mul(PLATFORM_SHARE)
              .div(BASIS_POINTS);
            const expectedCreatorShare = rewardAmount
              .mul(CREATOR_SHARE)
              .div(BASIS_POINTS);
            const expectedReferrerShare = rewardAmount
              .mul(REFERRER_SHARE)
              .div(BASIS_POINTS);

            expect(await protocolRewards.balanceOf(platform)).to.eq(
              expectedPlatformShare
            );
            expect(await protocolRewards.balanceOf(creator)).to.eq(
              expectedCreatorShare
            );
            expect(await protocolRewards.balanceOf(referrer.address)).to.eq(
              expectedReferrerShare
            );
          });

          it("Should emit MintFeePaid() on mint()", async () => {
            const { v, r, s } = await ERC721_generateSignature(
              erc721,
              trustedAddress,
              bob.address
            );
            const [
              functionSignature,
              { r: metaTxnR, s: metaTxnS, v: metaTxnV },
            ] = await prepareNativeMetaTxnSignatureWithReferrer(erc721, bob, {
              to: bob.address,
              r,
              s,
              v,
              referrer: ethers.constants.AddressZero,
            });

            await expect(
              erc721
                .connect(relayer)
                .executeMetaTransaction(
                  bob.address,
                  functionSignature,
                  metaTxnR,
                  metaTxnS,
                  metaTxnV,
                  { value: MINT_FEE }
                )
            )
              .to.emit(erc721, "MintFeePaid")
              .withArgs(
                MINT_FEE,
                bob.address,
                MINT_FEE_RECIPIENT,
                await erc721.owner(),
                ethers.constants.AddressZero
              );
          });
        });

        describe("sponsoredMints", () => {
          beforeEach(async () => {
            // Deploy new ERC721Token via ERC721TokenFactory
            const deployERC721Token = await erc721TokenFactory
              .connect(alice)
              .deployERC721Token(
                TokenType.ERC721Token,
                encodeInitializationDataWithSponsoredMints([
                  "TestToken",
                  "TEST",
                  "https://example.com/contractURI",
                  "https://example.com",
                  alice.address,
                  trustedAddress.address,
                  10,
                  3,
                ]),
                +new Date(),
                { value: SPONSORED_MINT_FEE.mul(3) }
              );
            const receipt = await deployERC721Token.wait();
            const erc721TokenCloneAddress = getArgFromEvent(
              erc721TokenFactory,
              receipt,
              erc721TokenFactory.interface.events[
                "ERC721TokenDeployed(uint8,address,address,address)"
              ].name,
              "_erc721TokenClone"
            );
            erc721 = await ethers.getContractAt(
              "ERC721TokenImpl",
              erc721TokenCloneAddress
            );
          });

          it("should charge mint fee for any mints if maxSponsoredMints = 0 ", async () => {
            // Deploy new ERC721Token via ERC721TokenFactory
            const deployERC721Token = await erc721TokenFactory
              .connect(alice)
              .deployERC721Token(
                TokenType.ERC721Token,
                encodeInitializationDataWithSponsoredMints([
                  "TestToken",
                  "TEST",
                  "https://example.com/contractURI",
                  "https://example.com",
                  alice.address,
                  trustedAddress.address,
                  10,
                  0,
                ]),
                +new Date()
              );
            const receipt = await deployERC721Token.wait();
            const erc721TokenCloneAddress = getArgFromEvent(
              erc721TokenFactory,
              receipt,
              erc721TokenFactory.interface.events[
                "ERC721TokenDeployed(uint8,address,address,address)"
              ].name,
              "_erc721TokenClone"
            );
            erc721 = await ethers.getContractAt(
              "ERC721TokenImpl",
              erc721TokenCloneAddress
            );

            const { v, r, s } = await ERC721_generateSignature(
              erc721,
              trustedAddress,
              bob.address
            );

            const [
              functionSignature,
              { r: metaTxnR, s: metaTxnS, v: metaTxnV },
            ] = await prepareNativeMetaTxnSignatureWithReferrer(erc721, bob, {
              to: bob.address,
              r,
              s,
              v,
              referrer: ethers.constants.AddressZero,
            });

            const platform = MINT_FEE_RECIPIENT;
            const creator = await erc721.owner();
            const referrer = ethers.constants.AddressZero;

            const rewardAmount = MINT_FEE;
            const expectedPlatformShare = rewardAmount
              .mul(PLATFORM_SHARE)
              .div(BASIS_POINTS)
              .add(rewardAmount.mul(REFERRER_SHARE).div(BASIS_POINTS));
            const expectedCreatorShare = rewardAmount
              .mul(CREATOR_SHARE)
              .div(BASIS_POINTS);
            const expectedReferrerShare = 0;

            expect(await erc721.sponsoredMints()).to.eq(0);
            await erc721
              .connect(relayer)
              .executeMetaTransaction(
                bob.address,
                functionSignature,
                metaTxnR,
                metaTxnS,
                metaTxnV,
                { value: MINT_FEE }
              );
            expect(await erc721.sponsoredMints()).to.eq(0);

            expect(await protocolRewards.balanceOf(platform)).to.eq(
              expectedPlatformShare
            );
            expect(await protocolRewards.balanceOf(creator)).to.eq(
              expectedCreatorShare
            );
            expect(await protocolRewards.balanceOf(referrer)).to.eq(
              expectedReferrerShare
            );
          });

          it("Should not charge mint fee sponsoredMints < maxSponsoredMints", async function () {
            const mint = async (user: SignerWithAddress, mintFee = true) => {
              const { v, r, s } = await ERC721_generateSignature(
                erc721,
                trustedAddress,
                user.address
              );

              const [
                functionSignature,
                { r: metaTxnR, s: metaTxnS, v: metaTxnV },
              ] = await prepareNativeMetaTxnSignatureWithReferrer(
                erc721,
                user,
                {
                  to: user.address,
                  r,
                  s,
                  v,
                  referrer: ethers.constants.AddressZero,
                }
              );

              return await erc721
                .connect(relayer)
                .executeMetaTransaction(
                  user.address,
                  functionSignature,
                  metaTxnR,
                  metaTxnS,
                  metaTxnV,
                  { value: mintFee ? MINT_FEE : 0 }
                );
            };

            const platform = MINT_FEE_RECIPIENT;
            const creator = await erc721.owner();
            const referrer = ethers.constants.AddressZero;

            expect(await erc721.sponsoredMints()).to.eq(0);
            await mint(bob, false);
            expect(await erc721.sponsoredMints()).to.eq(1);
            expect(await protocolRewards.balanceOf(platform)).to.eq(0);
            expect(await protocolRewards.balanceOf(creator)).to.eq(0);
            expect(await protocolRewards.balanceOf(referrer)).to.eq(0);

            await mint(charlie, false);
            expect(await erc721.sponsoredMints()).to.eq(2);
            expect(await protocolRewards.balanceOf(platform)).to.eq(0);
            expect(await protocolRewards.balanceOf(creator)).to.eq(0);
            expect(await protocolRewards.balanceOf(referrer)).to.eq(0);

            await mint(david, false);
            expect(await erc721.sponsoredMints()).to.eq(3);
            expect(await protocolRewards.balanceOf(platform)).to.eq(0);
            expect(await protocolRewards.balanceOf(creator)).to.eq(0);
            expect(await protocolRewards.balanceOf(referrer)).to.eq(0);

            const rewardAmount = MINT_FEE;
            const expectedPlatformShare = rewardAmount
              .mul(PLATFORM_SHARE)
              .div(BASIS_POINTS)
              .add(rewardAmount.mul(REFERRER_SHARE).div(BASIS_POINTS));
            const expectedCreatorShare = rewardAmount
              .mul(CREATOR_SHARE)
              .div(BASIS_POINTS);
            const expectedReferrerShare = 0;

            await mint(eve, true);
            expect(await erc721.sponsoredMints()).to.eq(3);
            expect(await protocolRewards.balanceOf(platform)).to.eq(
              expectedPlatformShare
            );
            expect(await protocolRewards.balanceOf(creator)).to.eq(
              expectedCreatorShare
            );
            expect(await protocolRewards.balanceOf(referrer)).to.eq(
              expectedReferrerShare
            );
          });

          it("should allow increasing maxSponsoredMints in between mints", async () => {
            const mint = async (user: SignerWithAddress, mintFee = true) => {
              const { v, r, s } = await ERC721_generateSignature(
                erc721,
                trustedAddress,
                user.address
              );

              const [
                functionSignature,
                { r: metaTxnR, s: metaTxnS, v: metaTxnV },
              ] = await prepareNativeMetaTxnSignatureWithReferrer(
                erc721,
                user,
                {
                  to: user.address,
                  r,
                  s,
                  v,
                  referrer: ethers.constants.AddressZero,
                }
              );

              return await erc721
                .connect(relayer)
                .executeMetaTransaction(
                  user.address,
                  functionSignature,
                  metaTxnR,
                  metaTxnS,
                  metaTxnV,
                  { value: mintFee ? MINT_FEE : 0 }
                );
            };

            await mint(bob, false);
            await mint(charlie, false);
            await mint(david, false);
            expect(await erc721.sponsoredMints()).to.eq(3);
            expect(await erc721.maxSponsoredMints()).to.eq(3);

            await mint(eve, true);
            expect(await erc721.sponsoredMints()).to.eq(3);
            expect(await erc721.maxSponsoredMints()).to.eq(3);

            await erc721.connect(alice).increaseMaxSponsoredMints(2, {
              value: SPONSORED_MINT_FEE.mul(2),
            });

            await mint(frank, false);
            expect(await erc721.sponsoredMints()).to.eq(4);
            expect(await erc721.maxSponsoredMints()).to.eq(5);

            await mint(george, false);
            expect(await erc721.sponsoredMints()).to.eq(5);
            expect(await erc721.maxSponsoredMints()).to.eq(5);

            await mint(harry, true);
            expect(await erc721.sponsoredMints()).to.eq(5);
            expect(await erc721.maxSponsoredMints()).to.eq(5);
          });

          it("should revert if mint fee is paid even for sponsored mint", async () => {
            const { v, r, s } = await ERC721_generateSignature(
              erc721,
              trustedAddress,
              bob.address
            );

            const [
              functionSignature,
              { r: metaTxnR, s: metaTxnS, v: metaTxnV },
            ] = await prepareNativeMetaTxnSignatureWithReferrer(erc721, bob, {
              to: bob.address,
              r,
              s,
              v,
              referrer: ethers.constants.AddressZero,
            });

            await expect(
              erc721
                .connect(relayer)
                .executeMetaTransaction(
                  bob.address,
                  functionSignature,
                  metaTxnR,
                  metaTxnS,
                  metaTxnV,
                  { value: MINT_FEE }
                )
            ).to.be.reverted;
          });
        });

        it("should revert if to == referrer", async () => {
          const { v, r, s } = await ERC721_generateSignature(
            erc721,
            trustedAddress,
            bob.address
          );

          const [functionSignature, { r: metaTxnR, s: metaTxnS, v: metaTxnV }] =
            await prepareNativeMetaTxnSignatureWithReferrer(erc721, bob, {
              to: bob.address,
              r,
              s,
              v,
              referrer: bob.address,
            });

          await expect(
            erc721
              .connect(relayer)
              .executeMetaTransaction(
                bob.address,
                functionSignature,
                metaTxnR,
                metaTxnS,
                metaTxnV,
                { value: MINT_FEE }
              )
          ).to.be.reverted;
        });

        it("should throw an error if minted past max supply", async () => {
          const deployERC721Token = await erc721TokenFactory.deployERC721Token(
            TokenType.ERC721Token,
            encodeInitializationDataWithSponsoredMints([
              "TestToken",
              "TEST",
              "https://example.com/contractURI",
              "https://example.com",
              alice.address,
              trustedAddress.address,
              1,
              0,
            ]), // only 1 maxSupply
            +new Date()
          );
          const receipt = await deployERC721Token.wait();
          const erc721TokenCloneAddress = getArgFromEvent(
            erc721TokenFactory,
            receipt,
            erc721TokenFactory.interface.events[
              "ERC721TokenDeployed(uint8,address,address,address)"
            ].name,
            "_erc721TokenClone"
          );
          erc721 = await ethers.getContractAt(
            "ERC721TokenImpl",
            erc721TokenCloneAddress
          );

          const mint = async (user: SignerWithAddress) => {
            const { v, r, s } = await ERC721_generateSignature(
              erc721,
              trustedAddress,
              user.address
            );
            const [
              functionSignature,
              { r: metaTxnR, s: metaTxnS, v: metaTxnV },
            ] = await prepareNativeMetaTxnSignatureWithReferrer(erc721, user, {
              to: user.address,
              r,
              s,
              v,
              referrer: ethers.constants.AddressZero,
            });

            await erc721
              .connect(relayer)
              .executeMetaTransaction(
                user.address,
                functionSignature,
                metaTxnR,
                metaTxnS,
                metaTxnV,
                { value: MINT_FEE }
              );
          };
          await mint(bob);
          await expect(mint(charlie)).to.reverted;
        });

        it("should not allow claiming again", async () => {
          let { v, r, s } = await ERC721_generateSignature(
            erc721,
            trustedAddress,
            bob.address // signature for bob
          );

          // bob mints for bob
          let [functionSignature, { r: metaTxnR, s: metaTxnS, v: metaTxnV }] =
            await prepareNativeMetaTxnSignatureWithReferrer(erc721, bob, {
              to: bob.address,
              r,
              s,
              v,
              referrer: ethers.constants.AddressZero,
            });
          await erc721
            .connect(relayer)
            .executeMetaTransaction(
              bob.address,
              functionSignature,
              metaTxnR,
              metaTxnS,
              metaTxnV,
              { value: MINT_FEE }
            );

          //  try minting again
          await expect(
            erc721
              .connect(relayer)
              .executeMetaTransaction(
                bob.address,
                functionSignature,
                metaTxnR,
                metaTxnS,
                metaTxnV,
                { value: MINT_FEE }
              )
          ).to.be.reverted;

          // charlie mints for bob
          [functionSignature, { r: metaTxnR, s: metaTxnS, v: metaTxnV }] =
            await prepareNativeMetaTxnSignatureWithReferrer(erc721, charlie, {
              to: bob.address,
              r,
              s,
              v,
              referrer: ethers.constants.AddressZero,
            });
          await expect(
            erc721
              .connect(relayer)
              .executeMetaTransaction(
                charlie.address,
                functionSignature,
                metaTxnR,
                metaTxnS,
                metaTxnV,
                { value: MINT_FEE }
              )
          ).to.be.reverted;

          // Try latest signature
          ({ v, r, s } = await ERC721_generateSignature(
            erc721,
            trustedAddress,
            bob.address
          ));
          [functionSignature, { r: metaTxnR, s: metaTxnS, v: metaTxnV }] =
            await prepareNativeMetaTxnSignatureWithReferrer(erc721, bob, {
              to: bob.address,
              r,
              s,
              v,
              referrer: ethers.constants.AddressZero,
            });
          //  try minting again with the new signature
          await expect(
            erc721
              .connect(relayer)
              .executeMetaTransaction(
                bob.address,
                functionSignature,
                metaTxnR,
                metaTxnS,
                metaTxnV,
                { value: MINT_FEE }
              )
          ).to.be.reverted;
          // charlie mints for bob
          [functionSignature, { r: metaTxnR, s: metaTxnS, v: metaTxnV }] =
            await prepareNativeMetaTxnSignatureWithReferrer(erc721, charlie, {
              to: bob.address,
              r,
              s,
              v,
              referrer: ethers.constants.AddressZero,
            });
          await expect(
            erc721
              .connect(relayer)
              .executeMetaTransaction(
                charlie.address,
                functionSignature,
                metaTxnR,
                metaTxnS,
                metaTxnV,
                { value: MINT_FEE }
              )
          ).to.be.reverted;
        });
      });
    });
  });

  describe("ERC721SoulboundTokenImpl", async function () {
    describe("deploy", async function () {
      it("Should deploy ERC721SoulboundTokenImpl logic contract", async function () {
        // Deploy ERC721SoulboundTokenImpl logic contract
        const ERC721SoulboundTokenImpl = await ethers.getContractFactory(
          "ERC721SoulboundTokenImpl"
        );
        await ERC721SoulboundTokenImpl.deploy(
          MINT_FEE,
          SPONSORED_MINT_FEE,
          MINT_FEE_RECIPIENT,
          protocolRewards.address
        );
      });
    });

    describe("initialize()", async function () {
      it("Should revert if anyone tries to initialize() after deployment", async function () {
        // Deploy ERC721SoulboundTokenImpl logic contract
        const ERC721SoulboundTokenImpl = await ethers.getContractFactory(
          "ERC721SoulboundTokenImpl"
        );
        let erc721SoulboundTokenImpl = await ERC721SoulboundTokenImpl.deploy(
          MINT_FEE,
          SPONSORED_MINT_FEE,
          MINT_FEE_RECIPIENT,
          protocolRewards.address
        );

        // Try calling initialize
        await expect(
          erc721SoulboundTokenImpl.initialize(
            encodeInitializationDataWithSponsoredMints([
              "TestToken",
              "TEST",
              "https://example.com/contractURI",
              "https://example.com",
              owner.address,
              trustedAddress.address,
              10,
              0,
            ])
          )
        ).to.be.revertedWith("Initializable: contract is already initialized");
      });

      it("should initialize with custom name and symbol", async () => {
        expect(await erc721Soulbound.MINT_FEE()).to.eq(MINT_FEE);
        expect(await erc721Soulbound.MINT_FEE_RECIPIENT()).to.eq(
          MINT_FEE_RECIPIENT
        );
        expect(await erc721Soulbound.name()).to.eq("TestToken");
        expect(await erc721Soulbound.symbol()).to.eq("TEST");
        expect(await erc721Soulbound.maxSupply()).to.eq(10);
        expect(await erc721Soulbound.sponsoredMints()).to.eq(0);
        expect(await erc721Soulbound.maxSponsoredMints()).to.eq(0);
        expect(await erc721Soulbound.contractURI()).to.eq(
          "https://example.com/contractURI"
        );
        expect(await erc721Soulbound.tokenURI(1)).to.eq("https://example.com");
        expect(await erc721Soulbound.nextTokenId()).to.eq(1);
        expect(await erc721Soulbound.owner()).to.eq(alice.address);
        await expect(
          erc721Soulbound.transferFrom(alice.address, bob.address, 1)
        ).to.be.revertedWith("Soulbound");
      });

      it("should not allow initializing with empty trusted address", async () => {
        const ERC721SoulboundToken = await ethers.getContractFactory(
          "ERC721SoulboundToken"
        );

        await expect(
          ERC721SoulboundToken.deploy(
            "TestToken",
            "TEST",
            "https://example.com/contractURI",
            "https://example.com",
            ZERO_ADDRESS,
            10
          )
        ).to.be.revertedWith("InvalidAddress");
      });

      describe("sponsoredMints", () => {
        it("Should revert if sponsoredMints > maxSupply", async function () {
          // Deploy new ERC721Token via ERC721TokenFactory
          await expect(
            erc721TokenFactory
              .connect(alice)
              .deployERC721Token(
                TokenType.ERC721SoulboundToken,
                encodeInitializationDataWithSponsoredMints([
                  "TestToken",
                  "TEST",
                  "https://example.com/contractURI",
                  "https://example.com",
                  alice.address,
                  trustedAddress.address,
                  10,
                  11,
                ]),
                +new Date()
              )
          ).to.be.revertedWith("ExceedsMaxSupply");
        });

        it("Should revert if sponsoredMints fee is not paid", async function () {
          // Deploy new ERC721Token via ERC721TokenFactory
          await expect(
            erc721TokenFactory
              .connect(alice)
              .deployERC721Token(
                TokenType.ERC721SoulboundToken,
                encodeInitializationDataWithSponsoredMints([
                  "TestToken",
                  "TEST",
                  "https://example.com/contractURI",
                  "https://example.com",
                  alice.address,
                  trustedAddress.address,
                  10,
                  5,
                ]),
                +new Date()
              )
          ).to.be.revertedWith("InvalidFee");
        });

        it("Should transfer sponsoredMints fee", async function () {
          await expect(() =>
            erc721TokenFactory
              .connect(alice)
              .deployERC721Token(
                TokenType.ERC721SoulboundToken,
                encodeInitializationDataWithSponsoredMints([
                  "TestToken",
                  "TEST",
                  "https://example.com/contractURI",
                  "https://example.com",
                  alice.address,
                  trustedAddress.address,
                  10,
                  5,
                ]),
                +new Date(),
                { value: SPONSORED_MINT_FEE.mul(5) }
              )
          ).to.changeEtherBalances(
            [alice, new VoidSigner(MINT_FEE_RECIPIENT, ethers.provider)],
            [SPONSORED_MINT_FEE.mul(5).mul(-1), SPONSORED_MINT_FEE.mul(5)]
          );
        });

        it("Should not transfer sponsoredMints fee if its 0", async function () {
          await expect(() =>
            erc721TokenFactory
              .connect(alice)
              .deployERC721Token(
                TokenType.ERC721SoulboundToken,
                encodeInitializationDataWithSponsoredMints([
                  "TestToken",
                  "TEST",
                  "https://example.com/contractURI",
                  "https://example.com",
                  alice.address,
                  trustedAddress.address,
                  10,
                  0,
                ]),
                +new Date()
              )
          ).to.changeEtherBalances(
            [alice, new VoidSigner(MINT_FEE_RECIPIENT, ethers.provider)],
            [0, 0]
          );
        });

        it("Should emit SponsoredMintFeesPaid()", async function () {
          const _saltNonce = +new Date();
          const erc721Address = await erc721TokenFactory
            .connect(alice)
            .callStatic.deployERC721Token(
              TokenType.ERC721SoulboundToken,
              encodeInitializationDataWithSponsoredMints([
                "TestToken",
                "TEST",
                "https://example.com/contractURI",
                "https://example.com",
                alice.address,
                trustedAddress.address,
                10,
                5,
              ]),
              _saltNonce,
              { value: SPONSORED_MINT_FEE.mul(5) }
            );
          await expect(
            erc721TokenFactory
              .connect(alice)
              .deployERC721Token(
                TokenType.ERC721SoulboundToken,
                encodeInitializationDataWithSponsoredMints([
                  "TestToken",
                  "TEST",
                  "https://example.com/contractURI",
                  "https://example.com",
                  alice.address,
                  trustedAddress.address,
                  10,
                  5,
                ]),
                _saltNonce,
                { value: SPONSORED_MINT_FEE.mul(5) }
              )
          )
            .to.emit(
              ERC721TokenImpl__factory.connect(erc721Address, alice),
              "SponsoredMintFeesPaid"
            )
            .withArgs(5, SPONSORED_MINT_FEE, MINT_FEE_RECIPIENT);
        });

        it("Should revert with TransferFailed() if sponsored mint fee payment fails", async () => {
          // Deploy RevertOnReceiveEther
          const RevertOnReceiveEther = await ethers.getContractFactory(
            "RevertOnReceiveEther"
          );
          const revertOnReceiveEther = await RevertOnReceiveEther.deploy();

          // Deploy factory, logics with RevertOnReceiveEther as MINT_FEE_RECIPIENT
          // Deploy ERC721TokenImpl logic contract
          const erc721Logic = await ERC721.deploy(
            MINT_FEE,
            SPONSORED_MINT_FEE,
            revertOnReceiveEther.address,
            protocolRewards.address
          );
          // Deploy ERC721SoulboundTokenImpl logic contract
          const erc721SoulboundLogic = await ERC721Soulbound.deploy(
            MINT_FEE,
            SPONSORED_MINT_FEE,
            revertOnReceiveEther.address,
            protocolRewards.address
          );
          const ERC721TokenFactory = await ethers.getContractFactory(
            "ERC721TokenNativeGaslessMintFactory"
          );
          const erc721TokenFactory = await ERC721TokenFactory.connect(
            owner
          ).deploy(
            erc721Logic.address,
            erc721SoulboundLogic.address,
            erc721TokenNativeGaslessMintLogic.address,
            erc721SoulboundTokenNativeGaslessMintLogic.address
          );
          // Deploy new ERC721Token via ERC721TokenFactory
          await expect(
            erc721TokenFactory
              .connect(alice)
              .deployERC721Token(
                TokenType.ERC721SoulboundToken,
                encodeInitializationDataWithSponsoredMints([
                  "TestToken",
                  "TEST",
                  "https://example.com/contractURI",
                  "https://example.com",
                  alice.address,
                  trustedAddress.address,
                  10,
                  5,
                ]),
                +new Date(),
                { value: SPONSORED_MINT_FEE.mul(5) }
              )
          ).to.be.revertedWith("TransferFailed");
        });
      });
    });

    describe("mint()", async function () {
      describe("signature", async function () {
        it("should allow minting with a trusted address - msg.sender == to", async () => {
          const { v, r, s } = await ERC721_generateSignature(
            erc721Soulbound,
            trustedAddress,
            bob.address
          );

          expect(
            (await erc721Soulbound.balanceOf(bob.address)).toNumber()
          ).to.eq(0);
          expect(await erc721Soulbound.nextTokenId()).to.eq(1);
          expect(await erc721Soulbound.ownerOf(1)).to.eq(ZERO_ADDRESS);
          expect(await erc721Soulbound.claims(bob.address)).to.eq(0);

          await erc721Soulbound
            .connect(bob)
            .mint(bob.address, r, s, v, ethers.constants.AddressZero, {
              value: MINT_FEE,
            });

          expect(
            (await erc721Soulbound.balanceOf(bob.address)).toNumber()
          ).to.eq(1);
          expect(await erc721Soulbound.nextTokenId()).to.eq(2);
          expect(await erc721Soulbound.ownerOf(1)).to.eq(bob.address);
          expect(await erc721Soulbound.claims(bob.address)).to.eq(1);
        });

        it("should allow minting with a trusted address - msg.sender != to", async () => {
          const { v, r, s } = await ERC721_generateSignature(
            erc721Soulbound,
            trustedAddress,
            charlie.address // signature for charlie
          );

          expect(
            (await erc721Soulbound.balanceOf(charlie.address)).toNumber()
          ).to.eq(0);
          expect(await erc721Soulbound.nextTokenId()).to.eq(1);
          expect(await erc721Soulbound.ownerOf(1)).to.eq(ZERO_ADDRESS);
          expect(await erc721Soulbound.claims(charlie.address)).to.eq(0);

          // bob mints for charlie
          await erc721Soulbound
            .connect(bob)
            .mint(charlie.address, r, s, v, ethers.constants.AddressZero, {
              value: MINT_FEE,
            });

          // nft transferred to charlie, not bob
          expect(
            (await erc721Soulbound.balanceOf(bob.address)).toNumber()
          ).to.eq(0);
          expect(
            (await erc721Soulbound.balanceOf(charlie.address)).toNumber()
          ).to.eq(1);
          expect(await erc721Soulbound.nextTokenId()).to.eq(2);
          expect(await erc721Soulbound.ownerOf(1)).to.eq(charlie.address);
          // claimer should be charlie, not bob
          expect(await erc721Soulbound.claims(charlie.address)).to.eq(1);
          expect(await erc721Soulbound.claims(bob.address)).to.eq(0);
        });

        it("should revert if signature is not for `to` - msg.sender == to", async () => {
          const { v, r, s } = await ERC721_generateSignature(
            erc721Soulbound,
            trustedAddress,
            charlie.address // signature for charlie
          );

          expect(
            (await erc721Soulbound.balanceOf(bob.address)).toNumber()
          ).to.eq(0);
          expect(await erc721Soulbound.nextTokenId()).to.eq(1);
          expect(await erc721Soulbound.ownerOf(1)).to.eq(ZERO_ADDRESS);
          expect(await erc721Soulbound.claims(bob.address)).to.eq(0);
          expect(await erc721Soulbound.getNonce(bob.address)).to.eq(0);

          // bob mints for bob
          await expect(
            erc721Soulbound
              .connect(bob)
              .mint(bob.address, r, s, v, ethers.constants.AddressZero)
          ).to.be.reverted;
        });

        it("should revert if signature is not for `to` - msg.sender != to", async () => {
          const { v, r, s } = await ERC721_generateSignature(
            erc721Soulbound,
            trustedAddress,
            bob.address // signature for bob
          );

          expect(
            (await erc721Soulbound.balanceOf(bob.address)).toNumber()
          ).to.eq(0);
          expect(await erc721Soulbound.nextTokenId()).to.eq(1);
          expect(await erc721Soulbound.ownerOf(1)).to.eq(ZERO_ADDRESS);
          expect(await erc721Soulbound.claims(bob.address)).to.eq(0);
          expect(await erc721Soulbound.getNonce(bob.address)).to.eq(0);

          // bob mints for charlie

          await expect(
            erc721Soulbound
              .connect(bob)
              .mint(charlie.address, r, s, v, ethers.constants.AddressZero)
          ).to.be.reverted;
        });

        it("should reject on invalid signer - wrong trustedAddress", async () => {
          const { domain, types, value } = getEIP712TypedData({
            to: bob.address,
            contractAddress: erc721Soulbound.address,
            chainId: hre.network.config.chainId as number,
            domainName: await erc721Soulbound.name(),
            domainVersion: "1.0",
          });
          const rawSignature: string = await bob._signTypedData(
            domain,
            types,
            value
          );
          const { v, r, s } = ethers.utils.splitSignature(rawSignature);

          const sb = erc721Soulbound.connect(bob);

          await expect(
            sb.mint(bob.address, r, s, v, ethers.constants.AddressZero, {
              value: MINT_FEE,
            })
          ).to.be.revertedWith("InvalidAddress");
          // try minting to another address
          await expect(
            sb.mint(charlie.address, r, s, v, ethers.constants.AddressZero, {
              value: MINT_FEE,
            })
          ).to.be.revertedWith("InvalidAddress");
        });

        it("should reject on signature used by someone else", async () => {
          const { domain, types, value } = getEIP712TypedData({
            to: bob.address, // signature meant to be used by `bob`
            contractAddress: erc721Soulbound.address,
            chainId: hre.network.config.chainId as number,
            domainName: await erc721Soulbound.name(),
            domainVersion: "1.0",
          });
          const rawSignature: string = await trustedAddress._signTypedData(
            domain,
            types,
            value
          );
          const { v, r, s } = ethers.utils.splitSignature(rawSignature);

          // charlie tries minting with signature for `bob`
          const sb = erc721Soulbound.connect(charlie);
          await expect(
            sb.mint(charlie.address, r, s, v, ethers.constants.AddressZero, {
              value: MINT_FEE,
            })
          ).to.be.revertedWith("InvalidAddress");
          // charlie tries minting to alice with signature for `bob`
          await expect(
            sb.mint(alice.address, r, s, v, ethers.constants.AddressZero, {
              value: MINT_FEE,
            })
          ).to.be.revertedWith("InvalidAddress");

          // charlie tries minting to bob with signature for `bob`, which should work
          await sb.mint(bob.address, r, s, v, ethers.constants.AddressZero, {
            value: MINT_FEE,
          });
          // nft transferred to bob, not charlie
          expect(
            (await erc721Soulbound.balanceOf(charlie.address)).toNumber()
          ).to.eq(0);
          expect(
            (await erc721Soulbound.balanceOf(bob.address)).toNumber()
          ).to.eq(1);
          expect(await erc721Soulbound.nextTokenId()).to.eq(2);
          expect(await erc721Soulbound.ownerOf(1)).to.eq(bob.address);
          // claimer should be bob, not charlie
          expect(await erc721Soulbound.claims(bob.address)).to.eq(1);
          expect(await erc721Soulbound.claims(charlie.address)).to.eq(0);
          expect(await erc721Soulbound.getNonce(charlie.address)).to.eq(0);
          expect(await erc721Soulbound.getNonce(bob.address)).to.eq(0);
        });

        it("should revert on signature replay", async () => {
          // mint token 1 on contract A
          const deployERC721SoulboundToken_A =
            await erc721TokenFactory.deployERC721Token(
              TokenType.ERC721SoulboundToken,
              encodeInitializationDataWithSponsoredMints([
                "ERC721Soulbound_A",
                "ERC721Soulbound_A",
                "https://example.com/contractURI",
                "https://example.com",
                alice.address,
                trustedAddress.address,
                10,
                0,
              ]),
              +new Date()
            );
          const receipt_A = await deployERC721SoulboundToken_A.wait();
          const erc721SoulboundTokenCloneAddress_A = getArgFromEvent(
            erc721TokenFactory,
            receipt_A,
            erc721TokenFactory.interface.events[
              "ERC721TokenDeployed(uint8,address,address,address)"
            ].name,
            "_erc721TokenClone"
          );
          const erc721Soulbound_A = await ethers.getContractAt(
            "ERC721SoulboundTokenImpl",
            erc721SoulboundTokenCloneAddress_A
          );
          const { domain, types, value } = getEIP712TypedData({
            to: bob.address,
            contractAddress: erc721Soulbound_A.address,
            chainId: hre.network.config.chainId as number,
            domainName: "ERC721Soulbound_A", // contract A name
            domainVersion: "1.0",
          });
          const rawSignature: string = await trustedAddress._signTypedData(
            domain,
            types,
            value
          );
          const { v, r, s } = ethers.utils.splitSignature(rawSignature);
          await erc721Soulbound_A
            .connect(bob)
            .mint(bob.address, r, s, v, ethers.constants.AddressZero, {
              value: MINT_FEE,
            });

          // replay signature from contract A to mint from contract B
          const deployERC721SoulboundToken_B =
            await erc721TokenFactory.deployERC721Token(
              TokenType.ERC721SoulboundToken,
              encodeInitializationDataWithSponsoredMints([
                "ERC721Soulbound_B",
                "ERC721Soulbound_B",
                "https://example.com/contractURI",
                "https://example.com",
                alice.address,
                trustedAddress.address,
                10,
                0,
              ]),
              +new Date()
            );
          const receipt_B = await deployERC721SoulboundToken_B.wait();
          const erc721SoulboundTokenCloneAddress_B = getArgFromEvent(
            erc721TokenFactory,
            receipt_B,
            erc721TokenFactory.interface.events[
              "ERC721TokenDeployed(uint8,address,address,address)"
            ].name,
            "_erc721TokenClone"
          );
          const erc721_B = await ethers.getContractAt(
            "ERC721SoulboundTokenImpl",
            erc721SoulboundTokenCloneAddress_B
          );
          await expect(
            erc721_B
              .connect(bob)
              .mint(bob.address, r, s, v, ethers.constants.AddressZero, {
                value: MINT_FEE,
              })
          ).to.be.reverted;
          // try minting to another address
          await expect(
            erc721_B
              .connect(bob)
              .mint(charlie.address, r, s, v, ethers.constants.AddressZero, {
                value: MINT_FEE,
              })
          ).to.be.reverted;
        });
      });

      describe("mintFee", async function () {
        it("Should revert on mint() if correct fee not paid", async function () {
          const { v, r, s } = await ERC721_generateSignature(
            erc721Soulbound,
            trustedAddress,
            bob.address
          );

          // zero fees
          await expect(
            erc721Soulbound
              .connect(bob)
              .mint(bob.address, r, s, v, ethers.constants.AddressZero)
          ).to.be.revertedWith("InvalidFee");

          // less fees
          await expect(
            erc721Soulbound
              .connect(bob)
              .mint(bob.address, r, s, v, ethers.constants.AddressZero, {
                value: MINT_FEE.sub(1),
              })
          ).to.be.revertedWith("InvalidFee");

          // more fees
          await expect(
            erc721Soulbound
              .connect(bob)
              .mint(bob.address, r, s, v, ethers.constants.AddressZero, {
                value: MINT_FEE.add(1),
              })
          ).to.be.revertedWith("InvalidFee");
        });

        it("Should split and deposit rewards - no referrer", async () => {
          const { v, r, s } = await ERC721_generateSignature(
            erc721Soulbound,
            trustedAddress,
            bob.address
          );

          await erc721Soulbound
            .connect(bob)
            .mint(bob.address, r, s, v, ethers.constants.AddressZero, {
              value: MINT_FEE,
            });

          const rewardAmount = MINT_FEE;
          const expectedPlatformShare = rewardAmount
            .mul(PLATFORM_SHARE)
            .div(BASIS_POINTS)
            .add(rewardAmount.mul(REFERRER_SHARE).div(BASIS_POINTS));
          const expectedCreatorShare = rewardAmount
            .mul(CREATOR_SHARE)
            .div(BASIS_POINTS);
          const expectedReferrerShare = 0;

          const platform = MINT_FEE_RECIPIENT;
          const creator = await erc721Soulbound.owner();
          const referrer = ethers.constants.AddressZero;

          expect(await protocolRewards.balanceOf(platform)).to.eq(
            expectedPlatformShare
          );
          expect(await protocolRewards.balanceOf(creator)).to.eq(
            expectedCreatorShare
          );
          expect(await protocolRewards.balanceOf(referrer)).to.eq(
            expectedReferrerShare
          );
        });

        it("Should split and deposit rewards - yes referrer", async () => {
          const { v, r, s } = await ERC721_generateSignature(
            erc721Soulbound,
            trustedAddress,
            bob.address
          );

          await erc721Soulbound
            .connect(bob)
            .mint(bob.address, r, s, v, referrer.address, {
              value: MINT_FEE,
            });

          const rewardAmount = MINT_FEE;
          const expectedPlatformShare = rewardAmount
            .mul(PLATFORM_SHARE)
            .div(BASIS_POINTS);
          const expectedCreatorShare = rewardAmount
            .mul(CREATOR_SHARE)
            .div(BASIS_POINTS);
          const expectedReferrerShare = rewardAmount
            .mul(REFERRER_SHARE)
            .div(BASIS_POINTS);

          const platform = MINT_FEE_RECIPIENT;
          const creator = await erc721Soulbound.owner();

          expect(await protocolRewards.balanceOf(platform)).to.eq(
            expectedPlatformShare
          );
          expect(await protocolRewards.balanceOf(creator)).to.eq(
            expectedCreatorShare
          );
          expect(await protocolRewards.balanceOf(referrer.address)).to.eq(
            expectedReferrerShare
          );
        });

        it("Should emit MintFeePaid() on mint()", async () => {
          const { v, r, s } = await ERC721_generateSignature(
            erc721Soulbound,
            trustedAddress,
            bob.address
          );

          await expect(
            erc721Soulbound
              .connect(bob)
              .mint(bob.address, r, s, v, ethers.constants.AddressZero, {
                value: MINT_FEE,
              })
          )
            .to.emit(erc721Soulbound, "MintFeePaid")
            .withArgs(
              MINT_FEE,
              bob.address,
              MINT_FEE_RECIPIENT,
              await erc721.owner(),
              ethers.constants.AddressZero
            );
        });
      });

      it("should emit Transfer on mint", async () => {
        const { v, r, s } = await ERC721_generateSignature(
          erc721Soulbound,
          trustedAddress,
          bob.address
        );

        await expect(
          erc721Soulbound
            .connect(bob)
            .mint(bob.address, r, s, v, ethers.constants.AddressZero, {
              value: MINT_FEE,
            })
        )
          .to.emit(erc721Soulbound, "Transfer")
          .withArgs(ZERO_ADDRESS, bob.address, 1);

        expect((await erc721Soulbound.balanceOf(bob.address)).toNumber()).to.eq(
          1
        );
        expect(await erc721Soulbound.ownerOf(1)).to.eq(bob.address);
      });

      it("should revert if to == referrer", async () => {
        const { v, r, s } = await ERC721_generateSignature(
          erc721Soulbound,
          trustedAddress,
          bob.address
        );

        await expect(
          erc721Soulbound
            .connect(bob)
            .mint(bob.address, r, s, v, bob.address, { value: MINT_FEE })
        ).to.be.revertedWith("InvalidAddress");
      });

      it("should throw an error if minted past max supply", async () => {
        const deployERC721SoulboundToken =
          await erc721TokenFactory.deployERC721Token(
            TokenType.ERC721SoulboundToken,
            encodeInitializationDataWithSponsoredMints([
              "TestToken",
              "TEST",
              "https://example.com/contractURI",
              "https://example.com",
              alice.address,
              trustedAddress.address,
              1,
              0,
            ]), // only 1 maxSupply
            +new Date()
          );
        const receipt = await deployERC721SoulboundToken.wait();
        const erc721SoulboundTokenCloneAddress = getArgFromEvent(
          erc721TokenFactory,
          receipt,
          erc721TokenFactory.interface.events[
            "ERC721TokenDeployed(uint8,address,address,address)"
          ].name,
          "_erc721TokenClone"
        );
        erc721Soulbound = await ethers.getContractAt(
          "ERC721SoulboundTokenImpl",
          erc721SoulboundTokenCloneAddress
        );

        const mint = async (user: SignerWithAddress) => {
          const { v, r, s } = await ERC721_generateSignature(
            erc721Soulbound,
            trustedAddress,
            user.address
          );
          await erc721Soulbound
            .connect(user)
            .mint(user.address, r, s, v, ethers.constants.AddressZero, {
              value: MINT_FEE,
            });
        };
        await mint(bob);
        await expect(mint(charlie)).to.revertedWith("ExceedsMaxSupply");
      });

      it("should not allow claiming again", async () => {
        let { v, r, s } = await ERC721_generateSignature(
          erc721Soulbound,
          trustedAddress,
          bob.address // signature for bob
        );

        // bob mints for bob
        const sb = erc721Soulbound.connect(bob);
        await sb.mint(bob.address, r, s, v, ethers.constants.AddressZero, {
          value: MINT_FEE,
        });
        await expect(
          sb.mint(bob.address, r, s, v, ethers.constants.AddressZero, {
            value: MINT_FEE,
          })
        ).to.be.revertedWith("AlreadyClaimed");
        // charlie mints for bob
        const sb_charlie = erc721Soulbound.connect(charlie);
        await expect(
          sb_charlie.mint(bob.address, r, s, v, ethers.constants.AddressZero)
        ).to.be.revertedWith("AlreadyClaimed");

        // Try latest signature
        ({ v, r, s } = await ERC721_generateSignature(
          erc721Soulbound,
          trustedAddress,
          bob.address
        ));
        // bob mints for bob
        await expect(
          sb.mint(bob.address, r, s, v, ethers.constants.AddressZero, {
            value: MINT_FEE,
          })
        ).to.be.revertedWith("AlreadyClaimed");
        // try minting to another address
        // charlie mints for bob
        await expect(
          sb_charlie.mint(bob.address, r, s, v, ethers.constants.AddressZero)
        ).to.be.revertedWith("AlreadyClaimed");
      });

      describe("sponsoredMints", () => {
        beforeEach(async () => {
          // Deploy new ERC721Token via ERC721TokenFactory
          const deployERC721Token = await erc721TokenFactory
            .connect(alice)
            .deployERC721Token(
              TokenType.ERC721SoulboundToken,
              encodeInitializationDataWithSponsoredMints([
                "TestToken",
                "TEST",
                "https://example.com/contractURI",
                "https://example.com",
                alice.address,
                trustedAddress.address,
                10,
                3,
              ]),
              +new Date(),
              { value: SPONSORED_MINT_FEE.mul(3) }
            );
          const receipt = await deployERC721Token.wait();
          const erc721TokenCloneAddress = getArgFromEvent(
            erc721TokenFactory,
            receipt,
            erc721TokenFactory.interface.events[
              "ERC721TokenDeployed(uint8,address,address,address)"
            ].name,
            "_erc721TokenClone"
          );
          erc721Soulbound = await ethers.getContractAt(
            "ERC721SoulboundTokenImpl",
            erc721TokenCloneAddress
          );
        });

        it("should charge mint fee for any mints if maxSponsoredMints = 0 ", async () => {
          // Deploy new ERC721SoulboundToken via ERC721TokenFactory
          const deployERC721Token = await erc721TokenFactory
            .connect(alice)
            .deployERC721Token(
              TokenType.ERC721SoulboundToken,
              encodeInitializationDataWithSponsoredMints([
                "TestToken",
                "TEST",
                "https://example.com/contractURI",
                "https://example.com",
                alice.address,
                trustedAddress.address,
                10,
                0,
              ]),
              +new Date()
            );
          const receipt = await deployERC721Token.wait();
          const erc721TokenCloneAddress = getArgFromEvent(
            erc721TokenFactory,
            receipt,
            erc721TokenFactory.interface.events[
              "ERC721TokenDeployed(uint8,address,address,address)"
            ].name,
            "_erc721TokenClone"
          );
          erc721Soulbound = await ethers.getContractAt(
            "ERC721SoulboundTokenImpl",
            erc721TokenCloneAddress
          );

          const { v, r, s } = await ERC721_generateSignature(
            erc721Soulbound,
            trustedAddress,
            bob.address
          );

          expect(await erc721Soulbound.sponsoredMints()).to.eq(0);
          await erc721Soulbound
            .connect(bob)
            .mint(bob.address, r, s, v, ethers.constants.AddressZero, {
              value: MINT_FEE,
            });
          expect(await erc721Soulbound.sponsoredMints()).to.eq(0);

          const platform = MINT_FEE_RECIPIENT;
          const creator = await erc721Soulbound.owner();
          const referrer = ethers.constants.AddressZero;

          const rewardAmount = MINT_FEE;
          const expectedPlatformShare = rewardAmount
            .mul(PLATFORM_SHARE)
            .div(BASIS_POINTS)
            .add(rewardAmount.mul(REFERRER_SHARE).div(BASIS_POINTS));
          const expectedCreatorShare = rewardAmount
            .mul(CREATOR_SHARE)
            .div(BASIS_POINTS);
          const expectedReferrerShare = 0;

          expect(await protocolRewards.balanceOf(platform)).to.eq(
            expectedPlatformShare
          );
          expect(await protocolRewards.balanceOf(creator)).to.eq(
            expectedCreatorShare
          );
          expect(await protocolRewards.balanceOf(referrer)).to.eq(
            expectedReferrerShare
          );
        });

        it("Should not charge mint fee sponsoredMints < maxSponsoredMints", async function () {
          const mint = async (user: SignerWithAddress, mintFee = true) => {
            const { v, r, s } = await ERC721_generateSignature(
              erc721Soulbound,
              trustedAddress,
              user.address
            );
            return await erc721Soulbound
              .connect(user)
              .mint(user.address, r, s, v, ethers.constants.AddressZero, {
                value: mintFee ? MINT_FEE : 0,
              });
          };

          const platform = MINT_FEE_RECIPIENT;
          const creator = await erc721.owner();
          const referrer = ethers.constants.AddressZero;

          expect(await erc721Soulbound.sponsoredMints()).to.eq(0);
          await mint(bob, false);
          expect(await erc721Soulbound.sponsoredMints()).to.eq(1);
          expect(await protocolRewards.balanceOf(platform)).to.eq(0);
          expect(await protocolRewards.balanceOf(creator)).to.eq(0);
          expect(await protocolRewards.balanceOf(referrer)).to.eq(0);

          await mint(charlie, false);
          expect(await erc721Soulbound.sponsoredMints()).to.eq(2);
          expect(await protocolRewards.balanceOf(platform)).to.eq(0);
          expect(await protocolRewards.balanceOf(creator)).to.eq(0);
          expect(await protocolRewards.balanceOf(referrer)).to.eq(0);

          await mint(david, false);
          expect(await erc721Soulbound.sponsoredMints()).to.eq(3);
          expect(await protocolRewards.balanceOf(platform)).to.eq(0);
          expect(await protocolRewards.balanceOf(creator)).to.eq(0);
          expect(await protocolRewards.balanceOf(referrer)).to.eq(0);

          const rewardAmount = MINT_FEE;
          const expectedPlatformShare = rewardAmount
            .mul(PLATFORM_SHARE)
            .div(BASIS_POINTS)
            .add(rewardAmount.mul(REFERRER_SHARE).div(BASIS_POINTS));
          const expectedCreatorShare = rewardAmount
            .mul(CREATOR_SHARE)
            .div(BASIS_POINTS);
          const expectedReferrerShare = 0;

          await mint(eve, true);
          expect(await erc721Soulbound.sponsoredMints()).to.eq(3);
          expect(await protocolRewards.balanceOf(platform)).to.eq(
            expectedPlatformShare
          );
          expect(await protocolRewards.balanceOf(creator)).to.eq(
            expectedCreatorShare
          );
          expect(await protocolRewards.balanceOf(referrer)).to.eq(
            expectedReferrerShare
          );
        });

        it("should revert if mint fee is paid even for sponsored mint", async () => {
          const { v, r, s } = await ERC721_generateSignature(
            erc721Soulbound,
            trustedAddress,
            bob.address
          );

          await expect(
            erc721Soulbound
              .connect(bob)
              .mint(bob.address, r, s, v, ethers.constants.AddressZero, {
                value: MINT_FEE,
              })
          ).to.be.revertedWith("InvalidFee");
        });
      });
    });

    describe("increaseMaxSponsoredMints()", () => {
      beforeEach(async () => {
        // Deploy new ERC721SoulboundToken via ERC721TokenFactory
        const deployERC721Token = await erc721TokenFactory
          .connect(alice)
          .deployERC721Token(
            TokenType.ERC721SoulboundToken,
            encodeInitializationDataWithSponsoredMints([
              "TestToken",
              "TEST",
              "https://example.com/contractURI",
              "https://example.com",
              alice.address,
              trustedAddress.address,
              10,
              3,
            ]),
            +new Date(),
            { value: SPONSORED_MINT_FEE.mul(3) }
          );
        const receipt = await deployERC721Token.wait();
        const erc721TokenCloneAddress = getArgFromEvent(
          erc721TokenFactory,
          receipt,
          erc721TokenFactory.interface.events[
            "ERC721TokenDeployed(uint8,address,address,address)"
          ].name,
          "_erc721TokenClone"
        );
        erc721Soulbound = await ethers.getContractAt(
          "ERC721SoulboundTokenImpl",
          erc721TokenCloneAddress
        );
      });

      it("should revert if maxSponsoredMints > maxSupply", async () => {
        await expect(
          erc721Soulbound.connect(alice).increaseMaxSponsoredMints(8, {
            value: SPONSORED_MINT_FEE.mul(8),
          }) // 3 + 8 = 11 > 10
        ).to.be.revertedWith("ExceedsMaxSupply");
      });

      it("should increase maxSponsoredMints", async () => {
        expect(await erc721Soulbound.sponsoredMints()).to.eq(0);
        expect(await erc721Soulbound.maxSponsoredMints()).to.eq(3);
        await erc721Soulbound.connect(alice).increaseMaxSponsoredMints(2, {
          value: SPONSORED_MINT_FEE.mul(2),
        });
        expect(await erc721Soulbound.sponsoredMints()).to.eq(0);
        expect(await erc721Soulbound.maxSponsoredMints()).to.eq(5);
      });

      it("should emit SponsoredMintFeesPaid()", async () => {
        await expect(
          erc721Soulbound
            .connect(alice)
            .increaseMaxSponsoredMints(2, { value: SPONSORED_MINT_FEE.mul(2) })
        )
          .to.emit(erc721Soulbound, "SponsoredMintFeesPaid")
          .withArgs(2, SPONSORED_MINT_FEE, MINT_FEE_RECIPIENT);
      });

      it("should transfer sponsoredMints fee", async () => {
        await expect(() =>
          erc721Soulbound
            .connect(alice)
            .increaseMaxSponsoredMints(2, { value: SPONSORED_MINT_FEE.mul(2) })
        ).to.changeEtherBalances(
          [alice, new VoidSigner(MINT_FEE_RECIPIENT, ethers.provider)],
          [SPONSORED_MINT_FEE.mul(2).mul(-1), SPONSORED_MINT_FEE.mul(2)]
        );
      });

      it("should allow increasing maxSponsoredMints in between mints", async () => {
        const mint = async (user: SignerWithAddress, mintFee = true) => {
          const { v, r, s } = await ERC721_generateSignature(
            erc721Soulbound,
            trustedAddress,
            user.address
          );
          return await erc721Soulbound
            .connect(user)
            .mint(user.address, r, s, v, ethers.constants.AddressZero, {
              value: mintFee ? MINT_FEE : 0,
            });
        };

        await mint(bob, false);
        await mint(charlie, false);
        await mint(david, false);
        expect(await erc721Soulbound.sponsoredMints()).to.eq(3);
        expect(await erc721Soulbound.maxSponsoredMints()).to.eq(3);

        await mint(eve, true);
        expect(await erc721Soulbound.sponsoredMints()).to.eq(3);
        expect(await erc721Soulbound.maxSponsoredMints()).to.eq(3);

        await erc721Soulbound.connect(alice).increaseMaxSponsoredMints(2, {
          value: SPONSORED_MINT_FEE.mul(2),
        });

        await mint(frank, false);
        expect(await erc721Soulbound.sponsoredMints()).to.eq(4);
        expect(await erc721Soulbound.maxSponsoredMints()).to.eq(5);

        await mint(george, false);
        expect(await erc721Soulbound.sponsoredMints()).to.eq(5);
        expect(await erc721Soulbound.maxSponsoredMints()).to.eq(5);

        await mint(harry, true);
        expect(await erc721Soulbound.sponsoredMints()).to.eq(5);
        expect(await erc721Soulbound.maxSponsoredMints()).to.eq(5);
      });
    });

    it("should be compatible with ERC165, ERC721 and ERC721Metadata", async () => {
      for (const id of ["0x01ffc9a7", "0x80ac58cd", "0x5b5e139f"]) {
        expect(await erc721Soulbound.supportsInterface(id)).to.eq(true);
      }
    });

    it("should throw on transferring methods since soulbound", async () => {
      const { v, r, s } = await ERC721_generateSignature(
        erc721Soulbound,
        trustedAddress,
        bob.address
      );

      const sb = erc721Soulbound.connect(bob);

      await sb.mint(bob.address, r, s, v, ethers.constants.AddressZero, {
        value: MINT_FEE,
      });

      const calls = [
        sb.approve(bob.address, 1),
        sb.isApprovedForAll(erc721Soulbound.address, bob.address),
        sb.getApproved(1),
        sb.setApprovalForAll(erc721Soulbound.address, true),
        sb.transferFrom(bob.address, bob.address, 1),
        sb["safeTransferFrom(address,address,uint256)"](
          bob.address,
          bob.address,
          1
        ),
        sb["safeTransferFrom(address,address,uint256,bytes)"](
          bob.address,
          bob.address,
          1,
          ethers.constants.HashZero
        ),
      ];

      for (const call of calls) {
        await expect(call).to.be.revertedWith("Soulbound");
      }
    });

    describe("Meta Transactions", () => {
      describe("mint()", async function () {
        describe("signature", async function () {
          it("should allow minting with a trusted address - msgSender() == to", async () => {
            const { v, r, s } = await ERC721_generateSignature(
              erc721Soulbound,
              trustedAddress,
              bob.address
            );

            expect(
              (await erc721Soulbound.balanceOf(bob.address)).toNumber()
            ).to.eq(0);
            expect(await erc721Soulbound.nextTokenId()).to.eq(1);
            expect(await erc721Soulbound.ownerOf(1)).to.eq(ZERO_ADDRESS);
            expect(await erc721Soulbound.claims(bob.address)).to.eq(0);

            const [
              functionSignature,
              { r: metaTxnR, s: metaTxnS, v: metaTxnV },
            ] = await prepareNativeMetaTxnSignatureWithReferrer(
              erc721Soulbound,
              bob,
              {
                to: bob.address,
                r,
                s,
                v,
                referrer: ethers.constants.AddressZero,
              }
            );

            await erc721Soulbound
              .connect(relayer)
              .executeMetaTransaction(
                bob.address,
                functionSignature,
                metaTxnR,
                metaTxnS,
                metaTxnV,
                { value: MINT_FEE }
              );

            expect(
              (await erc721Soulbound.balanceOf(bob.address)).toNumber()
            ).to.eq(1);
            expect(await erc721Soulbound.nextTokenId()).to.eq(2);
            expect(await erc721Soulbound.ownerOf(1)).to.eq(bob.address);
            expect(await erc721Soulbound.claims(bob.address)).to.eq(1);
          });

          it("should allow minting with a trusted address - msgSender() != to", async () => {
            const { v, r, s } = await ERC721_generateSignature(
              erc721Soulbound,
              trustedAddress,
              charlie.address // signature for charlie
            );

            expect(
              (await erc721Soulbound.balanceOf(charlie.address)).toNumber()
            ).to.eq(0);
            expect(await erc721Soulbound.nextTokenId()).to.eq(1);
            expect(await erc721Soulbound.ownerOf(1)).to.eq(ZERO_ADDRESS);
            expect(await erc721Soulbound.claims(charlie.address)).to.eq(0);

            // bob mints for charlie
            const [
              functionSignature,
              { r: metaTxnR, s: metaTxnS, v: metaTxnV },
            ] = await prepareNativeMetaTxnSignatureWithReferrer(
              erc721Soulbound,
              bob,
              {
                to: charlie.address,
                r,
                s,
                v,
                referrer: ethers.constants.AddressZero,
              }
            );

            await erc721Soulbound
              .connect(relayer)
              .executeMetaTransaction(
                bob.address,
                functionSignature,
                metaTxnR,
                metaTxnS,
                metaTxnV,
                { value: MINT_FEE }
              );

            // nft transferred to charlie, not bob
            expect(
              (await erc721Soulbound.balanceOf(bob.address)).toNumber()
            ).to.eq(0);
            expect(
              (await erc721Soulbound.balanceOf(charlie.address)).toNumber()
            ).to.eq(1);
            expect(await erc721Soulbound.nextTokenId()).to.eq(2);
            expect(await erc721Soulbound.ownerOf(1)).to.eq(charlie.address);
            // claimer should be charlie, not bob
            expect(await erc721Soulbound.claims(charlie.address)).to.eq(1);
            expect(await erc721Soulbound.claims(bob.address)).to.eq(0);
          });

          it("should revert if signature is not for `to` - msgSender() == to", async () => {
            const { v, r, s } = await ERC721_generateSignature(
              erc721Soulbound,
              trustedAddress,
              charlie.address // signature for charlie
            );

            expect(
              (await erc721Soulbound.balanceOf(bob.address)).toNumber()
            ).to.eq(0);
            expect(await erc721Soulbound.nextTokenId()).to.eq(1);
            expect(await erc721Soulbound.ownerOf(1)).to.eq(ZERO_ADDRESS);
            expect(await erc721Soulbound.claims(bob.address)).to.eq(0);
            expect(await erc721Soulbound.getNonce(bob.address)).to.eq(0);

            // bob mints for bob
            const [
              functionSignature,
              { r: metaTxnR, s: metaTxnS, v: metaTxnV },
            ] = await prepareNativeMetaTxnSignatureWithReferrer(
              erc721Soulbound,
              bob,
              {
                to: bob.address,
                r,
                s,
                v,
                referrer: ethers.constants.AddressZero,
              }
            );
            await expect(
              erc721Soulbound
                .connect(relayer)
                .executeMetaTransaction(
                  bob.address,
                  functionSignature,
                  metaTxnR,
                  metaTxnS,
                  metaTxnV
                )
            ).to.be.reverted;
          });

          it("should revert if signature is not for `to` - msgSender() != to", async () => {
            const { v, r, s } = await ERC721_generateSignature(
              erc721Soulbound,
              trustedAddress,
              bob.address // signature for bob
            );

            expect(
              (await erc721Soulbound.balanceOf(bob.address)).toNumber()
            ).to.eq(0);
            expect(await erc721Soulbound.nextTokenId()).to.eq(1);
            expect(await erc721Soulbound.ownerOf(1)).to.eq(ZERO_ADDRESS);
            expect(await erc721Soulbound.claims(bob.address)).to.eq(0);
            expect(await erc721Soulbound.getNonce(bob.address)).to.eq(0);

            // bob mints for charlie
            const [
              functionSignature,
              { r: metaTxnR, s: metaTxnS, v: metaTxnV },
            ] = await prepareNativeMetaTxnSignatureWithReferrer(
              erc721Soulbound,
              bob,
              {
                to: charlie.address,
                r,
                s,
                v,
                referrer: ethers.constants.AddressZero,
              }
            );
            await expect(
              erc721Soulbound
                .connect(relayer)
                .executeMetaTransaction(
                  bob.address,
                  functionSignature,
                  metaTxnR,
                  metaTxnS,
                  metaTxnV
                )
            ).to.be.reverted;
          });

          it("should reject on invalid signer - wrong trustedAddress", async () => {
            const { domain, types, value } = getEIP712TypedData({
              to: bob.address,
              contractAddress: erc721Soulbound.address,
              chainId: hre.network.config.chainId as number,
              domainName: await erc721Soulbound.name(),
              domainVersion: "1.0",
            });
            const rawSignature: string = await bob._signTypedData(
              domain,
              types,
              value
            );
            const { v, r, s } = ethers.utils.splitSignature(rawSignature);

            let [functionSignature, { r: metaTxnR, s: metaTxnS, v: metaTxnV }] =
              await prepareNativeMetaTxnSignatureWithReferrer(
                erc721Soulbound,
                bob,
                {
                  to: bob.address,
                  r,
                  s,
                  v,
                  referrer: ethers.constants.AddressZero,
                }
              );

            await expect(
              erc721Soulbound
                .connect(relayer)
                .executeMetaTransaction(
                  bob.address,
                  functionSignature,
                  metaTxnR,
                  metaTxnS,
                  metaTxnV,
                  { value: MINT_FEE }
                )
            ).to.be.reverted;

            // try minting to another address
            [functionSignature, { r: metaTxnR, s: metaTxnS, v: metaTxnV }] =
              await prepareNativeMetaTxnSignatureWithReferrer(
                erc721Soulbound,
                bob,
                {
                  to: charlie.address,
                  r,
                  s,
                  v,
                  referrer: ethers.constants.AddressZero,
                }
              );

            await expect(
              erc721Soulbound
                .connect(relayer)
                .executeMetaTransaction(
                  bob.address,
                  functionSignature,
                  metaTxnR,
                  metaTxnS,
                  metaTxnV,
                  { value: MINT_FEE }
                )
            ).to.be.reverted;
          });

          it("should reject on signature used by someone else", async () => {
            const { domain, types, value } = getEIP712TypedData({
              to: bob.address, // signature meant to be used by `user`
              contractAddress: erc721Soulbound.address,
              chainId: hre.network.config.chainId as number,
              domainName: await erc721Soulbound.name(),
              domainVersion: "1.0",
            });
            const rawSignature: string = await trustedAddress._signTypedData(
              domain,
              types,
              value
            );
            const { v, r, s } = ethers.utils.splitSignature(rawSignature);

            // charlie tries minting to charlie with signature for `bob`
            let [functionSignature, { r: metaTxnR, s: metaTxnS, v: metaTxnV }] =
              await prepareNativeMetaTxnSignatureWithReferrer(
                erc721Soulbound,
                charlie,
                {
                  to: charlie.address,
                  r,
                  s,
                  v,
                  referrer: ethers.constants.AddressZero,
                }
              );

            await expect(
              erc721Soulbound
                .connect(relayer)
                .executeMetaTransaction(
                  charlie.address,
                  functionSignature,
                  metaTxnR,
                  metaTxnS,
                  metaTxnV,
                  { value: MINT_FEE }
                )
            ).to.be.reverted;

            // charlie tries minting to alice with signature for `bob`
            [functionSignature, { r: metaTxnR, s: metaTxnS, v: metaTxnV }] =
              await prepareNativeMetaTxnSignatureWithReferrer(
                erc721Soulbound,
                charlie,
                {
                  to: alice.address,
                  r,
                  s,
                  v,
                  referrer: ethers.constants.AddressZero,
                }
              );

            await expect(
              erc721Soulbound
                .connect(relayer)
                .executeMetaTransaction(
                  charlie.address,
                  functionSignature,
                  metaTxnR,
                  metaTxnS,
                  metaTxnV,
                  { value: MINT_FEE }
                )
            ).to.be.reverted;

            // charlie tries minting to bob with signature for `bob`, which should work
            [functionSignature, { r: metaTxnR, s: metaTxnS, v: metaTxnV }] =
              await prepareNativeMetaTxnSignatureWithReferrer(
                erc721Soulbound,
                charlie,
                {
                  to: bob.address,
                  r,
                  s,
                  v,
                  referrer: ethers.constants.AddressZero,
                }
              );

            await erc721Soulbound
              .connect(relayer)
              .executeMetaTransaction(
                charlie.address,
                functionSignature,
                metaTxnR,
                metaTxnS,
                metaTxnV,
                { value: MINT_FEE }
              );

            // nft transferred to bob, not charlie
            expect(
              (await erc721Soulbound.balanceOf(charlie.address)).toNumber()
            ).to.eq(0);
            expect(
              (await erc721Soulbound.balanceOf(bob.address)).toNumber()
            ).to.eq(1);
            expect(await erc721Soulbound.nextTokenId()).to.eq(2);
            expect(await erc721Soulbound.ownerOf(1)).to.eq(bob.address);
            expect(await erc721Soulbound.claims(bob.address)).to.eq(1);
            expect(await erc721Soulbound.getNonce(charlie.address)).to.eq(1);
          });

          it("should revert on signature replay", async () => {
            // mint token 1 on contract A
            const deployERC721SoulboundToken_A =
              await erc721TokenFactory.deployERC721Token(
                TokenType.ERC721SoulboundToken,
                encodeInitializationDataWithSponsoredMints([
                  "ERC721Soulbound_A",
                  "ERC721Soulbound_A",
                  "https://example.com/contractURI",
                  "https://example.com",
                  alice.address,
                  trustedAddress.address,
                  10,
                  0,
                ]),
                +new Date()
              );
            const receipt_A = await deployERC721SoulboundToken_A.wait();
            const erc721SoulboundTokenCloneAddress_A = getArgFromEvent(
              erc721TokenFactory,
              receipt_A,
              erc721TokenFactory.interface.events[
                "ERC721TokenDeployed(uint8,address,address,address)"
              ].name,
              "_erc721TokenClone"
            );
            const erc721Soulbound_A = await ethers.getContractAt(
              "ERC721SoulboundTokenImpl",
              erc721SoulboundTokenCloneAddress_A
            );
            const { domain, types, value } = getEIP712TypedData({
              to: bob.address,
              contractAddress: erc721Soulbound_A.address,
              chainId: hre.network.config.chainId as number,
              domainName: "ERC721Soulbound_A", // contract A name
              domainVersion: "1.0",
            });
            const rawSignature: string = await trustedAddress._signTypedData(
              domain,
              types,
              value
            );
            const { v, r, s } = ethers.utils.splitSignature(rawSignature);
            let [functionSignature, { r: metaTxnR, s: metaTxnS, v: metaTxnV }] =
              await prepareNativeMetaTxnSignatureWithReferrer(
                erc721Soulbound_A,
                bob,
                {
                  to: bob.address,
                  r,
                  s,
                  v,
                  referrer: ethers.constants.AddressZero,
                }
              );

            await erc721Soulbound_A
              .connect(relayer)
              .executeMetaTransaction(
                bob.address,
                functionSignature,
                metaTxnR,
                metaTxnS,
                metaTxnV,
                { value: MINT_FEE }
              );

            // replay signature from contract A to mint from contract B
            const deployERC721SoulboundToken_B =
              await erc721TokenFactory.deployERC721Token(
                TokenType.ERC721SoulboundToken,
                encodeInitializationDataWithSponsoredMints([
                  "ERC721Soulbound_B",
                  "ERC721Soulbound_B",
                  "https://example.com/contractURI",
                  "https://example.com",
                  alice.address,
                  trustedAddress.address,
                  10,
                  0,
                ]),
                +new Date()
              );
            const receipt_B = await deployERC721SoulboundToken_B.wait();
            const erc721SoulboundTokenCloneAddress_B = getArgFromEvent(
              erc721TokenFactory,
              receipt_B,
              erc721TokenFactory.interface.events[
                "ERC721TokenDeployed(uint8,address,address,address)"
              ].name,
              "_erc721TokenClone"
            );
            const erc721_B = await ethers.getContractAt(
              "ERC721SoulboundTokenImpl",
              erc721SoulboundTokenCloneAddress_B
            );
            await expect(
              erc721_B
                .connect(relayer)
                .executeMetaTransaction(
                  bob.address,
                  functionSignature,
                  metaTxnR,
                  metaTxnS,
                  metaTxnV,
                  { value: MINT_FEE }
                )
            ).to.be.reverted;

            // try minting to another address
            [functionSignature] =
              await prepareNativeMetaTxnSignatureWithReferrer(
                erc721Soulbound_A,
                bob,
                {
                  to: charlie.address,
                  r,
                  s,
                  v,
                  referrer: ethers.constants.AddressZero,
                }
              );
            await expect(
              erc721_B
                .connect(relayer)
                .executeMetaTransaction(
                  bob.address,
                  functionSignature,
                  metaTxnR,
                  metaTxnS,
                  metaTxnV,
                  { value: MINT_FEE }
                )
            ).to.be.reverted;
          });
        });

        describe("mintFee", async function () {
          it("Should revert on mint() if correct fee not paid", async function () {
            const { v, r, s } = await ERC721_generateSignature(
              erc721Soulbound,
              trustedAddress,
              bob.address
            );
            const [
              functionSignature,
              { r: metaTxnR, s: metaTxnS, v: metaTxnV },
            ] = await prepareNativeMetaTxnSignatureWithReferrer(
              erc721Soulbound,
              bob,
              {
                to: bob.address,
                r,
                s,
                v,
                referrer: ethers.constants.AddressZero,
              }
            );

            // zero fees
            await expect(
              erc721Soulbound
                .connect(relayer)
                .executeMetaTransaction(
                  bob.address,
                  functionSignature,
                  metaTxnR,
                  metaTxnS,
                  metaTxnV
                )
            ).to.be.reverted;

            // less fees
            await expect(
              erc721Soulbound
                .connect(relayer)
                .executeMetaTransaction(
                  bob.address,
                  functionSignature,
                  metaTxnR,
                  metaTxnS,
                  metaTxnV,
                  { value: MINT_FEE.sub(1) }
                )
            ).to.be.reverted;

            // more fees
            await expect(
              erc721Soulbound
                .connect(relayer)
                .executeMetaTransaction(
                  bob.address,
                  functionSignature,
                  metaTxnR,
                  metaTxnS,
                  metaTxnV,
                  { value: MINT_FEE.add(1) }
                )
            ).to.be.reverted;
          });

          it("Should split and deposit rewards - no referrer", async () => {
            const { v, r, s } = await ERC721_generateSignature(
              erc721Soulbound,
              trustedAddress,
              bob.address
            );
            const [
              functionSignature,
              { r: metaTxnR, s: metaTxnS, v: metaTxnV },
            ] = await prepareNativeMetaTxnSignatureWithReferrer(
              erc721Soulbound,
              bob,
              {
                to: bob.address,
                r,
                s,
                v,
                referrer: ethers.constants.AddressZero,
              }
            );

            await erc721Soulbound
              .connect(relayer)
              .executeMetaTransaction(
                bob.address,
                functionSignature,
                metaTxnR,
                metaTxnS,
                metaTxnV,
                { value: MINT_FEE }
              );

            const rewardAmount = MINT_FEE;
            const expectedPlatformShare = rewardAmount
              .mul(PLATFORM_SHARE)
              .div(BASIS_POINTS)
              .add(rewardAmount.mul(REFERRER_SHARE).div(BASIS_POINTS));
            const expectedCreatorShare = rewardAmount
              .mul(CREATOR_SHARE)
              .div(BASIS_POINTS);
            const expectedReferrerShare = 0;

            const platform = MINT_FEE_RECIPIENT;
            const creator = await erc721Soulbound.owner();
            const referrer = ethers.constants.AddressZero;

            expect(await protocolRewards.balanceOf(platform)).to.eq(
              expectedPlatformShare
            );
            expect(await protocolRewards.balanceOf(creator)).to.eq(
              expectedCreatorShare
            );
            expect(await protocolRewards.balanceOf(referrer)).to.eq(
              expectedReferrerShare
            );
          });
          it("Should split and deposit rewards - yes referrer", async () => {
            const { v, r, s } = await ERC721_generateSignature(
              erc721Soulbound,
              trustedAddress,
              bob.address
            );
            const [
              functionSignature,
              { r: metaTxnR, s: metaTxnS, v: metaTxnV },
            ] = await prepareNativeMetaTxnSignatureWithReferrer(
              erc721Soulbound,
              bob,
              {
                to: bob.address,
                r,
                s,
                v,
                referrer: referrer.address,
              }
            );

            await erc721Soulbound
              .connect(relayer)
              .executeMetaTransaction(
                bob.address,
                functionSignature,
                metaTxnR,
                metaTxnS,
                metaTxnV,
                { value: MINT_FEE }
              );

            const rewardAmount = MINT_FEE;
            const expectedPlatformShare = rewardAmount
              .mul(PLATFORM_SHARE)
              .div(BASIS_POINTS);
            const expectedCreatorShare = rewardAmount
              .mul(CREATOR_SHARE)
              .div(BASIS_POINTS);
            const expectedReferrerShare = rewardAmount
              .mul(REFERRER_SHARE)
              .div(BASIS_POINTS);

            const platform = MINT_FEE_RECIPIENT;
            const creator = await erc721Soulbound.owner();

            expect(await protocolRewards.balanceOf(platform)).to.eq(
              expectedPlatformShare
            );
            expect(await protocolRewards.balanceOf(creator)).to.eq(
              expectedCreatorShare
            );
            expect(await protocolRewards.balanceOf(referrer.address)).to.eq(
              expectedReferrerShare
            );
          });

          it("Should emit MintFeePaid() on mint()", async () => {
            const { v, r, s } = await ERC721_generateSignature(
              erc721Soulbound,
              trustedAddress,
              bob.address
            );
            const [
              functionSignature,
              { r: metaTxnR, s: metaTxnS, v: metaTxnV },
            ] = await prepareNativeMetaTxnSignatureWithReferrer(
              erc721Soulbound,
              bob,
              {
                to: bob.address,
                r,
                s,
                v,
                referrer: ethers.constants.AddressZero,
              }
            );

            await expect(
              erc721Soulbound
                .connect(relayer)
                .executeMetaTransaction(
                  bob.address,
                  functionSignature,
                  metaTxnR,
                  metaTxnS,
                  metaTxnV,
                  { value: MINT_FEE }
                )
            )
              .to.emit(erc721Soulbound, "MintFeePaid")
              .withArgs(
                MINT_FEE,
                bob.address,
                MINT_FEE_RECIPIENT,
                await erc721.owner(),
                ethers.constants.AddressZero
              );
          });
        });

        describe("sponsoredMints", () => {
          beforeEach(async () => {
            // Deploy new ERC721Token via ERC721TokenFactory
            const deployERC721Token = await erc721TokenFactory
              .connect(alice)
              .deployERC721Token(
                TokenType.ERC721SoulboundToken,
                encodeInitializationDataWithSponsoredMints([
                  "TestToken",
                  "TEST",
                  "https://example.com/contractURI",
                  "https://example.com",
                  alice.address,
                  trustedAddress.address,
                  10,
                  3,
                ]),
                +new Date(),
                { value: SPONSORED_MINT_FEE.mul(3) }
              );
            const receipt = await deployERC721Token.wait();
            const erc721TokenCloneAddress = getArgFromEvent(
              erc721TokenFactory,
              receipt,
              erc721TokenFactory.interface.events[
                "ERC721TokenDeployed(uint8,address,address,address)"
              ].name,
              "_erc721TokenClone"
            );
            erc721Soulbound = await ethers.getContractAt(
              "ERC721SoulboundTokenImpl",
              erc721TokenCloneAddress
            );
          });

          it("should charge mint fee for any mints if maxSponsoredMints = 0 ", async () => {
            // Deploy new ERC721Token via ERC721TokenFactory
            const deployERC721Token = await erc721TokenFactory
              .connect(alice)
              .deployERC721Token(
                TokenType.ERC721SoulboundToken,
                encodeInitializationDataWithSponsoredMints([
                  "TestToken",
                  "TEST",
                  "https://example.com/contractURI",
                  "https://example.com",
                  alice.address,
                  trustedAddress.address,
                  10,
                  0,
                ]),
                +new Date()
              );
            const receipt = await deployERC721Token.wait();
            const erc721TokenCloneAddress = getArgFromEvent(
              erc721TokenFactory,
              receipt,
              erc721TokenFactory.interface.events[
                "ERC721TokenDeployed(uint8,address,address,address)"
              ].name,
              "_erc721TokenClone"
            );
            erc721Soulbound = await ethers.getContractAt(
              "ERC721SoulboundTokenImpl",
              erc721TokenCloneAddress
            );

            const { v, r, s } = await ERC721_generateSignature(
              erc721Soulbound,
              trustedAddress,
              bob.address
            );

            const [
              functionSignature,
              { r: metaTxnR, s: metaTxnS, v: metaTxnV },
            ] = await prepareNativeMetaTxnSignatureWithReferrer(
              erc721Soulbound,
              bob,
              {
                to: bob.address,
                r,
                s,
                v,
                referrer: ethers.constants.AddressZero,
              }
            );

            expect(await erc721Soulbound.sponsoredMints()).to.eq(0);
            await erc721Soulbound
              .connect(relayer)
              .executeMetaTransaction(
                bob.address,
                functionSignature,
                metaTxnR,
                metaTxnS,
                metaTxnV,
                { value: MINT_FEE }
              );
            expect(await erc721Soulbound.sponsoredMints()).to.eq(0);

            const platform = MINT_FEE_RECIPIENT;
            const creator = await erc721Soulbound.owner();
            const referrer = ethers.constants.AddressZero;

            const rewardAmount = MINT_FEE;
            const expectedPlatformShare = rewardAmount
              .mul(PLATFORM_SHARE)
              .div(BASIS_POINTS)
              .add(rewardAmount.mul(REFERRER_SHARE).div(BASIS_POINTS));
            const expectedCreatorShare = rewardAmount
              .mul(CREATOR_SHARE)
              .div(BASIS_POINTS);
            const expectedReferrerShare = 0;

            expect(await protocolRewards.balanceOf(platform)).to.eq(
              expectedPlatformShare
            );
            expect(await protocolRewards.balanceOf(creator)).to.eq(
              expectedCreatorShare
            );
            expect(await protocolRewards.balanceOf(referrer)).to.eq(
              expectedReferrerShare
            );
          });

          it("Should not charge mint fee sponsoredMints < maxSponsoredMints", async function () {
            const mint = async (user: SignerWithAddress, mintFee = true) => {
              const { v, r, s } = await ERC721_generateSignature(
                erc721Soulbound,
                trustedAddress,
                user.address
              );

              const [
                functionSignature,
                { r: metaTxnR, s: metaTxnS, v: metaTxnV },
              ] = await prepareNativeMetaTxnSignatureWithReferrer(
                erc721Soulbound,
                user,
                {
                  to: user.address,
                  r,
                  s,
                  v,
                  referrer: ethers.constants.AddressZero,
                }
              );

              return await erc721Soulbound
                .connect(relayer)
                .executeMetaTransaction(
                  user.address,
                  functionSignature,
                  metaTxnR,
                  metaTxnS,
                  metaTxnV,
                  { value: mintFee ? MINT_FEE : 0 }
                );
            };

            const platform = MINT_FEE_RECIPIENT;
            const creator = await erc721Soulbound.owner();
            const referrer = ethers.constants.AddressZero;

            expect(await erc721Soulbound.sponsoredMints()).to.eq(0);
            await mint(bob, false);
            expect(await erc721Soulbound.sponsoredMints()).to.eq(1);
            expect(await protocolRewards.balanceOf(platform)).to.eq(0);
            expect(await protocolRewards.balanceOf(creator)).to.eq(0);
            expect(await protocolRewards.balanceOf(referrer)).to.eq(0);

            await mint(charlie, false);
            expect(await erc721Soulbound.sponsoredMints()).to.eq(2);
            expect(await protocolRewards.balanceOf(platform)).to.eq(0);
            expect(await protocolRewards.balanceOf(creator)).to.eq(0);
            expect(await protocolRewards.balanceOf(referrer)).to.eq(0);

            await mint(david, false);
            expect(await erc721Soulbound.sponsoredMints()).to.eq(3);
            expect(await protocolRewards.balanceOf(platform)).to.eq(0);
            expect(await protocolRewards.balanceOf(creator)).to.eq(0);
            expect(await protocolRewards.balanceOf(referrer)).to.eq(0);

            const rewardAmount = MINT_FEE;
            const expectedPlatformShare = rewardAmount
              .mul(PLATFORM_SHARE)
              .div(BASIS_POINTS)
              .add(rewardAmount.mul(REFERRER_SHARE).div(BASIS_POINTS));
            const expectedCreatorShare = rewardAmount
              .mul(CREATOR_SHARE)
              .div(BASIS_POINTS);
            const expectedReferrerShare = 0;

            await mint(eve, true);
            expect(await erc721Soulbound.sponsoredMints()).to.eq(3);
            expect(await protocolRewards.balanceOf(platform)).to.eq(
              expectedPlatformShare
            );
            expect(await protocolRewards.balanceOf(creator)).to.eq(
              expectedCreatorShare
            );
            expect(await protocolRewards.balanceOf(referrer)).to.eq(
              expectedReferrerShare
            );
          });

          it("should allow increasing maxSponsoredMints in between mints", async () => {
            const mint = async (user: SignerWithAddress, mintFee = true) => {
              const { v, r, s } = await ERC721_generateSignature(
                erc721Soulbound,
                trustedAddress,
                user.address
              );

              const [
                functionSignature,
                { r: metaTxnR, s: metaTxnS, v: metaTxnV },
              ] = await prepareNativeMetaTxnSignatureWithReferrer(
                erc721Soulbound,
                user,
                {
                  to: user.address,
                  r,
                  s,
                  v,
                  referrer: ethers.constants.AddressZero,
                }
              );

              return await erc721Soulbound
                .connect(relayer)
                .executeMetaTransaction(
                  user.address,
                  functionSignature,
                  metaTxnR,
                  metaTxnS,
                  metaTxnV,
                  { value: mintFee ? MINT_FEE : 0 }
                );
            };

            await mint(bob, false);
            await mint(charlie, false);
            await mint(david, false);
            expect(await erc721Soulbound.sponsoredMints()).to.eq(3);
            expect(await erc721Soulbound.maxSponsoredMints()).to.eq(3);

            await mint(eve, true);
            expect(await erc721Soulbound.sponsoredMints()).to.eq(3);
            expect(await erc721Soulbound.maxSponsoredMints()).to.eq(3);

            await erc721Soulbound.connect(alice).increaseMaxSponsoredMints(2, {
              value: SPONSORED_MINT_FEE.mul(2),
            });

            await mint(frank, false);
            expect(await erc721Soulbound.sponsoredMints()).to.eq(4);
            expect(await erc721Soulbound.maxSponsoredMints()).to.eq(5);

            await mint(george, false);
            expect(await erc721Soulbound.sponsoredMints()).to.eq(5);
            expect(await erc721Soulbound.maxSponsoredMints()).to.eq(5);

            await mint(harry, true);
            expect(await erc721Soulbound.sponsoredMints()).to.eq(5);
            expect(await erc721Soulbound.maxSponsoredMints()).to.eq(5);
          });

          it("should revert if mint fee is paid even for sponsored mint", async () => {
            const { v, r, s } = await ERC721_generateSignature(
              erc721Soulbound,
              trustedAddress,
              bob.address
            );

            const [
              functionSignature,
              { r: metaTxnR, s: metaTxnS, v: metaTxnV },
            ] = await prepareNativeMetaTxnSignatureWithReferrer(
              erc721Soulbound,
              bob,
              {
                to: bob.address,
                r,
                s,
                v,
                referrer: ethers.constants.AddressZero,
              }
            );

            await expect(
              erc721Soulbound
                .connect(relayer)
                .executeMetaTransaction(
                  bob.address,
                  functionSignature,
                  metaTxnR,
                  metaTxnS,
                  metaTxnV,
                  { value: MINT_FEE }
                )
            ).to.be.reverted;
          });
        });

        it("should emit Transfer on mint", async () => {
          const { v, r, s } = await ERC721_generateSignature(
            erc721Soulbound,
            trustedAddress,
            bob.address
          );
          const [functionSignature, { r: metaTxnR, s: metaTxnS, v: metaTxnV }] =
            await prepareNativeMetaTxnSignatureWithReferrer(
              erc721Soulbound,
              bob,
              {
                to: bob.address,
                r,
                s,
                v,
                referrer: ethers.constants.AddressZero,
              }
            );

          await expect(
            erc721Soulbound
              .connect(relayer)
              .executeMetaTransaction(
                bob.address,
                functionSignature,
                metaTxnR,
                metaTxnS,
                metaTxnV,
                { value: MINT_FEE }
              )
          )
            .to.emit(erc721Soulbound, "Transfer")
            .withArgs(ZERO_ADDRESS, bob.address, 1);

          expect(
            (await erc721Soulbound.balanceOf(bob.address)).toNumber()
          ).to.eq(1);
          expect(await erc721Soulbound.ownerOf(1)).to.eq(bob.address);
        });

        it("should revert if to == referrer", async () => {
          const { v, r, s } = await ERC721_generateSignature(
            erc721Soulbound,
            trustedAddress,
            bob.address
          );

          const [functionSignature, { r: metaTxnR, s: metaTxnS, v: metaTxnV }] =
            await prepareNativeMetaTxnSignatureWithReferrer(
              erc721Soulbound,
              bob,
              {
                to: bob.address,
                r,
                s,
                v,
                referrer: bob.address,
              }
            );

          await expect(
            erc721Soulbound
              .connect(relayer)
              .executeMetaTransaction(
                bob.address,
                functionSignature,
                metaTxnR,
                metaTxnS,
                metaTxnV,
                { value: MINT_FEE }
              )
          ).to.be.reverted;
        });

        it("should throw an error if minted past max supply", async () => {
          const deployERC721SoulboundToken =
            await erc721TokenFactory.deployERC721Token(
              TokenType.ERC721SoulboundToken,
              encodeInitializationDataWithSponsoredMints([
                "TestToken",
                "TEST",
                "https://example.com/contractURI",
                "https://example.com",
                alice.address,
                trustedAddress.address,
                1,
                0,
              ]), // only 1 maxSupply
              +new Date()
            );
          const receipt = await deployERC721SoulboundToken.wait();
          const erc721SoulboundTokenCloneAddress = getArgFromEvent(
            erc721TokenFactory,
            receipt,
            erc721TokenFactory.interface.events[
              "ERC721TokenDeployed(uint8,address,address,address)"
            ].name,
            "_erc721TokenClone"
          );
          erc721Soulbound = await ethers.getContractAt(
            "ERC721SoulboundTokenImpl",
            erc721SoulboundTokenCloneAddress
          );

          const mint = async (user: SignerWithAddress) => {
            const { v, r, s } = await ERC721_generateSignature(
              erc721Soulbound,
              trustedAddress,
              user.address
            );
            const [
              functionSignature,
              { r: metaTxnR, s: metaTxnS, v: metaTxnV },
            ] = await prepareNativeMetaTxnSignatureWithReferrer(
              erc721Soulbound,
              user,
              {
                to: user.address,
                r,
                s,
                v,
                referrer: ethers.constants.AddressZero,
              }
            );

            await erc721Soulbound
              .connect(relayer)
              .executeMetaTransaction(
                user.address,
                functionSignature,
                metaTxnR,
                metaTxnS,
                metaTxnV,
                { value: MINT_FEE }
              );
          };
          await mint(bob);
          await expect(mint(charlie)).to.reverted;
        });

        it("should not allow claiming again", async () => {
          let { v, r, s } = await ERC721_generateSignature(
            erc721Soulbound,
            trustedAddress,
            bob.address // signature for bob
          );

          // bob mints for bob
          let [functionSignature, { r: metaTxnR, s: metaTxnS, v: metaTxnV }] =
            await prepareNativeMetaTxnSignatureWithReferrer(
              erc721Soulbound,
              bob,
              {
                to: bob.address,
                r,
                s,
                v,
                referrer: ethers.constants.AddressZero,
              }
            );
          await erc721Soulbound
            .connect(relayer)
            .executeMetaTransaction(
              bob.address,
              functionSignature,
              metaTxnR,
              metaTxnS,
              metaTxnV,
              { value: MINT_FEE }
            );

          //  try minting again
          await expect(
            erc721Soulbound
              .connect(relayer)
              .executeMetaTransaction(
                bob.address,
                functionSignature,
                metaTxnR,
                metaTxnS,
                metaTxnV,
                { value: MINT_FEE }
              )
          ).to.be.reverted;

          // charlie mints for bob
          [functionSignature, { r: metaTxnR, s: metaTxnS, v: metaTxnV }] =
            await prepareNativeMetaTxnSignatureWithReferrer(
              erc721Soulbound,
              charlie,
              {
                to: bob.address,
                r,
                s,
                v,
                referrer: ethers.constants.AddressZero,
              }
            );
          await expect(
            erc721Soulbound
              .connect(relayer)
              .executeMetaTransaction(
                charlie.address,
                functionSignature,
                metaTxnR,
                metaTxnS,
                metaTxnV,
                { value: MINT_FEE }
              )
          ).to.be.reverted;

          // Try latest signature
          ({ v, r, s } = await ERC721_generateSignature(
            erc721Soulbound,
            trustedAddress,
            bob.address
          ));
          [functionSignature, { r: metaTxnR, s: metaTxnS, v: metaTxnV }] =
            await prepareNativeMetaTxnSignatureWithReferrer(
              erc721Soulbound,
              bob,
              {
                to: bob.address,
                r,
                s,
                v,
                referrer: ethers.constants.AddressZero,
              }
            );
          //  try minting again with the new signature
          await expect(
            erc721Soulbound
              .connect(relayer)
              .executeMetaTransaction(
                bob.address,
                functionSignature,
                metaTxnR,
                metaTxnS,
                metaTxnV,
                { value: MINT_FEE }
              )
          ).to.be.reverted;
          //  try minting to another address
          [functionSignature, { r: metaTxnR, s: metaTxnS, v: metaTxnV }] =
            await prepareNativeMetaTxnSignatureWithReferrer(
              erc721Soulbound,
              bob,
              {
                to: charlie.address,
                r,
                s,
                v,
                referrer: ethers.constants.AddressZero,
              }
            );
          await expect(
            erc721Soulbound
              .connect(relayer)
              .executeMetaTransaction(
                bob.address,
                functionSignature,
                metaTxnR,
                metaTxnS,
                metaTxnV,
                { value: MINT_FEE }
              )
          ).to.be.reverted;
        });
      });
    });
  });

  describe("ERC721TokenNativeGaslessMintImpl", async function () {
    describe("deploy", async function () {
      it("Should deploy ERC721TokenNativeGaslessMintImpl logic contract", async function () {
        // Deploy ERC721TokenNativeGaslessMintImpl logic contract
        const ERC721TokenNativeGaslessMintImpl =
          await ethers.getContractFactory("ERC721TokenNativeGaslessMintImpl");
        await ERC721TokenNativeGaslessMintImpl.deploy();
      });
    });

    describe("initialize()", async function () {
      it("Should revert if anyone tries to initialize() after deployment", async function () {
        // Deploy ERC721TokenNativeGaslessMintImpl logic contract
        const ERC721TokenNativeGaslessMintImpl =
          await ethers.getContractFactory("ERC721TokenNativeGaslessMintImpl");
        let erc721TokenNativeGaslessMintImpl =
          await ERC721TokenNativeGaslessMintImpl.deploy();

        // Try calling initialize
        await expect(
          erc721TokenNativeGaslessMintImpl.initialize(
            encodeInitializationData([
              "TestToken",
              "TEST",
              "https://example.com/contractURI",
              "https://example.com",
              owner.address,
              trustedAddress.address,
              10,
            ])
          )
        ).to.be.revertedWith("Initializable: contract is already initialized");
      });

      it("should initialize with custom name and symbol", async () => {
        expect(await erc721TokenNativeGaslessMint.name()).to.eq("TestToken");
        expect(await erc721TokenNativeGaslessMint.symbol()).to.eq("TEST");
        expect(await erc721TokenNativeGaslessMint.maxSupply()).to.eq(10);
        expect(await erc721TokenNativeGaslessMint.contractURI()).to.eq(
          "https://example.com/contractURI"
        );
        expect(await erc721TokenNativeGaslessMint.tokenURI(1)).to.eq(
          "https://example.com"
        );
        expect(await erc721TokenNativeGaslessMint.nextTokenId()).to.eq(1);
        expect(await erc721TokenNativeGaslessMint.owner()).to.eq(alice.address);
        expect(await erc721TokenNativeGaslessMint.getNonce(bob.address)).to.eq(
          0
        );
      });

      it("should not allow initializing with empty trusted address", async () => {
        await expect(
          erc721TokenFactory.deployERC721Token(
            TokenType.ERC721TokenNativeGaslessMint,
            encodeInitializationData([
              "TestToken",
              "TEST",
              "https://example.com/contractURI",
              "https://example.com",
              alice.address,
              ZERO_ADDRESS,
              10,
            ]),
            +new Date()
          )
        ).to.be.revertedWith("InvalidAddress");
      });
    });

    describe("mint()", async function () {
      describe("signature", async function () {
        it("should allow minting with a trusted address - msg.sender == to", async () => {
          const { v, r, s } = await ERC721_generateSignature(
            erc721TokenNativeGaslessMint,
            trustedAddress,
            bob.address
          );

          expect(
            (
              await erc721TokenNativeGaslessMint.balanceOf(bob.address)
            ).toNumber()
          ).to.eq(0);
          expect(await erc721TokenNativeGaslessMint.nextTokenId()).to.eq(1);
          await expect(
            erc721TokenNativeGaslessMint.ownerOf(1)
          ).to.be.revertedWith("ERC721: invalid token ID");
          expect(await erc721TokenNativeGaslessMint.claims(bob.address)).to.eq(
            0
          );
          expect(
            await erc721TokenNativeGaslessMint.getNonce(bob.address)
          ).to.eq(0);

          await erc721TokenNativeGaslessMint
            .connect(bob)
            .mint(bob.address, r, s, v);

          expect(
            (
              await erc721TokenNativeGaslessMint.balanceOf(bob.address)
            ).toNumber()
          ).to.eq(1);
          expect(await erc721TokenNativeGaslessMint.nextTokenId()).to.eq(2);
          expect(await erc721TokenNativeGaslessMint.ownerOf(1)).to.eq(
            bob.address
          );
          expect(await erc721TokenNativeGaslessMint.claims(bob.address)).to.eq(
            1
          );
          expect(
            await erc721TokenNativeGaslessMint.getNonce(bob.address)
          ).to.eq(0);
        });

        it("should allow minting with a trusted address - msg.sender != to", async () => {
          const { v, r, s } = await ERC721_generateSignature(
            erc721TokenNativeGaslessMint,
            trustedAddress,
            charlie.address // signature for charlie
          );

          expect(
            (
              await erc721TokenNativeGaslessMint.balanceOf(charlie.address)
            ).toNumber()
          ).to.eq(0);
          expect(await erc721TokenNativeGaslessMint.nextTokenId()).to.eq(1);
          await expect(
            erc721TokenNativeGaslessMint.ownerOf(1)
          ).to.be.revertedWith("ERC721: invalid token ID");
          expect(
            await erc721TokenNativeGaslessMint.claims(charlie.address)
          ).to.eq(0);
          expect(
            await erc721TokenNativeGaslessMint.getNonce(charlie.address)
          ).to.eq(0);

          // bob mints for charlie
          await erc721TokenNativeGaslessMint
            .connect(bob)
            .mint(charlie.address, r, s, v);

          // nft transferred to charlie, not bob
          expect(
            (
              await erc721TokenNativeGaslessMint.balanceOf(bob.address)
            ).toNumber()
          ).to.eq(0);
          expect(
            (
              await erc721TokenNativeGaslessMint.balanceOf(charlie.address)
            ).toNumber()
          ).to.eq(1);
          expect(await erc721TokenNativeGaslessMint.nextTokenId()).to.eq(2);
          expect(await erc721TokenNativeGaslessMint.ownerOf(1)).to.eq(
            charlie.address
          );
          // claimer should still be charlie, not bob
          expect(
            await erc721TokenNativeGaslessMint.claims(charlie.address)
          ).to.eq(1);
          expect(await erc721TokenNativeGaslessMint.claims(bob.address)).to.eq(
            0
          );
          expect(
            await erc721TokenNativeGaslessMint.getNonce(charlie.address)
          ).to.eq(0);
          expect(
            await erc721TokenNativeGaslessMint.getNonce(bob.address)
          ).to.eq(0);
        });

        it("should revert if signature is not for `to` - msg.sender == to", async () => {
          const { v, r, s } = await ERC721_generateSignature(
            erc721TokenNativeGaslessMint,
            trustedAddress,
            charlie.address // signature for charlie
          );

          expect(
            (
              await erc721TokenNativeGaslessMint.balanceOf(bob.address)
            ).toNumber()
          ).to.eq(0);
          expect(await erc721TokenNativeGaslessMint.nextTokenId()).to.eq(1);
          await expect(
            erc721TokenNativeGaslessMint.ownerOf(1)
          ).to.be.revertedWith("ERC721: invalid token ID");
          expect(await erc721TokenNativeGaslessMint.claims(bob.address)).to.eq(
            0
          );
          expect(
            await erc721TokenNativeGaslessMint.getNonce(bob.address)
          ).to.eq(0);

          // bob mints for bob
          await expect(
            erc721TokenNativeGaslessMint.connect(bob).mint(bob.address, r, s, v)
          ).to.be.reverted;
        });

        it("should revert if signature is not for `to` - msg.sender != to", async () => {
          const { v, r, s } = await ERC721_generateSignature(
            erc721TokenNativeGaslessMint,
            trustedAddress,
            bob.address // signature for bob
          );

          expect(
            (
              await erc721TokenNativeGaslessMint.balanceOf(bob.address)
            ).toNumber()
          ).to.eq(0);
          expect(await erc721TokenNativeGaslessMint.nextTokenId()).to.eq(1);
          await expect(
            erc721TokenNativeGaslessMint.ownerOf(1)
          ).to.be.revertedWith("ERC721: invalid token ID");
          expect(await erc721TokenNativeGaslessMint.claims(bob.address)).to.eq(
            0
          );
          expect(
            await erc721TokenNativeGaslessMint.getNonce(bob.address)
          ).to.eq(0);

          // bob mints for charlie

          await expect(
            erc721TokenNativeGaslessMint
              .connect(bob)
              .mint(charlie.address, r, s, v)
          ).to.be.reverted;
        });

        it("should reject on invalid signer - wrong trustedAddress", async () => {
          const { domain, types, value } = getEIP712TypedData({
            to: bob.address,
            contractAddress: erc721TokenNativeGaslessMint.address,
            chainId: hre.network.config.chainId as number,
            domainName: await erc721TokenNativeGaslessMint.name(),
            domainVersion: "1.0",
          });
          const rawSignature: string = await bob._signTypedData(
            domain,
            types,
            value
          );
          const { v, r, s } = ethers.utils.splitSignature(rawSignature);

          const sb = erc721TokenNativeGaslessMint.connect(bob);

          await expect(sb.mint(bob.address, r, s, v)).to.be.revertedWith(
            "InvalidAddress"
          );
          // try minting to another address
          await expect(sb.mint(charlie.address, r, s, v)).to.be.revertedWith(
            "InvalidAddress"
          );
        });

        it("should reject on signature used by someone else", async () => {
          const { domain, types, value } = getEIP712TypedData({
            to: bob.address, // signature meant to be used by `bob`
            contractAddress: erc721TokenNativeGaslessMint.address,
            chainId: hre.network.config.chainId as number,
            domainName: await erc721TokenNativeGaslessMint.name(),
            domainVersion: "1.0",
          });
          const rawSignature: string = await trustedAddress._signTypedData(
            domain,
            types,
            value
          );
          const { v, r, s } = ethers.utils.splitSignature(rawSignature);

          // charlie tries minting to charlie with signature for `bob`
          const sb = erc721TokenNativeGaslessMint.connect(charlie);
          await expect(sb.mint(charlie.address, r, s, v)).to.be.revertedWith(
            "InvalidAddress"
          );
          // charlie tries minting to alice with signature for `bob`
          await expect(sb.mint(alice.address, r, s, v)).to.be.revertedWith(
            "InvalidAddress"
          );

          // charlie tries minting to bob with signature for `bob`, which should work
          // try minting to another address
          await sb.mint(bob.address, r, s, v);
          // nft transferred to bob, not charlie
          expect(
            (
              await erc721TokenNativeGaslessMint.balanceOf(charlie.address)
            ).toNumber()
          ).to.eq(0);
          expect(
            (
              await erc721TokenNativeGaslessMint.balanceOf(bob.address)
            ).toNumber()
          ).to.eq(1);
          expect(await erc721TokenNativeGaslessMint.nextTokenId()).to.eq(2);
          expect(await erc721TokenNativeGaslessMint.ownerOf(1)).to.eq(
            bob.address
          );
          // claimer should be charlie, not bob
          expect(await erc721TokenNativeGaslessMint.claims(bob.address)).to.eq(
            1
          );
          expect(
            await erc721TokenNativeGaslessMint.claims(charlie.address)
          ).to.eq(0);
          expect(
            await erc721TokenNativeGaslessMint.getNonce(charlie.address)
          ).to.eq(0);
          expect(
            await erc721TokenNativeGaslessMint.getNonce(bob.address)
          ).to.eq(0);
        });

        it("should revert on signature replay", async () => {
          // mint token 1 on contract A
          const deployERC721TokenNativeGaslessMint_A =
            await erc721TokenFactory.deployERC721Token(
              TokenType.ERC721TokenNativeGaslessMint,
              encodeInitializationData([
                "ERC721_A",
                "ERC721_A",
                "https://example.com/contractURI",
                "https://example.com",
                alice.address,
                trustedAddress.address,
                10,
              ]),
              +new Date()
            );
          const receipt_A = await deployERC721TokenNativeGaslessMint_A.wait();
          const erc721TokenCloneAddress_A = getArgFromEvent(
            erc721TokenFactory,
            receipt_A,
            erc721TokenFactory.interface.events[
              "ERC721TokenDeployed(uint8,address,address,address)"
            ].name,
            "_erc721TokenClone"
          );
          const erc721_A = await ethers.getContractAt(
            "ERC721TokenNativeGaslessMintImpl",
            erc721TokenCloneAddress_A
          );
          const { domain, types, value } = getEIP712TypedData({
            to: bob.address,
            contractAddress: erc721_A.address,
            chainId: hre.network.config.chainId as number,
            domainName: "ERC721_A", // contract A name
            domainVersion: "1.0",
          });
          const rawSignature: string = await trustedAddress._signTypedData(
            domain,
            types,
            value
          );
          const { v, r, s } = ethers.utils.splitSignature(rawSignature);
          await erc721_A.connect(bob).mint(bob.address, r, s, v);

          // replay signature from contract A to mint from contract B
          const deployERC721TokenNativeGaslessMint_B =
            await erc721TokenFactory.deployERC721Token(
              TokenType.ERC721TokenNativeGaslessMint,
              encodeInitializationData([
                "ERC721_B",
                "ERC721_B",
                "https://example.com/contractURI",
                "https://example.com",
                alice.address,
                trustedAddress.address,
                10,
              ]),
              +new Date()
            );
          const receipt_B = await deployERC721TokenNativeGaslessMint_B.wait();
          const erc721TokenCloneAddress_B = getArgFromEvent(
            erc721TokenFactory,
            receipt_B,
            erc721TokenFactory.interface.events[
              "ERC721TokenDeployed(uint8,address,address,address)"
            ].name,
            "_erc721TokenClone"
          );
          const erc721_B = await ethers.getContractAt(
            "ERC721TokenNativeGaslessMintImpl",
            erc721TokenCloneAddress_B
          );
          await expect(erc721_B.connect(bob).mint(bob.address, r, s, v)).to.be
            .reverted;
          // try minting to another address
          await expect(erc721_B.connect(bob).mint(charlie.address, r, s, v)).to
            .be.reverted;
        });
      });

      it("should throw an error if minted past max supply", async () => {
        const deployERC721Token = await erc721TokenFactory.deployERC721Token(
          TokenType.ERC721TokenNativeGaslessMint,
          encodeInitializationData([
            "TestToken",
            "TEST",
            "https://example.com/contractURI",
            "https://example.com",
            alice.address,
            trustedAddress.address,
            1,
          ]), // only 1 maxSupply
          +new Date()
        );
        const receipt = await deployERC721Token.wait();
        const erc721TokenCloneAddress = getArgFromEvent(
          erc721TokenFactory,
          receipt,
          erc721TokenFactory.interface.events[
            "ERC721TokenDeployed(uint8,address,address,address)"
          ].name,
          "_erc721TokenClone"
        );
        erc721TokenNativeGaslessMint = await ethers.getContractAt(
          "ERC721TokenNativeGaslessMintImpl",
          erc721TokenCloneAddress
        );

        const mint = async (user: SignerWithAddress) => {
          const { v, r, s } = await ERC721_generateSignature(
            erc721TokenNativeGaslessMint,
            trustedAddress,
            user.address
          );
          await erc721TokenNativeGaslessMint
            .connect(user)
            .mint(user.address, r, s, v);
        };
        await mint(bob);
        await expect(mint(charlie)).to.revertedWith("ExceedsMaxSupply");
      });

      it("should not allow claiming again", async () => {
        let { v, r, s } = await ERC721_generateSignature(
          erc721TokenNativeGaslessMint,
          trustedAddress,
          bob.address // signature for bob
        );

        // bob mints for bob
        const sb = erc721TokenNativeGaslessMint.connect(bob);
        await sb.mint(bob.address, r, s, v);
        await expect(sb.mint(bob.address, r, s, v)).to.be.revertedWith(
          "AlreadyClaimed"
        );
        // charlie mints for bob
        const sb_charlie = erc721TokenNativeGaslessMint.connect(charlie);
        await expect(sb_charlie.mint(bob.address, r, s, v)).to.be.revertedWith(
          "AlreadyClaimed"
        );

        // Try latest signature
        ({ v, r, s } = await ERC721_generateSignature(
          erc721,
          trustedAddress,
          bob.address
        ));
        // bob mints for bob
        await expect(sb.mint(bob.address, r, s, v)).to.be.revertedWith(
          "AlreadyClaimed"
        );
        // charlie mints for bob
        await expect(sb_charlie.mint(bob.address, r, s, v)).to.be.revertedWith(
          "AlreadyClaimed"
        );
      });

      it("should prevent re-entrancy", async () => {
        const ReenterMint: ReenterMint__factory =
          await ethers.getContractFactory("ReenterMint");

        const reenterMint = await ReenterMint.deploy();
        let { v, r, s } = await ERC721_generateSignature(
          erc721TokenNativeGaslessMint,
          trustedAddress,
          reenterMint.address
        );

        // Since tokenId is not part of signature, no need to request signature from backend multiple times
        // And instead use the signature first generated
        // But it would still fail since it will try to mint the same tokenId
        // which is prohibited in ERC721
        // After moving the _safeMint() for CEI, it should now revert with AlreadyClaimed
        await expect(
          reenterMint.attack(erc721TokenNativeGaslessMint.address, r, s, v)
        ).to.be.revertedWith("AlreadyClaimed");
      });
    });

    it("should be compatible with ERC165, ERC721 and ERC721Metadata", async () => {
      for (const id of ["0x01ffc9a7", "0x80ac58cd", "0x5b5e139f"]) {
        expect(await erc721TokenNativeGaslessMint.supportsInterface(id)).to.eq(
          true
        );
      }
    });

    describe("Meta Transactions", () => {
      describe("mint()", async function () {
        describe("signature", async function () {
          it("should allow minting with a trusted address - msgSender() == to", async () => {
            const { v, r, s } = await ERC721_generateSignature(
              erc721TokenNativeGaslessMint,
              trustedAddress,
              bob.address
            );

            expect(
              (
                await erc721TokenNativeGaslessMint.balanceOf(bob.address)
              ).toNumber()
            ).to.eq(0);
            expect(await erc721TokenNativeGaslessMint.nextTokenId()).to.eq(1);
            await expect(
              erc721TokenNativeGaslessMint.ownerOf(1)
            ).to.be.revertedWith("ERC721: invalid token ID");
            expect(
              await erc721TokenNativeGaslessMint.claims(bob.address)
            ).to.eq(0);
            expect(
              await erc721TokenNativeGaslessMint.getNonce(bob.address)
            ).to.eq(0);

            const [
              functionSignature,
              { r: metaTxnR, s: metaTxnS, v: metaTxnV },
            ] = await prepareNativeMetaTxnSignature(
              erc721TokenNativeGaslessMint,
              bob,
              { to: bob.address, r, s, v }
            );

            await erc721TokenNativeGaslessMint
              .connect(relayer)
              .executeMetaTransaction(
                bob.address,
                functionSignature,
                metaTxnR,
                metaTxnS,
                metaTxnV
              );

            expect(
              (
                await erc721TokenNativeGaslessMint.balanceOf(bob.address)
              ).toNumber()
            ).to.eq(1);
            expect(await erc721TokenNativeGaslessMint.nextTokenId()).to.eq(2);
            expect(await erc721TokenNativeGaslessMint.ownerOf(1)).to.eq(
              bob.address
            );
            expect(
              await erc721TokenNativeGaslessMint.claims(bob.address)
            ).to.eq(1);
            expect(
              await erc721TokenNativeGaslessMint.getNonce(bob.address)
            ).to.eq(1);
          });

          it("should allow minting with a trusted address - msgSender() != to", async () => {
            const { v, r, s } = await ERC721_generateSignature(
              erc721TokenNativeGaslessMint,
              trustedAddress,
              charlie.address // signature for charlie
            );

            expect(
              (
                await erc721TokenNativeGaslessMint.balanceOf(charlie.address)
              ).toNumber()
            ).to.eq(0);
            expect(await erc721TokenNativeGaslessMint.nextTokenId()).to.eq(1);
            await expect(
              erc721TokenNativeGaslessMint.ownerOf(1)
            ).to.be.revertedWith("ERC721: invalid token ID");
            expect(
              await erc721TokenNativeGaslessMint.claims(charlie.address)
            ).to.eq(0);
            expect(
              await erc721TokenNativeGaslessMint.getNonce(charlie.address)
            ).to.eq(0);

            // bob mints for charlie
            const [
              functionSignature,
              { r: metaTxnR, s: metaTxnS, v: metaTxnV },
            ] = await prepareNativeMetaTxnSignature(
              erc721TokenNativeGaslessMint,
              bob,
              {
                to: charlie.address,
                r,
                s,
                v,
              }
            );

            await erc721TokenNativeGaslessMint
              .connect(relayer)
              .executeMetaTransaction(
                bob.address,
                functionSignature,
                metaTxnR,
                metaTxnS,
                metaTxnV
              );

            // nft transferred to charlie, not bob
            expect(
              (
                await erc721TokenNativeGaslessMint.balanceOf(bob.address)
              ).toNumber()
            ).to.eq(0);
            expect(
              (
                await erc721TokenNativeGaslessMint.balanceOf(charlie.address)
              ).toNumber()
            ).to.eq(1);
            expect(await erc721TokenNativeGaslessMint.nextTokenId()).to.eq(2);
            expect(await erc721TokenNativeGaslessMint.ownerOf(1)).to.eq(
              charlie.address
            );
            // claimer should be charlie, not bob
            expect(
              await erc721TokenNativeGaslessMint.claims(charlie.address)
            ).to.eq(1);
            expect(
              await erc721TokenNativeGaslessMint.claims(bob.address)
            ).to.eq(0);
            // nonce should be updated for bob, not charlie
            expect(
              await erc721TokenNativeGaslessMint.getNonce(bob.address)
            ).to.eq(1);
            expect(
              await erc721TokenNativeGaslessMint.getNonce(charlie.address)
            ).to.eq(0);
          });

          it("should revert if signature is not for `to` - msgSender() == to", async () => {
            const { v, r, s } = await ERC721_generateSignature(
              erc721TokenNativeGaslessMint,
              trustedAddress,
              charlie.address // signature for charlie
            );

            expect(
              (
                await erc721TokenNativeGaslessMint.balanceOf(bob.address)
              ).toNumber()
            ).to.eq(0);
            expect(await erc721TokenNativeGaslessMint.nextTokenId()).to.eq(1);
            await expect(
              erc721TokenNativeGaslessMint.ownerOf(1)
            ).to.be.revertedWith("ERC721: invalid token ID");
            expect(
              await erc721TokenNativeGaslessMint.claims(bob.address)
            ).to.eq(0);
            expect(
              await erc721TokenNativeGaslessMint.getNonce(bob.address)
            ).to.eq(0);

            // bob mints for bob
            const [
              functionSignature,
              { r: metaTxnR, s: metaTxnS, v: metaTxnV },
            ] = await prepareNativeMetaTxnSignature(
              erc721TokenNativeGaslessMint,
              bob,
              { to: bob.address, r, s, v }
            );
            await expect(
              erc721TokenNativeGaslessMint
                .connect(relayer)
                .executeMetaTransaction(
                  bob.address,
                  functionSignature,
                  metaTxnR,
                  metaTxnS,
                  metaTxnV
                )
            ).to.be.reverted;
          });

          it("should revert if signature is not for `to` - msgSender() != to", async () => {
            const { v, r, s } = await ERC721_generateSignature(
              erc721TokenNativeGaslessMint,
              trustedAddress,
              bob.address // signature for bob
            );

            expect(
              (
                await erc721TokenNativeGaslessMint.balanceOf(bob.address)
              ).toNumber()
            ).to.eq(0);
            expect(await erc721TokenNativeGaslessMint.nextTokenId()).to.eq(1);
            await expect(
              erc721TokenNativeGaslessMint.ownerOf(1)
            ).to.be.revertedWith("ERC721: invalid token ID");
            expect(
              await erc721TokenNativeGaslessMint.claims(bob.address)
            ).to.eq(0);
            expect(
              await erc721TokenNativeGaslessMint.getNonce(bob.address)
            ).to.eq(0);

            // bob mints for charlie
            const [
              functionSignature,
              { r: metaTxnR, s: metaTxnS, v: metaTxnV },
            ] = await prepareNativeMetaTxnSignature(
              erc721TokenNativeGaslessMint,
              bob,
              { to: charlie.address, r, s, v }
            );
            await expect(
              erc721TokenNativeGaslessMint
                .connect(relayer)
                .executeMetaTransaction(
                  bob.address,
                  functionSignature,
                  metaTxnR,
                  metaTxnS,
                  metaTxnV
                )
            ).to.be.reverted;
          });

          it("should reject on invalid signer - wrong trustedAddress", async () => {
            const { domain, types, value } = getEIP712TypedData({
              to: bob.address,
              contractAddress: erc721TokenNativeGaslessMint.address,
              chainId: hre.network.config.chainId as number,
              domainName: await erc721TokenNativeGaslessMint.name(),
              domainVersion: "1.0",
            });
            const rawSignature: string = await bob._signTypedData(
              domain,
              types,
              value
            );
            const { v, r, s } = ethers.utils.splitSignature(rawSignature);

            let [functionSignature, { r: metaTxnR, s: metaTxnS, v: metaTxnV }] =
              await prepareNativeMetaTxnSignature(
                erc721TokenNativeGaslessMint,
                bob,
                { to: bob.address, r, s, v }
              );

            await expect(
              erc721TokenNativeGaslessMint
                .connect(relayer)
                .executeMetaTransaction(
                  bob.address,
                  functionSignature,
                  metaTxnR,
                  metaTxnS,
                  metaTxnV
                )
            ).to.be.reverted;

            // try minting to another address
            [functionSignature, { r: metaTxnR, s: metaTxnS, v: metaTxnV }] =
              await prepareNativeMetaTxnSignature(
                erc721TokenNativeGaslessMint,
                bob,
                {
                  to: charlie.address,
                  r,
                  s,
                  v,
                }
              );

            await expect(
              erc721TokenNativeGaslessMint
                .connect(relayer)
                .executeMetaTransaction(
                  bob.address,
                  functionSignature,
                  metaTxnR,
                  metaTxnS,
                  metaTxnV
                )
            ).to.be.reverted;
          });

          it("should reject on signature used by someone else", async () => {
            const { domain, types, value } = getEIP712TypedData({
              to: bob.address, // signature meant to be used by `user`
              contractAddress: erc721TokenNativeGaslessMint.address,
              chainId: hre.network.config.chainId as number,
              domainName: await erc721TokenNativeGaslessMint.name(),
              domainVersion: "1.0",
            });
            const rawSignature: string = await trustedAddress._signTypedData(
              domain,
              types,
              value
            );
            const { v, r, s } = ethers.utils.splitSignature(rawSignature);

            // charlie tries minting to charlie with signature for `bob`
            let [functionSignature, { r: metaTxnR, s: metaTxnS, v: metaTxnV }] =
              await prepareNativeMetaTxnSignature(
                erc721TokenNativeGaslessMint,
                charlie,
                { to: charlie.address, r, s, v }
              );

            await expect(
              erc721TokenNativeGaslessMint
                .connect(relayer)
                .executeMetaTransaction(
                  charlie.address,
                  functionSignature,
                  metaTxnR,
                  metaTxnS,
                  metaTxnV
                )
            ).to.be.reverted;

            // charlie tries minting to alice with signature for `bob`
            [functionSignature, { r: metaTxnR, s: metaTxnS, v: metaTxnV }] =
              await prepareNativeMetaTxnSignature(
                erc721TokenNativeGaslessMint,
                charlie,
                {
                  to: alice.address,
                  r,
                  s,
                  v,
                }
              );
            await expect(
              erc721TokenNativeGaslessMint
                .connect(relayer)
                .executeMetaTransaction(
                  charlie.address,
                  functionSignature,
                  metaTxnR,
                  metaTxnS,
                  metaTxnV
                )
            ).to.be.reverted;

            // charlie tries minting to bob with signature for `bob`, which should work
            [functionSignature, { r: metaTxnR, s: metaTxnS, v: metaTxnV }] =
              await prepareNativeMetaTxnSignature(
                erc721TokenNativeGaslessMint,
                charlie,
                { to: bob.address, r, s, v }
              );

            await erc721TokenNativeGaslessMint
              .connect(relayer)
              .executeMetaTransaction(
                charlie.address,
                functionSignature,
                metaTxnR,
                metaTxnS,
                metaTxnV
              );

            // nft transferred to bob, not charlie
            expect(
              (
                await erc721TokenNativeGaslessMint.balanceOf(charlie.address)
              ).toNumber()
            ).to.eq(0);
            expect(
              (
                await erc721TokenNativeGaslessMint.balanceOf(bob.address)
              ).toNumber()
            ).to.eq(1);
            expect(await erc721TokenNativeGaslessMint.nextTokenId()).to.eq(2);
            expect(await erc721TokenNativeGaslessMint.ownerOf(1)).to.eq(
              bob.address
            );
            expect(
              await erc721TokenNativeGaslessMint.claims(bob.address)
            ).to.eq(1);
            expect(
              await erc721TokenNativeGaslessMint.getNonce(charlie.address)
            ).to.eq(1);
          });

          it("should revert on signature replay", async () => {
            // mint token 1 on contract A
            const deployERC721TokenNativeGaslessMint_A =
              await erc721TokenFactory.deployERC721Token(
                TokenType.ERC721TokenNativeGaslessMint,
                encodeInitializationData([
                  "ERC721_A",
                  "ERC721_A",
                  "https://example.com/contractURI",
                  "https://example.com",
                  alice.address,
                  trustedAddress.address,
                  10,
                ]),
                +new Date()
              );
            const receipt_A = await deployERC721TokenNativeGaslessMint_A.wait();
            const erc721TokenCloneAddress_A = getArgFromEvent(
              erc721TokenFactory,
              receipt_A,
              erc721TokenFactory.interface.events[
                "ERC721TokenDeployed(uint8,address,address,address)"
              ].name,
              "_erc721TokenClone"
            );
            const erc721_A = await ethers.getContractAt(
              "ERC721TokenNativeGaslessMintImpl",
              erc721TokenCloneAddress_A
            );
            const { domain, types, value } = getEIP712TypedData({
              to: bob.address,
              contractAddress: erc721_A.address,
              chainId: hre.network.config.chainId as number,
              domainName: "ERC721_A", // contract A name
              domainVersion: "1.0",
            });
            const rawSignature: string = await trustedAddress._signTypedData(
              domain,
              types,
              value
            );
            const { v, r, s } = ethers.utils.splitSignature(rawSignature);

            let [functionSignature, { r: metaTxnR, s: metaTxnS, v: metaTxnV }] =
              await prepareNativeMetaTxnSignature(erc721_A, bob, {
                to: bob.address,
                r,
                s,
                v,
              });

            await erc721_A
              .connect(relayer)
              .executeMetaTransaction(
                bob.address,
                functionSignature,
                metaTxnR,
                metaTxnS,
                metaTxnV
              );

            // replay signature from contract A to mint from contract B
            const deployERC721TokenNativeGaslessMint_B =
              await erc721TokenFactory.deployERC721Token(
                TokenType.ERC721TokenNativeGaslessMint,
                encodeInitializationData([
                  "ERC721_B",
                  "ERC721_B",
                  "https://example.com/contractURI",
                  "https://example.com",
                  alice.address,
                  trustedAddress.address,
                  10,
                ]),
                +new Date()
              );
            const receipt_B = await deployERC721TokenNativeGaslessMint_B.wait();
            const erc721TokenCloneAddress_B = getArgFromEvent(
              erc721TokenFactory,
              receipt_B,
              erc721TokenFactory.interface.events[
                "ERC721TokenDeployed(uint8,address,address,address)"
              ].name,
              "_erc721TokenClone"
            );
            const erc721_B = await ethers.getContractAt(
              "ERC721TokenNativeGaslessMintImpl",
              erc721TokenCloneAddress_B
            );
            await expect(
              erc721_B
                .connect(relayer)
                .executeMetaTransaction(
                  bob.address,
                  functionSignature,
                  metaTxnR,
                  metaTxnS,
                  metaTxnV
                )
            ).to.be.reverted;

            // try minting to another address
            [functionSignature] = await prepareNativeMetaTxnSignature(
              erc721_A,
              bob,
              {
                to: charlie.address,
                r,
                s,
                v,
              }
            );
            await expect(
              erc721_B
                .connect(relayer)
                .executeMetaTransaction(
                  bob.address,
                  functionSignature,
                  metaTxnR,
                  metaTxnS,
                  metaTxnV
                )
            ).to.be.reverted;
          });
        });

        it("should throw an error if minted past max supply", async () => {
          const deployERC721Token = await erc721TokenFactory.deployERC721Token(
            TokenType.ERC721TokenNativeGaslessMint,
            encodeInitializationData([
              "TestToken",
              "TEST",
              "https://example.com/contractURI",
              "https://example.com",
              alice.address,
              trustedAddress.address,
              1,
            ]), // only 1 maxSupply
            +new Date()
          );
          const receipt = await deployERC721Token.wait();
          const erc721TokenCloneAddress = getArgFromEvent(
            erc721TokenFactory,
            receipt,
            erc721TokenFactory.interface.events[
              "ERC721TokenDeployed(uint8,address,address,address)"
            ].name,
            "_erc721TokenClone"
          );
          erc721TokenNativeGaslessMint = await ethers.getContractAt(
            "ERC721TokenNativeGaslessMintImpl",
            erc721TokenCloneAddress
          );

          const mint = async (user: SignerWithAddress) => {
            const { v, r, s } = await ERC721_generateSignature(
              erc721TokenNativeGaslessMint,
              trustedAddress,
              user.address
            );
            const [
              functionSignature,
              { r: metaTxnR, s: metaTxnS, v: metaTxnV },
            ] = await prepareNativeMetaTxnSignature(
              erc721TokenNativeGaslessMint,
              user,
              { to: user.address, r, s, v }
            );

            await erc721TokenNativeGaslessMint
              .connect(relayer)
              .executeMetaTransaction(
                user.address,
                functionSignature,
                metaTxnR,
                metaTxnS,
                metaTxnV
              );
          };
          await mint(bob);
          await expect(mint(charlie)).to.reverted;
        });

        it("should not allow claiming again", async () => {
          let { v, r, s } = await ERC721_generateSignature(
            erc721TokenNativeGaslessMint,
            trustedAddress,
            bob.address // signature for bob
          );

          // bob mints for bob
          let [functionSignature, { r: metaTxnR, s: metaTxnS, v: metaTxnV }] =
            await prepareNativeMetaTxnSignature(
              erc721TokenNativeGaslessMint,
              bob,
              { to: bob.address, r, s, v }
            );
          await erc721TokenNativeGaslessMint
            .connect(relayer)
            .executeMetaTransaction(
              bob.address,
              functionSignature,
              metaTxnR,
              metaTxnS,
              metaTxnV
            );

          //  try minting again
          await expect(
            erc721TokenNativeGaslessMint
              .connect(relayer)
              .executeMetaTransaction(
                bob.address,
                functionSignature,
                metaTxnR,
                metaTxnS,
                metaTxnV
              )
          ).to.be.reverted;

          // charlie mints for bob
          [functionSignature, { r: metaTxnR, s: metaTxnS, v: metaTxnV }] =
            await prepareNativeMetaTxnSignature(
              erc721TokenNativeGaslessMint,
              charlie,
              {
                to: bob.address,
                r,
                s,
                v,
              }
            );
          await expect(
            erc721TokenNativeGaslessMint
              .connect(relayer)
              .executeMetaTransaction(
                charlie.address,
                functionSignature,
                metaTxnR,
                metaTxnS,
                metaTxnV
              )
          ).to.be.reverted;

          // Try latest signature
          ({ v, r, s } = await ERC721_generateSignature(
            erc721,
            trustedAddress,
            bob.address
          ));

          [functionSignature, { r: metaTxnR, s: metaTxnS, v: metaTxnV }] =
            await prepareNativeMetaTxnSignature(
              erc721TokenNativeGaslessMint,
              bob,
              { to: bob.address, r, s, v }
            );
          //  try minting again with the new signature
          await expect(
            erc721TokenNativeGaslessMint
              .connect(relayer)
              .executeMetaTransaction(
                bob.address,
                functionSignature,
                metaTxnR,
                metaTxnS,
                metaTxnV
              )
          ).to.be.reverted;
          // charlie mints for bob
          [functionSignature, { r: metaTxnR, s: metaTxnS, v: metaTxnV }] =
            await prepareNativeMetaTxnSignature(
              erc721TokenNativeGaslessMint,
              charlie,
              { to: bob.address, r, s, v }
            );
          await expect(
            erc721TokenNativeGaslessMint
              .connect(relayer)
              .executeMetaTransaction(
                charlie.address,
                functionSignature,
                metaTxnR,
                metaTxnS,
                metaTxnV
              )
          ).to.be.reverted;
        });
      });
    });
  });

  describe("ERC721SoulboundTokenNativeGaslessMintImpl", async function () {
    describe("deploy", async function () {
      it("Should deploy ERC721SoulboundTokenNativeGaslessMintImpl logic contract", async function () {
        // Deploy ERC721SoulboundTokenNativeGaslessMintImpl logic contract
        const ERC721SoulboundTokenNativeGaslessMintImpl =
          await ethers.getContractFactory(
            "ERC721SoulboundTokenNativeGaslessMintImpl"
          );
        await ERC721SoulboundTokenNativeGaslessMintImpl.deploy();
      });
    });

    describe("initialize()", async function () {
      it("Should revert if anyone tries to initialize() after deployment", async function () {
        // Deploy ERC721SoulboundTokenNativeGaslessMintImpl logic contract
        const ERC721SoulboundTokenNativeGaslessMintImpl =
          await ethers.getContractFactory(
            "ERC721SoulboundTokenNativeGaslessMintImpl"
          );
        let erc721SoulboundTokenNativeGaslessMint =
          await ERC721SoulboundTokenNativeGaslessMintImpl.deploy();

        // Try calling initialize
        await expect(
          erc721SoulboundTokenNativeGaslessMint.initialize(
            encodeInitializationData([
              "TestToken",
              "TEST",
              "https://example.com/contractURI",
              "https://example.com",
              alice.address,
              trustedAddress.address,
              1,
            ])
          )
        ).to.be.revertedWith("Initializable: contract is already initialized");
      });

      it("should initialize with custom name and symbol", async () => {
        expect(await erc721SoulboundTokenNativeGaslessMint.name()).to.eq(
          "TestToken"
        );
        expect(await erc721SoulboundTokenNativeGaslessMint.symbol()).to.eq(
          "TEST"
        );
        expect(await erc721SoulboundTokenNativeGaslessMint.maxSupply()).to.eq(
          10
        );
        expect(await erc721SoulboundTokenNativeGaslessMint.contractURI()).to.eq(
          "https://example.com/contractURI"
        );
        expect(await erc721SoulboundTokenNativeGaslessMint.tokenURI(1)).to.eq(
          "https://example.com"
        );
        expect(await erc721SoulboundTokenNativeGaslessMint.nextTokenId()).to.eq(
          1
        );
        expect(await erc721SoulboundTokenNativeGaslessMint.owner()).to.eq(
          alice.address
        );
        expect(
          await erc721SoulboundTokenNativeGaslessMint.getNonce(alice.address)
        ).to.eq(0);
        await expect(
          erc721SoulboundTokenNativeGaslessMint.transferFrom(
            alice.address,
            bob.address,
            1
          )
        ).to.be.revertedWith("Soulbound");
      });

      it("should not allow initializing with empty trusted address", async () => {
        await expect(
          erc721TokenFactory.deployERC721Token(
            TokenType.ERC721SoulboundTokenNativeGaslessMint,
            encodeInitializationData([
              "TestToken",
              "TEST",
              "https://example.com/contractURI",
              "https://example.com",
              alice.address,
              ZERO_ADDRESS,
              10,
            ]),
            +new Date()
          )
        ).to.be.revertedWith("InvalidAddress");
      });
    });

    describe("mint()", async function () {
      describe("signature", async function () {
        it("should allow minting with a trusted address - msg.sender == to", async () => {
          const { v, r, s } = await ERC721_generateSignature(
            erc721SoulboundTokenNativeGaslessMint,
            trustedAddress,
            bob.address
          );

          expect(
            (
              await erc721SoulboundTokenNativeGaslessMint.balanceOf(bob.address)
            ).toNumber()
          ).to.eq(0);
          expect(
            await erc721SoulboundTokenNativeGaslessMint.nextTokenId()
          ).to.eq(1);
          expect(await erc721SoulboundTokenNativeGaslessMint.ownerOf(1)).to.eq(
            ZERO_ADDRESS
          );
          expect(
            await erc721SoulboundTokenNativeGaslessMint.claims(bob.address)
          ).to.eq(0);
          expect(
            await erc721SoulboundTokenNativeGaslessMint.getNonce(bob.address)
          ).to.eq(0);

          await erc721SoulboundTokenNativeGaslessMint
            .connect(bob)
            .mint(bob.address, r, s, v);

          expect(
            (
              await erc721SoulboundTokenNativeGaslessMint.balanceOf(bob.address)
            ).toNumber()
          ).to.eq(1);
          expect(
            await erc721SoulboundTokenNativeGaslessMint.nextTokenId()
          ).to.eq(2);
          expect(await erc721SoulboundTokenNativeGaslessMint.ownerOf(1)).to.eq(
            bob.address
          );
          expect(
            await erc721SoulboundTokenNativeGaslessMint.claims(bob.address)
          ).to.eq(1);
          expect(
            await erc721SoulboundTokenNativeGaslessMint.getNonce(bob.address)
          ).to.eq(0);
        });

        it("should allow minting with a trusted address - msg.sender != to", async () => {
          const { v, r, s } = await ERC721_generateSignature(
            erc721SoulboundTokenNativeGaslessMint,
            trustedAddress,
            charlie.address // signature for charlie
          );

          expect(
            (
              await erc721SoulboundTokenNativeGaslessMint.balanceOf(
                charlie.address
              )
            ).toNumber()
          ).to.eq(0);
          expect(
            await erc721SoulboundTokenNativeGaslessMint.nextTokenId()
          ).to.eq(1);
          expect(await erc721SoulboundTokenNativeGaslessMint.ownerOf(1)).to.eq(
            ZERO_ADDRESS
          );
          expect(
            await erc721SoulboundTokenNativeGaslessMint.claims(charlie.address)
          ).to.eq(0);
          expect(
            await erc721SoulboundTokenNativeGaslessMint.getNonce(
              charlie.address
            )
          ).to.eq(0);

          // bob mints for charlie
          await erc721SoulboundTokenNativeGaslessMint
            .connect(bob)
            .mint(charlie.address, r, s, v);

          // nft transferred to charlie, not bob
          expect(
            (
              await erc721SoulboundTokenNativeGaslessMint.balanceOf(bob.address)
            ).toNumber()
          ).to.eq(0);
          expect(
            (
              await erc721SoulboundTokenNativeGaslessMint.balanceOf(
                charlie.address
              )
            ).toNumber()
          ).to.eq(1);
          expect(
            await erc721SoulboundTokenNativeGaslessMint.nextTokenId()
          ).to.eq(2);
          expect(await erc721SoulboundTokenNativeGaslessMint.ownerOf(1)).to.eq(
            charlie.address
          );
          // claimer should be charlie, not bob
          expect(
            await erc721SoulboundTokenNativeGaslessMint.claims(charlie.address)
          ).to.eq(1);
          expect(
            await erc721SoulboundTokenNativeGaslessMint.claims(bob.address)
          ).to.eq(0);
          expect(
            await erc721SoulboundTokenNativeGaslessMint.getNonce(bob.address)
          ).to.eq(0);
          expect(
            await erc721SoulboundTokenNativeGaslessMint.getNonce(
              charlie.address
            )
          ).to.eq(0);
        });

        it("should revert if signature is not for `to` - msg.sender == to", async () => {
          const { v, r, s } = await ERC721_generateSignature(
            erc721SoulboundTokenNativeGaslessMint,
            trustedAddress,
            charlie.address // signature for charlie
          );

          expect(
            (
              await erc721SoulboundTokenNativeGaslessMint.balanceOf(bob.address)
            ).toNumber()
          ).to.eq(0);
          expect(
            await erc721SoulboundTokenNativeGaslessMint.nextTokenId()
          ).to.eq(1);
          expect(await erc721SoulboundTokenNativeGaslessMint.ownerOf(1)).to.eq(
            ZERO_ADDRESS
          );
          expect(
            await erc721SoulboundTokenNativeGaslessMint.claims(bob.address)
          ).to.eq(0);
          expect(
            await erc721SoulboundTokenNativeGaslessMint.getNonce(bob.address)
          ).to.eq(0);

          // bob mints for bob
          await expect(
            erc721SoulboundTokenNativeGaslessMint
              .connect(bob)
              .mint(bob.address, r, s, v)
          ).to.be.reverted;
        });

        it("should revert if signature is not for `to` - msg.sender != to", async () => {
          const { v, r, s } = await ERC721_generateSignature(
            erc721SoulboundTokenNativeGaslessMint,
            trustedAddress,
            bob.address // signature for bob
          );

          expect(
            (
              await erc721SoulboundTokenNativeGaslessMint.balanceOf(bob.address)
            ).toNumber()
          ).to.eq(0);
          expect(
            await erc721SoulboundTokenNativeGaslessMint.nextTokenId()
          ).to.eq(1);
          expect(await erc721SoulboundTokenNativeGaslessMint.ownerOf(1)).to.eq(
            ZERO_ADDRESS
          );
          expect(
            await erc721SoulboundTokenNativeGaslessMint.claims(bob.address)
          ).to.eq(0);
          expect(
            await erc721SoulboundTokenNativeGaslessMint.getNonce(bob.address)
          ).to.eq(0);

          // bob mints for charlie

          await expect(
            erc721SoulboundTokenNativeGaslessMint
              .connect(bob)
              .mint(charlie.address, r, s, v)
          ).to.be.reverted;
        });

        it("should reject on invalid signer - wrong trustedAddress", async () => {
          const { domain, types, value } = getEIP712TypedData({
            to: bob.address,
            contractAddress: erc721SoulboundTokenNativeGaslessMint.address,
            chainId: hre.network.config.chainId as number,
            domainName: await erc721SoulboundTokenNativeGaslessMint.name(),
            domainVersion: "1.0",
          });
          const rawSignature: string = await bob._signTypedData(
            domain,
            types,
            value
          );
          const { v, r, s } = ethers.utils.splitSignature(rawSignature);

          const sb = erc721SoulboundTokenNativeGaslessMint.connect(bob);

          await expect(sb.mint(bob.address, r, s, v)).to.be.revertedWith(
            "InvalidAddress"
          );
          // try minting to another address
          await expect(sb.mint(charlie.address, r, s, v)).to.be.revertedWith(
            "InvalidAddress"
          );
        });

        it("should reject on signature used by someone else", async () => {
          const { domain, types, value } = getEIP712TypedData({
            to: bob.address, // signature meant to be used by `bob`
            contractAddress: erc721SoulboundTokenNativeGaslessMint.address,
            chainId: hre.network.config.chainId as number,
            domainName: await erc721SoulboundTokenNativeGaslessMint.name(),
            domainVersion: "1.0",
          });
          const rawSignature: string = await trustedAddress._signTypedData(
            domain,
            types,
            value
          );
          const { v, r, s } = ethers.utils.splitSignature(rawSignature);

          // charlie tries minting to charlie with signature for `bob`
          const sb = erc721SoulboundTokenNativeGaslessMint.connect(charlie);
          await expect(sb.mint(charlie.address, r, s, v)).to.be.revertedWith(
            "InvalidAddress"
          );
          // charlie tries minting to alice with signature for `bob`
          await expect(sb.mint(alice.address, r, s, v)).to.be.revertedWith(
            "InvalidAddress"
          );
          // charlie tries minting to bob with signature for `bob`, which should work
          await sb.mint(bob.address, r, s, v);
          // nft transferred to bob, not charlie
          expect(
            (
              await erc721SoulboundTokenNativeGaslessMint.balanceOf(
                charlie.address
              )
            ).toNumber()
          ).to.eq(0);
          expect(
            (
              await erc721SoulboundTokenNativeGaslessMint.balanceOf(bob.address)
            ).toNumber()
          ).to.eq(1);
          expect(
            await erc721SoulboundTokenNativeGaslessMint.nextTokenId()
          ).to.eq(2);
          expect(await erc721SoulboundTokenNativeGaslessMint.ownerOf(1)).to.eq(
            bob.address
          );
          // claimer should be bob, not charlie
          expect(
            await erc721SoulboundTokenNativeGaslessMint.claims(bob.address)
          ).to.eq(1);
          expect(
            await erc721SoulboundTokenNativeGaslessMint.claims(charlie.address)
          ).to.eq(0);
          expect(
            await erc721SoulboundTokenNativeGaslessMint.getNonce(
              charlie.address
            )
          ).to.eq(0);
          expect(
            await erc721SoulboundTokenNativeGaslessMint.getNonce(bob.address)
          ).to.eq(0);
        });

        it("should revert on signature replay", async () => {
          const deployERC721SoulboundTokenNativeGaslessMint_A =
            await erc721TokenFactory.deployERC721Token(
              TokenType.ERC721SoulboundTokenNativeGaslessMint,
              encodeInitializationData([
                "ERC721_A",
                "ERC721_A",
                "https://example.com/contractURI",
                "https://example.com",
                alice.address,
                trustedAddress.address,
                10,
              ]),
              +new Date()
            );
          const receipt_A =
            await deployERC721SoulboundTokenNativeGaslessMint_A.wait();
          const erc721TokenCloneAddress_A = getArgFromEvent(
            erc721TokenFactory,
            receipt_A,
            erc721TokenFactory.interface.events[
              "ERC721TokenDeployed(uint8,address,address,address)"
            ].name,
            "_erc721TokenClone"
          );
          const erc721_A = await ethers.getContractAt(
            "ERC721SoulboundTokenNativeGaslessMintImpl",
            erc721TokenCloneAddress_A
          );
          const { domain, types, value } = getEIP712TypedData({
            to: bob.address,
            contractAddress: erc721_A.address,
            chainId: hre.network.config.chainId as number,
            domainName: "ERC721_A", // contract A name
            domainVersion: "1.0",
          });
          const rawSignature: string = await trustedAddress._signTypedData(
            domain,
            types,
            value
          );
          const { v, r, s } = ethers.utils.splitSignature(rawSignature);
          await erc721_A.connect(bob).mint(bob.address, r, s, v);

          // replay signature from contract A to mint from contract B
          const deployERC721SoulboundTokenNativeGaslessMint_B =
            await erc721TokenFactory.deployERC721Token(
              TokenType.ERC721SoulboundTokenNativeGaslessMint,
              encodeInitializationData([
                "ERC721_B",
                "ERC721_B",
                "https://example.com/contractURI",
                "https://example.com",
                alice.address,
                trustedAddress.address,
                10,
              ]),
              +new Date()
            );
          const receipt_B =
            await deployERC721SoulboundTokenNativeGaslessMint_B.wait();
          const erc721TokenCloneAddress_B = getArgFromEvent(
            erc721TokenFactory,
            receipt_B,
            erc721TokenFactory.interface.events[
              "ERC721TokenDeployed(uint8,address,address,address)"
            ].name,
            "_erc721TokenClone"
          );
          const erc721_B = await ethers.getContractAt(
            "ERC721SoulboundTokenNativeGaslessMintImpl",
            erc721TokenCloneAddress_B
          );
          await expect(erc721_B.connect(bob).mint(bob.address, r, s, v)).to.be
            .reverted;
          // try minting to another address
          await expect(erc721_B.connect(bob).mint(charlie.address, r, s, v)).to
            .be.reverted;
        });
      });

      it("should emit Transfer on mint", async () => {
        const { v, r, s } = await ERC721_generateSignature(
          erc721SoulboundTokenNativeGaslessMint,
          trustedAddress,
          bob.address
        );

        await expect(
          erc721SoulboundTokenNativeGaslessMint
            .connect(bob)
            .mint(bob.address, r, s, v)
        )
          .to.emit(erc721SoulboundTokenNativeGaslessMint, "Transfer")
          .withArgs(ZERO_ADDRESS, bob.address, 1);

        expect(
          (
            await erc721SoulboundTokenNativeGaslessMint.balanceOf(bob.address)
          ).toNumber()
        ).to.eq(1);
        expect(await erc721SoulboundTokenNativeGaslessMint.ownerOf(1)).to.eq(
          bob.address
        );
      });

      it("should throw an error if minted past max supply", async () => {
        const deployERC721Token = await erc721TokenFactory.deployERC721Token(
          TokenType.ERC721SoulboundTokenNativeGaslessMint,
          encodeInitializationData([
            "TestToken",
            "TEST",
            "https://example.com/contractURI",
            "https://example.com",
            alice.address,
            trustedAddress.address,
            1,
          ]), // only 1 maxSupply
          +new Date()
        );
        const receipt = await deployERC721Token.wait();
        const erc721TokenCloneAddress = getArgFromEvent(
          erc721TokenFactory,
          receipt,
          erc721TokenFactory.interface.events[
            "ERC721TokenDeployed(uint8,address,address,address)"
          ].name,
          "_erc721TokenClone"
        );
        erc721SoulboundTokenNativeGaslessMint = await ethers.getContractAt(
          "ERC721SoulboundTokenNativeGaslessMintImpl",
          erc721TokenCloneAddress
        );

        const mint = async (user: SignerWithAddress) => {
          const { v, r, s } = await ERC721_generateSignature(
            erc721SoulboundTokenNativeGaslessMint,
            trustedAddress,
            user.address
          );
          await erc721SoulboundTokenNativeGaslessMint
            .connect(user)
            .mint(user.address, r, s, v);
        };
        await mint(bob);
        await expect(mint(charlie)).to.revertedWith("ExceedsMaxSupply");
      });

      it("should not allow claiming again", async () => {
        let { v, r, s } = await ERC721_generateSignature(
          erc721SoulboundTokenNativeGaslessMint,
          trustedAddress,
          bob.address // signature for bob
        );

        // bob mints for bob
        const sb = erc721SoulboundTokenNativeGaslessMint.connect(bob);
        await sb.mint(bob.address, r, s, v);
        await expect(sb.mint(bob.address, r, s, v)).to.be.revertedWith(
          "AlreadyClaimed"
        );

        // charlie mints for bob
        const sb_charlie =
          erc721SoulboundTokenNativeGaslessMint.connect(charlie);
        await expect(sb_charlie.mint(bob.address, r, s, v)).to.be.revertedWith(
          "AlreadyClaimed"
        );

        // Try latest signature
        ({ v, r, s } = await ERC721_generateSignature(
          erc721SoulboundTokenNativeGaslessMint,
          trustedAddress,
          bob.address
        ));
        // bob mints for bob
        await expect(sb.mint(bob.address, r, s, v)).to.be.revertedWith(
          "AlreadyClaimed"
        );
        // charlie mints for bob
        await expect(sb_charlie.mint(bob.address, r, s, v)).to.be.revertedWith(
          "AlreadyClaimed"
        );
      });
    });

    it("should be compatible with ERC165, ERC721 and ERC721Metadata", async () => {
      for (const id of ["0x01ffc9a7", "0x80ac58cd", "0x5b5e139f"]) {
        expect(
          await erc721SoulboundTokenNativeGaslessMint.supportsInterface(id)
        ).to.eq(true);
      }
    });

    it("should throw on transferring methods since soulbound", async () => {
      const { v, r, s } = await ERC721_generateSignature(
        erc721SoulboundTokenNativeGaslessMint,
        trustedAddress,
        bob.address
      );

      const sb = erc721SoulboundTokenNativeGaslessMint.connect(bob);

      await sb.mint(bob.address, r, s, v);

      const calls = [
        sb.approve(bob.address, 1),
        sb.isApprovedForAll(
          erc721SoulboundTokenNativeGaslessMint.address,
          bob.address
        ),
        sb.getApproved(1),
        sb.setApprovalForAll(
          erc721SoulboundTokenNativeGaslessMint.address,
          true
        ),
        sb.transferFrom(bob.address, bob.address, 1),
        sb["safeTransferFrom(address,address,uint256)"](
          bob.address,
          bob.address,
          1
        ),
        sb["safeTransferFrom(address,address,uint256,bytes)"](
          bob.address,
          bob.address,
          1,
          ethers.constants.HashZero
        ),
      ];

      for (const call of calls) {
        await expect(call).to.be.revertedWith("Soulbound");
      }
    });

    describe("Meta Transactions", () => {
      describe("mint()", async function () {
        describe("signature", async function () {
          it("should allow minting with a trusted address - msgSender() == to", async () => {
            const { v, r, s } = await ERC721_generateSignature(
              erc721SoulboundTokenNativeGaslessMint,
              trustedAddress,
              bob.address
            );

            expect(
              (
                await erc721SoulboundTokenNativeGaslessMint.balanceOf(
                  bob.address
                )
              ).toNumber()
            ).to.eq(0);
            expect(
              await erc721SoulboundTokenNativeGaslessMint.nextTokenId()
            ).to.eq(1);
            expect(
              await erc721SoulboundTokenNativeGaslessMint.ownerOf(1)
            ).to.eq(ZERO_ADDRESS);
            expect(
              await erc721SoulboundTokenNativeGaslessMint.claims(bob.address)
            ).to.eq(0);
            expect(
              await erc721SoulboundTokenNativeGaslessMint.getNonce(bob.address)
            ).to.eq(0);

            const [
              functionSignature,
              { r: metaTxnR, s: metaTxnS, v: metaTxnV },
            ] = await prepareNativeMetaTxnSignature(
              erc721SoulboundTokenNativeGaslessMint,
              bob,
              { to: bob.address, r, s, v }
            );

            await erc721SoulboundTokenNativeGaslessMint
              .connect(relayer)
              .executeMetaTransaction(
                bob.address,
                functionSignature,
                metaTxnR,
                metaTxnS,
                metaTxnV
              );

            expect(
              (
                await erc721SoulboundTokenNativeGaslessMint.balanceOf(
                  bob.address
                )
              ).toNumber()
            ).to.eq(1);
            expect(
              await erc721SoulboundTokenNativeGaslessMint.nextTokenId()
            ).to.eq(2);
            expect(
              await erc721SoulboundTokenNativeGaslessMint.ownerOf(1)
            ).to.eq(bob.address);
            expect(
              await erc721SoulboundTokenNativeGaslessMint.claims(bob.address)
            ).to.eq(1);
            expect(
              await erc721SoulboundTokenNativeGaslessMint.getNonce(bob.address)
            ).to.eq(1);
          });

          it("should allow minting with a trusted address - msgSender() != to", async () => {
            const { v, r, s } = await ERC721_generateSignature(
              erc721SoulboundTokenNativeGaslessMint,
              trustedAddress,
              charlie.address // signature for charlie
            );

            expect(
              (
                await erc721SoulboundTokenNativeGaslessMint.balanceOf(
                  charlie.address
                )
              ).toNumber()
            ).to.eq(0);
            expect(
              await erc721SoulboundTokenNativeGaslessMint.nextTokenId()
            ).to.eq(1);
            expect(
              await erc721SoulboundTokenNativeGaslessMint.ownerOf(1)
            ).to.eq(ZERO_ADDRESS);
            expect(
              await erc721SoulboundTokenNativeGaslessMint.claims(
                charlie.address
              )
            ).to.eq(0);
            expect(
              await erc721SoulboundTokenNativeGaslessMint.getNonce(
                charlie.address
              )
            ).to.eq(0);

            // bob mints for charlie
            const [
              functionSignature,
              { r: metaTxnR, s: metaTxnS, v: metaTxnV },
            ] = await prepareNativeMetaTxnSignature(
              erc721SoulboundTokenNativeGaslessMint,
              bob,
              {
                to: charlie.address,
                r,
                s,
                v,
              }
            );

            await erc721SoulboundTokenNativeGaslessMint
              .connect(relayer)
              .executeMetaTransaction(
                bob.address,
                functionSignature,
                metaTxnR,
                metaTxnS,
                metaTxnV
              );

            // nft transferred to charlie, not bob
            expect(
              (
                await erc721SoulboundTokenNativeGaslessMint.balanceOf(
                  bob.address
                )
              ).toNumber()
            ).to.eq(0);
            expect(
              (
                await erc721SoulboundTokenNativeGaslessMint.balanceOf(
                  charlie.address
                )
              ).toNumber()
            ).to.eq(1);
            expect(
              await erc721SoulboundTokenNativeGaslessMint.nextTokenId()
            ).to.eq(2);
            expect(
              await erc721SoulboundTokenNativeGaslessMint.ownerOf(1)
            ).to.eq(charlie.address);
            // claimer should be charlie, not bob
            expect(
              await erc721SoulboundTokenNativeGaslessMint.claims(
                charlie.address
              )
            ).to.eq(1);
            expect(
              await erc721SoulboundTokenNativeGaslessMint.claims(bob.address)
            ).to.eq(0);
            // nonce should be updated for bob, not charlie
            expect(
              await erc721SoulboundTokenNativeGaslessMint.getNonce(bob.address)
            ).to.eq(1);
            expect(
              await erc721SoulboundTokenNativeGaslessMint.getNonce(
                charlie.address
              )
            ).to.eq(0);
          });

          it("should revert if signature is not for `to` - msgSender() == to", async () => {
            const { v, r, s } = await ERC721_generateSignature(
              erc721SoulboundTokenNativeGaslessMint,
              trustedAddress,
              charlie.address // signature for charlie
            );

            expect(
              (
                await erc721SoulboundTokenNativeGaslessMint.balanceOf(
                  bob.address
                )
              ).toNumber()
            ).to.eq(0);
            expect(
              await erc721SoulboundTokenNativeGaslessMint.nextTokenId()
            ).to.eq(1);
            expect(
              await erc721SoulboundTokenNativeGaslessMint.ownerOf(1)
            ).to.eq(ZERO_ADDRESS);
            expect(
              await erc721SoulboundTokenNativeGaslessMint.claims(bob.address)
            ).to.eq(0);
            expect(
              await erc721SoulboundTokenNativeGaslessMint.getNonce(bob.address)
            ).to.eq(0);

            // bob mints for bob
            const [
              functionSignature,
              { r: metaTxnR, s: metaTxnS, v: metaTxnV },
            ] = await prepareNativeMetaTxnSignature(
              erc721SoulboundTokenNativeGaslessMint,
              bob,
              { to: bob.address, r, s, v }
            );
            await expect(
              erc721SoulboundTokenNativeGaslessMint
                .connect(relayer)
                .executeMetaTransaction(
                  bob.address,
                  functionSignature,
                  metaTxnR,
                  metaTxnS,
                  metaTxnV
                )
            ).to.be.reverted;
          });

          it("should revert if signature is not for `to` - msgSender() != to", async () => {
            const { v, r, s } = await ERC721_generateSignature(
              erc721SoulboundTokenNativeGaslessMint,
              trustedAddress,
              bob.address // signature for bob
            );

            expect(
              (
                await erc721SoulboundTokenNativeGaslessMint.balanceOf(
                  bob.address
                )
              ).toNumber()
            ).to.eq(0);
            expect(
              await erc721SoulboundTokenNativeGaslessMint.nextTokenId()
            ).to.eq(1);
            expect(
              await erc721SoulboundTokenNativeGaslessMint.ownerOf(1)
            ).to.eq(ZERO_ADDRESS);
            expect(
              await erc721SoulboundTokenNativeGaslessMint.claims(bob.address)
            ).to.eq(0);
            expect(
              await erc721SoulboundTokenNativeGaslessMint.getNonce(bob.address)
            ).to.eq(0);

            // bob mints for charlie
            const [
              functionSignature,
              { r: metaTxnR, s: metaTxnS, v: metaTxnV },
            ] = await prepareNativeMetaTxnSignature(
              erc721SoulboundTokenNativeGaslessMint,
              bob,
              { to: charlie.address, r, s, v }
            );
            await expect(
              erc721SoulboundTokenNativeGaslessMint
                .connect(relayer)
                .executeMetaTransaction(
                  bob.address,
                  functionSignature,
                  metaTxnR,
                  metaTxnS,
                  metaTxnV
                )
            ).to.be.reverted;
          });

          it("should reject on invalid signer - wrong trustedAddress", async () => {
            const { domain, types, value } = getEIP712TypedData({
              to: bob.address,
              contractAddress: erc721SoulboundTokenNativeGaslessMint.address,
              chainId: hre.network.config.chainId as number,
              domainName: await erc721SoulboundTokenNativeGaslessMint.name(),
              domainVersion: "1.0",
            });
            const rawSignature: string = await charlie._signTypedData(
              domain,
              types,
              value
            );
            const { v, r, s } = ethers.utils.splitSignature(rawSignature);

            let [functionSignature, { r: metaTxnR, s: metaTxnS, v: metaTxnV }] =
              await prepareNativeMetaTxnSignature(
                erc721SoulboundTokenNativeGaslessMint,
                bob,
                { to: bob.address, r, s, v }
              );

            await expect(
              erc721SoulboundTokenNativeGaslessMint
                .connect(relayer)
                .executeMetaTransaction(
                  bob.address,
                  functionSignature,
                  metaTxnR,
                  metaTxnS,
                  metaTxnV
                )
            ).to.be.reverted;

            // try minting to another address
            [functionSignature, { r: metaTxnR, s: metaTxnS, v: metaTxnV }] =
              await prepareNativeMetaTxnSignature(
                erc721SoulboundTokenNativeGaslessMint,
                bob,
                {
                  to: charlie.address,
                  r,
                  s,
                  v,
                }
              );

            await expect(
              erc721SoulboundTokenNativeGaslessMint
                .connect(relayer)
                .executeMetaTransaction(
                  bob.address,
                  functionSignature,
                  metaTxnR,
                  metaTxnS,
                  metaTxnV
                )
            ).to.be.reverted;
          });

          it("should reject on signature used by someone else", async () => {
            const { domain, types, value } = getEIP712TypedData({
              to: bob.address, // signature meant to be used by `bob`
              contractAddress: erc721SoulboundTokenNativeGaslessMint.address,
              chainId: hre.network.config.chainId as number,
              domainName: await erc721SoulboundTokenNativeGaslessMint.name(),
              domainVersion: "1.0",
            });
            const rawSignature: string = await trustedAddress._signTypedData(
              domain,
              types,
              value
            );
            const { v, r, s } = ethers.utils.splitSignature(rawSignature);

            // charlie tries minting to charlie with signature for `bob`
            let [functionSignature, { r: metaTxnR, s: metaTxnS, v: metaTxnV }] =
              await prepareNativeMetaTxnSignature(
                erc721SoulboundTokenNativeGaslessMint,
                charlie,
                { to: charlie.address, r, s, v }
              );
            await expect(
              erc721SoulboundTokenNativeGaslessMint
                .connect(relayer)
                .executeMetaTransaction(
                  charlie.address,
                  functionSignature,
                  metaTxnR,
                  metaTxnS,
                  metaTxnV
                )
            ).to.be.reverted;

            // charlie tries minting to alice with signature for `bob`
            [functionSignature, { r: metaTxnR, s: metaTxnS, v: metaTxnV }] =
              await prepareNativeMetaTxnSignature(
                erc721SoulboundTokenNativeGaslessMint,
                charlie,
                {
                  to: alice.address,
                  r,
                  s,
                  v,
                }
              );
            await expect(
              erc721SoulboundTokenNativeGaslessMint
                .connect(relayer)
                .executeMetaTransaction(
                  charlie.address,
                  functionSignature,
                  metaTxnR,
                  metaTxnS,
                  metaTxnV
                )
            ).to.be.reverted;

            // charlie tries minting to bob with signature for `bob`, which should work
            [functionSignature, { r: metaTxnR, s: metaTxnS, v: metaTxnV }] =
              await prepareNativeMetaTxnSignature(
                erc721SoulboundTokenNativeGaslessMint,
                charlie,
                { to: bob.address, r, s, v }
              );

            await erc721SoulboundTokenNativeGaslessMint
              .connect(relayer)
              .executeMetaTransaction(
                charlie.address,
                functionSignature,
                metaTxnR,
                metaTxnS,
                metaTxnV
              );

            // nft transferred to bob, not charlie
            expect(
              (
                await erc721SoulboundTokenNativeGaslessMint.balanceOf(
                  charlie.address
                )
              ).toNumber()
            ).to.eq(0);
            expect(
              (
                await erc721SoulboundTokenNativeGaslessMint.balanceOf(
                  bob.address
                )
              ).toNumber()
            ).to.eq(1);
            expect(
              await erc721SoulboundTokenNativeGaslessMint.nextTokenId()
            ).to.eq(2);
            expect(
              await erc721SoulboundTokenNativeGaslessMint.ownerOf(1)
            ).to.eq(bob.address);
            expect(
              await erc721SoulboundTokenNativeGaslessMint.claims(bob.address)
            ).to.eq(1);
            expect(
              await erc721SoulboundTokenNativeGaslessMint.getNonce(
                charlie.address
              )
            ).to.eq(1);
          });

          it("should revert on signature replay", async () => {
            // mint token 1 on contract A
            const deployERC721SoulboundTokenNativeGaslessMint_A =
              await erc721TokenFactory.deployERC721Token(
                TokenType.ERC721SoulboundTokenNativeGaslessMint,
                encodeInitializationData([
                  "ERC721_A",
                  "ERC721_A",
                  "https://example.com/contractURI",
                  "https://example.com",
                  alice.address,
                  trustedAddress.address,
                  10,
                ]),
                +new Date()
              );
            const receipt_A =
              await deployERC721SoulboundTokenNativeGaslessMint_A.wait();
            const erc721TokenCloneAddress_A = getArgFromEvent(
              erc721TokenFactory,
              receipt_A,
              erc721TokenFactory.interface.events[
                "ERC721TokenDeployed(uint8,address,address,address)"
              ].name,
              "_erc721TokenClone"
            );
            const erc721_A = await ethers.getContractAt(
              "ERC721SoulboundTokenNativeGaslessMintImpl",
              erc721TokenCloneAddress_A
            );
            const { domain, types, value } = getEIP712TypedData({
              to: bob.address,
              contractAddress: erc721_A.address,
              chainId: hre.network.config.chainId as number,
              domainName: "ERC721_A", // contract A name
              domainVersion: "1.0",
            });
            const rawSignature: string = await trustedAddress._signTypedData(
              domain,
              types,
              value
            );
            const { v, r, s } = ethers.utils.splitSignature(rawSignature);
            let [functionSignature, { r: metaTxnR, s: metaTxnS, v: metaTxnV }] =
              await prepareNativeMetaTxnSignature(erc721_A, bob, {
                to: bob.address,
                r,
                s,
                v,
              });

            await erc721_A
              .connect(relayer)
              .executeMetaTransaction(
                bob.address,
                functionSignature,
                metaTxnR,
                metaTxnS,
                metaTxnV
              );

            // replay signature from contract A to mint from contract B
            const deployERC721SoulboundTokenNativeGaslessMint_B =
              await erc721TokenFactory.deployERC721Token(
                TokenType.ERC721SoulboundTokenNativeGaslessMint,
                encodeInitializationData([
                  "ERC721_B",
                  "ERC721_B",
                  "https://example.com/contractURI",
                  "https://example.com",
                  alice.address,
                  trustedAddress.address,
                  10,
                ]),
                +new Date()
              );
            const receipt_B =
              await deployERC721SoulboundTokenNativeGaslessMint_B.wait();
            const erc721TokenCloneAddress_B = getArgFromEvent(
              erc721TokenFactory,
              receipt_B,
              erc721TokenFactory.interface.events[
                "ERC721TokenDeployed(uint8,address,address,address)"
              ].name,
              "_erc721TokenClone"
            );
            const erc721_B = await ethers.getContractAt(
              "ERC721SoulboundTokenNativeGaslessMintImpl",
              erc721TokenCloneAddress_B
            );
            await expect(
              erc721_B
                .connect(relayer)
                .executeMetaTransaction(
                  bob.address,
                  functionSignature,
                  metaTxnR,
                  metaTxnS,
                  metaTxnV
                )
            ).to.be.reverted;
            // try minting to another address
            [functionSignature] = await prepareNativeMetaTxnSignature(
              erc721_A,
              bob,
              {
                to: charlie.address,
                r,
                s,
                v,
              }
            );
            await expect(
              erc721_B
                .connect(relayer)
                .executeMetaTransaction(
                  bob.address,
                  functionSignature,
                  metaTxnR,
                  metaTxnS,
                  metaTxnV
                )
            ).to.be.reverted;
          });
        });

        it("should throw an error if minted past max supply", async () => {
          const deployERC721Token = await erc721TokenFactory.deployERC721Token(
            TokenType.ERC721SoulboundTokenNativeGaslessMint,
            encodeInitializationData([
              "TestToken",
              "TEST",
              "https://example.com/contractURI",
              "https://example.com",
              alice.address,
              trustedAddress.address,
              1,
            ]), // only 1 maxSupply
            +new Date()
          );
          const receipt = await deployERC721Token.wait();
          const erc721TokenCloneAddress = getArgFromEvent(
            erc721TokenFactory,
            receipt,
            erc721TokenFactory.interface.events[
              "ERC721TokenDeployed(uint8,address,address,address)"
            ].name,
            "_erc721TokenClone"
          );
          erc721SoulboundTokenNativeGaslessMint = await ethers.getContractAt(
            "ERC721SoulboundTokenNativeGaslessMintImpl",
            erc721TokenCloneAddress
          );

          const mint = async (user: SignerWithAddress) => {
            const { v, r, s } = await ERC721_generateSignature(
              erc721SoulboundTokenNativeGaslessMint,
              trustedAddress,
              user.address
            );
            const [
              functionSignature,
              { r: metaTxnR, s: metaTxnS, v: metaTxnV },
            ] = await prepareNativeMetaTxnSignature(
              erc721SoulboundTokenNativeGaslessMint,
              user,
              { to: user.address, r, s, v }
            );

            await erc721SoulboundTokenNativeGaslessMint
              .connect(relayer)
              .executeMetaTransaction(
                user.address,
                functionSignature,
                metaTxnR,
                metaTxnS,
                metaTxnV
              );
          };
          await mint(bob);
          await expect(mint(charlie)).to.reverted;
        });

        it("should not allow claiming again", async () => {
          let { v, r, s } = await ERC721_generateSignature(
            erc721SoulboundTokenNativeGaslessMint,
            trustedAddress,
            bob.address // signature for bob
          );

          // bob mints for bob
          let [functionSignature, { r: metaTxnR, s: metaTxnS, v: metaTxnV }] =
            await prepareNativeMetaTxnSignature(
              erc721SoulboundTokenNativeGaslessMint,
              bob,
              { to: bob.address, r, s, v }
            );
          await erc721SoulboundTokenNativeGaslessMint
            .connect(relayer)
            .executeMetaTransaction(
              bob.address,
              functionSignature,
              metaTxnR,
              metaTxnS,
              metaTxnV
            );

          //  try minting again
          await expect(
            erc721SoulboundTokenNativeGaslessMint
              .connect(relayer)
              .executeMetaTransaction(
                bob.address,
                functionSignature,
                metaTxnR,
                metaTxnS,
                metaTxnV
              )
          ).to.be.reverted;

          // charlie mints for bob
          [functionSignature, { r: metaTxnR, s: metaTxnS, v: metaTxnV }] =
            await prepareNativeMetaTxnSignature(
              erc721SoulboundTokenNativeGaslessMint,
              charlie,
              { to: bob.address, r, s, v }
            );
          await expect(
            erc721SoulboundTokenNativeGaslessMint
              .connect(relayer)
              .executeMetaTransaction(
                charlie.address,
                functionSignature,
                metaTxnR,
                metaTxnS,
                metaTxnV
              )
          ).to.be.reverted;

          // Try latest signature
          ({ v, r, s } = await ERC721_generateSignature(
            erc721SoulboundTokenNativeGaslessMint,
            trustedAddress,
            bob.address
          ));
          [functionSignature, { r: metaTxnR, s: metaTxnS, v: metaTxnV }] =
            await prepareNativeMetaTxnSignature(
              erc721SoulboundTokenNativeGaslessMint,
              bob,
              { to: bob.address, r, s, v }
            );
          //  try minting again with the new signature
          await expect(
            erc721SoulboundTokenNativeGaslessMint
              .connect(relayer)
              .executeMetaTransaction(
                bob.address,
                functionSignature,
                metaTxnR,
                metaTxnS,
                metaTxnV
              )
          ).to.be.reverted;

          // charlie mints for bob
          [functionSignature, { r: metaTxnR, s: metaTxnS, v: metaTxnV }] =
            await prepareNativeMetaTxnSignature(
              erc721SoulboundTokenNativeGaslessMint,
              charlie,
              { to: bob.address, r, s, v }
            );
          await expect(
            erc721SoulboundTokenNativeGaslessMint
              .connect(relayer)
              .executeMetaTransaction(
                charlie.address,
                functionSignature,
                metaTxnR,
                metaTxnS,
                metaTxnV
              )
          ).to.be.reverted;
        });
      });
    });
  });
});

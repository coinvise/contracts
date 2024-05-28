import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { keccak256, parseEther, toUtf8Bytes } from "ethers/lib/utils";
import { ethers } from "hardhat";
import { ERC20Token, ERC20TokenFactory } from "../../typechain";
import {
  ZERO_ADDRESS,
  ZERO_ADDRESS_BYTES32,
  getArgFromEvent,
} from "../test-utils";

describe("ERC20Token", function () {
  let erc20TokenLogic: ERC20Token;
  let erc20Token: ERC20Token;
  let erc20TokenFactory: ERC20TokenFactory;
  let owner: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let charlie: SignerWithAddress;
  let addrs: SignerWithAddress[];

  beforeEach(async function () {
    [owner, alice, bob, charlie, ...addrs] = await ethers.getSigners();

    // Deploy ERC20Token logic contract
    const ERC20Token = await ethers.getContractFactory("ERC20Token");
    erc20TokenLogic = await ERC20Token.deploy();

    // Deploy ERC20TokenFactory
    const ERC20TokenFactory = await ethers.getContractFactory(
      "ERC20TokenFactory"
    );
    erc20TokenFactory = await ERC20TokenFactory.deploy(erc20TokenLogic.address);

    // Deploy new ERC20Token via ERC20TokenFactory
    const deployERC20Token = await erc20TokenFactory.deployERC20Token(
      "TestToken",
      "TEST",
      parseEther("1000"),
      owner.address,
      +new Date()
    );
    const receipt = await deployERC20Token.wait();
    const deployedERC20TokenCloneAddress = getArgFromEvent(
      erc20TokenFactory,
      receipt,
      erc20TokenFactory.interface.events["ERC20TokenDeployed(address,address)"]
        .name,
      "_erc20TokenClone"
    );
    erc20Token = await ethers.getContractAt(
      "ERC20Token",
      deployedERC20TokenCloneAddress
    );
  });

  describe("ERC20TokenFactory", () => {
    it("Should deploy ERC20TokenFactory", async function () {
      // Deploy ERC20Token logic contract
      const ERC20Token = await ethers.getContractFactory("ERC20Token");
      erc20TokenLogic = await ERC20Token.deploy();

      // Deploy ERC20TokenFactory
      const ERC20TokenFactory = await ethers.getContractFactory(
        "ERC20TokenFactory"
      );
      let erc20TokenFactory = await ERC20TokenFactory.deploy(
        erc20TokenLogic.address
      );

      expect(await erc20TokenFactory.erc20Token()).to.equal(
        erc20TokenLogic.address
      );
    });

    it("Should revert on deploy if erc20Token logic address is zero address", async function () {
      // Deploy ERC20TokenFactory
      const ERC20TokenFactory = await ethers.getContractFactory(
        "ERC20TokenFactory"
      );
      await expect(ERC20TokenFactory.deploy(ZERO_ADDRESS)).to.be.revertedWith(
        "ERR__ERC20_TOKEN_CANNOT_BE_ZERO_ADDRESS"
      );
    });

    // Deploy a ERC20Token clone via ERC20TokenFactory
    it("Should allow to deployERC20Token()", async function () {
      // Deploy ERC20Token clone
      const deployERC20Token = await erc20TokenFactory.deployERC20Token(
        "TestToken",
        "TEST",
        parseEther("1000"),
        owner.address,
        +new Date()
      );

      // Assert event emitted
      const receipt = await deployERC20Token.wait();
      const creator = getArgFromEvent(
        erc20TokenFactory,
        receipt,
        erc20TokenFactory.interface.events[
          "ERC20TokenDeployed(address,address)"
        ].name,
        "_creator"
      );
      const deployedERC20TokenCloneAddress = getArgFromEvent(
        erc20TokenFactory,
        receipt,
        erc20TokenFactory.interface.events[
          "ERC20TokenDeployed(address,address)"
        ].name,
        "_erc20TokenClone"
      );
      expect(creator).to.equal(owner.address);

      // Assert initialized state variables in ERC20Token clone
      let erc20Token = await ethers.getContractAt(
        "ERC20Token",
        deployedERC20TokenCloneAddress
      );

      expect(await erc20Token.creator()).to.equal(owner.address);
      expect(await erc20Token.name()).to.equal("TestToken");
      expect(await erc20Token.symbol()).to.equal("TEST");
      expect(await erc20Token.totalSupply()).to.equal(parseEther("1000"));

      // Should mint initialSupply tokens to the minter
      expect(await erc20Token.balanceOf(owner.address)).to.equal(
        parseEther("1000")
      );

      // Deployer should be granted DEFAULT_ADMIN_ROLE
      expect(
        await erc20Token.hasRole(ZERO_ADDRESS_BYTES32, owner.address)
      ).to.equal(true);

      // Deployer should be granted PAUSER_ROLE
      expect(
        await erc20Token.hasRole(
          keccak256(toUtf8Bytes("PAUSER_ROLE")),
          owner.address
        )
      ).to.equal(true);
    });

    it("Should allow to deployERC20Token() multiple times and each should have separate valid states", async function () {
      let receipt;
      let creator;
      let erc20TokenDeployedEvent;
      let deployedERC20TokenCloneAddress;

      // ERC20Token A
      // Deploy ERC20Token clone
      const deployERC20TokenA = await erc20TokenFactory
        .connect(alice)
        .deployERC20Token(
          "ERC20TokenA",
          "ERC20a",
          parseEther("1000"),
          alice.address,
          +new Date()
        );

      // Assert event emitted
      receipt = await deployERC20TokenA.wait();
      creator = getArgFromEvent(
        erc20TokenFactory,
        receipt,
        erc20TokenFactory.interface.events[
          "ERC20TokenDeployed(address,address)"
        ].name,
        "_creator"
      );
      deployedERC20TokenCloneAddress = getArgFromEvent(
        erc20TokenFactory,
        receipt,
        erc20TokenFactory.interface.events[
          "ERC20TokenDeployed(address,address)"
        ].name,
        "_erc20TokenClone"
      );
      expect(creator).to.equal(alice.address);

      let erc20TokenA = await ethers.getContractAt(
        "ERC20Token",
        deployedERC20TokenCloneAddress
      );

      // ERC20Token B
      // Deploy ERC20Token clone
      const deployERC20TokenB = await erc20TokenFactory
        .connect(bob)
        .deployERC20Token(
          "ERC20TokenB",
          "ERC20b",
          parseEther("2000"),
          bob.address,
          +new Date()
        );

      // Assert event emitted
      receipt = await deployERC20TokenB.wait();
      creator = getArgFromEvent(
        erc20TokenFactory,
        receipt,
        erc20TokenFactory.interface.events[
          "ERC20TokenDeployed(address,address)"
        ].name,
        "_creator"
      );
      deployedERC20TokenCloneAddress = getArgFromEvent(
        erc20TokenFactory,
        receipt,
        erc20TokenFactory.interface.events[
          "ERC20TokenDeployed(address,address)"
        ].name,
        "_erc20TokenClone"
      );
      expect(creator).to.equal(bob.address);

      let erc20TokenB = await ethers.getContractAt(
        "ERC20Token",
        deployedERC20TokenCloneAddress
      );

      // ERC20Token C
      // Deploy ERC20Token clone
      const deployERC20TokenC = await erc20TokenFactory
        .connect(charlie)
        .deployERC20Token(
          "ERC20TokenC",
          "ERC20c",
          parseEther("3000"),
          charlie.address,
          +new Date()
        );

      // Assert event emitted
      receipt = await deployERC20TokenC.wait();
      creator = getArgFromEvent(
        erc20TokenFactory,
        receipt,
        erc20TokenFactory.interface.events[
          "ERC20TokenDeployed(address,address)"
        ].name,
        "_creator"
      );
      deployedERC20TokenCloneAddress = getArgFromEvent(
        erc20TokenFactory,
        receipt,
        erc20TokenFactory.interface.events[
          "ERC20TokenDeployed(address,address)"
        ].name,
        "_erc20TokenClone"
      );
      expect(creator).to.equal(charlie.address);

      let erc20TokenC = await ethers.getContractAt(
        "ERC20Token",
        deployedERC20TokenCloneAddress
      );

      // Assert all ERC20Token states
      // Assert ERC20Token A states
      expect(await erc20TokenA.creator()).to.equal(alice.address);
      expect(await erc20TokenA.name()).to.equal("ERC20TokenA");
      expect(await erc20TokenA.symbol()).to.equal("ERC20a");
      expect(await erc20TokenA.totalSupply()).to.equal(parseEther("1000"));
      // Should mint initialSupply tokens to the minter
      expect(await erc20TokenA.balanceOf(alice.address)).to.equal(
        parseEther("1000")
      );
      // Deployer should be granted DEFAULT_ADMIN_ROLE
      expect(
        await erc20TokenA.hasRole(ZERO_ADDRESS_BYTES32, alice.address)
      ).to.equal(true);
      // Deployer should be granted PAUSER_ROLE
      expect(
        await erc20TokenA.hasRole(
          keccak256(toUtf8Bytes("PAUSER_ROLE")),
          alice.address
        )
      ).to.equal(true);

      // Assert ERC20Token B states
      expect(await erc20TokenB.creator()).to.equal(bob.address);
      expect(await erc20TokenB.name()).to.equal("ERC20TokenB");
      expect(await erc20TokenB.symbol()).to.equal("ERC20b");
      expect(await erc20TokenB.totalSupply()).to.equal(parseEther("2000"));
      // Should mint initialSupply tokens to the minter
      expect(await erc20TokenB.balanceOf(bob.address)).to.equal(
        parseEther("2000")
      );
      // Deployer should be granted DEFAULT_ADMIN_ROLE
      expect(
        await erc20TokenB.hasRole(ZERO_ADDRESS_BYTES32, bob.address)
      ).to.equal(true);
      // Deployer should be granted PAUSER_ROLE
      expect(
        await erc20TokenB.hasRole(
          keccak256(toUtf8Bytes("PAUSER_ROLE")),
          bob.address
        )
      ).to.equal(true);

      // Assert ERC20Token C states
      expect(await erc20TokenC.creator()).to.equal(charlie.address);
      expect(await erc20TokenC.name()).to.equal("ERC20TokenC");
      expect(await erc20TokenC.symbol()).to.equal("ERC20c");
      expect(await erc20TokenC.totalSupply()).to.equal(parseEther("3000"));
      // Should mint initialSupply tokens to the minter
      expect(await erc20TokenC.balanceOf(charlie.address)).to.equal(
        parseEther("3000")
      );
      // Deployer should be granted DEFAULT_ADMIN_ROLE
      expect(
        await erc20TokenC.hasRole(ZERO_ADDRESS_BYTES32, charlie.address)
      ).to.equal(true);
      // Deployer should be granted PAUSER_ROLE
      expect(
        await erc20TokenC.hasRole(
          keccak256(toUtf8Bytes("PAUSER_ROLE")),
          charlie.address
        )
      ).to.equal(true);
    });

    it("Should allow ERC20TokenFactory owner to setERC20TokenImplAddress()", async function () {
      // Deploy a new ERC20Token logic contract
      const ERC20Token = await ethers.getContractFactory("ERC20Token");
      let newErc20TokenLogic = await ERC20Token.deploy();

      // Change erc20Token impl address
      await erc20TokenFactory.setERC20TokenImplAddress(
        newErc20TokenLogic.address
      );

      expect(await erc20TokenFactory.erc20Token()).to.equal(
        newErc20TokenLogic.address
      );
    });

    it("Should revert if non-ERC20TokenFactory-owner tries to setERC20TokenImplAddress()", async function () {
      // Deploy a new ERC20Token logic contract
      const ERC20Token = await ethers.getContractFactory("ERC20Token");
      let newErc20TokenLogic = await ERC20Token.deploy();

      // Try to change erc20Token impl address as alice
      await expect(
        erc20TokenFactory
          .connect(alice)
          .setERC20TokenImplAddress(newErc20TokenLogic.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should revert if ERC20TokenFactory owner tries to setERC20TokenImplAddress() to zero address", async function () {
      // Try to change erc20Token impl address to zero address
      await expect(
        erc20TokenFactory.setERC20TokenImplAddress(ZERO_ADDRESS)
      ).to.be.revertedWith("ERR__ERC20_TOKEN_CANNOT_BE_ZERO_ADDRESS");
    });
  });

  describe("ERC20Token", async function () {
    it("Should deploy ERC20Token logic contract", async function () {
      // Deploy ERC20Token logic contract
      const ERC20Token = await ethers.getContractFactory("ERC20Token");
      await ERC20Token.deploy();
    });

    it("Should revert if anyone tries to initialize() after deployment", async function () {
      // Deploy ERC20Token logic contract
      const ERC20Token = await ethers.getContractFactory("ERC20Token");
      let erc20TokenLogic = await ERC20Token.deploy();

      // Try calling initialize
      await expect(
        erc20TokenLogic.initialize(
          owner.address,
          "TestToken",
          "TEST",
          parseEther("1000"),
          owner.address
        )
      ).to.be.revertedWith("Initializable: contract is already initialized");
    });

    it("Should allow to transfer() tokens", async function () {
      await expect(() =>
        erc20Token.transfer(alice.address, parseEther("10"))
      ).to.changeTokenBalances(
        erc20Token,
        [owner, alice],
        [parseEther("-10"), parseEther("10")]
      );
    });

    it("Should allow PAUSER_ROLE to pause() transfers", async function () {
      // paused() should be false initially
      expect(await erc20Token.paused()).to.equal(false);

      // Pause transfers
      await erc20Token.pause();

      // paused() should now be true
      expect(await erc20Token.paused()).to.equal(true);
    });

    it("Should revert if anyone without PAUSER_ROLE tries to pause() transfers", async function () {
      // Try to Pause transfers as alice
      await expect(erc20Token.connect(alice).pause()).to.be.revertedWith(
        "ERC20Token: must have pauser role to pause"
      );
    });

    it("Should allow PAUSER_ROLE to unpause() transfers", async function () {
      // paused() should be false initially
      expect(await erc20Token.paused()).to.equal(false);

      // Pause transfers
      await erc20Token.pause();

      // paused() should now be true
      expect(await erc20Token.paused()).to.equal(true);

      // Unpause transfers
      await erc20Token.unpause();

      // paused() should now be false
      expect(await erc20Token.paused()).to.equal(false);
    });

    it("Should revert if anyone without PAUSER_ROLE tries to unpause() transfers", async function () {
      // Try to Pause transfers as alice
      await expect(erc20Token.connect(alice).unpause()).to.be.revertedWith(
        "ERC20Token: must have pauser role to unpause"
      );
    });

    it("Should revert on transfer() if paused", async function () {
      // Pause transfers
      await erc20Token.pause();

      // paused() should now be true
      expect(await erc20Token.paused()).to.equal(true);

      // Transfer should now revert
      await expect(
        erc20Token.transfer(alice.address, parseEther("10"))
      ).to.be.revertedWith("ERC20Pausable: token transfer while paused");
    });

    it("Should transfer tokens once unpaused", async function () {
      // Pause transfers
      await erc20Token.pause();

      // Unpause transfers
      await erc20Token.unpause();

      // paused() should now be false
      expect(await erc20Token.paused()).to.equal(false);

      // Transfer should now transfer without revert
      await expect(() =>
        erc20Token.transfer(alice.address, parseEther("10"))
      ).to.changeTokenBalances(
        erc20Token,
        [owner, alice],
        [parseEther("-10"), parseEther("10")]
      );
    });

    it("Should allow token holders to burn() their own tokens", async function () {
      await expect(() =>
        erc20Token.burn(parseEther("250"))
      ).to.changeTokenBalance(erc20Token, owner, parseEther("-250"));

      // Total supply should be reduced by 250 tokens
      expect(await erc20Token.totalSupply()).to.equal(parseEther("750"));
    });

    it("Should allow anyone with allowance to burnFrom() other accounts", async function () {
      // Approve alice to spend 250 tokens
      await erc20Token.approve(alice.address, parseEther("250"));

      // Alice should now be able to burnFrom() owner
      await expect(() =>
        erc20Token.connect(alice).burnFrom(owner.address, parseEther("250"))
      ).to.changeTokenBalance(erc20Token, owner, parseEther("-250"));

      // Total supply should be reduced by 250 tokens
      expect(await erc20Token.totalSupply()).to.equal(parseEther("750"));
    });
  });
});

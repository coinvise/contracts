import "@nomiclabs/hardhat-ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Contract, utils } from "ethers";
import { parseEther } from "ethers/lib/utils";
import hre, { ethers } from "hardhat";
import { resetNetwork, timeTravel, ZERO_ADDRESS } from "./test-utils";

describe("Vesting", () => {
  let vesting: Contract;
  let vestingInterface: utils.Interface;
  let vestingLogic: Contract;
  let vestingProxy: Contract;
  let vestingFactory: Contract;
  let vestingFactoryInterface: utils.Interface;
  let owner: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let charlie: SignerWithAddress;
  let addrs: SignerWithAddress[];
  let dai: Contract;

  const Nov_1_2021_GMT = +new Date(Date.UTC(2021, 10, 1, 0, 0, 0)) / 1000;

  const Dec_1_2021_GMT = +new Date(Date.UTC(2021, 11, 1, 0, 0, 0)) / 1000;

  const Jan_1_2022_GMT = +new Date(Date.UTC(2022, 0, 1, 0, 0, 0)) / 1000;

  const Feb_1_2022_GMT = +new Date(Date.UTC(2022, 1, 1, 0, 0, 0)) / 1000;
  const Feb_3_2022_GMT = +new Date(Date.UTC(2022, 1, 3, 0, 0, 0)) / 1000;

  const Mar_1_2022_GMT = +new Date(Date.UTC(2022, 2, 1, 0, 0, 0)) / 1000;
  const Mar_24_2022_11_23_54_GMT =
    +new Date(Date.UTC(2022, 2, 24, 11, 23, 54)) / 1000;

  const Apr_1_2022_GMT = +new Date(Date.UTC(2022, 3, 1, 0, 0, 0)) / 1000;

  const Jun_1_2022_GMT = +new Date(Date.UTC(2022, 5, 1, 0, 0, 0)) / 1000;
  const Jun_10_2022_22_42_12_GMT =
    +new Date(Date.UTC(2022, 5, 10, 22, 42, 12)) / 1000;

  const Jul_1_2022_GMT = +new Date(Date.UTC(2022, 6, 1, 0, 0, 0)) / 1000;

  const Oct_1_2022_GMT = +new Date(Date.UTC(2022, 9, 1, 0, 0, 0)) / 1000;
  const Oct_31_2022_09_45_32_GMT =
    +new Date(Date.UTC(2022, 9, 31, 9, 45, 32)) / 1000;

  const Nov_1_2022_GMT = +new Date(Date.UTC(2022, 10, 1, 0, 0, 0)) / 1000;

  const Dec_1_2022_GMT = +new Date(Date.UTC(2022, 11, 1, 0, 0, 0)) / 1000;

  const Dec_10_2022_23_12_42_GMT =
    +new Date(Date.UTC(2022, 11, 10, 23, 12, 42)) / 1000;

  //before each test
  beforeEach(async () => {
    // Prepare wallets
    [owner, alice, bob, charlie, ...addrs] = await ethers.getSigners();

    // Deploy DAI and mint 12000 DAI to owner
    const Dai = await ethers.getContractFactory("TestERC20");
    dai = await Dai.deploy("Dai", "DAI");
    await dai.mint(owner.address, ethers.utils.parseEther("12000"));

    // Deploy Vesting logic contract
    const Vesting = await ethers.getContractFactory("Vesting");
    vestingLogic = await Vesting.deploy();

    // Deploy VestingFactory
    const VestingFactory = await ethers.getContractFactory("VestingFactory");
    vestingFactory = await VestingFactory.deploy(vestingLogic.address);
    vestingFactoryInterface = VestingFactory.interface;

    // Approve VestingFactory to spend 12000 DAI from owner
    await dai.approve(vestingFactory.address, parseEther("12000"));

    // Deploy a Vesting proxy via VestingFactory with alice as beneficiary
    // tokenAddress = DAI
    // beneficiary = alice
    // start = Nov_1_2021_GMT
    // cliff = 3 months
    // totalTokens = 12000 DAI
    // noOfMonths = 12 months
    const deployVestingProxy = await vestingFactory.deployVestingProxy(
      dai.address,
      alice.address,
      Nov_1_2021_GMT,
      3,
      parseEther("12000"),
      12
    );
    const receipt = await deployVestingProxy.wait();
    const vestingProxyDeployedEvent = receipt.events[1];
    const deployedVestingProxyAddress =
      vestingProxyDeployedEvent.args._vestingProxy;
    vestingProxy = await ethers.getContractAt(
      "contracts/vesting/VestingProxy.sol:VestingProxy",
      deployedVestingProxyAddress
    );
    vesting = await ethers.getContractAt(
      "Vesting",
      deployedVestingProxyAddress
    );
    vestingInterface = Vesting.interface;
  });

  afterEach(async () => {
    // Used to reset any time travel after each test
    await resetNetwork();
  });

  describe("VestingFactory", () => {
    it("Should deploy VestingFactory", async function () {
      // Deploy Vesting logic contract
      const Vesting = await ethers.getContractFactory("Vesting");
      let vestingLogic = await Vesting.deploy();

      // Deploy VestingFactory
      const VestingFactory = await ethers.getContractFactory("VestingFactory");
      let vestingFactory = await VestingFactory.deploy(vestingLogic.address);

      expect(await vestingFactory.vesting()).to.equal(vestingLogic.address);
    });

    it("Should revert on deploy if vesting logic address is zero address", async function () {
      // Deploy VestingFactory
      const VestingFactory = await ethers.getContractFactory("VestingFactory");
      await expect(VestingFactory.deploy(ZERO_ADDRESS)).to.be.revertedWith(
        "ERR__VESTING_CANNOT_BE_ZERO_ADDRESS"
      );
    });

    // Deploy a Vesting proxy via VestingFactory
    it("Should allow to deployVestingProxy()", async function () {
      // Mint 12000 DAI to owner
      await dai.mint(owner.address, ethers.utils.parseEther("12000"));
      // Approve VestingFactory to spend 12000 DAI from owner
      await dai.approve(vestingFactory.address, parseEther("12000"));
      // Deploy Vesting proxy
      const deployVestingProxy = await vestingFactory.deployVestingProxy(
        dai.address,
        alice.address,
        Nov_1_2021_GMT,
        3,
        parseEther("12000"),
        12
      );

      // Assert event emitted
      const receipt = await deployVestingProxy.wait();
      const vestingProxyDeployedEvent = receipt.events[1];
      expect(vestingProxyDeployedEvent.event).to.equal("VestingProxyDeployed");
      expect(vestingProxyDeployedEvent.args._creator).to.equal(owner.address);

      // Assert initialized state variables in Vesting proxy
      const deployedVestingProxyAddress =
        vestingProxyDeployedEvent.args._vestingProxy;
      let vestingProxy = await ethers.getContractAt(
        "contracts/vesting/VestingProxy.sol:VestingProxy",
        deployedVestingProxyAddress
      );
      let vesting = await ethers.getContractAt(
        "Vesting",
        deployedVestingProxyAddress
      );

      expect(await vestingProxy.vestingFactory()).to.equal(
        vestingFactory.address
      );
      expect(await vestingProxy.vesting()).to.equal(vestingLogic.address);

      expect(await vesting.creator()).to.equal(owner.address);
      expect(await vesting.token()).to.equal(dai.address);
      expect(await vesting.beneficiary()).to.equal(alice.address);
      expect(await vesting.start()).to.equal(Nov_1_2021_GMT);
      expect(await vesting.cliff()).to.equal(Feb_1_2022_GMT);
      expect(await vesting.releasePerMonth()).to.equal(parseEther("1000"));
      expect(await vesting.noOfMonths()).to.equal(12);
      expect(await vesting.released()).to.equal(0);
      expect(await vesting.revoked()).to.equal(false);
    });

    it("Should allow to deployVestingProxy() multiple times and each should have separate valid states", async function () {
      const TestERC20 = await ethers.getContractFactory("TestERC20");

      let receipt;
      let vestingProxyDeployedEvent;
      let deployedVestingProxyAddress;

      // Vesting A
      // Deploy $VESTINGa token and mint 48000 $VESTINGa to alice
      let vestingTokenA = await TestERC20.deploy("VestingTokenA", "$VESTINGa");
      await vestingTokenA.mint(alice.address, parseEther("48000"));

      // Approve VestingFactory to spend 48000 VESTINGa from alice
      await vestingTokenA
        .connect(alice)
        .approve(vestingFactory.address, parseEther("48000"));

      // Deploy VestingProxy via VestingFactory as alice
      const deployVestingProxyA = await vestingFactory
        .connect(alice)
        .deployVestingProxy(
          vestingTokenA.address,
          bob.address,
          Nov_1_2021_GMT,
          3,
          parseEther("48000"),
          24
        );

      // Assert event emitted
      receipt = await deployVestingProxyA.wait();
      vestingProxyDeployedEvent = receipt.events[1];
      expect(vestingProxyDeployedEvent.event).to.equal("VestingProxyDeployed");
      expect(vestingProxyDeployedEvent.args._creator).to.equal(alice.address);

      deployedVestingProxyAddress =
        vestingProxyDeployedEvent.args._vestingProxy;
      let vestingProxyA = await ethers.getContractAt(
        "contracts/vesting/VestingProxy.sol:VestingProxy",
        deployedVestingProxyAddress
      );
      let vestingA = await ethers.getContractAt(
        "Vesting",
        deployedVestingProxyAddress
      );

      // Vesting B
      // Deploy $VESTINGb token and mint 50000 $VESTINGb to bob
      let vestingTokenB = await TestERC20.deploy("VestingTokenB", "$VESTINGb");
      await vestingTokenB.mint(bob.address, parseEther("50000"));

      // Approve VestingFactory to spend 50000 VESTINGb from bob
      await vestingTokenB
        .connect(bob)
        .approve(vestingFactory.address, parseEther("50000"));

      // Deploy VestingProxy via VestingFactory as bob
      const deployVestingProxyB = await vestingFactory
        .connect(bob)
        .deployVestingProxy(
          vestingTokenB.address,
          charlie.address,
          Dec_1_2021_GMT,
          4,
          parseEther("50000"),
          20
        );

      // Assert event emitted
      receipt = await deployVestingProxyB.wait();
      vestingProxyDeployedEvent = receipt.events[1];
      expect(vestingProxyDeployedEvent.event).to.equal("VestingProxyDeployed");
      expect(vestingProxyDeployedEvent.args._creator).to.equal(bob.address);

      deployedVestingProxyAddress =
        vestingProxyDeployedEvent.args._vestingProxy;
      let vestingProxyB = await ethers.getContractAt(
        "contracts/vesting/VestingProxy.sol:VestingProxy",
        deployedVestingProxyAddress
      );
      let vestingB = await ethers.getContractAt(
        "Vesting",
        deployedVestingProxyAddress
      );

      // Vesting C
      // Deploy $VESTINGc token and mint 75000 $VESTINGc to charlie
      let vestingTokenC = await TestERC20.deploy("VestingTokenC", "$VESTINGc");
      await vestingTokenC.mint(charlie.address, parseEther("75000"));

      // Approve VestingFactory to spend 75000 VESTINGc from charlie
      await vestingTokenC
        .connect(charlie)
        .approve(vestingFactory.address, parseEther("75000"));

      // Deploy VestingProxy via VestingFactory as charlie
      const deployVestingProxyC = await vestingFactory
        .connect(charlie)
        .deployVestingProxy(
          vestingTokenC.address,
          alice.address,
          Jan_1_2022_GMT,
          5,
          parseEther("75000"),
          25
        );

      // Assert event emitted
      receipt = await deployVestingProxyC.wait();
      vestingProxyDeployedEvent = receipt.events[1];
      expect(vestingProxyDeployedEvent.event).to.equal("VestingProxyDeployed");
      expect(vestingProxyDeployedEvent.args._creator).to.equal(charlie.address);

      deployedVestingProxyAddress =
        vestingProxyDeployedEvent.args._vestingProxy;
      let vestingProxyC = await ethers.getContractAt(
        "contracts/vesting/VestingProxy.sol:VestingProxy",
        deployedVestingProxyAddress
      );
      let vestingC = await ethers.getContractAt(
        "Vesting",
        deployedVestingProxyAddress
      );

      // Assert all vestings states
      // Assert Vesting A states
      expect(await vestingProxyA.vestingFactory()).to.equal(
        vestingFactory.address
      );
      expect(await vestingProxyA.vesting()).to.equal(vestingLogic.address);
      expect(await vestingA.creator()).to.equal(alice.address);
      expect(await vestingA.token()).to.equal(vestingTokenA.address);
      expect(await vestingA.beneficiary()).to.equal(bob.address);
      expect(await vestingA.start()).to.equal(Nov_1_2021_GMT);
      expect(await vestingA.cliff()).to.equal(Feb_1_2022_GMT);
      expect(await vestingA.releasePerMonth()).to.equal(parseEther("2000"));
      expect(await vestingA.noOfMonths()).to.equal(24);
      expect(await vestingA.released()).to.equal(0);
      expect(await vestingA.revoked()).to.equal(false);

      // Assert Vesting B states
      expect(await vestingProxyB.vestingFactory()).to.equal(
        vestingFactory.address
      );
      expect(await vestingProxyB.vesting()).to.equal(vestingLogic.address);
      expect(await vestingB.creator()).to.equal(bob.address);
      expect(await vestingB.token()).to.equal(vestingTokenB.address);
      expect(await vestingB.beneficiary()).to.equal(charlie.address);
      expect(await vestingB.start()).to.equal(Dec_1_2021_GMT);
      expect(await vestingB.cliff()).to.equal(Apr_1_2022_GMT);
      expect(await vestingB.releasePerMonth()).to.equal(parseEther("2500"));
      expect(await vestingB.noOfMonths()).to.equal(20);
      expect(await vestingB.released()).to.equal(0);
      expect(await vestingB.revoked()).to.equal(false);

      // Assert Vesting C states
      expect(await vestingProxyC.vestingFactory()).to.equal(
        vestingFactory.address
      );
      expect(await vestingProxyC.vesting()).to.equal(vestingLogic.address);
      expect(await vestingC.creator()).to.equal(charlie.address);
      expect(await vestingC.token()).to.equal(vestingTokenC.address);
      expect(await vestingC.beneficiary()).to.equal(alice.address);
      expect(await vestingC.start()).to.equal(Jan_1_2022_GMT);
      expect(await vestingC.cliff()).to.equal(Jun_1_2022_GMT);
      expect(await vestingC.releasePerMonth()).to.equal(parseEther("3000"));
      expect(await vestingC.noOfMonths()).to.equal(25);
      expect(await vestingC.released()).to.equal(0);
      expect(await vestingC.revoked()).to.equal(false);

      // Try upgrading one of the vestings
      // Deploy a new Vesting logic contract
      const Vesting = await ethers.getContractFactory("Vesting");
      let newVestingLogic = await Vesting.deploy();
      // Change vesting impl address
      await vestingFactory.setVestingImplAddress(newVestingLogic.address);
      // Upgrade Vesting B proxy
      await vestingFactory.connect(bob).upgradeProxy(vestingProxyB.address);

      // Assert Vesting B proxy is upgraded
      expect(await vestingProxyB.vesting()).to.equal(newVestingLogic.address);
      // Assert Vesting B state is intact
      expect(await vestingProxyB.vestingFactory()).to.equal(
        vestingFactory.address
      );
      expect(await vestingProxyB.vesting()).to.equal(newVestingLogic.address);
      expect(await vestingB.creator()).to.equal(bob.address);
      expect(await vestingB.token()).to.equal(vestingTokenB.address);
      expect(await vestingB.beneficiary()).to.equal(charlie.address);
      expect(await vestingB.start()).to.equal(Dec_1_2021_GMT);
      expect(await vestingB.cliff()).to.equal(Apr_1_2022_GMT);
      expect(await vestingB.releasePerMonth()).to.equal(parseEther("2500"));
      expect(await vestingB.noOfMonths()).to.equal(20);
      expect(await vestingB.released()).to.equal(0);
      expect(await vestingB.revoked()).to.equal(false);

      // Assert Vesting A proxy has not changed
      expect(await vestingProxyA.vesting()).to.equal(vestingLogic.address);

      // Assert Vesting C proxy has not changed
      expect(await vestingProxyC.vesting()).to.equal(vestingLogic.address);
    });

    it("Should allow VestingFactory owner to setVestingImplAddress()", async function () {
      // Deploy a new Vesting logic contract
      const Vesting = await ethers.getContractFactory("Vesting");
      let newVestingLogic = await Vesting.deploy();

      // Change vesting impl address
      await vestingFactory.setVestingImplAddress(newVestingLogic.address);

      expect(await vestingFactory.vesting()).to.equal(newVestingLogic.address);
    });

    it("Should revert if non-VestingFactory-owner tries to setVestingImplAddress()", async function () {
      // Deploy a new Vesting logic contract
      const Vesting = await ethers.getContractFactory("Vesting");
      let newVestingLogic = await Vesting.deploy();

      // Try to change vesting impl address as alice
      await expect(
        vestingFactory
          .connect(alice)
          .setVestingImplAddress(newVestingLogic.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should revert if VestingFactory owner tries to setVestingImplAddress() to zero address", async function () {
      // Try to change vesting impl address to zero address
      await expect(
        vestingFactory.setVestingImplAddress(ZERO_ADDRESS)
      ).to.be.revertedWith("ERR__VESTING_CANNOT_BE_ZERO_ADDRESS");
    });

    it("Should allow Vesting proxy creator to upgradeProxy() to the latest Vesting logic", async function () {
      // Deploy a new Vesting logic contract
      const Vesting = await ethers.getContractFactory("Vesting");
      let newVestingLogic = await Vesting.deploy();

      // Change vesting impl address
      await vestingFactory.setVestingImplAddress(newVestingLogic.address);

      // Upgrade proxy
      await vestingFactory.upgradeProxy(vestingProxy.address);

      expect(await vestingProxy.vesting()).to.equal(newVestingLogic.address);
    });

    it("Should revert if non-creator tries to upgradeProxy()", async function () {
      // Deploy a new Vesting logic contract
      const Vesting = await ethers.getContractFactory("Vesting");
      let newVestingLogic = await Vesting.deploy();

      // Change vesting impl address
      await vestingFactory.setVestingImplAddress(newVestingLogic.address);

      // Try to upgrade proxy as alice
      await expect(
        vestingFactory.connect(alice).upgradeProxy(vestingProxy.address)
      ).to.be.revertedWith("ERR__UNAUTHORIZED");
    });

    it("Should revert if creator tries to upgradeProxy() when it's already latest", async function () {
      // Try to upgrade proxy without changing vesting impl address
      await expect(
        vestingFactory.upgradeProxy(vestingProxy.address)
      ).to.be.revertedWith("ERR__VESTING_ALREADY_LATEST");
    });
  });

  describe("VestingProxy", async function () {
    it("Should deploy via VestingFactory", async function () {
      // Deploy Vesting logic contract
      const Vesting = await ethers.getContractFactory("Vesting");
      let vestingLogic = await Vesting.deploy();

      // Deploy VestingFactory
      const VestingFactory = await ethers.getContractFactory("VestingFactory");
      let vestingFactory = await VestingFactory.deploy(vestingLogic.address);

      // Mint 12000 DAI to owner
      await dai.mint(owner.address, ethers.utils.parseEther("12000"));
      // Approve VestingFactory to spend 12000 DAI from owner
      await dai.approve(vestingFactory.address, parseEther("12000"));

      // Deploy a Vesting proxy via VestingFactory
      const deployVestingProxy = await vestingFactory.deployVestingProxy(
        dai.address,
        alice.address,
        Nov_1_2021_GMT,
        3,
        parseEther("12000"),
        12
      );
      const receipt = await deployVestingProxy.wait();
      const vestingProxyDeployedEvent = receipt.events[1];
      const deployedVestingProxyAddress =
        vestingProxyDeployedEvent.args._vestingProxy;
      let vestingProxy = await ethers.getContractAt(
        "contracts/vesting/VestingProxy.sol:VestingProxy",
        deployedVestingProxyAddress
      );

      expect(await vestingProxy.vestingFactory()).to.equal(
        vestingFactory.address
      );
      expect(await vestingProxy.vesting()).to.equal(vestingLogic.address);
    });

    it("Should revert if deployer is not VestingFactory", async function () {
      const VestingProxy = await ethers.getContractFactory(
        "contracts/vesting/VestingProxy.sol:VestingProxy"
      );
      await expect(VestingProxy.deploy(vestingLogic.address, Buffer.from("")))
        .to.be.reverted;
    });

    it("Should allow VestingFactory to upgradeVesting()", async function () {
      // Deploy a new Vesting logic contract
      const Vesting = await ethers.getContractFactory("Vesting");
      let newVestingLogic = await Vesting.deploy();

      // Change vesting impl address
      await vestingFactory.setVestingImplAddress(newVestingLogic.address);

      // Upgrade proxy
      await vestingFactory.upgradeProxy(vestingProxy.address);

      expect(await vestingProxy.vesting()).to.equal(newVestingLogic.address);
    });

    it("Should revert if non-VestingFactory calls upgradeVesting()", async function () {
      await expect(
        vestingProxy.upgradeVesting(vestingLogic.address)
      ).to.be.revertedWith("ERR__UNAUTHORIZED");
    });
  });

  describe("Vesting", () => {
    it("Should deploy Vesting logic contract", async function () {
      // Deploy Vesting logic contract
      const Vesting = await ethers.getContractFactory("Vesting");
      await Vesting.deploy();
    });

    it("Should revert if anyone tries to initialize() after deployment", async function () {
      // Deploy Vesting logic contract
      const Vesting = await ethers.getContractFactory("Vesting");
      let vestingLogic = await Vesting.deploy();

      // Try calling initialize
      await expect(
        vestingLogic.initialize(
          owner.address,
          dai.address,
          alice.address,
          Nov_1_2021_GMT,
          3,
          parseEther("12000"),
          12
        )
      ).to.be.revertedWith("Initializable: contract is already initialized");
    });

    it("Should revert on deploy if beneficiary is ZERO_ADDRESS", async function () {
      // Try deploying a Vesting proxy with ZERO_ADDRESS as beneficiary
      await expect(
        vestingFactory.deployVestingProxy(
          dai.address,
          ZERO_ADDRESS,
          Nov_1_2021_GMT,
          3,
          parseEther("12000"),
          12
        )
      ).to.be.revertedWith("ERR__BENEFICIARY_CANNOT_BE_ZERO_ADDRESS");
    });

    it("Should revert on deploy if cliff is longer than total number of months", async function () {
      // Try deploying a Vesting proxy with cliff greater than noOfMonths
      await expect(
        vestingFactory.deployVestingProxy(
          dai.address,
          alice.address,
          Nov_1_2021_GMT,
          13,
          parseEther("12000"),
          12
        )
      ).to.be.revertedWith("ERR__CLIFF_CANNOT_BE_GREATER_THAN_TOTAL_MONTHS");
    });

    it("Should revert on deploy if creator doesn't have enough token balance", async function () {
      // Burn creator's DAI
      await dai.transfer(alice.address, await dai.balanceOf(owner.address));

      // Try deploying a Vesting
      await expect(
        vestingFactory.deployVestingProxy(
          dai.address,
          alice.address,
          Nov_1_2021_GMT,
          3,
          parseEther("12000"),
          12
        )
      ).to.be.revertedWith("ERR__INSUFFICIENT_TOKEN_BALANCE");
    });

    it("Should return zero as amount vested on vestedAmount() - before cliff", async function () {
      expect(await vesting.vestedAmount()).to.equal(0);
    });

    it("Should return correct amount vested on vestedAmount() - after cliff", async function () {
      // Time travel to cliff - 3 months from Nov_1_2021_GMT - Feb_1_2022_GMT
      await timeTravel(Feb_1_2022_GMT);

      // Vested amount should be 3000 - 1000 per month for 3 months - Nov 2021 to Feb 2022
      expect(await vesting.vestedAmount()).to.equal(parseEther("3000"));
    });

    it("Should return totalTokens as amount vested on vestedAmount() - after total vesting period", async function () {
      // Time travel to after vesting period Nov_1_2022_GMT
      await timeTravel(Nov_1_2022_GMT);

      // Vested amount should be totalTokens - 12000 after vesting period
      expect(await vesting.vestedAmount()).to.equal(parseEther("12000"));
    });

    it("Should return correct amount vested on vestedAmount() - after cliff, at different months", async function () {
      // Time travel to Mar_1_2022_GMT
      await timeTravel(Mar_1_2022_GMT);

      // Vested amount should be 4000 - 1000 per month for 4 months - Nov 2021 to Mar 2022
      expect(await vesting.vestedAmount()).to.equal(parseEther("4000"));

      // Time travel to Mar_24_2022_11_23_54_GMT
      await timeTravel(Mar_24_2022_11_23_54_GMT);

      // Vested amount should still be 4000
      expect(await vesting.vestedAmount()).to.equal(parseEther("4000"));

      // Time travel to Jun_1_2022_GMT
      await timeTravel(Jun_1_2022_GMT);

      // Vested amount should be 7000 - 1000 per month for 7 months - Nov 2021 to Jun 2022
      expect(await vesting.vestedAmount()).to.equal(parseEther("7000"));

      // Time travel to Jun_10_2022_22_42_12_GMT
      await timeTravel(Jun_10_2022_22_42_12_GMT);

      // Vested amount should still be 7000
      expect(await vesting.vestedAmount()).to.equal(parseEther("7000"));

      // Time travel to Oct_1_2022_GMT
      await timeTravel(Oct_1_2022_GMT);

      // Vested amount should be 11000 - 1000 per month for 11 months - Nov 2021 to Oct 2022
      expect(await vesting.vestedAmount()).to.equal(parseEther("11000"));

      // Time travel to Oct_31_2022_09_45_32_GMT
      await timeTravel(Oct_31_2022_09_45_32_GMT);

      // Vested amount should still be 11000
      expect(await vesting.vestedAmount()).to.equal(parseEther("11000"));

      // Time travel to Nov_1_2022_GMT
      await timeTravel(Nov_1_2022_GMT);

      // Vested amount should be 12000 - 1000 per month for 12 months - Nov 2021 to Nov 2022
      expect(await vesting.vestedAmount()).to.equal(parseEther("12000"));

      // Time travel to Dec_10_2022_23_12_42_GMT
      await timeTravel(Dec_10_2022_23_12_42_GMT);

      // Vested amount should still be 12000
      expect(await vesting.vestedAmount()).to.equal(parseEther("12000"));
    });

    it("Should return correct amount vested on vestedAmount() - after cliff, after revoke", async function () {
      // Time travel to cliff - Feb_1_2022_GMT
      await timeTravel(Feb_1_2022_GMT);

      // Revoke
      await vesting.revoke();

      // Vested amount should be 3000 - 1000 per month for 3 months - Nov 2021 to Feb 2022
      expect(await vesting.vestedAmount()).to.equal(parseEther("3000"));

      // Time travel to Oct_1_2022_GMT
      await timeTravel(Oct_1_2022_GMT);

      // Vested amount should still be 3000
      expect(await vesting.vestedAmount()).to.equal(parseEther("3000"));
    });

    it("Should allow to release() correct vested amount", async function () {
      // Time travel to cliff - Feb_1_2022_GMT
      await timeTravel(Feb_1_2022_GMT);

      // Should release 3000 - 1000 per month for 3 months - Nov 2021 to Feb 2022
      const release = () => vesting.release();
      await expect(() =>
        expect(release())
          .to.emit(vesting, "Released")
          .withArgs(parseEther("3000"))
      ).to.changeTokenBalances(
        dai,
        [vesting, alice],
        [parseEther("-3000"), parseEther("3000")]
      );
      // Total released should be 3000
      expect(await vesting.released()).to.equal(parseEther("3000"));

      // Time travel to Mar_1_2022_GMT
      await timeTravel(Mar_1_2022_GMT);

      // Should release 1000 - 1000 per month for 1 months - Feb 2022 to Mar 2022
      await expect(() =>
        expect(release())
          .to.emit(vesting, "Released")
          .withArgs(parseEther("1000"))
      ).to.changeTokenBalances(
        dai,
        [vesting, alice],
        [parseEther("-1000"), parseEther("1000")]
      );
      // Total released should be 4000
      expect(await vesting.released()).to.equal(parseEther("4000"));

      // Time travel to Jun_10_2022_22_42_12_GMT
      await timeTravel(Jun_10_2022_22_42_12_GMT);

      // Should release 3000 - 1000 per month for 3 months - Mar 2022 to Jun 2022
      await expect(() =>
        expect(release())
          .to.emit(vesting, "Released")
          .withArgs(parseEther("3000"))
      ).to.changeTokenBalances(
        dai,
        [vesting, alice],
        [parseEther("-3000"), parseEther("3000")]
      );
      // Total released should be 7000
      expect(await vesting.released()).to.equal(parseEther("7000"));

      // Time travel to Oct_31_2022_09_45_32_GMT
      await timeTravel(Oct_31_2022_09_45_32_GMT);

      // Should release 4000 - 1000 per month for 1 months - Jun 2022 to Oct 2022
      await expect(() =>
        expect(release())
          .to.emit(vesting, "Released")
          .withArgs(parseEther("4000"))
      ).to.changeTokenBalances(
        dai,
        [vesting, alice],
        [parseEther("-4000"), parseEther("4000")]
      );
      // Total released should be 11000
      expect(await vesting.released()).to.equal(parseEther("11000"));

      // Time travel to Dec_10_2022_23_12_42_GMT
      await timeTravel(Dec_10_2022_23_12_42_GMT);

      // Should release 1000 - 1000 per month for 1 months - Oct 2022 to Nov 2022
      await expect(() =>
        expect(release())
          .to.emit(vesting, "Released")
          .withArgs(parseEther("1000"))
      ).to.changeTokenBalances(
        dai,
        [vesting, alice],
        [parseEther("-1000"), parseEther("1000")]
      );
      // Total released should be 12000
      expect(await vesting.released()).to.equal(parseEther("12000"));
    });

    it("Should revert on release() - before cliff", async function () {
      await expect(vesting.release()).to.be.revertedWith(
        "ERR__ZERO_RELEASABLE_TOKENS"
      );
    });

    it("Should revert on release() if releasable amount already released", async function () {
      // Time travel to cliff - Feb_1_2022_GMT
      await timeTravel(Feb_1_2022_GMT);

      // Should release 3000 - 1000 per month for 3 months - Nov 2021 to Feb 2022
      const release = () => vesting.release();
      await expect(() =>
        expect(release())
          .to.emit(vesting, "Released")
          .withArgs(parseEther("3000"))
      ).to.changeTokenBalances(
        dai,
        [vesting, alice],
        [parseEther("-3000"), parseEther("3000")]
      );
      // Total released should be 3000
      expect(await vesting.released()).to.equal(parseEther("3000"));

      // Try calling release() again before next month
      await expect(vesting.release()).to.be.revertedWith(
        "ERR__ZERO_RELEASABLE_TOKENS"
      );
    });

    it("Should revert on release() if all amount has been already released", async function () {
      // Time travel to after vesting period Nov_1_2022_GMT
      await timeTravel(Nov_1_2022_GMT);

      // Should release 12000 - 1000 per month for 3 months - Nov 2021 to Nov 2022
      const release = () => vesting.release();
      await expect(() =>
        expect(release())
          .to.emit(vesting, "Released")
          .withArgs(parseEther("12000"))
      ).to.changeTokenBalances(
        dai,
        [vesting, alice],
        [parseEther("-12000"), parseEther("12000")]
      );
      // Total released should be 12000
      expect(await vesting.released()).to.equal(parseEther("12000"));

      // Try calling release() again
      await expect(vesting.release()).to.be.revertedWith(
        "ERR__ZERO_RELEASABLE_TOKENS"
      );
    });

    it("Should allow owner to revoke() vesting - before any release", async function () {
      // Should send back 12000 tokens back to owner
      const revoke = () => vesting.revoke();
      await expect(() =>
        expect(revoke()).to.emit(vesting, "Revoked")
      ).to.changeTokenBalances(
        dai,
        [vesting, owner],
        [parseEther("-12000"), parseEther("12000")]
      );

      // revoked should be set to true
      expect(await vesting.revoked()).to.equal(true);
    });

    it("Should allow owner to revoke() vesting - after some release", async function () {
      // Time travel to to cliff Feb_1_2022_GMT
      await timeTravel(Feb_1_2022_GMT);

      // Should release 3000 - 1000 per month for 3 months - Nov 2021 to Feb 2022
      const release = () => vesting.release();
      await expect(() =>
        expect(release())
          .to.emit(vesting, "Released")
          .withArgs(parseEther("3000"))
      ).to.changeTokenBalances(
        dai,
        [vesting, alice],
        [parseEther("-3000"), parseEther("3000")]
      );
      // Total released should be 3000
      expect(await vesting.released()).to.equal(parseEther("3000"));

      // Should send back 9000 tokens back to owner
      const revoke = () => vesting.revoke();
      await expect(() =>
        expect(revoke()).to.emit(vesting, "Revoked")
      ).to.changeTokenBalances(
        dai,
        [vesting, owner],
        [parseEther("-9000"), parseEther("9000")]
      );

      // revoked should be set to true
      expect(await vesting.revoked()).to.equal(true);
    });

    it("Should allow owner to revoke() vesting - after some release and vesting", async function () {
      // Time travel to cliff Feb_1_2022_GMT
      await timeTravel(Feb_1_2022_GMT);

      // Should release 3000 - 1000 per month for 3 months - Nov 2021 to Feb 2022
      const release = () => vesting.release();
      await expect(() =>
        expect(release())
          .to.emit(vesting, "Released")
          .withArgs(parseEther("3000"))
      ).to.changeTokenBalances(
        dai,
        [vesting, alice],
        [parseEther("-3000"), parseEther("3000")]
      );
      // Total released should be 3000
      expect(await vesting.released()).to.equal(parseEther("3000"));

      // Time travel to Apr_1_2022_GMT
      await timeTravel(Apr_1_2022_GMT);

      // Should send back 7000 tokens back to owner - 5000 total vested from Nov 2021 to Apr 2022
      const revoke = () => vesting.revoke();
      await expect(() =>
        expect(revoke()).to.emit(vesting, "Revoked")
      ).to.changeTokenBalances(
        dai,
        [vesting, owner],
        [parseEther("-7000"), parseEther("7000")]
      );

      // revoked should be set to true
      expect(await vesting.revoked()).to.equal(true);
    });

    it("Should revert if non-owner calls revoke()", async function () {
      await expect(vesting.connect(alice).revoke()).to.be.revertedWith(
        "ERR__UNAUTHORIZED"
      );
    });

    it("Should revert on revoke() if vesting already revoked", async function () {
      // Should send back 12000 tokens back to owner
      const revoke = () => vesting.revoke();
      await expect(() =>
        expect(revoke()).to.emit(vesting, "Revoked")
      ).to.changeTokenBalances(
        dai,
        [vesting, owner],
        [parseEther("-12000"), parseEther("12000")]
      );
      // revoked should be set to true
      expect(await vesting.revoked()).to.equal(true);

      await expect(vesting.revoke()).to.be.revertedWith("ERR__ALREADY_REVOKED");
    });

    it("Should return zero on releasableAmount() - before cliff", async function () {
      // Releasable amount before cliff should be zero
      expect(await vesting.releasableAmount()).to.equal(parseEther("0"));
    });

    it("Should return correct releasable amount on releasableAmount() - after cliff", async function () {
      // Time travel to to cliff Feb_1_2022_GMT
      await timeTravel(Feb_1_2022_GMT);

      // Releasable amount after cliff, before any release should be 3000
      expect(await vesting.releasableAmount()).to.equal(parseEther("3000"));
    });

    it("Should return correct releasable amount on releasableAmount() - after some release", async function () {
      // Time travel to to cliff Feb_1_2022_GMT
      await timeTravel(Feb_1_2022_GMT);

      // Should release 3000 - 1000 per month for 3 months - Nov 2021 to Feb 2022
      const release = () => vesting.release();
      await expect(() =>
        expect(release())
          .to.emit(vesting, "Released")
          .withArgs(parseEther("3000"))
      ).to.changeTokenBalances(
        dai,
        [vesting, alice],
        [parseEther("-3000"), parseEther("3000")]
      );
      // Total released should be 3000
      expect(await vesting.released()).to.equal(parseEther("3000"));

      // releasableAmount should be zero after release
      expect(await vesting.releasableAmount()).to.equal(parseEther("0"));

      // Time travel to Mar_1_2022_GMT
      await timeTravel(Mar_1_2022_GMT);

      // releasableAmount should be 1000 - 1000 per month for 1 month - Feb 2022 to Mar 2022
      expect(await vesting.releasableAmount()).to.equal(parseEther("1000"));
    });

    it("Should return cliff on nextUnlock() - before cliff", async function () {
      expect(await vesting.nextUnlock()).to.equal(Feb_1_2022_GMT);
    });

    it("Should return next month on nextUnlock() - after cliff", async function () {
      // Time travel to after cliff Feb_3_2022_GMT
      await timeTravel(Feb_3_2022_GMT);

      // nextUnlock should be Mar_1_2022_GMT
      expect(await vesting.nextUnlock()).to.equal(Mar_1_2022_GMT);
    });

    it("Should return next month on nextUnlock() - after cliff, at different months", async function () {
      // Time travel to cliff Feb_1_2022_GMT
      await timeTravel(Feb_1_2022_GMT);
      // nextUnlock should be Mar_1_2022_GMT
      expect(await vesting.nextUnlock()).to.equal(Mar_1_2022_GMT);

      // Time travel to Mar_1_2022_GMT
      await timeTravel(Mar_1_2022_GMT);
      // nextUnlock should be Apr_1_2022_GMT
      expect(await vesting.nextUnlock()).to.equal(Apr_1_2022_GMT);

      // Time travel to Jun_10_2022_22_42_12_GMT
      await timeTravel(Jun_10_2022_22_42_12_GMT);
      // nextUnlock should be Jul_1_2022_GMT
      expect(await vesting.nextUnlock()).to.equal(Jul_1_2022_GMT);
    });

    it("Should return vesting period on nextUnlock() - after total vesting period", async function () {
      // Time travel to after vesting period Nov_1_2022_GMT
      await timeTravel(Nov_1_2022_GMT);
      // nextUnlock should be Nov_1_2022_GMT
      expect(await vesting.nextUnlock()).to.equal(Nov_1_2022_GMT);

      // Time travel to after vesting period Dec_10_2022_23_12_42_GMT
      await timeTravel(Dec_10_2022_23_12_42_GMT);
      // nextUnlock should still be Nov_1_2022_GMT
      expect(await vesting.nextUnlock()).to.equal(Nov_1_2022_GMT);
    });

    it("Should handle vesting fine if totalTokens indivisible by noOfMonths", async function () {
      // alice should have 0 DAI on start
      expect(await dai.balanceOf(alice.address)).to.be.equal(0);

      // Mint 11000 DAI to owner
      await dai.mint(owner.address, ethers.utils.parseEther("11000"));
      // Approve VestingFactory to spend 11000 DAI from owner
      await dai.approve(vestingFactory.address, parseEther("11000"));
      // Deploy a Vesting with alice as beneficiary
      // tokenAddress = DAI
      // beneficiary = alice
      // start = Nov_1_2021_GMT
      // cliff = 3 months
      // totalTokens = 11000 DAI
      // noOfMonths = 12 months
      const deployVestingProxy = await vestingFactory.deployVestingProxy(
        dai.address,
        alice.address,
        Nov_1_2021_GMT,
        3,
        parseEther("11000"),
        12
      );
      const receipt = await deployVestingProxy.wait();
      const vestingProxyDeployedEvent = receipt.events[1];
      const deployedVestingProxyAddress =
        vestingProxyDeployedEvent.args._vestingProxy;
      let vesting = await ethers.getContractAt(
        "Vesting",
        deployedVestingProxyAddress
      );
      const releasePerMonth = parseEther("11000").div(12);

      // Assert initialized state
      expect(await vesting.token()).to.equal(dai.address);
      expect(await vesting.beneficiary()).to.equal(alice.address);
      expect(await vesting.start()).to.equal(Nov_1_2021_GMT);
      expect(await vesting.cliff()).to.equal(Feb_1_2022_GMT);
      expect(await vesting.releasePerMonth()).to.equal(releasePerMonth);
      expect(await vesting.noOfMonths()).to.equal(12);
      expect(await vesting.released()).to.equal(0);
      expect(await vesting.revoked()).to.equal(false);

      // nextUnlock() should be cliff
      expect(await vesting.nextUnlock()).to.equal(Feb_1_2022_GMT);
      // vestedAmount() should be zero
      expect(await vesting.vestedAmount()).to.equal(0);
      // releasableAmount() should be zero
      expect(await vesting.releasableAmount()).to.equal(0);

      // Time travel to to cliff Feb_1_2022_GMT
      await timeTravel(Feb_1_2022_GMT);
      // nextUnlock() should be Mar_1_2022_GMT
      expect(await vesting.nextUnlock()).to.equal(Mar_1_2022_GMT);
      // vestedAmount() should be releasePerMonth * 3
      let vestedAmount = releasePerMonth.mul(3);
      expect(await vesting.vestedAmount()).to.equal(vestedAmount);
      // releasableAmount() should be releasePerMonth * 3
      let releasableAmount = vestedAmount;
      expect(await vesting.releasableAmount()).to.equal(releasableAmount);
      // Release
      const release = () => vesting.release();
      await expect(() =>
        expect(release())
          .to.emit(vesting, "Released")
          .withArgs(releasableAmount)
      ).to.changeTokenBalances(
        dai,
        [vesting, alice],
        ["-" + releasableAmount.toString(), releasableAmount]
      );
      expect(await vesting.released()).to.equal(vestedAmount);

      // Time travel to Jun_10_2022_22_42_12_GMT
      await timeTravel(Jun_10_2022_22_42_12_GMT);
      // nextUnlock() should be Jul_1_2022_GMT
      expect(await vesting.nextUnlock()).to.equal(Jul_1_2022_GMT);
      // vestedAmount() should be releasePerMonth * 7
      let prevRelease = releasableAmount;
      vestedAmount = releasePerMonth.mul(7);
      expect(await vesting.vestedAmount()).to.equal(vestedAmount);
      // releasableAmount() should be releasePerMonth * 7 - prevRelease
      releasableAmount = vestedAmount.sub(prevRelease);
      expect(await vesting.releasableAmount()).to.equal(releasableAmount);
      // Release
      await expect(() =>
        expect(release())
          .to.emit(vesting, "Released")
          .withArgs(releasableAmount)
      ).to.changeTokenBalances(
        dai,
        [vesting, alice],
        ["-" + releasableAmount.toString(), releasableAmount]
      );
      expect(await vesting.released()).to.equal(vestedAmount);

      // Time travel to Dec_10_2022_23_12_42_GMT
      await timeTravel(Dec_10_2022_23_12_42_GMT);
      // nextUnlock() should be vesting period Nov_1_2022_GMT
      expect(await vesting.nextUnlock()).to.equal(Nov_1_2022_GMT);
      // vestedAmount() should be totalTokens
      expect(await vesting.vestedAmount()).to.equal(parseEther("11000"));
      // releasableAmount() should be balance of contract i.e, totalTokens - released
      releasableAmount = parseEther("11000").sub(await vesting.released());
      expect(await vesting.releasableAmount()).to.equal(releasableAmount);
      // Release
      await expect(() =>
        expect(release())
          .to.emit(vesting, "Released")
          .withArgs(releasableAmount)
      ).to.changeTokenBalances(
        dai,
        [vesting, alice],
        ["-" + releasableAmount.toString(), releasableAmount]
      );
      expect(await vesting.released()).to.equal(parseEther("11000"));

      // Assert no dust is left in the Vesting contract
      // alice should have 11000 DAI at the end
      expect(await dai.balanceOf(alice.address)).to.be.equal(
        parseEther("11000")
      );
      // vesting should have 0 DAI at the end
      expect(await dai.balanceOf(vesting.address)).to.be.equal(0);
    });
  });
});

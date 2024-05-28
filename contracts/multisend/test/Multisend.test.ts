import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber, Contract, utils } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { ethers } from "hardhat";

describe("Multisend", async function () {
  this.timeout(300000);
  let multisend: Contract;
  let multisendInterface: utils.Interface;
  let owner: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let charlie: SignerWithAddress;
  let addrs: SignerWithAddress[];
  let dai: Contract;

  beforeEach(async () => {
    [owner, alice, bob, charlie, ...addrs] = await ethers.getSigners();
    const Dai = await ethers.getContractFactory("TestERC20");
    dai = await Dai.deploy("Dai", "DAI");
    await dai.mint(owner.address, ethers.utils.parseEther("1000"));

    const Multisend = await ethers.getContractFactory("Multisend");
    multisend = await Multisend.deploy();
    multisendInterface = multisend.interface;

    await dai.approve(multisend.address, ethers.utils.parseEther("1000"));
  });

  it("Should deploy Multisend", async () => {
    const Multisend = await ethers.getContractFactory("Multisend");
    multisend = await Multisend.deploy();
  });

  it("Should allow to multisendEther()", async () => {
    await expect(
      async () =>
        await multisend.multisendEther(
          [alice.address, bob.address, charlie.address],
          [parseEther("0.1"), parseEther("0.2"), parseEther("0.3")],
          {
            value: parseEther("0.1")
              .add(parseEther("0.2"))
              .add(parseEther("0.3")),
          }
        )
    ).to.changeEtherBalances(
      [owner, multisend, alice, bob, charlie],
      [
        parseEther("-0.6"),
        parseEther("0"),
        parseEther("0.1"),
        parseEther("0.2"),
        parseEther("0.3"),
      ]
    );
  });

  it("Should refund sender if extra ether was sent", async () => {
    await expect(
      async () =>
        await multisend.multisendEther(
          [alice.address, bob.address, charlie.address],
          [parseEther("0.1"), parseEther("0.2"), parseEther("0.3")],
          {
            value: parseEther("0.1")
              .add(parseEther("0.2"))
              .add(parseEther("0.3"))
              .add(parseEther("0.5")), // Send extra 0.5 ETH
          }
        )
    ).to.changeEtherBalances(
      [owner, multisend, alice, bob, charlie],
      [
        parseEther("-0.6"),
        parseEther("0"),
        parseEther("0.1"),
        parseEther("0.2"),
        parseEther("0.3"),
        // Ether balances should still change only to expected values
      ]
    );
  });

  it("Should allow to multisendToken()", async () => {
    await expect(
      async () =>
        await multisend.multisendToken(
          dai.address,
          [alice.address, bob.address, charlie.address],
          [1, 2, 3]
        )
    ).to.changeTokenBalances(
      dai,
      [owner, multisend, alice, bob, charlie],
      [-6, 0, 1, 2, 3]
    );
  });

  it("Estimate Gas", async () => {
    // Set gas price
    const gasPriceInGwei = 165;
    console.log(`\nAssuming Gas Price = ${gasPriceInGwei} gwei...`);

    const estimate = async (recipientsCount: number) => {
      // Array of 160 duplicate addresses
      let addresses: SignerWithAddress[] = [];
      addresses.push(
        ...(await ethers.getSigners()),
        ...(await ethers.getSigners()),
        ...(await ethers.getSigners()),
        ...(await ethers.getSigners()),
        ...(await ethers.getSigners()),
        ...(await ethers.getSigners()),
        ...(await ethers.getSigners()),
        ...(await ethers.getSigners())
      );

      // Setup recipientsAddress according to recipientsCount
      let recipientsAddresses: string[] = [];
      for (let i = 0; i < recipientsCount; i++) {
        recipientsAddresses.push(addresses[i].address);
      }

      // Setup valuesEther with 1 ETH per recipient
      let valuesEther: BigNumber[] = [];
      for (let i = 0; i < recipientsCount; i++) {
        valuesEther.push(parseEther("1"));
      }

      // Setup valuesDai with 5000 DAI per recipient
      let valuesDai: BigNumber[];
      valuesDai = [];
      for (let i = 0; i < recipientsCount; i++) {
        valuesDai.push(parseEther("5000"));
      }

      // Estimate multisendEther()
      const estimateMultisendEther = (
        await multisend.estimateGas.multisendEther(
          recipientsAddresses,
          valuesEther,
          {
            value: parseEther(recipientsCount.toString()),
          }
        )
      ).toNumber();
      console.log(
        `\nmultisendEther(); ${recipientsCount} recipients; Estimated Gas = ${estimateMultisendEther}; Estimated Price ${
          (estimateMultisendEther * gasPriceInGwei) / Math.pow(10, 9)
        } ETH`
      );

      // Mint and Approve enough DAI for Multisend
      await dai.mint(
        owner.address,
        parseEther((5000 * recipientsCount).toString())
      );
      await dai.approve(
        multisend.address,
        parseEther((5000 * recipientsCount).toString())
      );

      // Estimate estimateMultisendToken()
      const estimateMultisendToken = (
        await multisend.estimateGas.multisendToken(
          dai.address,
          recipientsAddresses,
          valuesDai
        )
      ).toNumber();
      console.log(
        `multisendToken(); ${recipientsCount} recipients; Estimated Gas = ${estimateMultisendToken}; Estimated Price ${
          (estimateMultisendToken * gasPriceInGwei) / Math.pow(10, 9)
        } ETH`
      );
    };

    // Estimate for different no. of recipients
    await estimate(10);
    await estimate(25);
    await estimate(50);
    await estimate(75);
    await estimate(120);
    await estimate(160);
  });
});

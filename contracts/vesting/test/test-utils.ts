import hre, { ethers } from "hardhat";
import { expect } from "chai";

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
export const ZERO_ADDRESS_BYTES32 = ethers.constants.HashZero;

export const timeTravel = async (timestamp: Number) => {
  await hre.network.provider.send("evm_setNextBlockTimestamp", [timestamp]);
  await hre.network.provider.send("evm_mine");
  expect(
    (await ethers.provider.getBlock(await ethers.provider.getBlockNumber()))
      .timestamp
  ).to.equal(timestamp);
};

export const resetNetwork = async () => {
  await hre.network.provider.request({
    method: "hardhat_reset",
    params: [],
  });
};

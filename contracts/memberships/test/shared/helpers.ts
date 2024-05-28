import hre, { ethers } from "hardhat";
import { expect } from "chai";

export const timeTravel = async (timestamp: number) => {
  await hre.network.provider.send("evm_setNextBlockTimestamp", [timestamp]);
  await hre.network.provider.send("evm_mine");
  expect((await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp).to.equal(timestamp);
};

// No need to use this since we're using fixtures
export const resetNetwork = async () => {
  await hre.network.provider.request({
    method: "hardhat_reset",
    params: [],
  });
};

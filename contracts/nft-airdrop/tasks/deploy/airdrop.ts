import { task, types } from "hardhat/config";

import { NFTAirDrop__factory } from "../../src/types/factories/NFTAirDrop__factory";

import { SUBTASK_DEPLOY_VERIFY, SUBTASK_DEPLOY_WAIT_FOR_CONFIRMATIONS, TASK_DEPLOY_NFT_AIRDROP } from "../constants";

task(TASK_DEPLOY_NFT_AIRDROP)
  .addParam("confirmations", "How many block confirmations to wait for", 0, types.int)
  .addParam("verify", "Should contract be verified post deployment", true, types.boolean)
  .setAction(async function (
    taskArguments: { confirmations: number; verify: boolean; tokens: boolean },
    { ethers, run },
  ) {
    const [deployer] = await ethers.getSigners();
    console.log("Deployer: ", deployer.address);

    const NFTAirdropFactory = <NFTAirDrop__factory>await ethers.getContractFactory("NFTAirDrop");
    const airDrop = await NFTAirdropFactory.deploy();

    await run(SUBTASK_DEPLOY_WAIT_FOR_CONFIRMATIONS, {
      contract: airDrop,
      confirmations: taskArguments.confirmations,
    });

    if (taskArguments.verify) {
      await run(SUBTASK_DEPLOY_VERIFY, {
        contract: airDrop,
      });
    }
  });

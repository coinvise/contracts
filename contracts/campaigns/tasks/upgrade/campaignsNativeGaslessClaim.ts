import { task, types } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

import { CampaignsNativeGaslessClaim } from "../../src/types/contracts/campaigns";
import { CampaignsNativeGaslessClaim__factory } from "../../src/types/factories/contracts/campaigns";
import {
  SUBTASK_DEPLOY_VERIFY,
  SUBTASK_DEPLOY_WAIT_FOR_CONFIRMATIONS,
  TASK_UPGRADE_CAMPAIGNS_NATIVE_GASLESS_CLAIM,
} from "../constants";

task(TASK_UPGRADE_CAMPAIGNS_NATIVE_GASLESS_CLAIM)
  .addParam("proxyAddress", "Address of the proxy to upgrade", "")
  .addParam("protocolRewardsAddress", "Protocol Rewards contract address")
  .addParam("confirmations", "How many block confirmations to wait for", 0, types.int)
  .addParam("verify", "Should contract be verified post deployment", true, types.boolean)
  .setAction(async function (taskArguments: TaskArguments, { ethers, run, upgrades, network }) {
    if (!network.config.chainId) throw new Error("Cannot find network chain id");

    console.log("proxyAddress: ", taskArguments.proxyAddress);
    console.log("protocolRewardsAddress: ", taskArguments.protocolRewardsAddress);

    const [deployer] = await ethers.getSigners();
    console.log("Deployer: ", deployer.address);

    console.log(
      "Current implementation: ",
      await upgrades.erc1967.getImplementationAddress(taskArguments.proxyAddress),
    );

    const campaignsFactory: CampaignsNativeGaslessClaim__factory = <CampaignsNativeGaslessClaim__factory>(
      await ethers.getContractFactory("CampaignsNativeGaslessClaim")
    );
    const campaigns: CampaignsNativeGaslessClaim = <CampaignsNativeGaslessClaim>await upgrades.upgradeProxy(
      taskArguments.proxyAddress,
      campaignsFactory,
      {
        constructorArgs: [taskArguments.protocolRewardsAddress],
      },
    );

    await run(SUBTASK_DEPLOY_WAIT_FOR_CONFIRMATIONS, {
      contract: campaigns,
      confirmations: taskArguments.confirmations,
    });

    const newImplementationAddress = await upgrades.erc1967.getImplementationAddress(campaigns.address);
    console.log("CampaignsNativeGaslessClaim implementation deployed to: ", newImplementationAddress);
    console.log("CampaignsNativeGaslessClaim proxy deployed to: ", campaigns.address);
    console.log("Deployment txn hash: ", campaigns.deployTransaction.hash);

    if (taskArguments.verify) {
      await run(SUBTASK_DEPLOY_VERIFY, {
        contract: await ethers.getContractAt("CampaignsNativeGaslessClaim", campaigns.address),
        args: [taskArguments.protocolRewardsAddress],
      });
    }

    /* console.log("Setting treasury address...");
    await campaigns.setTreasury(taskArguments.treasuryAddress);
    console.log("Setting sponsored claim fee...");
    await campaigns.setSponsoredClaimFee(taskArguments.sponsoredClaimFee); */
  });

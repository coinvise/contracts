import { task, types } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

import { formatEther } from "ethers/lib/utils";
import { TRUSTED_ADDRESS, getCampaignClaimFee, getCampaignSponsoredClaimFee } from "../../helpers/constants";
import { CampaignsNativeGaslessClaim } from "../../src/types/contracts/campaigns";
import { CampaignsNativeGaslessClaim__factory } from "../../src/types/factories/contracts/campaigns";
import {
  SUBTASK_DEPLOY_VERIFY,
  SUBTASK_DEPLOY_WAIT_FOR_CONFIRMATIONS,
  TASK_DEPLOY_CAMPAIGNS_NATIVE_GASLESS_CLAIM,
} from "../constants";

task(TASK_DEPLOY_CAMPAIGNS_NATIVE_GASLESS_CLAIM)
  .addParam("trustedAddress", "Address used for signatures", TRUSTED_ADDRESS)
  .addParam("claimFee", "Claim fee", "")
  .addParam("protocolRewardsAddress", "Protocol Rewards contract address")
  .addParam("treasuryAddress", "Treasury address", "0x8df737904ab678B99717EF553b4eFdA6E3f94589")
  .addParam("sponsoredClaimFee", "Sponsored claim fee", "")
  .addParam("confirmations", "How many block confirmations to wait for", 0, types.int)
  .addParam("verify", "Should contract be verified post deployment", true, types.boolean)
  .setAction(async function (taskArguments: TaskArguments, { ethers, run, upgrades, network }) {
    if (!network.config.chainId) throw new Error("Cannot find network chain id");

    if (!taskArguments.trustedAddress) taskArguments.trustedAddress = TRUSTED_ADDRESS;
    if (!taskArguments.claimFee) taskArguments.claimFee = getCampaignClaimFee(network.config.chainId);
    if (!taskArguments.sponsoredClaimFee)
      taskArguments.sponsoredClaimFee = getCampaignSponsoredClaimFee(network.config.chainId);
    console.log("trustedAddress: ", taskArguments.trustedAddress);
    console.log("claimFee: ", formatEther(taskArguments.claimFee.toString()));
    console.log("sponsoredClaimFee: ", formatEther(taskArguments.sponsoredClaimFee));
    console.log("protocolRewardsAddress: ", taskArguments.protocolRewardsAddress);
    console.log("treasuryAddress: ", taskArguments.treasuryAddress);

    const [deployer] = await ethers.getSigners();
    console.log("Deployer: ", deployer.address);

    const campaignsFactory: CampaignsNativeGaslessClaim__factory = <CampaignsNativeGaslessClaim__factory>(
      await ethers.getContractFactory("CampaignsNativeGaslessClaim")
    );
    const campaigns: CampaignsNativeGaslessClaim = <CampaignsNativeGaslessClaim>await upgrades.deployProxy(
      campaignsFactory,
      [taskArguments.trustedAddress, taskArguments.claimFee],
      {
        constructorArgs: [taskArguments.protocolRewardsAddress],
      },
    );
    // const campaigns: CampaignsNativeGaslessClaim = <CampaignsNativeGaslessClaim>await campaignsFactory.deploy(taskArguments.trustedAddress, taskArguments.claimFee);

    await run(SUBTASK_DEPLOY_WAIT_FOR_CONFIRMATIONS, {
      contract: campaigns,
      confirmations: taskArguments.confirmations,
    });

    console.log(
      "CampaignsNativeGaslessClaim implementation deployed to: ",
      await upgrades.erc1967.getImplementationAddress(campaigns.address),
    );
    console.log("CampaignsNativeGaslessClaim proxy deployed to: ", campaigns.address);
    console.log("Deployment txn hash: ", campaigns.deployTransaction.hash);

    if (taskArguments.verify) {
      await run(SUBTASK_DEPLOY_VERIFY, {
        contract: campaigns,
        args: [taskArguments.protocolRewardsAddress],
      });
    }

    console.log("Setting treasury address...");
    await campaigns.setTreasury(taskArguments.treasuryAddress);
    console.log("Setting sponsored claim fee...");
    await campaigns.setSponsoredClaimFee(taskArguments.sponsoredClaimFee);
  });

import { task, types } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

import { BigNumber } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { ETHAddress } from "../../helpers/constants";
import { getArgFromEvent } from "../../helpers/events";
import { Campaigns, CampaignsNativeGaslessClaim } from "../../src/types/contracts/campaigns";
import { TASK_RUN_CREATE_CAMPAIGN } from "../constants";

task(TASK_RUN_CREATE_CAMPAIGN)
  .addParam("campaigns", "Address of the Campaigns | CampaignsNativeGaslessClaim contract")
  .addParam("tokenAddress", "Address of token for campaign", ETHAddress, types.string)
  .addParam("maxClaims", "Max no. of claims for campaign", 10, types.int)
  .addParam(
    "amountPerClaim",
    "Amount of tokens per claim for campaign in token decimals",
    parseEther("0.01").toString(),
    types.string,
  )
  .addParam(
    "isGasless",
    "Whether campaigns supports gasless claiming iff CampaignsNativeGaslessClaim",
    false,
    types.boolean,
  )
  .addParam("maxSponsoredClaims", "No. of sponsored claims", 0, types.int)
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const [executor] = await ethers.getSigners();
    console.log("Executor: ", executor.address);

    let campaigns: Campaigns | CampaignsNativeGaslessClaim = <Campaigns>(
      await ethers.getContractAt("Campaigns", taskArguments.campaigns)
    );
    const eip712Domain_name = (await campaigns.eip712Domain()).name as "Campaigns" | "CampaignsNativeGaslessClaim";
    console.log("eip712Domain_name: ", eip712Domain_name);

    let createCampaign;
    let totalValue;
    const totalSponsoredClaimFees = (await campaigns.sponsoredClaimFee()).mul(taskArguments.maxSponsoredClaims);
    const totalCampaignAmount = BigNumber.from(taskArguments.amountPerClaim).mul(taskArguments.maxClaims);
    if (taskArguments.tokenAddress != ETHAddress) {
      totalValue = totalSponsoredClaimFees;
    } else {
      totalValue = totalSponsoredClaimFees.add(totalCampaignAmount);
    }

    if (eip712Domain_name == "CampaignsNativeGaslessClaim") {
      campaigns = <CampaignsNativeGaslessClaim>(
        await ethers.getContractAt("CampaignsNativeGaslessClaim", taskArguments.campaigns)
      );
      createCampaign = await campaigns.createCampaign(
        taskArguments.tokenAddress,
        taskArguments.maxClaims,
        taskArguments.amountPerClaim,
        taskArguments.isGasless ? 1 : 0,
        taskArguments.maxSponsoredClaims,
        {
          value: totalValue,
        },
      );
    } else if (eip712Domain_name == "Campaigns") {
      campaigns = <Campaigns>await ethers.getContractAt("Campaigns", taskArguments.campaigns);
      createCampaign = await campaigns.createCampaign(
        taskArguments.tokenAddress,
        taskArguments.maxClaims,
        taskArguments.amountPerClaim,
        taskArguments.maxSponsoredClaims,
        {
          value: totalValue,
        },
      );
    } else throw new Error("Unknown contract name");

    console.log("createCampaign() txn hash: ", createCampaign.hash);

    const receipt = await createCampaign.wait(5);

    const campaignManager = getArgFromEvent(
      campaigns,
      receipt,
      campaigns.interface.events["CampaignCreated(address,uint256)"].name,
      "campaignManager",
    );
    const campaignId = getArgFromEvent(
      campaigns,
      receipt,
      campaigns.interface.events["CampaignCreated(address,uint256)"].name,
      "campaignId",
    );

    if (campaignManager) console.log("campaignManager: ", campaignManager);
    else console.error("Could not fetch campaignManager");
    if (campaignId) console.log("campaignId: ", campaignId.toString());
    else console.error("Could not fetch campaignId");
  });

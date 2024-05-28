import { task, types } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

import { TRUSTED_ADDRESS_PRIVATE_KEY } from "../../helpers/constants";
import { Campaigns_generateClaimSignature, prepareNativeMetaTxnSignature } from "../../helpers/eip712";
import { getArgFromEvent } from "../../helpers/events";
import { Campaigns, CampaignsNativeGaslessClaim } from "../../src/types/contracts/campaigns";
import { TASK_RUN_CLAIM } from "../constants";

task(TASK_RUN_CLAIM)
  .addParam("campaigns", "Address of the Campaigns | CampaignsNativeGaslessClaim contract")
  .addParam("campaignManager", "creator of the campaign to claim")
  .addParam("campaignId", "id of the campaign to claim")
  .addParam(
    "isGasless",
    "Whether campaigns supports gasless claiming iff CampaignsNativeGaslessClaim",
    false,
    types.boolean,
  )
  .addParam("referrer", "Address of the referrer", "")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const [_, __, claimer, relayer] = await ethers.getSigners();
    console.log("Claimer: ", claimer.address);

    const referrer = taskArguments.referrer ? taskArguments.referrer : ethers.constants.AddressZero;

    let campaigns: Campaigns | CampaignsNativeGaslessClaim = <Campaigns>(
      await ethers.getContractAt("Campaigns", taskArguments.campaigns)
    );
    const eip712Domain_name = (await campaigns.eip712Domain()).name as "Campaigns" | "CampaignsNativeGaslessClaim";
    console.log("eip712Domain_name: ", eip712Domain_name);

    const { v, r, s } = await Campaigns_generateClaimSignature(
      campaigns,
      eip712Domain_name,
      taskArguments.campaignManager,
      taskArguments.campaignId,
      claimer.address,
      new ethers.Wallet(TRUSTED_ADDRESS_PRIVATE_KEY, ethers.provider),
    );
    let claim;
    if (eip712Domain_name == "CampaignsNativeGaslessClaim" && taskArguments.isGasless) {
      campaigns = <CampaignsNativeGaslessClaim>(
        await ethers.getContractAt("CampaignsNativeGaslessClaim", taskArguments.campaigns)
      );
      const [functionSignature, { r: metaTxnR, s: metaTxnS, v: metaTxnV }] = await prepareNativeMetaTxnSignature(
        campaigns,
        claimer,
        { campaignManager: taskArguments.campaignManager, campaignId: taskArguments.campaignId, r, s, v, referrer },
      );
      console.log("Relayer: ", relayer.address);
      claim = await campaigns
        .connect(relayer)
        .executeMetaTransaction(claimer.address, functionSignature, metaTxnR, metaTxnS, metaTxnV);
    } else if (eip712Domain_name == "CampaignsNativeGaslessClaim") {
      campaigns = <CampaignsNativeGaslessClaim>await ethers.getContractAt("Campaigns", taskArguments.campaigns);
      claim = await campaigns
        .connect(claimer)
        .claim(taskArguments.campaignManager, taskArguments.campaignId, r, s, v, referrer, {
          value: await campaigns.claimFee(),
        });
    } else if (eip712Domain_name == "Campaigns") {
      campaigns = <Campaigns>await ethers.getContractAt("Campaigns", taskArguments.campaigns);
      claim = await campaigns
        .connect(claimer)
        .claim(taskArguments.campaignManager, taskArguments.campaignId, r, s, v, referrer, {
          value: await campaigns.claimFee(),
        });
    } else throw new Error("Unknown contract name");

    console.log("claim() txn hash: ", claim.hash);

    const receipt = await claim.wait(8);

    const amount = getArgFromEvent(
      campaigns,
      receipt,
      campaigns.interface.events["CampaignClaimed(address,uint256,address,address,uint256)"].name,
      "amount",
    );
    const tokenAddress = getArgFromEvent(
      campaigns,
      receipt,
      campaigns.interface.events["CampaignClaimed(address,uint256,address,address,uint256)"].name,
      "tokenAddress",
    );

    if (amount) console.log("amount: ", amount.toString());
    else console.error("Could not fetch amount");
    if (tokenAddress) console.log("tokenAddress: ", tokenAddress.toString());
    else console.error("Could not fetch tokenAddress");
  });

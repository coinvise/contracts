import { task, types } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

import { MembershipsFactory } from "../../src/types/MembershipsFactory";
import {
  SUBTASK_RUN_UPLOAD_FILE_NFT_STORAGE,
  TASK_RUN_DEPLOY_MEMBERSHIPS,
  TASK_RUN_UPLOAD_CONTRACT_METADATA_NFT_STORAGE,
  TASK_RUN_UPLOAD_TOKEN_METADATA_NFT_STORAGE,
  TASK_RUN_VERIFY_MEMBERSHIPS_PROXY,
} from "../constants";
import {
  ETH_ADDRESS,
  MEMBERSHIPS_BASE_URI,
  MEMBERSHIPS_CAP,
  MEMBERSHIPS_CONTRACT_URI,
  MEMBERSHIPS_IMAGE_NAME,
  MEMBERSHIPS_IMAGE_PATH,
  MEMBERSHIPS_IMAGE_TYPE,
  MEMBERSHIPS_NAME,
  MEMBERSHIPS_SYMBOL,
  SECONDS_PER_DAY,
} from "../../helpers/constants";
import { AddressZero } from "@ethersproject/constants";
import { parseEther } from "ethers/lib/utils";
import { getArgFromEvent } from "../../helpers/events";

task(TASK_RUN_DEPLOY_MEMBERSHIPS)
  .addParam("factory", "Address of the MembershipsFactory contract")
  .addParam("owner", "Membership owner")
  .addParam("treasury", "Treasury address to withdraw sales funds")
  .addParam("name", "Name for Membership", MEMBERSHIPS_NAME, types.string)
  .addParam("symbol", "Symbol for Membership", MEMBERSHIPS_SYMBOL, types.string)
  .addParam("contractUri", "contractURI for Membership", MEMBERSHIPS_CONTRACT_URI, types.string)
  .addParam("baseUri", "baseURI for Membership", MEMBERSHIPS_BASE_URI, types.string)
  .addParam("membershipTokenAddress", "Membership price token address", ETH_ADDRESS, types.string)
  .addParam("membershipPrice", "Membership price in ETH", "0.01", types.string)
  .addParam(
    "membershipValidity",
    "Membership validity duration in seconds for which a membership is valid after each purchase",
    Math.floor(90 * SECONDS_PER_DAY), // 90 days or ~3 months from now
    types.int,
  )
  .addParam("membershipCap", "Membership cap", MEMBERSHIPS_CAP, types.int)
  .addParam("membershipAirdropToken", "Membership airdrop token address", AddressZero, types.string)
  .addParam("membershipAirdropAmount", "Membership airdrop amount in airdrop token decimals", "0", types.string)
  .addParam("uploadMetadata", "Should new metadata be uploaded and used", false, types.boolean)
  .addParam("verify", "Should contract be verified post deployment", false, types.boolean)
  .setAction(async function (taskArguments: TaskArguments, { ethers, run }) {
    const [executor] = await ethers.getSigners();
    console.log("Executor: ", executor.address);

    // This could be improved
    if (taskArguments.uploadMetadata) {
      console.log("Uploading metadata..");

      console.log("Uploading image..");
      const fileCID = await run(SUBTASK_RUN_UPLOAD_FILE_NFT_STORAGE, {
        filePath: MEMBERSHIPS_IMAGE_PATH,
        fileName: MEMBERSHIPS_IMAGE_NAME,
        fileType: MEMBERSHIPS_IMAGE_TYPE,
      });
      const imageUri = `ipfs://${fileCID}`;

      console.log("Uploading contract metadata..");
      taskArguments.contractUri = `ipfs://${await run(TASK_RUN_UPLOAD_CONTRACT_METADATA_NFT_STORAGE, {
        name: taskArguments.name,
        description: taskArguments.description,
        imageUri,
      })}`;

      console.log("Uploading tokens metadata..");
      taskArguments.baseUri = `ipfs://${await run(TASK_RUN_UPLOAD_TOKEN_METADATA_NFT_STORAGE, {
        name: taskArguments.name,
        description: taskArguments.description,
        imageUri,
      })}/`;
    }

    const membershipsFactory = (await ethers.getContractAt(
      "MembershipsFactory",
      taskArguments.factory,
    )) as MembershipsFactory;

    const deployMemberships = await membershipsFactory.deployMemberships(
      taskArguments.owner,
      taskArguments.treasury,
      taskArguments.name,
      taskArguments.symbol,
      taskArguments.contractUri,
      taskArguments.baseUri,
      {
        tokenAddress: taskArguments.membershipTokenAddress,
        price: parseEther(taskArguments.membershipPrice),
        validity: taskArguments.membershipValidity,
        cap: taskArguments.membershipCap,
        airdropToken: taskArguments.membershipAirdropToken,
        airdropAmount: taskArguments.membershipAirdropAmount,
      },
    );

    console.log("deployMemberships() txn hash: ", deployMemberships.hash);

    const receipt = await deployMemberships.wait(5);

    const membershipsProxyAddress = getArgFromEvent(
      membershipsFactory,
      receipt,
      membershipsFactory.interface.events["MembershipsDeployed(address,address,address)"].name,
      "membershipsProxy",
    );

    if (membershipsProxyAddress) console.log("Memberships proxy deployed to: ", membershipsProxyAddress);
    else console.error("Could not fetch Memberships proxy address");

    if (membershipsProxyAddress && taskArguments.verify) {
      await deployMemberships.wait(10);

      await run(TASK_RUN_VERIFY_MEMBERSHIPS_PROXY, {
        membershipsProxy: membershipsProxyAddress,
        factory: taskArguments.factory,
        owner: taskArguments.owner,
        treasury: taskArguments.treasury,
        name: taskArguments.name,
        symbol: taskArguments.symbol,
        contractUri: taskArguments.contractUri,
        baseUri: taskArguments.baseUri,
        membershipTokenAddress: taskArguments.membershipTokenAddress,
        membershipPrice: taskArguments.membershipPrice,
        membershipValidity: taskArguments.membershipValidity,
        membershipCap: taskArguments.membershipCap,
        membershipAirdropToken: taskArguments.membershipAirdropToken,
        membershipAirdropAmount: taskArguments.membershipAirdropAmount,
      });
    }
  });

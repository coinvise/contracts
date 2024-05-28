import { task, types } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

import { AddressZero } from "@ethersproject/constants";
import { parseEther } from "ethers/lib/utils";
import {
  ETH_ADDRESS,
  MEMBERSHIPS_BASE_URI,
  MEMBERSHIPS_CAP,
  MEMBERSHIPS_CONTRACT_URI,
  MEMBERSHIPS_NAME,
  MEMBERSHIPS_SYMBOL,
  SECONDS_PER_DAY,
} from "../../helpers/constants";
import { Memberships } from "../../src/types/Memberships";
import { MembershipsFactory } from "../../src/types/MembershipsFactory";
import { TASK_RUN_VERIFY_MEMBERSHIPS_PROXY } from "../constants";

task(TASK_RUN_VERIFY_MEMBERSHIPS_PROXY)
  .addParam("membershipsProxy", "Address of the MembershipsProxy contract to verify")
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
  .setAction(async function (taskArguments: TaskArguments, { ethers, run }) {
    const membershipsProxy = (await ethers.getContractAt("Memberships", taskArguments.membershipsProxy)) as Memberships;

    const initializeData = membershipsProxy.interface.encodeFunctionData("initialize", [
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
    ]);
    const membershipsVersion = await membershipsProxy.version();

    const membershipsFactory = (await ethers.getContractAt(
      "MembershipsFactory",
      taskArguments.factory,
    )) as MembershipsFactory;

    const memberships = await membershipsFactory.membershipsImpls(membershipsVersion);

    await run("verify:verify", {
      address: taskArguments.membershipsProxy,
      constructorArguments: [membershipsVersion, memberships, initializeData],
    });
  });

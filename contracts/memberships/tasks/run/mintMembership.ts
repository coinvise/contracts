import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

import { Memberships } from "../../src/types/Memberships";
import { TASK_RUN_MINT_MEMBERSHIP } from "../constants";

task(TASK_RUN_MINT_MEMBERSHIP)
  .addParam("membershipsProxy", "Address of the Memberships proxy to mint")
  .addOptionalParam("recipient", "Address of the recipient")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const [executor, defaultRecipient] = await ethers.getSigners();
    console.log("Executor: ", executor.address);

    if (!taskArguments.recipient) {
      taskArguments.recipient = defaultRecipient.address;
    }
    console.log("Recipient: ", taskArguments.recipient);

    const membershipsProxy = (await ethers.getContractAt("Memberships", taskArguments.membershipsProxy)) as Memberships;

    const mint = await membershipsProxy.mint(taskArguments.recipient);

    console.log("mint() txn hash: ", mint.hash);

    await mint.wait();
  });

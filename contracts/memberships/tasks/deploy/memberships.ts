import { task, types } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

import { Memberships } from "../../src/types/Memberships";
import { Memberships__factory } from "../../src/types/factories/Memberships__factory";
import { SUBTASK_DEPLOY_VERIFY, SUBTASK_DEPLOY_WAIT_FOR_CONFIRMATIONS, TASK_DEPLOY_MEMBERSHIPS } from "../constants";

task(TASK_DEPLOY_MEMBERSHIPS)
  .addParam("membershipsMetadataRegistry", "MembershipsMetadataRegistry address")
  .addParam("confirmations", "How many block confirmations to wait for", 0, types.int)
  .addParam("verify", "Should contract be verified post deployment", true, types.boolean)
  .setAction(async function (taskArguments: TaskArguments, { ethers, run }) {
    const [deployer] = await ethers.getSigners();
    console.log("Deployer: ", deployer.address);

    const membershipsFactory: Memberships__factory = <Memberships__factory>(
      await ethers.getContractFactory("Memberships")
    );
    const memberships: Memberships = <Memberships>(
      await membershipsFactory.deploy(taskArguments.membershipsMetadataRegistry)
    );

    await run(SUBTASK_DEPLOY_WAIT_FOR_CONFIRMATIONS, {
      contract: memberships,
      confirmations: taskArguments.confirmations,
    });

    console.log("Memberships deployed to: ", memberships.address);
    console.log("Deployment txn hash: ", memberships.deployTransaction.hash);

    if (taskArguments.verify) {
      await run(SUBTASK_DEPLOY_VERIFY, {
        contract: memberships,
        args: [taskArguments.membershipsMetadataRegistry],
      });
    }
  });

import { task, types } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

import { MembershipsFactory } from "../../src/types/MembershipsFactory";
import { MembershipsFactory__factory } from "../../src/types/factories/MembershipsFactory__factory";
import {
  SUBTASK_DEPLOY_VERIFY,
  SUBTASK_DEPLOY_WAIT_FOR_CONFIRMATIONS,
  TASK_DEPLOY_MEMBERSHIPS_FACTORY,
} from "../constants";

task(TASK_DEPLOY_MEMBERSHIPS_FACTORY)
  .addParam("feeBps", "fee in bps")
  .addParam("feeTreasury", "Treasury address to withdraw fees from Membership")
  .addParam("confirmations", "How many block confirmations to wait for", 0, types.int)
  .addParam("verify", "Should contract be verified post deployment", true, types.boolean)
  .addParam("setMembershipsImplV1", "Should set V1 memberships implementation address", true, types.boolean)
  .addOptionalParam("memberships", "Address of the Memberships logic contract to set implementation")
  .setAction(async function (taskArguments: TaskArguments, { ethers, run }) {
    const [deployer] = await ethers.getSigners();
    console.log("Deployer: ", deployer.address);

    const membershipsFactoryFactory: MembershipsFactory__factory = <MembershipsFactory__factory>(
      await ethers.getContractFactory("MembershipsFactory")
    );
    const membershipsFactory: MembershipsFactory = <MembershipsFactory>(
      await membershipsFactoryFactory.deploy(taskArguments.feeBps, taskArguments.feeTreasury)
    );

    await run(SUBTASK_DEPLOY_WAIT_FOR_CONFIRMATIONS, {
      contract: membershipsFactory,
      confirmations: taskArguments.confirmations,
    });

    console.log("MembershipsFactory deployed to: ", membershipsFactory.address);
    console.log("Deployment txn hash: ", membershipsFactory.deployTransaction.hash);

    if (taskArguments.setMembershipsImplV1) {
      if (!taskArguments.memberships) {
        console.error("Memberships V1 implementation address not provided");
        return;
      }
      console.log("Setting Memberships V1 implementation address");
      const setMembershipsImplAddress = await membershipsFactory.setMembershipsImplAddress(
        1,
        taskArguments.memberships,
      );
      console.log("setMembershipsImplAddress() txn hash: ", setMembershipsImplAddress.hash);
    }

    if (taskArguments.verify) {
      await run(SUBTASK_DEPLOY_VERIFY, {
        contract: membershipsFactory,
        args: [taskArguments.feeBps, taskArguments.feeTreasury],
      });
    }
  });

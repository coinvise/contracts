import { task, types } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

import { MembershipsMetadataRegistry__factory } from "../../src/types/factories/MembershipsMetadataRegistry__factory";
import { MembershipsMetadataRegistry } from "../../src/types/MembershipsMetadataRegistry";
import {
  SUBTASK_DEPLOY_VERIFY,
  SUBTASK_DEPLOY_WAIT_FOR_CONFIRMATIONS,
  TASK_DEPLOY_MEMBERSHIPS_METADATA_REGISTRY,
} from "../constants";

task(TASK_DEPLOY_MEMBERSHIPS_METADATA_REGISTRY)
  .addParam("confirmations", "How many block confirmations to wait for", 0, types.int)
  .addParam("verify", "Should contract be verified post deployment", true, types.boolean)
  .setAction(async function (taskArguments: TaskArguments, { ethers, run }) {
    const [deployer] = await ethers.getSigners();
    console.log("Deployer: ", deployer.address);

    const membershipsMetadataRegistryFactory: MembershipsMetadataRegistry__factory = <
      MembershipsMetadataRegistry__factory
    >await ethers.getContractFactory("MembershipsMetadataRegistry");
    const membershipsMetadataRegistry: MembershipsMetadataRegistry = <MembershipsMetadataRegistry>(
      await membershipsMetadataRegistryFactory.deploy()
    );

    await run(SUBTASK_DEPLOY_WAIT_FOR_CONFIRMATIONS, {
      contract: membershipsMetadataRegistry,
      confirmations: taskArguments.confirmations,
    });

    console.log("MembershipsMetadataRegistry deployed to: ", membershipsMetadataRegistry.address);
    console.log("Deployment txn hash: ", membershipsMetadataRegistry.deployTransaction.hash);

    if (taskArguments.verify) {
      await run(SUBTASK_DEPLOY_VERIFY, {
        contract: membershipsMetadataRegistry,
      });
    }
  });

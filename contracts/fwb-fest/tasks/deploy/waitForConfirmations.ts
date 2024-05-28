import { subtask, types } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

import { SUBTASK_DEPLOY_WAIT_FOR_CONFIRMATIONS } from "../constants";

subtask(SUBTASK_DEPLOY_WAIT_FOR_CONFIRMATIONS)
  .addParam("confirmations", "How many block confirmations to wait for", 0, types.int)
  .addParam("contract", "Contract whose deployment to wait for", undefined, types.any)
  .setAction(async function (taskArguments: TaskArguments): Promise<void> {
    if (taskArguments.confirmations === 0) {
      await taskArguments.contract.deployed();
    } else if (taskArguments.contract.deployTransaction) {
      await taskArguments.contract.deployTransaction.wait(taskArguments.confirmations);
    }
  });

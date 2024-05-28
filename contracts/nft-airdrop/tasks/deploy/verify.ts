import { subtask, types } from "hardhat/config";
import { TaskArguments } from "hardhat/types";
import { CHAIN_IDS } from "../../helpers/chains";

import { SUBTASK_DEPLOY_VERIFY, SUBTASK_DEPLOY_WAIT_FOR_CONFIRMATIONS } from "../constants";

subtask(SUBTASK_DEPLOY_VERIFY)
  .addParam("contract", "Contract whose deployment to wait for", undefined, types.any)
  .addParam("args", "Constructor arguments used for deployment", [], types.any)
  .setAction(async function (taskArguments: TaskArguments, { run, network }): Promise<void> {
    if (network.config.chainId !== CHAIN_IDS.hardhat) {
      // It'll take some time after deployment for
      // the data to be propagated to the Etherscan backend
      // Hence we wait for some block confirmations
      await run(SUBTASK_DEPLOY_WAIT_FOR_CONFIRMATIONS, {
        contract: taskArguments.contract,
        confirmations: 5,
      });

      await run("verify:verify", {
        address: taskArguments.contract.address,
        constructorArguments: [...taskArguments.args],
      });
    }
  });

import { task, types } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

import { FWBFestAttendanceNFT__factory } from "../../src/types/factories/FWBFestAttendanceNFT__factory";
import { FWBFestAttendanceNFT } from "../../src/types/FWBFestAttendanceNFT";
import {
  SUBTASK_DEPLOY_VERIFY,
  SUBTASK_DEPLOY_WAIT_FOR_CONFIRMATIONS,
  TASK_DEPLOY_FWB_FEST,
  TRUSTED_ADDRESS,
} from "../constants";

task(TASK_DEPLOY_FWB_FEST)
  .addParam("trustee", "Trusted Address", TRUSTED_ADDRESS, types.string)
  .addParam("verify", "Should contract be verified post deployment", true, types.boolean)
  .setAction(async function (taskArguments: TaskArguments, { ethers, run }) {
    const [deployer] = await ethers.getSigners();
    console.log("Deployer: ", deployer.address);

    const fwbFactory: FWBFestAttendanceNFT__factory = <FWBFestAttendanceNFT__factory>(
      await ethers.getContractFactory("FWBFestAttendanceNFT")
    );
    const fwb: FWBFestAttendanceNFT = <FWBFestAttendanceNFT>await fwbFactory.deploy(taskArguments.trustee);

    await run(SUBTASK_DEPLOY_WAIT_FOR_CONFIRMATIONS, {
      contract: fwb,
      confirmations: taskArguments.confirmations,
    });

    console.log("FWBFestAttendanceNFT deployed to: ", fwb.address);
    console.log("Deployment txn hash: ", fwb.deployTransaction.hash);

    if (taskArguments.verify) {
      await run(SUBTASK_DEPLOY_VERIFY, {
        contract: fwb,
        args: [taskArguments.trustee],
      });
    }
  });

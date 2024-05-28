import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

import { ERC20Token } from "../../src/types/ERC20Token";
import { TASK_RUN_APPROVE_ERC20_TOKEN } from "../constants";

task(TASK_RUN_APPROVE_ERC20_TOKEN)
  .addParam("erc20Token", "Address of the ERC20Token contract")
  .addParam("spender", "spender address to approve")
  .addParam("amount", "amount of tokens to approve")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const [executor] = await ethers.getSigners();
    console.log("Executor: ", executor.address);

    const erc20Token = (await ethers.getContractAt("ERC20Token", taskArguments.erc20Token)) as ERC20Token;

    const approve = await erc20Token.approve(taskArguments.spender, taskArguments.amount);

    console.log("approve() txn hash: ", approve.hash);

    await approve.wait();
  });

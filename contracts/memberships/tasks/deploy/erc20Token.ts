import { parseUnits } from "@ethersproject/units";
import { task, types } from "hardhat/config";
import { TaskArguments } from "hardhat/types";
import { ERC20_TOKEN_NAME, ERC20_TOKEN_SYMBOL } from "../../helpers/constants";

import { ERC20Token } from "../../src/types/ERC20Token";
import { ERC20Token__factory } from "../../src/types/factories/ERC20Token__factory";
import { SUBTASK_DEPLOY_VERIFY, SUBTASK_DEPLOY_WAIT_FOR_CONFIRMATIONS, TASK_DEPLOY_ERC20_TOKEN } from "../constants";

task(TASK_DEPLOY_ERC20_TOKEN)
  .addParam("name", "Name of ERC20 token", ERC20_TOKEN_NAME, types.string)
  .addParam("symbol", "Symbol of ERC20 token", ERC20_TOKEN_SYMBOL, types.string)
  .addParam("factory", "Address of the MembershipsFactory contract to approve ERC20Token")
  .addParam("confirmations", "How many block confirmations to wait for", 0, types.int)
  .addParam("verify", "Should contract be verified post deployment", true, types.boolean)
  .setAction(async function (taskArguments: TaskArguments, { ethers, run }) {
    const [deployer] = await ethers.getSigners();
    console.log("Deployer: ", deployer.address);

    const erc20TokenFactory: ERC20Token__factory = <ERC20Token__factory>await ethers.getContractFactory("ERC20Token");
    const erc20Token: ERC20Token = <ERC20Token>await erc20TokenFactory.deploy(taskArguments.name, taskArguments.symbol);

    await run(SUBTASK_DEPLOY_WAIT_FOR_CONFIRMATIONS, {
      contract: erc20Token,
      confirmations: taskArguments.confirmations,
    });

    console.log("ERC20Token deployed to: ", erc20Token.address);
    console.log("Deployment txn hash: ", erc20Token.deployTransaction.hash);

    if (taskArguments.verify) {
      await run(SUBTASK_DEPLOY_VERIFY, {
        contract: erc20Token,
        args: [taskArguments.name, taskArguments.symbol],
      });
    }

    // Mint tokens
    await erc20Token.connect(deployer).mint(deployer.address, parseUnits("100000", await erc20Token.decimals()));

    // Approve tokens to factory contract
    await erc20Token.connect(deployer).approve(taskArguments.factory, await erc20Token.balanceOf(deployer.address));
  });

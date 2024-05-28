import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";
import { ETH_ADDRESS } from "../../helpers/constants";
import { ERC20Token } from "../../src/types/ERC20Token";

import { Memberships } from "../../src/types/Memberships";
import { TASK_RUN_PURCHASE_MEMBERSHIP } from "../constants";

task(TASK_RUN_PURCHASE_MEMBERSHIP)
  .addParam("membershipsProxy", "Address of the Memberships proxy to purchase")
  .addOptionalParam("recipient", "Address of the recipient")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const [executor, defaultRecipient] = await ethers.getSigners();
    console.log("Executor: ", executor.address);

    if (!taskArguments.recipient) {
      taskArguments.recipient = defaultRecipient.address;
    }
    console.log("Recipient: ", taskArguments.recipient);

    const membershipsProxy = (await ethers.getContractAt("Memberships", taskArguments.membershipsProxy)) as Memberships;

    const tokenAddress = await membershipsProxy.tokenAddress();
    const price = await membershipsProxy.price();

    let purchase;

    if (tokenAddress == ETH_ADDRESS) {
      purchase = await membershipsProxy.purchase(taskArguments.recipient, {
        value: price,
      });
    } else {
      const token = (await ethers.getContractAt("ERC20Token", tokenAddress)) as ERC20Token;
      await token.approve(membershipsProxy.address, price);
      purchase = await membershipsProxy.purchase(taskArguments.recipient);
    }

    console.log("purchase() txn hash: ", purchase.hash);

    await purchase.wait();
  });

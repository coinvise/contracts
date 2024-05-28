import { Contract, ContractReceipt } from "ethers";
import { LogDescription } from "ethers/lib/utils";

export function getArgFromEvent(contract: Contract, receipt: ContractReceipt, eventName: string, argName: string) {
  const parsedLogs = receipt.logs
    .map(log => {
      try {
        return contract.interface.parseLog(log);
      } catch (error) {
        return null;
      }
    })
    .filter((val): val is LogDescription => Boolean(val));

  const event = parsedLogs.find(log => log.eventFragment.name === contract.interface.getEvent(eventName).name);

  if (!event || !event.args[argName]) {
    console.error(`Event ${eventName} not found in txn ${receipt.transactionHash}`);
    return;
  }

  return event.args[argName];
}

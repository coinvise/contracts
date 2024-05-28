import { ERC721TokenNativeGaslessMint__factory } from "../../../typechain";
import { addContractToBiconomy, addMetaApiToBiconomy } from "../../utils";

/**
 * Add contract and `executeMetaTransaction()` API for a contract on Biconomy Dashboard
 */
const main = async () => {
  const contractName = "ERC721TokenNativeGaslessMint";
  const contractAddress = "0x67A6202A8ed9d185b15CA98Ccfcc84c1974392c5";
  const abi = ERC721TokenNativeGaslessMint__factory.abi;

  await addContractToBiconomy(contractName, contractAddress, abi);
  console.log("Contract added to Biconomy");

  await addMetaApiToBiconomy(contractAddress);
  console.log("Meta API added to Biconomy");
};

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

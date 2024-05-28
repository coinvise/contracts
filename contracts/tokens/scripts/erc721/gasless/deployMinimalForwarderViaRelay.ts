import {
  DefenderRelayProvider,
  DefenderRelaySigner,
} from "defender-relay-client/lib/ethers";
import { ethers } from "hardhat";
import {
  MinimalForwarder,
  MinimalForwarder__factory,
} from "../../../typechain";
import { getEnvVar } from "../../uploadMetadata";

const RELAYER_API_KEY = getEnvVar("RELAYER_API_KEY");
const RELAYER_API_SECRET = getEnvVar("RELAYER_API_SECRET");

/**
 * Deploy MinimalForwarder via OZ Relay
 */
const deployMinimalForwarderViaRelay = async (): Promise<string> => {
  const MinimalForwarder = <MinimalForwarder__factory>(
    await ethers.getContractFactory("MinimalForwarder")
  );

  const credentials = {
    apiKey: RELAYER_API_KEY,
    apiSecret: RELAYER_API_SECRET,
  };
  const provider = new DefenderRelayProvider(credentials);
  const relaySigner = new DefenderRelaySigner(credentials, provider, {
    speed: "fast",
  });

  console.log("RelaySigner address: ", await relaySigner.getAddress());

  const minimalForwarder: MinimalForwarder = await MinimalForwarder.connect(
    relaySigner
  ).deploy();
  console.log("MinimalForwarder address: ", minimalForwarder.address);

  await minimalForwarder.deployTransaction.wait(5);

  console.log("MinimalForwarder deployed");

  /* await hre.run("verify:verify", {
    address: MinimalForwarder.address,
    constructorArguments: [],
  }); */

  return minimalForwarder.address;
};

const main = async () => {
  await deployMinimalForwarderViaRelay();
};

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

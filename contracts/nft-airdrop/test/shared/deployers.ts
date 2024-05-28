import type { Signer } from "@ethersproject/abstract-signer";
import { artifacts, waffle } from "hardhat";

import { Contract } from "ethers";

const { deployContract } = waffle;

export async function deployToken<T extends Contract>(deployer: Signer, artifactName: string): Promise<T> {
  const artifact = await artifacts.readArtifact(artifactName);
  const contract = <T>await deployContract(deployer, artifact);
  return contract;
}

import type { Signer } from "@ethersproject/abstract-signer";
import { artifacts, waffle } from "hardhat";
import type { Artifact } from "hardhat/types";
import { FWBFestAttendanceNFT } from "../../src/types/FWBFestAttendanceNFT";

const { deployContract } = waffle;

export async function deployFWBFestAttendance(deployer: Signer, trustedAddress: string): Promise<FWBFestAttendanceNFT> {
  const fwbFestArtifact: Artifact = await artifacts.readArtifact("FWBFestAttendanceNFT");
  const fwbFest: FWBFestAttendanceNFT = <FWBFestAttendanceNFT>(
    await deployContract(deployer, fwbFestArtifact, [trustedAddress])
  );
  return fwbFest;
}

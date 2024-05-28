import type { Signer } from "@ethersproject/abstract-signer";
import { FWBFestAttendanceNFT } from "../../src/types/FWBFestAttendanceNFT";
import { deployFWBFestAttendance } from "./deployers";

type UnitFixtureFWBFestReturnType = {
  fwbToken: FWBFestAttendanceNFT;
  fwbTokenDeployer: Signer;
  trustee: Signer;
};

export async function unitFixtureFWBFest(signers: Signer[]): Promise<UnitFixtureFWBFestReturnType> {
  const signerLength = signers.length;
  const fwbTokenDeployer = signers[signerLength - 1];
  const trustee = signers[signerLength - 2];

  const trustedAddress = await trustee.getAddress();

  const fwbToken = await deployFWBFestAttendance(fwbTokenDeployer, trustedAddress);

  return {
    fwbToken,
    fwbTokenDeployer,
    trustee,
  };
}

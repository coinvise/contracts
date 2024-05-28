// eslint-disable @typescript-eslint/no-explicit-any
import type { Signer } from "@ethersproject/abstract-signer";
import type { Wallet } from "@ethersproject/wallet";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { ethers, waffle } from "hardhat";

import type { Contracts, Mocks, Signers } from "./types";

/// This is run at the beginning of each suite of tests: 2e2, integration and unit.
export function baseContext(description: string, hooks: () => void): void {
  describe(description, function () {
    before(async function () {
      this.contracts = {} as Contracts;
      this.mocks = {} as Mocks;
      this.signers = {} as Signers;

      const signers: SignerWithAddress[] = await ethers.getSigners();
      this.signers.alice = signers[0];
      this.signers.bob = signers[1];
      this.signers.carol = signers[2];
      this.signers.david = signers[3];
      this.signers.eve = signers[4];

      // Get rid of this when https://github.com/nomiclabs/hardhat/issues/849 gets fixed.
      this.loadFixture = waffle.createFixtureLoader(signers as Signer[] as Wallet[]);
    });

    hooks();
  });
}

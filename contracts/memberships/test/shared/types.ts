import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import type { MockContract } from "ethereum-waffle";
import type { Fixture } from "ethereum-waffle";

import { ERC20Token } from "../../src/types/ERC20Token";
import { Memberships as MembershipsV1 } from "../../src/v1/types/Memberships";
import { Memberships } from "../../src/types/Memberships";
import { MembershipsFactory } from "../../src/types/MembershipsFactory";
import { MembershipsMetadataRegistry } from "../../src/types/MembershipsMetadataRegistry";
import { TestMembershipsFactory } from "../../src/types/TestMembershipsFactory";

declare module "mocha" {
  interface Context {
    contracts: Contracts;
    loadFixture: <T>(fixture: Fixture<T>) => Promise<T>;
    mocks: Mocks;
    signers: Signers;
  }
}

export interface Contracts {
  membershipsMetadataRegistry: MembershipsMetadataRegistry;
  membershipsV1: MembershipsV1;
  memberships: Memberships;
  membershipsV1Proxy: MembershipsV1;
  membershipsProxy: Memberships;
  membershipsProxy_ERC20: Memberships;
  membershipsFactory: MembershipsFactory;
  testMembershipsFactory: TestMembershipsFactory;
  erc20Token: ERC20Token;
  erc20PaymentToken: ERC20Token;
}

export interface Mocks {
  membershipsMetadataRegistry: MockContract;
  memberships: MockContract;
  membershipsFactory: MockContract;
  erc20Token: MockContract;
}

export interface Signers {
  alice: SignerWithAddress;
  bob: SignerWithAddress;
  carol: SignerWithAddress;
  david: SignerWithAddress;
  eve: SignerWithAddress;
}

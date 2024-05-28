import type { MockContract } from "@ethereum-waffle/mock-contract";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

import { Campaigns, CampaignsNativeGaslessClaim } from "../../src/types/contracts/campaigns";
import { ProtocolRewards } from "../../src/types/contracts/protocol-rewards";
import { CampaignsNativeGaslessClaimV1 } from "../../src/types/contracts/test/CampaignsNativeGaslessClaimV1";
import { CampaignsV1 } from "../../src/types/contracts/test/CampaignsV1";
import { ERC20Token } from "../../src/types/contracts/test/ERC20Token";

type Fixture<T> = () => Promise<T>;

declare module "mocha" {
  interface Context {
    contracts: Contracts;
    loadFixture: <T>(fixture: Fixture<T>) => Promise<T>;
    mocks: Mocks;
    signers: Signers;
  }
}

export interface Contracts {
  campaigns: Campaigns;
  campaignsV1: CampaignsV1;
  campaignsNativeGaslessClaim: CampaignsNativeGaslessClaim;
  campaignsNativeGaslessClaimV1: CampaignsNativeGaslessClaimV1;
  erc20Token: ERC20Token;
  protocolRewards: ProtocolRewards;
}

export interface Mocks {
  campaigns: MockContract;
  erc20Token: MockContract;
  protocolRewards: MockContract;
}

export interface Signers {
  alice: SignerWithAddress;
  bob: SignerWithAddress;
  carol: SignerWithAddress;
  david: SignerWithAddress;
  eve: SignerWithAddress;
  referrer: SignerWithAddress;
  treasury: SignerWithAddress;
  relayer: SignerWithAddress;
  trustedAddress: SignerWithAddress;
}
